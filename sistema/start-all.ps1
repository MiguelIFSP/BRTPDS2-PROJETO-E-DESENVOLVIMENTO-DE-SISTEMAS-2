# Sobe tudo com um comando só: bancos (Docker, cria na primeira vez / só inicia
# depois) + as 3 APIs (PM2) + build do painel admin (servido pela própria
# management em /admin). Idempotente — pode rodar de novo sem problema.
# Pré-requisito (só precisa rodar uma vez, não é feito aqui): "npm install" em
# todos os projetos — veja install-all.ps1.

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

Write-Host "Buildando o painel admin (management-better-meet/web)..."
Push-Location "$root/management-better-meet/web"
npm run export:web
Pop-Location

Write-Host "Subindo api, monitoring e management (PM2)..."
pm2 start "$root/ecosystem.config.js"

Write-Host "Pronto. Painel em http://localhost:3335/admin — confira os processos com: pm2 list"
