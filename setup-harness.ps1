# ==============================================================================
# SCRIPT DE INSTALACAO & INICIALIZACAO DO HARNESS (WINDOWS POWERSHELL)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   >>> INICIALIZANDO O ENXAME DE AGENTES (KIMI + OPENCODE GO) <<<" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar Node.js
Write-Host ""
Write-Host "[1/5] Verificando ambiente Node.js..." -ForegroundColor Gray
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node -v
    Write-Host "  [OK] Node.js detectado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERRO] Node.js nao foi encontrado! Instale a versao LTS de https://nodejs.org" -ForegroundColor Red
    Exit
}

# 2. Verificar ou Instalar Kimi Code CLI
Write-Host ""
Write-Host "[2/5] Verificando Kimi Code CLI..." -ForegroundColor Gray
if (Get-Command kimi -ErrorAction SilentlyContinue) {
    $kimiVer = kimi --version
    Write-Host "  [OK] Kimi Code CLI detectado: v$kimiVer" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] Kimi Code CLI nao encontrado. Instalando via npm..." -ForegroundColor Yellow
    npm install -g --allow-scripts=@moonshot-ai/kimi-code,node-pty @moonshot-ai/kimi-code
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Kimi Code CLI instalado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "  [AVISO] Tentando script alternativo..." -ForegroundColor Yellow
        irm https://code.kimi.com/kimi-code/install.ps1 | iex
    }
}

# 3. Criar Diretorios Operacionais do Enxame
Write-Host ""
Write-Host "[3/5] Estruturando diretorios de producao..." -ForegroundColor Gray
$folders = @("web", "marketing", "instagram", "prompts")
foreach ($folder in $folders) {
    $fullPath = Join-Path $PSScriptRoot $folder
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  + Criado diretorio: $folder/" -ForegroundColor DarkGray
    }
}
Write-Host "  [OK] Diretorios operacionais prontos." -ForegroundColor Green

# 4. Configurar Arquivo .env
Write-Host ""
Write-Host "[4/5] Verificando credenciais do OpenCode Go..." -ForegroundColor Gray
$envFile = Join-Path $PSScriptRoot ".env"
$envExample = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "  [AVISO] Arquivo '.env' criado a partir de '.env.example'!" -ForegroundColor Yellow
    Write-Host "  [ACAO] Abra o arquivo .env e cole sua OPENCODE_API_KEY do OpenCode Go." -ForegroundColor Yellow
} else {
    Write-Host "  [OK] Arquivo '.env' localizado." -ForegroundColor Green
}

# 5. Configurar KIMI_CODE_HOME para carregar o config.toml do Harness
Write-Host ""
Write-Host "[5/5] Vinculando configuracao do Harness ao Kimi Code CLI..." -ForegroundColor Gray
$env:KIMI_CODE_HOME = $PSScriptRoot
Write-Host "  [OK] KIMI_CODE_HOME apontado para: $PSScriptRoot" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   >>> ENXAME PRONTO PARA DECOLAGEM! <<<" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Para iniciar uma sessao do Enxame, execute:" -ForegroundColor White
Write-Host "   .\start-swarm.ps1" -ForegroundColor Yellow
Write-Host "Ou diretamente no terminal:" -ForegroundColor White
Write-Host "   kimi" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
