# Sobe tudo com um comando só: gera os .env que faltarem (com segredos
# aleatórios reais), sobe os bancos (Docker, cria na primeira vez / só inicia
# depois) + as 3 APIs (PM2) + build do painel admin (servido pela própria
# management em /admin). Idempotente — pode rodar de novo sem problema.
#
# Uso:
#   .\start-all.ps1                          Sobe tudo (pm2 ausente e .env já existentes ficam como estão)
#   .\start-all.ps1 --pm2 y                  Idem, instalando o pm2 globalmente se estiver faltando
#   .\start-all.ps1 --adjust-env y           Idem, reaplicando os ajustes mesmo em .env que já existem
#   .\start-all.ps1 --pm2 y --adjust-env y   Os dois juntos (ordem não importa)
# y = yes, n = not — parâmetro omitido equivale a "n".
#
# Pré-requisito que não é automatizado (por segurança): Node.js e Docker
# Desktop instalados, e "npm install" já rodado em cada projeto — veja install-all.ps1.

# Sem param() de propósito — PowerShell não faz bind nativo de flags "--assim"
# (só "-Assim", com um traço), então o parse de --pm2/--adjust-env é manual aqui.
$scriptArgs = $args

function Get-FlagValue {
    param([string[]]$AllArgs, [string]$Name)

    for ($i = 0; $i -lt $AllArgs.Count; $i++) {
        if ($AllArgs[$i] -eq $Name -and ($i + 1) -lt $AllArgs.Count) {
            return $AllArgs[$i + 1]
        }
    }
    return $null
}

$installPm2 = (Get-FlagValue -AllArgs $scriptArgs -Name '--pm2') -eq 'y'
$forceAdjustEnv = (Get-FlagValue -AllArgs $scriptArgs -Name '--adjust-env') -eq 'y'

$root = $PSScriptRoot

# --- pm2 -------------------------------------------------------------------

Write-Host "Verificando o pm2..."
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    if ($installPm2) {
        Write-Host "pm2 não encontrado — instalando globalmente (npm install -g pm2)..."
        npm install -g pm2
    } else {
        Write-Host "pm2 não está instalado globalmente."
        Write-Host "Rode '.\start-all.ps1 --pm2 y' pra instalar automaticamente, ou 'npm install -g pm2' na mão."
        exit 1
    }
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

function Get-ExistingValue {
    param([string]$EnvPath, [string]$VarName)

    if (-not (Test-Path $EnvPath)) { return $null }

    $line = Get-Content -Path $EnvPath -Encoding UTF8 | Where-Object { $_ -match "^$VarName=" } | Select-Object -First 1
    if ($null -eq $line) { return $null }
    if ($line -match '^[A-Z_]+="(.*)"$') { return $Matches[1] }
    return $null
}

function Initialize-EnvFile {
    param(
        [string]$ProjectPath,
        [string]$JwtSecret,
        [string]$ApiKey,
        [string]$LocalIp,
        [bool]$ForceAdjust
    )

    $envPath = Join-Path $ProjectPath ".env"
    $examplePath = Join-Path $ProjectPath ".env.example"

    if ((Test-Path $envPath) -and -not $ForceAdjust) {
        Write-Host "  .env já existe em $ProjectPath — mantendo como está (use --adjust-env y pra sobrescrever)."
        return
    }
    if (-not (Test-Path $examplePath)) {
        Write-Host "  Sem .env.example em $ProjectPath — pulando."
        return
    }

    # 1) Copia o .env.example como .env (arquivo real, sem transformação nenhuma ainda)
    Copy-Item -Path $examplePath -Destination $envPath -Force

    # 2) Só depois aplica os ajustes (segredos reais, IP da máquina) em cima do .env recém-criado
    $content = Get-Content -Path $envPath -Raw -Encoding UTF8
    # [^"]* em vez de .*$ de propósito — os .env.example usam quebra de linha CRLF,
    # e um "$" ancorado no fim da linha não bate por causa do \r sobrando antes do \n.
    # ${1}/${2} (com chaves) em vez de $1/$2 de propósito — se o segredo gerado
    # começar com dígito, "$1" + "12ab..." vira "$112ab..." e o .NET tenta ler
    # isso como grupo "$12" (não existe), descartando a substituição inteira.
    $content = $content -replace '(?m)^(JWT_SECRET=")[^"]*(")', ('${1}' + $JwtSecret + '${2}')
    $content = $content -replace '(?m)^(INTERNAL_API_KEY=")[^"]*(")', ('${1}' + $ApiKey + '${2}')
    $content = $content -replace '(?m)^(EXPO_PUBLIC_MONITORING_API_KEY=")[^"]*(")', ('${1}' + $ApiKey + '${2}')
    $content = $content -replace '(?m)^(BETTER_AUTH_SECRET=")[^"]*(")', ('${1}' + (New-Secret) + '${2}')
    $content = $content -replace 'SEU_IP_AQUI', $LocalIp
    $content = $content -replace 'localhost', $LocalIp

    [System.IO.File]::WriteAllText($envPath, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  .env criado em $ProjectPath (copiado do .env.example e ajustado)"
}

Write-Host "Preparando os .env que faltarem..."

$localIp = Get-LocalIPv4
if ($localIp) {
    Write-Host "  IP da máquina na rede: $localIp (usado nos .env em vez de localhost/SEU_IP_AQUI)"
} else {
    $localIp = "localhost"
    Write-Host "  Não consegui detectar o IP da rede — usando 'localhost' como fallback."
    Write-Host "  Atenção: com 'localhost', o app mobile num celular físico não vai conseguir conectar."
}

$envProjects = @(
    "api",
    "better-meet",
    "monitoring-better-meet",
    "management-better-meet/server",
    "management-better-meet/web"
)

# Reaproveita um segredo já configurado em qualquer projeto (setup parcial) —
# só gera um novo se nenhum dos 5 projetos tiver .env ainda (máquina nova de verdade).
$jwtSecret = $null
$apiKey = $null
foreach ($project in $envProjects) {
    $envPath = Join-Path (Join-Path $root $project) ".env"
    if (-not $jwtSecret) { $jwtSecret = Get-ExistingValue -EnvPath $envPath -VarName 'JWT_SECRET' }
    if (-not $apiKey) { $apiKey = Get-ExistingValue -EnvPath $envPath -VarName 'INTERNAL_API_KEY' }
    if (-not $apiKey) { $apiKey = Get-ExistingValue -EnvPath $envPath -VarName 'EXPO_PUBLIC_MONITORING_API_KEY' }
}
if (-not $jwtSecret) { $jwtSecret = New-Secret }
if (-not $apiKey) { $apiKey = New-Secret }

foreach ($project in $envProjects) {
    Initialize-EnvFile -ProjectPath (Join-Path $root $project) -JwtSecret $jwtSecret -ApiKey $apiKey -LocalIp $localIp -ForceAdjust $forceAdjustEnv
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
