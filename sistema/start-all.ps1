# Sobe tudo com um comando só: instala o pm2 se faltar, roda "npm install" em
# todos os projetos (com o Prisma fixado em 7.10.0), cria/corrige os .env
# (segredos reais, IP da máquina), sobe os bancos (Docker, cria na primeira
# vez / só inicia depois) + as 3 APIs (PM2) + build do painel admin (servido
# pela própria management em /admin). Idempotente — pode rodar de novo sem problema.
#
# Uso:
#   .\start-all.ps1
#
# Pré-requisito que não é automatizado (por segurança): Node.js e Docker
# Desktop instalados.

$root = $PSScriptRoot

# --- pm2 -------------------------------------------------------------------

Write-Host "Verificando o pm2..."
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "pm2 não encontrado — instalando globalmente (npm install -g pm2)..."
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Não foi possível instalar o pm2 — rode 'npm install -g pm2' na mão e tente de novo."
        exit 1
    }
} else {
    Write-Host "  pm2 já instalado."
}

# --- npm install ------------------------------------------------------------
# api e monitoring-better-meet usam Prisma — prisma, @prisma/client e
# @prisma/adapter-mariadb ficam fixados (sem ^) no package.json de cada um, e
# aqui a gente confere se o que foi instalado bate mesmo com essa versão.

$prismaVersion = "7.10.0"
$prismaPackages = @("prisma", "@prisma/client", "@prisma/adapter-mariadb")

$npmProjects = @(
    "api",
    "better-meet",
    "monitoring-better-meet",
    "management-better-meet/server",
    "management-better-meet/web"
)
$prismaProjects = @("api", "monitoring-better-meet")

foreach ($project in $npmProjects) {
    Write-Host "npm install em $project..."
    Push-Location "$root/$project"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  npm install falhou em $project — abortando."
        Pop-Location
        exit 1
    }

    if ($prismaProjects -contains $project) {
        foreach ($package in $prismaPackages) {
            $installed = (node -p "require('./node_modules/$package/package.json').version" 2>$null)
            if ($installed -ne $prismaVersion) {
                Write-Host "  $package em $project está na versão '$installed', esperado $prismaVersion — abortando."
                Write-Host "  Confira se o package.json de $project tem `"$package`": `"$prismaVersion`" (sem ^)."
                Pop-Location
                exit 1
            }
        }
        Write-Host "  Prisma $prismaVersion confirmado em $project."
    }
    Pop-Location
}

# --- .env de cada projeto ---------------------------------------------------
# JWT_SECRET e a chave de API interna (INTERNAL_API_KEY / EXPO_PUBLIC_MONITORING_API_KEY)
# precisam ser IDÊNTICOS entre os projetos que os usam — por isso são gerados
# uma única vez aqui e reaproveitados, nunca um valor aleatório por arquivo.

function New-Secret {
    (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))").Trim()
}

# "localhost" só funciona pra quem já está na própria máquina — o app mobile
# exportado (rodando no celular físico) precisa do IP real da máquina na rede.
function Get-LocalIPv4 {
    try {
        $config = Get-NetIPConfiguration -ErrorAction Stop | Where-Object {
            $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up'
        } | Select-Object -First 1

        if ($config) { return $config.IPv4Address.IPAddress }
    } catch {}

    return $null
}

function Wait-ForMySQL {
    param([string]$ContainerName, [int]$TimeoutSeconds = 60)

    Write-Host "  Esperando $ContainerName ficar pronto..."
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        # -u/-p iguais ao MYSQL_ROOT_PASSWORD do docker-compose.yml — sem isso, o
        # mysqladmin responde "Access denied" (o que na verdade já confirma que o
        # MySQL está de pé, só não autenticou), e a checagem ficaria errada.
        docker exec $ContainerName mysqladmin ping -h localhost -u root -prootpassword --silent 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $ContainerName pronto."
            return $true
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    Write-Host "  $ContainerName não respondeu dentro de $TimeoutSeconds segundos — a sincronização do Prisma pode falhar."
    return $false
}

function Wait-ForHttp {
    param([string]$Url, [int]$TimeoutSeconds = 30)

    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($response.StatusCode -eq 200) { return $true }
        } catch {}
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    return $false
}

# api e monitoring-better-meet usam Prisma (management-better-meet/server NÃO usa
# — é stateless por design). "migrate diff --exit-code" só verifica se o banco já
# bate com o schema (retorna != 0 se houver diferença) — só rodamos "db push" (que
# pode alterar o banco) quando realmente há divergência, não sempre à toa.
function Sync-PrismaSchema {
    param([string]$ProjectPath, [string]$ProjectName)

    Write-Host "Verificando o schema do Prisma em $ProjectName..."
    Push-Location $ProjectPath

    # Prisma 7 removeu --from-schema-datasource/--to-schema-datamodel — agora é
    # --from-config-datasource (lê o banco via o datasource do prisma.config.ts)
    # + --to-schema (o schema.prisma é o "alvo" desejado).
    npx prisma migrate diff --from-config-datasource --to-schema ./prisma/schema.prisma --exit-code
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Schema do banco desatualizado — rodando 'prisma db push'..."
        npm run prisma:push
    } else {
        Write-Host "  Schema já em sincronia com o banco."
    }

    Write-Host "  Gerando o Prisma Client..."
    npm run prisma:generate

    Pop-Location
}

# Lê só as linhas CHAVE=valor (sem aspas); comentário e linha em branco ficam de fora.
function Read-EnvValues {
    param([string]$Path)

    $values = [ordered]@{}
    foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
        if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
            $values[$Matches[1]] = $Matches[2].Trim().Trim('"')
        }
    }
    return $values
}

# Valor que ainda não é um segredo de verdade: vazio, texto de exemplo tipo
# "troque-por-..."/"peça-esse-valor...", ou idêntico ao do .env.example (o da
# api/ traz um JWT_SECRET versionado — não serve como segredo real).
function Test-IsPlaceholder {
    param([string]$Value, [string]$ExampleValue)

    return (-not $Value) -or ($Value -eq $ExampleValue) -or ($Value -match 'troque-por|pe.a-esse|SEU_IP_AQUI')
}

# Primeiro valor real (não placeholder) de alguma das chaves, em qualquer .env
# já existente — assim um setup parcial é reaproveitado. Só gera um novo se
# nenhum projeto tiver um valor real ainda (máquina nova de verdade).
function Find-SharedSecret {
    param([string[]]$Projects, [string[]]$Keys)

    foreach ($project in $Projects) {
        $envPath = Join-Path (Join-Path $root $project) ".env"
        $examplePath = Join-Path (Join-Path $root $project) ".env.example"
        if (-not (Test-Path $envPath)) { continue }

        $values = Read-EnvValues -Path $envPath
        $example = if (Test-Path $examplePath) { Read-EnvValues -Path $examplePath } else { @{} }
        foreach ($key in $Keys) {
            if ($values.Contains($key) -and -not (Test-IsPlaceholder -Value $values[$key] -ExampleValue $example[$key])) {
                return $values[$key]
            }
        }
    }
    return New-Secret
}

function Get-DesiredEnvValue {
    param(
        [string]$Key,
        [string]$Current,
        [string]$ExampleValue,
        [hashtable]$SharedValues,
        [string]$LocalIp,
        [bool]$IpDetected
    )

    if ($SharedValues.ContainsKey($Key)) { return $SharedValues[$Key] }

    if ($Key -eq 'BETTER_AUTH_SECRET') {
        # Só troca se ainda for placeholder — gerar um novo a cada execução derrubaria as sessões.
        if (Test-IsPlaceholder -Value $Current -ExampleValue $ExampleValue) { return New-Secret }
        return $Current
    }

    # Chaves que no .env.example apontam pra localhost/SEU_IP_AQUI: troca só o
    # host (depois de "//" ou "@", ou o valor inteiro), mantendo porta e caminho.
    # Sem IP detectado, só preenche o SEU_IP_AQUI — não derruba um IP que já funcionava.
    if ($ExampleValue -match 'SEU_IP_AQUI|localhost') {
        $hostPattern = if ($IpDetected) { 'localhost|SEU_IP_AQUI|\d{1,3}(?:\.\d{1,3}){3}' } else { 'SEU_IP_AQUI' }
        return $Current -replace "(?<=^|//|@)(?:$hostPattern)(?=:|/|$)", $LocalIp
    }

    return $Current
}

# Cria o .env a partir do .env.example se não existir; se já existir, corrige
# só o que estiver errado (chave faltando, segredo placeholder/divergente, IP
# desatualizado) e mantém o resto — inclusive ajustes feitos na mão.
function Sync-EnvFile {
    param(
        [string]$ProjectPath,
        [hashtable]$SharedValues,
        [string]$LocalIp,
        [bool]$IpDetected
    )

    $envPath = Join-Path $ProjectPath ".env"
    $examplePath = Join-Path $ProjectPath ".env.example"

    if (-not (Test-Path $examplePath)) {
        Write-Host "  Sem .env.example em $ProjectPath — pulando."
        return
    }

    $example = Read-EnvValues -Path $examplePath
    $isNew = -not (Test-Path $envPath)
    $sourcePath = if ($isNew) { $examplePath } else { $envPath }
    $lines = [System.Collections.Generic.List[string]]([System.IO.File]::ReadAllLines($sourcePath))

    $changed = @()
    $seen = @{}
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -notmatch '^([A-Z_][A-Z0-9_]*)=(.*)$') { continue }
        $key = $Matches[1]
        $current = $Matches[2].Trim().Trim('"')
        $seen[$key] = $true

        $desired = Get-DesiredEnvValue -Key $key -Current $current -ExampleValue $example[$key] -SharedValues $SharedValues -LocalIp $LocalIp -IpDetected $IpDetected
        if ($desired -ne $current) {
            $lines[$i] = "$key=`"$desired`""
            $changed += $key
        }
    }

    foreach ($key in $example.Keys) {
        if ($seen[$key]) { continue }
        $desired = Get-DesiredEnvValue -Key $key -Current $example[$key] -ExampleValue $example[$key] -SharedValues $SharedValues -LocalIp $LocalIp -IpDetected $IpDetected
        $lines.Add("$key=`"$desired`"")
        $changed += "$key (adicionada)"
    }

    if (-not $isNew -and $changed.Count -eq 0) {
        Write-Host "  .env em $ProjectPath já está correto."
        return
    }

    # UTF-8 sem BOM — com BOM, o dotenv leria a primeira chave como "﻿PORT".
    $content = ($lines -join "`r`n") + "`r`n"
    [System.IO.File]::WriteAllText($envPath, $content, (New-Object System.Text.UTF8Encoding($false)))

    if ($isNew) {
        Write-Host "  .env criado em $ProjectPath (copiado do .env.example e ajustado)"
    } else {
        Write-Host "  .env corrigido em ${ProjectPath}: $($changed -join ', ')"
    }
}

Write-Host "Verificando os .env..."

$localIp = Get-LocalIPv4
$ipDetected = [bool]$localIp
if ($ipDetected) {
    Write-Host "  IP da máquina na rede: $localIp (usado nos .env em vez de localhost/SEU_IP_AQUI)"
} else {
    $localIp = "localhost"
    Write-Host "  Não consegui detectar o IP da rede — usando 'localhost' só onde ainda não há IP configurado."
    Write-Host "  Atenção: com 'localhost', o app mobile num celular físico não vai conseguir conectar."
}

$envProjects = $npmProjects

# JWT_SECRET e a chave de API interna precisam ser IDÊNTICOS entre os projetos —
# um valor canônico só, aplicado em todos (e corrigido onde estiver divergente).
$jwtSecret = Find-SharedSecret -Projects $envProjects -Keys @('JWT_SECRET')
$apiKey = Find-SharedSecret -Projects $envProjects -Keys @('INTERNAL_API_KEY', 'EXPO_PUBLIC_MONITORING_API_KEY')
$sharedValues = @{
    JWT_SECRET = $jwtSecret
    INTERNAL_API_KEY = $apiKey
    EXPO_PUBLIC_MONITORING_API_KEY = $apiKey
}

foreach ($project in $envProjects) {
    Sync-EnvFile -ProjectPath (Join-Path $root $project) -SharedValues $sharedValues -LocalIp $localIp -IpDetected $ipDetected
}

# --- bancos (Docker) ---------------------------------------------------------

Write-Host "Subindo os bancos (Docker)..."
docker compose -f "$root/docker-compose.yml" up -d

Wait-ForMySQL -ContainerName "mysql_better_meet_dev"
Wait-ForMySQL -ContainerName "mysql_monitoring_better_meet_dev"

# --- Prisma (api e monitoring-better-meet) ----------------------------------

Sync-PrismaSchema -ProjectPath "$root/api" -ProjectName "api"
Sync-PrismaSchema -ProjectPath "$root/monitoring-better-meet" -ProjectName "monitoring-better-meet"

# --- build ---------------------------------------------------------------

Write-Host "Buildando monitoring-better-meet..."
Push-Location "$root/monitoring-better-meet"
npm run build
Pop-Location

Write-Host "Buildando management-better-meet..."
Push-Location "$root/management-better-meet/server"
npm run build
Pop-Location

# --- PM2 -------------------------------------------------------------------

Write-Host "Subindo api, monitoring e management (PM2)..."
pm2 start "$root/ecosystem.config.js"

# --- Semente de status inicial (pro painel não ficar sem dados) ------------
# Chamadas aqui usam localhost, não $localIp — é a própria máquina falando com
# os serviços que ela mesma acabou de subir, sem depender de rota de rede/firewall.

Write-Host "Esperando api e monitoring responderem..."
$apiReady = Wait-ForHttp -Url "http://localhost:3333/health"
$monReady = Wait-ForHttp -Url "http://localhost:3334/health"

if ($apiReady -and $monReady) {
    Write-Host "Verificando se o painel já tem dados de status..."
    try {
        $loginBody = @{ identifier = 'admin@bettermeet.com'; password = 'Admin123!' } | ConvertTo-Json
        $login = Invoke-RestMethod -Uri "http://localhost:3333/login" -Method Post -Body $loginBody -ContentType 'application/json'

        $current = Invoke-RestMethod -Uri "http://localhost:3334/monitoring-better-meet/status" -Method Get -Headers @{ Authorization = "Bearer $($login.token)" }
        $existing = @($current | ForEach-Object { $_.subSystem })

        # Mesmos 6 nomes usados em monitoring-better-meet/src/jobs/healthCheck.cron.ts
        $knownSubsystems = @('data-api', 'database', 'mobile-app', 'monitoring-database', 'management', 'monitoring')

        foreach ($name in $knownSubsystems) {
            if ($existing -notcontains $name) {
                Write-Host "  Sem dado pra '$name' — inserindo registro inicial (UNKNOWN)..."
                $seedBody = @{ subSystem = $name; status = 'UNKNOWN'; message = 'Registro inicial (seed via start-all.ps1)' } | ConvertTo-Json
                Invoke-RestMethod -Uri "http://localhost:3334/monitoring-better-meet/status" -Method Post -Body $seedBody -ContentType 'application/json' -Headers @{ 'x-api-key' = $apiKey } | Out-Null
            }
        }

        # O seed acima só garante que o subsistema existe (com um "UNKNOWN" genérico)
        # — agora dispara a checagem de verdade de cada um (mesmo endpoint que a
        # management chama depois de start/stop/restart), pra já nascer com o status real.
        Write-Host "  Executando checagem real de cada subsistema..."
        foreach ($name in $knownSubsystems) {
            try {
                Invoke-RestMethod -Uri "http://localhost:3334/monitoring-better-meet/status/$name/check" -Method Post -Headers @{ 'x-api-key' = $apiKey } | Out-Null
                Write-Host "    $name verificado."
            } catch {
                Write-Host "    Não foi possível verificar '$name' agora: $($_.Exception.Message)"
            }
        }

        Write-Host "  Painel de status preparado."
    } catch {
        Write-Host "  Não foi possível verificar/preencher o status inicial: $($_.Exception.Message)"
        Write-Host "  Não é bloqueante — o painel só mostra 'Sem monitoramento ainda' até o próximo check."
    }
} else {
    Write-Host "api ou monitoring não responderam em tempo — pulando a semente de status inicial."
}

# --- Painel admin (só depois de tudo estar de pé e com status real) --------
# O build em si não "grava" nenhum dado (o painel busca o status ao vivo no
# navegador) — mas só builda depois pra manter a ordem: backend de pé e com
# dados reais, e só então o painel que vai consumir isso.

Write-Host "Buildando o painel admin (management-better-meet/web)..."
Push-Location "$root/management-better-meet/web"
npm run export:web
Pop-Location

Write-Host "Pronto. Painel em http://${localIp}:3335/admin — confira os processos com: pm2 list"
