<#
.SYNOPSIS
    Captura automaticamente a imagem/print da Área de Transferência do Windows
    e salva na pasta de prints do projeto C:\KIMI\prints.

.DESCRIPTION
    Permite tirar um print (Win + Shift + S ou PrintScreen) e, com um simples comando,
    salvar o arquivo PNG e disponibilizar o caminho para usar no terminal ou Kimi Code.
#>

param(
    [string]$NomeArquivo = ""
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

if (![System.Windows.Forms.Clipboard]::ContainsImage()) {
    Write-Host " [AVISO] Nenhuma imagem encontrada na Area de Transferencia!" -ForegroundColor Yellow
    Write-Host " Tire um print primeiro usando [Win + Shift + S] ou a tecla [PrintScreen] e tente novamente." -ForegroundColor Gray
    exit 1
}

$img = [System.Windows.Forms.Clipboard]::GetImage()
$pastaPrints = "C:\KIMI\prints"

if (!(Test-Path $pastaPrints)) {
    New-Item -ItemType Directory -Path $pastaPrints -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if ([string]::IsNullOrWhiteSpace($NomeArquivo)) {
    $NomeArquivo = "print_$timestamp.png"
} elseif (!$NomeArquivo.EndsWith(".png", [System.StringComparison]::OrdinalIgnoreCase)) {
    $NomeArquivo = "$NomeArquivo.png"
}

$caminhoCompleto = Join-Path $pastaPrints $NomeArquivo
$img.Save($caminhoCompleto, [System.Drawing.Imaging.ImageFormat]::Png)

# Copia o caminho direto para o clipboard para facilitar colar se desejar
Set-Clipboard -Value $caminhoCompleto

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host " Print capturado e salvo com sucesso!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Arquivo salvo em:" -ForegroundColor White
Write-Host "   $caminhoCompleto" -ForegroundColor Yellow
Write-Host " Dimensoes: $($img.Width)x$($img.Height) pixels" -ForegroundColor Gray
Write-Host " O caminho absoluto ja foi copiado para sua Area de Transferencia!" -ForegroundColor Green
Write-Host " Dica: No Kimi CLI, use 'Alt + V' para colar imagens diretamente!" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan
