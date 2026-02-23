$ErrorActionPreference = 'Stop'

Write-Host "Uninstalling ReleaseRun CLI..."

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Warning "npm not found, skipping npm uninstall step."
  exit 0
}

& npm uninstall -g releaserun
if ($LASTEXITCODE -ne 0) {
  Write-Warning "npm uninstall returned exit code $LASTEXITCODE"
}
