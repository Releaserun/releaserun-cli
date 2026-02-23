$ErrorActionPreference = 'Stop'

Write-Host "Installing ReleaseRun CLI via npm..."

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  throw "npm was not found. Please install Node.js 18+ and retry."
}

& npm install -g releaserun@1.0.0
if ($LASTEXITCODE -ne 0) {
  throw "npm global install failed with exit code $LASTEXITCODE"
}

Write-Host "ReleaseRun CLI installed. Run: releaserun --help"
