// Estimates nutrients for the foods of a meal with Gemini.
//
// Body: { lang: 'ca' | 'es', items: { name, qty?, unit? }[] }
// Reply: { ok: true, items: { name, qty, unit, kcal, protein, carbs, fat, fiber }[] }
//      | { ok: false, error: 'not_signed_in' | 'no_key' | 'bad_request' | 'ai_error' }
//
// The caller must be a signed-in user (their session token is validated against
// Supabase Auth), so the Gemini key can't be spent by anyone who only has the link.
// The key lives in the GEMINI_API_KEY secret, never in the app.

// Free-tier models get "503 high demand" often, so try several in turn, each
// with its own time limit, well inside the function's wall-clock limit.
// thinking: whether the model accepts a thinking budget (we turn thinking off
// for speed; it isn't needed for a nutrition estimate).
const MODELS: { id: string; thinking: boolean }[] = [
  { id: 'gemini-2.5-flash', thinking: true },
  { id: 'gemini-2.5-flash-lite', thinking: true },
  { id: 'gemini-flash-latest', thinking: false },
  { id: 'gemini-2.0-flash', thinking: false },
]
const ATTEMPT_MS = 18000
const TOTAL_MS = 60000
const geminiUrl = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

interface InItem { name: string; qty?: number; unit?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return reply({ ok: false, error: 'bad_request' }, 405)

  let body: { lang?: string; items?: InItem[] }
  try { body = await req.json() } catch { return reply({ ok: false, error: 'bad_request' }, 400) }

  const items = (body.items ?? [])
    .filter((i) => i && typeof i.name === 'string' && i.name.trim())
    .slice(0, 25)
    .map((i) => ({
      name: i.name.trim().slice(0, 120),
      qty: typeof i.qty === 'number' && i.qty > 0 ? i.qty : undefined,
      unit: i.unit === 'ml' || i.unit === 'u' ? i.unit : 'g',
    }))
  if (!items.length) return reply({ ok: false, error: 'bad_request' }, 400)

  // ── Signed-in user ── (the app sends the user's session token)
  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const auth = req.headers.get('Authorization') ?? ''
  const who = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: auth } })
  if (!who.ok) return reply({ ok: false, error: 'not_signed_in' })

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return reply({ ok: false, error: 'no_key' })

  // ── Gemini ──
  const lang = body.lang === 'es' ? 'Spanish' : 'Catalan'
  const prompt = `You are a clinical nutrition assistant. For each food below, estimate the nutrients for the
given quantity. If the quantity is missing, assume one typical adult portion and return that quantity.
Unit "g" = grams, "ml" = millilitres, "u" = units/pieces. Foods are written in ${lang} and are typical of
Spain/Catalonia; prefer values from Spanish food composition tables (BEDCA) when relevant.
Return the same foods in the same order, keeping each name exactly as given.
kcal in kilocalories; protein, carbs, fat and fiber in grams; round to one decimal.

Foods:
${items.map((i, n) => `${n + 1}. ${i.name} — ${i.qty ? `${i.qty} ${i.unit}` : 'quantity not given'}`).join('\n')}`

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        qty: { type: 'NUMBER' },
        unit: { type: 'STRING', enum: ['g', 'ml', 'u'] },
        kcal: { type: 'NUMBER' },
        protein: { type: 'NUMBER' },
        carbs: { type: 'NUMBER' },
        fat: { type: 'NUMBER' },
        fiber: { type: 'NUMBER' },
      },
      required: ['name', 'qty', 'unit', 'kcal', 'protein', 'carbs', 'fat', 'fiber'],
    },
  }

  /** One model, one attempt: parsed array, or null to try the next model. */
  const ask = async (model: { id: string; thinking: boolean }, ms: number): Promise<Record<string, unknown>[] | null> => {
    const ctl = new AbortController()
    const h = setTimeout(() => ctl.abort(), ms)
    try {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.2, responseMimeType: 'application/json', responseSchema: schema,
      }
      if (model.thinking) generationConfig.thinkingConfig = { thinkingBudget: 0 }
      const r = await fetch(geminiUrl(model.id), {
        method: 'POST',
        signal: ctl.signal,
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig }),
      })
      if (!r.ok) {
        console.error('gemini', model.id, r.status, (await r.text()).slice(0, 300))
        return null
      }
      const data = await r.json()
      const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
      const out = JSON.parse(text)
      return Array.isArray(out) ? out : null
    } catch (e) {
      console.error('gemini', model.id, (e as Error).name === 'AbortError' ? 'timeout' : String(e))
      return null
    } finally {
      clearTimeout(h)
    }
  }

  try {
    const started = Date.now()
    let out: Record<string, unknown>[] | null = null
    for (const m of MODELS) {
      const left = TOTAL_MS - (Date.now() - started)
      if (left < 3000) break
      out = await ask(m, Math.min(ATTEMPT_MS, left))
      if (out) break
    }
    if (!out) return reply({ ok: false, error: 'ai_error' })
    const num = (v: unknown) => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.round(v * 10) / 10 : 0)
    // Align by position with what was sent; the model may rephrase names.
    const result = items.map((it, i) => {
      const o = out[i] ?? {}
      return {
        name: it.name,
        qty: it.qty ?? num(o.qty),
        unit: it.qty ? it.unit : (o.unit === 'ml' || o.unit === 'u' ? o.unit : it.unit),
        kcal: num(o.kcal), protein: num(o.protein), carbs: num(o.carbs), fat: num(o.fat), fiber: num(o.fiber),
      }
    })
    return reply({ ok: true, items: result })
  } catch (e) {
    console.error('nutrition', e)
    return reply({ ok: false, error: 'ai_error' })
  }
})
