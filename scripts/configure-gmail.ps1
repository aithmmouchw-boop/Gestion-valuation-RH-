$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot 'backend\.env'
$artisanPath = Join-Path $projectRoot 'backend\artisan'

Write-Host 'Configuration Gmail - Gestion Evaluation RH' -ForegroundColor Green
Write-Host 'Utilisez un mot de passe application Google de 16 caracteres, pas le mot de passe habituel.' -ForegroundColor Yellow
$gmail = Read-Host 'Adresse Gmail expediteur'
if ($gmail -notmatch '^[^@\s]+@gmail\.com$') { throw 'Une adresse @gmail.com valide est requise.' }
$securePassword = Read-Host 'Mot de passe application Google' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try { $appPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
if ([string]::IsNullOrWhiteSpace($appPassword)) { throw 'Le mot de passe application est obligatoire.' }
$recipient = Read-Host "Adresse destinataire du test (Entree = $gmail)"
if ([string]::IsNullOrWhiteSpace($recipient)) { $recipient = $gmail }
if ($recipient -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { throw 'Adresse destinataire invalide.' }

$content = Get-Content -LiteralPath $envPath -Raw
function Set-EnvValue([string]$key, [string]$value) {
    $script:content = [regex]::Replace($script:content, '(?m)^' + [regex]::Escape($key) + '=.*$', { param($match) "$key=$value" })
    if ($script:content -notmatch ('(?m)^' + [regex]::Escape($key) + '=')) { $script:content += "`r`n$key=$value" }
}
Set-EnvValue 'MAIL_MAILER' 'smtp'
Set-EnvValue 'MAIL_SCHEME' 'null'
Set-EnvValue 'MAIL_HOST' 'smtp.gmail.com'
Set-EnvValue 'MAIL_PORT' '587'
Set-EnvValue 'MAIL_USERNAME' $gmail
Set-EnvValue 'MAIL_PASSWORD' ('"' + $appPassword + '"')
Set-EnvValue 'MAIL_FROM_ADDRESS' $gmail
Set-EnvValue 'MAIL_FROM_NAME' '"Gestion Evaluation RH"'
Set-Content -LiteralPath $envPath -Value $content -Encoding utf8
$appPassword = $null

Push-Location $projectRoot
try {
    & php $artisanPath config:clear
    & php $artisanPath mail:test $recipient
    if ($LASTEXITCODE -ne 0) { throw 'Le test SMTP a echoue.' }
    Write-Host "Succes. Verifiez la boite de reception de $recipient et le dossier spam." -ForegroundColor Green
} finally { Pop-Location }
Read-Host 'Appuyez sur Entree pour fermer'
