param([switch]$AppOnly)
$ErrorActionPreference = 'Stop'
$reviewRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$evidenceRoot = Join-Path $reviewRoot 'qa-evidence/axora-upgrade/workflow'
$reviewPorts = if ($AppOnly) { @(43435) } else { @(43434,43435,43436) }
foreach ($reviewPort in $reviewPorts) {
  if (Get-NetTCPConnection -State Listen -LocalPort $reviewPort -ErrorAction SilentlyContinue) { throw "QA port $reviewPort is already occupied; no process was stopped." }
}
$env:AXORA_DIST_DIR='.next-orders-qa'
$env:NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:43434'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY='fixture-anon-key'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-anon-key'
$env:SUPABASE_SERVICE_ROLE_KEY='fixture-service-role-key'
$env:NEXT_PUBLIC_SITE_URL='http://localhost:43435'
$env:SMTP_HOST='127.0.0.1'
$env:SMTP_PORT='43436'
$env:SMTP_SECURE='false'
$env:SMTP_USER='fixture@example.invalid'
$env:SMTP_PASSWORD='fixture-only-password'
$env:EMAIL_FROM='AXORA QA <fixture@example.invalid>'
$env:AXORA_ECOSYSTEM_JOB_SECRET='fixture-order-job-secret-xxxxxxxxxxxxxxxxxxxxxxxx'
$reviewNode=(Get-Command node).Source
if ($AppOnly) {
  $knownFixture=(Get-Content -LiteralPath (Join-Path $evidenceRoot 'review-servers.json') -Raw | ConvertFrom-Json).fixturePid
  $fixtureProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$knownFixture"
  if (-not $fixtureProcess -or $fixtureProcess.CommandLine -notmatch 'tests/order-workflow/fixture.mts') { throw 'Existing QA fixture identity mismatch.' }
  $fixture=Get-Process -Id $knownFixture
} else {
$fixture=Start-Process -FilePath $reviewNode -ArgumentList @('--import','tsx','tests/order-workflow/fixture.mts') -WorkingDirectory $reviewRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $evidenceRoot 'review-fixture.log') -RedirectStandardError (Join-Path $evidenceRoot 'review-fixture-error.log') -PassThru
}
$app=Start-Process -FilePath $reviewNode -ArgumentList @('node_modules/next/dist/bin/next','start','--port','43435','--hostname','127.0.0.1') -WorkingDirectory $reviewRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $evidenceRoot 'review-app.log') -RedirectStandardError (Join-Path $evidenceRoot 'review-app-error.log') -PassThru
[ordered]@{purpose='Loopback-only AXORA review, disposable PostgreSQL/Auth/SMTP; never production data';fixturePid=$fixture.Id;appPid=$app.Id;url='http://localhost:43435';startedAt=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content (Join-Path $evidenceRoot 'review-servers.json') -Encoding utf8
Write-Output 'QA review servers started on loopback ports 43434/43435/43436.'
