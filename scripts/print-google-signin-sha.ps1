# Prints Android SHA-1 fingerprints for Google Sign-In / Firebase setup.
# DEVELOPER_ERROR on EAS APK = release keystore SHA-1 missing in Firebase.

Write-Host ""
Write-Host "=== Google Sign-In Android SHA-1 setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package name: tuk.tuk.app"
Write-Host "Firebase project: tuk-tuk-application (969637468541)"
Write-Host ""
Write-Host "1) Debug / local Expo build SHA-1 (already in google-services.json):" -ForegroundColor Yellow
Write-Host "   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25"
Write-Host ""
Write-Host "2) EAS preview/production keystore SHA-1 (REQUIRED for store/EAS-signed APK):" -ForegroundColor Yellow
Write-Host "   Run:  npx eas-cli credentials -p android"
Write-Host "   Then: Keystore -> View SHA-1 fingerprint"
Write-Host "   Add that SHA-1 in Firebase Console:"
Write-Host "   Project settings -> Your apps -> Android (tuk.tuk.app) -> Add fingerprint"
Write-Host "   Download the new google-services.json and replace ./google-services.json"
Write-Host ""
Write-Host "3) Rebuild APK:" -ForegroundColor Yellow
Write-Host "   npx eas-cli build --platform android --profile preview"
Write-Host ""

$debugKeystore = Join-Path $env:USERPROFILE ".android\debug.keystore"
if (Test-Path $debugKeystore) {
  $keytool = Get-Command keytool -ErrorAction SilentlyContinue
  if ($keytool) {
    Write-Host "Local debug keystore SHA-1:" -ForegroundColor Green
    keytool -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android 2>$null |
      Select-String "SHA1:"
  }
}

Write-Host ""
