param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$installer = Join-Path $PSScriptRoot 'codex-one-click-install.ps1'
if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) { Write-Error '缺少 codex-one-click-install.ps1。'; exit 1 }
try {
    & $installer @PSBoundParameters
    if (-not $?) { exit 1 }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
