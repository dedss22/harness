# ==============================================================================
# SCRIPT DE DISPARO RAPIDO DO ENXAME (KIMI CODE CLI + OPENCODE GO)
# ==============================================================================

$scriptDir = $PSScriptRoot
$envFile = Join-Path $scriptDir ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $varName = $parts[0].Trim()
            $varVal = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($varName, $varVal, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

# Injetar header de sessao requerido pelo OpenCode Go
$env:KIMI_CODE_CUSTOM_HEADERS = "x-opencode-session: kimi-code-swarm-session"
$env:KIMI_CODE_HOME = $scriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   >>> DISPARANDO SESSAO DO ENXAME DE AGENTES <<<" -ForegroundColor Yellow
Write-Host "   Modelo Ativo: Kimi K3 (Orquestrador) via OpenCode Go" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

kimi
