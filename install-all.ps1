# Roda "npm install" em todos os projetos do repositório de uma vez — útil pra
# preparar uma máquina nova (ex.: PC da escola) antes do start-all.ps1.
# Quando o management-better-meet/web existir, adiciona ele nessa lista.

$root = $PSScriptRoot

$projects = @(
    "api",
    "better-meet",
    "monitoring-better-meet",
    "management-better-meet/server"
)

foreach ($project in $projects) {
    Write-Host "npm install em $project..."
    Push-Location "$root/$project"
    npm install
    Pop-Location
}

Write-Host "Pronto. Lembre de criar os arquivos .env em cada projeto (veja os .env.example) antes de rodar o start-all.ps1."
