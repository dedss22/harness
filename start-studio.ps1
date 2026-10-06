# ==============================================================================
# DISPARAR NEXUS SWARM STUDIO (WEB PLATFORM)
# ==============================================================================
Set-Location "C:\KIMI"
Start-Process "http://localhost:3000"
Write-Host "Iniciando Nexus Swarm Studio em http://localhost:3000..." -ForegroundColor Green
node server.js
