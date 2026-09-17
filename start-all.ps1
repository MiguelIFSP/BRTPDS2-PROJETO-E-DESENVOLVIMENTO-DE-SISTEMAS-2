# Sobe tudo com um comando só: bancos (Docker, cria na primeira vez / só inicia
# depois) + as 3 APIs (PM2). Idempotente — pode rodar de novo sem problema.
# Pré-requisito (só precisa rodar uma vez, não é feito aqui): "npm install" em
# api/, monitoring-better-meet/ e management-better-meet/server/.

$root = $PSScriptRoot

Write-Host "Subindo os bancos (Docker)..."
docker compose -f "$root/better-meet/docker-compose.yml" up -d

Write-Host "Buildando monitoring-better-meet..."
Push-Location "$root/monitoring-better-meet"
npm run build
Pop-Location

Write-Host "Buildando management-better-meet..."
Push-Location "$root/management-better-meet/server"
npm run build
Pop-Location

Write-Host "Subindo api, monitoring e management (PM2)..."
pm2 start "$root/ecosystem.config.js"

Write-Host "Pronto. Confira com: pm2 list"
