# Prints the Facebook Android key hash for your debug keystore.
# Add the output to Meta → Settings → Basic → Android → Key Hashes.
#
# Usage (from Tuk-Tuk folder):
#   powershell -ExecutionPolicy Bypass -File scripts/get-facebook-key-hash.ps1

$ErrorActionPreference = "Stop"

$candidates = @(
  (Join-Path $PSScriptRoot "..\android\app\debug.keystore"),
  (Join-Path $env:USERPROFILE ".android\debug.keystore")
)

$keystore = $null
foreach ($path in $candidates) {
  $resolved = [System.IO.Path]::GetFullPath($path)
  if (Test-Path $resolved) {
    $keystore = $resolved
    break
  }
}

if (-not $keystore) {
  Write-Host "No debug.keystore found. Build once first:" -ForegroundColor Yellow
  Write-Host "  npx expo prebuild"
  Write-Host "  npx expo run:android"
  exit 1
}

Write-Host "Using keystore: $keystore"

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  Write-Host "keytool not found. Install JDK and add it to PATH." -ForegroundColor Red
  exit 1
}

$certOutput = & keytool -exportcert -alias androiddebugkey -keystore $keystore -storepass android -keypass android 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host $certOutput
  exit 1
}

$sha1Line = (& keytool -list -v -keystore $keystore -alias androiddebugkey -storepass android -keypass android 2>&1) |
  Where-Object { $_ -match "SHA1:" } |
  Select-Object -First 1

if (-not $sha1Line) {
  Write-Host "Could not read SHA1 from keystore." -ForegroundColor Red
  exit 1
}

$sha1Hex = ($sha1Line -replace ".*SHA1:\s*", "" -replace ":", "").Trim().ToLower()
$bytes = [byte[]]::new($sha1Hex.Length / 2)
for ($i = 0; $i -lt $sha1Hex.Length; $i += 2) {
  $bytes[$i / 2] = [Convert]::ToByte($sha1Hex.Substring($i, 2), 16)
}
$keyHash = [Convert]::ToBase64String($bytes)

Write-Host ""
Write-Host "Facebook Android key hash:" -ForegroundColor Green
Write-Host $keyHash
Write-Host ""
Write-Host "Add this in Meta Developer Console:" -ForegroundColor Cyan
Write-Host "  App 978713374875936 → Settings → Basic → Android → Key Hashes"
Write-Host "  Package name: tuk.tuk.app"
Write-Host ""
Write-Host "Then set in .env:" -ForegroundColor Cyan
Write-Host "  EXPO_PUBLIC_FACEBOOK_USE_NATIVE=true"
Write-Host "  and rebuild the app."
