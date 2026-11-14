# Registrari

PWA mòbil (català / castellà) per portar un registre digestiu diari: aigua, àpats, símptomes, evacuacions (escala de Bristol), ventilacions, medicació i documents mèdics. Exporta la cronologia filtrada en PDF per al digestòleg.

## Stack
- React + Vite + TypeScript, `vite-plugin-pwa`
- Supabase (projecte `Registrari`, ref `xyidxnkpxzteutnuloui`): Postgres + Storage
- jsPDF + jspdf-autotable per a l'informe

## Seguretat
Sense usuaris. Qualsevol amb l'enllaç pot **llegir**; tota **escriptura** passa per RPCs `SECURITY DEFINER` que comproven un PIN de 4 xifres (hash bcrypt a `private.pin`). 8 PIN erronis en 15 min bloquegen les escriptures 15 min. Les pujades/esborrats de fitxers només funcionen amb un tiquet temporal emès per una RPC amb PIN. El primer PIN es crea des de l'app el primer cop que es desa alguna cosa.

## Desenvolupament
```bash
npm install
npm run dev
```
`.env.local` necessita `VITE_SUPABASE_URL` i `VITE_SUPABASE_KEY` (clau publishable).

Migracions: `supabase/migrations`, aplicar amb `npx supabase db push --remote` (contrasenya de la BD a `supabase/.secrets/db-password`, fora de git).
