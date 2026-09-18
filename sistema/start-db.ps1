Param(
  [Parameter(Mandatory=$false)][ValidateSet('up','down','status','help')][string]$Action = 'up'
)

$composeFile = 'better-meet/docker-compose.yml'

function Show-Help {
  @"
Usage: .\start-db.ps1 [up|down|status|help]

Commands:
  up      Start the DB container in background
  down    Stop and remove containers created by compose
  status  Show running container status
  help    Show this message
"@
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "docker not found in PATH. Install Docker Desktop or Docker Engine first."
  exit 1
}

switch ($Action) {
  'up' {
    docker compose -f $composeFile up -d db_better_meet
  }
  'down' {
    docker compose -f $composeFile down
  }
  'status' {
    docker ps --filter "name=mysql_better_meet" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  }
  default { Show-Help }
}
