# Saves the Gemini API key as a Supabase secret (used by the "nutrition"
# edge function). The key never goes into git or into the app.
$k = Read-Host "Enganxa la clau de Gemini (aistudio.google.com/apikey) i prem Enter"
if (-not $k) { Write-Host "Cap clau, no s'ha canviat res."; exit 1 }
npx -y supabase@latest secrets set "GEMINI_API_KEY=$k" --project-ref xyidxnkpxzteutnuloui
