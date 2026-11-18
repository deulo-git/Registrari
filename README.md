# Registrari

PWA mòbil (català / castellà) amb comptes de Google i una mascota per portar un registre digestiu diari: aigua, àpats, símptomes, evacuacions (escala de Bristol), ventilacions, medicació i documents mèdics. Exporta la cronologia filtrada en PDF per al digestòleg.

**App:** https://registrari.vercel.app (Vercel, compte deulofes; cada push a `main` es publica sol).

## Stack
- React + Vite + TypeScript, `vite-plugin-pwa`
- Supabase (projecte `Registrari`, ref `xyidxnkpxzteutnuloui`): Postgres + Auth (Google) + Storage
- jsPDF + jspdf-autotable per a l'informe

## Comptes i seguretat
Cada persona entra amb **Google** i les seves dades són seves (`owner_id` a cada registre). Tot passa per Row Level Security: ningú veu res d'un altre compte si no li ho han compartit.

- **Primer ús:** nom, cognoms, data de naixement, pes, alçada i mascota (10 espècies, 4 sliders de personalitat i, opcionalment, l'experiència personalitzada). La primera persona que es registra s'endú les dades que hi havia abans dels comptes (`claim_legacy()`).
- **Ajudants de gestió:** el propietari convida per correu electrònic (Configuració → Ajudants) amb tres nivells: *il·limitat* (tot excepte gestionar ajudants), *consulta, edició i eliminació* i *limitat* (només consulta i només els tipus de registre triats). L'ajudant canvia de persona des de Configuració → «Dades que veus».
- Els fitxers (bucket privat `documents`) viuen a `<id del propietari>/<uuid>.<ext>`; les polítiques d'emmagatzematge segueixen els mateixos permisos.
- La funció `nutrition` valida la sessió de l'usuari abans de gastar la clau de Gemini.

### Posada en marxa (una sola vegada, **abans** de publicar aquesta versió)
1. Supabase → Authentication → Providers → **Google**: activa'l amb el *Client ID* i *Secret* d'una credencial OAuth de Google Cloud (URI de redirecció autoritzat: `https://<ref>.supabase.co/auth/v1/callback`).
2. Supabase → Authentication → URL Configuration: afegeix `https://registrari.vercel.app` a *Site URL* i *Redirect URLs* (i `http://localhost:5173` per desenvolupar).
3. `npx supabase db push --remote` (aplica `0003_users.sql`; elimina el PIN i tanca la lectura anònima).
4. `npx supabase functions deploy nutrition`.
5. Fes merge a `main` i entra amb el teu Google: et demanarà les dades i es quedarà l'historial antic.

## Desenvolupament
```bash
npm install
npm run dev
```
`.env.local` necessita `VITE_SUPABASE_URL` i `VITE_SUPABASE_KEY` (clau publishable).

Migracions: `supabase/migrations`, aplicar amb `npx supabase db push --remote` (contrasenya de la BD a `supabase/.secrets/db-password`, fora de git).
