// Estimates nutrients for the foods of a meal with Gemini.
//
// Body: { pin: string, lang: 'ca' | 'es', items: { name, qty?, unit? }[] }
// Reply: { ok: true, items: { name, qty, unit, kcal, protein, carbs, fat, fiber }[] }
//      | { ok: false, error: 'bad_pin' | 'locked' | 'no_pin' | 'no_key' | 'bad_request' | 'ai_error' }
//
// The PIN is checked with the same RPC the app uses (wrong PINs count towards
// the lockout), so the Gemini key can't be spent by anyone who only has the link.
// The key lives in the GEMINI_API_KEY secret, never in the app.

const MODEL = 'gemini-flash-latest'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

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

  let body: { pin?: string; lang?: string; items?: InItem[] }
  try { body = await req.json() } catch { return reply({ ok: false, error: 'bad_request' }, 400) }

  const items = (body.items ?? [])
    .filter((i) => i && typeof i.name === 'string' && i.name.trim())
    .slice(0, 25)
    .map((i) => ({
      name: i.name.trim().slice(0, 120),
      qty: typeof i.qty === 'number' && i.qty > 0 ? i.qty : undefined,
      unit: i.unit === 'ml' || i.unit === 'u' ? i.unit : 'g',
    }))
  if (!items.length || typeof body.pin !== 'string') return reply({ ok: false, error: 'bad_request' }, 400)

  // ── PIN ──
  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const pinRes = await fetch(`${url}/rest/v1/rpc/check_pin`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_pin: body.pin }),
  })
  const pin = await pinRes.json().catch(() => null)
  if (!pin?.ok) return reply({ ok: false, error: pin?.error ?? 'bad_pin' })

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

  try {
    const r = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: schema },
      }),
    })
    if (!r.ok) {
      console.error('gemini', r.status, await r.text())
      return reply({ ok: false, error: 'ai_error' })
    }
    const data = await r.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    const out = JSON.parse(text) as Record<string, unknown>[]
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
