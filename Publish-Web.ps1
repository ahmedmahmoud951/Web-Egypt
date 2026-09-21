#Requires -Version 5.1
param(
  [string]$SiteName = "site92916",
  [string]$UserName = "site92916",
  [string]$ServiceHost = "site92916.siteasp.net",
  [string]$Password = "",
  [string]$PublicSiteUrl = "https://webtodayegypt.runasp.net",
  [string]$ApiUrl = "https://todayegypt.runasp.net",
  [switch]$SkipBuild,
  [switch]$SkipDeploy,
  [switch]$ForceInstall,
  [switch]$StopNode
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Get-MsDeploy {
  $candidates = @(
    "$env:ProgramFiles\IIS\Microsoft Web Deploy V3\msdeploy.exe",
    "${env:ProgramFiles(x86)}\IIS\Microsoft Web Deploy V3\msdeploy.exe"
  )
  $exe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $exe) {
    throw "msdeploy.exe not found. Install Web Deploy 3.6 from Microsoft."
  }
  return $exe
}

function Escape-MsDeployValue([string]$Value) {
  $v = $Value -replace "'", "''"
  return "'$v'"
}

function Stop-LocalNodeLocks {
  Write-Host "Stopping local node.exe processes..." -ForegroundColor DarkYellow
  Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
      Write-Host "  stopped node PID $($_.Id)"
    } catch {}
  }
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TodayInEgypt Web -> $PublicSiteUrl" -ForegroundColor Cyan
Write-Host " SiteASP: $SiteName @ ${ServiceHost}:8172" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $Password) {
  $sec = Read-Host -AsSecureString -Prompt "Web Deploy password"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

if ([string]::IsNullOrWhiteSpace($Password)) {
  throw "Password is required."
}

$publishDir = Join-Path $root "publish-out"
$standaloneDir = Join-Path $root ".next\standalone"
$staticDir = Join-Path $root ".next\static"
$publicDir = Join-Path $root "public"
$webConfigSrc = Join-Path $root "deploy\web.config"
$nodeModules = Join-Path $root "node_modules"
$nextBin = Join-Path $root "node_modules\next\dist\bin\next"

if (-not $SkipBuild) {
  if ($StopNode -or $ForceInstall) {
    Stop-LocalNodeLocks
  }

  Push-Location $root
  try {
    $needInstall = $ForceInstall -or -not (Test-Path $nodeModules) -or -not (Test-Path $nextBin)

    if ($needInstall) {
      Write-Host "=== 1) npm install ===" -ForegroundColor Yellow
      Write-Host "Close npm run dev if EPERM appears" -ForegroundColor DarkYellow
      npm install --no-fund --no-audit --prefer-offline
      if ($LASTEXITCODE -ne 0) {
        throw "npm install failed. Stop npm run dev, then use -ForceInstall -StopNode"
      }
    }
    else {
      Write-Host "=== 1) npm install SKIPPED (node_modules OK) ===" -ForegroundColor DarkYellow
    }

    if (-not (Test-Path $nextBin)) {
      throw "next binary missing. Run with -ForceInstall"
    }

    Write-Host "=== 2) next build (standalone) ===" -ForegroundColor Yellow
    $env:NODE_ENV = "production"
    $env:NEXT_PUBLIC_API_URL = $ApiUrl
    $env:NEXT_PUBLIC_API_DIRECT = "1"
    $env:INTERNAL_API_URL = $ApiUrl

    node $nextBin build
    if ($LASTEXITCODE -ne 0) { throw "next build failed" }
  }
  finally {
    Pop-Location
  }

  if (-not (Test-Path $standaloneDir)) {
    throw "Standalone output missing. Check next.config output standalone"
  }
  if (-not (Test-Path $staticDir)) {
    throw "Missing .next\static after build"
  }

  Write-Host "=== 3) Assemble publish-out ===" -ForegroundColor Yellow
  if (Test-Path $publishDir) {
    Remove-Item $publishDir -Recurse -Force
  }
  New-Item -ItemType Directory -Path $publishDir | Out-Null

  Copy-Item -Path (Join-Path $standaloneDir "*") -Destination $publishDir -Recurse -Force

  $destNext = Join-Path $publishDir ".next"
  if (-not (Test-Path $destNext)) {
    New-Item -ItemType Directory -Path $destNext | Out-Null
  }
  $destStatic = Join-Path $destNext "static"
  if (Test-Path $destStatic) { Remove-Item $destStatic -Recurse -Force }
  Copy-Item -Path $staticDir -Destination $destStatic -Recurse -Force

  if (Test-Path $publicDir) {
    $destPublic = Join-Path $publishDir "public"
    if (Test-Path $destPublic) { Remove-Item $destPublic -Recurse -Force }
    Copy-Item -Path $publicDir -Destination $destPublic -Recurse -Force
  }

  if (-not (Test-Path $webConfigSrc)) {
    throw "Missing deploy\web.config"
  }
  Copy-Item $webConfigSrc (Join-Path $publishDir "web.config") -Force

  foreach ($name in @("boot.js", "app.js")) {
    $src = Join-Path $root "deploy\$name"
    if (-not (Test-Path $src)) {
      throw "Missing deploy\$name"
    }
    Copy-Item $src (Join-Path $publishDir $name) -Force
  }

  New-Item -ItemType Directory -Path (Join-Path $publishDir "logs") -Force | Out-Null
  Set-Content -Path (Join-Path $publishDir "logs\.gitkeep") -Value "" -Encoding ASCII

  Write-Host "Publish package ready: $publishDir" -ForegroundColor Green
}
else {
  Write-Host "SkipBuild: using existing publish-out" -ForegroundColor DarkYellow
  if (-not (Test-Path $publishDir)) {
    throw "publish-out not found. Run without -SkipBuild first."
  }
  # Refresh IIS entry files even on DeployOnly
  Copy-Item $webConfigSrc (Join-Path $publishDir "web.config") -Force
  foreach ($name in @("boot.js", "app.js", "diag.js")) {
    $src = Join-Path $root "deploy\$name"
    if (Test-Path $src) {
      Copy-Item $src (Join-Path $publishDir $name) -Force
    }
  }
  New-Item -ItemType Directory -Path (Join-Path $publishDir "logs") -Force | Out-Null
}

if ($SkipDeploy) {
  Write-Host "SkipDeploy: build only. Done." -ForegroundColor Green
  exit 0
}

$msdeploy = Get-MsDeploy
$computerName = "https://${ServiceHost}:8172/msdeploy.axd?site=$SiteName"
$cn = Escape-MsDeployValue $computerName
$un = Escape-MsDeployValue $UserName
$pw = Escape-MsDeployValue $Password
$destAuth = "computerName=$cn,userName=$un,password=$pw,authType='Basic'"

Write-Host "=== 4) Web Deploy sync -> $SiteName ===" -ForegroundColor Yellow

# msdeploy + PowerShell breaks on paths with spaces (extra quotes).
# Stage to a no-space folder under TEMP, then deploy.
$stageDir = Join-Path $env:TEMP "tie-web-publish"
if (Test-Path $stageDir) {
  Remove-Item $stageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stageDir | Out-Null
Write-Host "Staging to $stageDir ..." -ForegroundColor DarkGray
robocopy $publishDir $stageDir /E /NFL /NDL /NJH /NJS /NC /NS | Out-Null
# robocopy exit codes 0-7 are success
if ($LASTEXITCODE -ge 8) {
  throw "robocopy staging failed with code $LASTEXITCODE"
}

# Pre-upload app_offline.htm so locked Example/.NET DLLs unlock before delete.
$offlineFile = Join-Path $env:TEMP "app_offline_tie_web.htm"
Set-Content -Path $offlineFile -Value "<!DOCTYPE html><html><body><h1>Updating site...</h1></body></html>" -Encoding ASCII
Write-Host "Uploading app_offline.htm to unlock site files..." -ForegroundColor DarkYellow
$offlineSrc = "-source:contentPath=$offlineFile"
$offlineDest = "-dest:contentPath=$SiteName/app_offline.htm,computerName=$cn,userName=$un,password=$pw,authType=Basic"
cmd.exe /c "`"$msdeploy`" -verb:sync $offlineSrc $offlineDest -allowUntrusted"
if ($LASTEXITCODE -eq 0) {
  Write-Host "Waiting 20s for app pool / Node to release file locks..." -ForegroundColor DarkYellow
  Start-Sleep -Seconds 20
}
else {
  Write-Host "app_offline upload failed (will still try sync with AppOffline rule)." -ForegroundColor DarkYellow
}

$sourceArg = "-source:contentPath=$stageDir"
# AppOffline stops Node (releases locks). Skip ONLY nested browser-logs style paths —
# always upload root logs\ so HttpPlatform can write stdout (missing folder = empty 500).
$destArg = "-dest:contentPath=$SiteName,computerName=$cn,userName=$un,password=$pw,authType=Basic,includeAcls=False"
$msdeployCmd = "`"$msdeploy`" -verb:sync $sourceArg $destArg -allowUntrusted -enableRule:AppOffline -disableLink:AppPoolExtension -disableLink:ContentExtension -disableLink:CertificateExtension -retryAttempts:5 -retryInterval:3000"

$deployExit = 1
for ($attempt = 1; $attempt -le 3; $attempt++) {
  Write-Host "Running msdeploy via cmd (attempt $attempt/3)..." -ForegroundColor DarkGray
  cmd.exe /c $msdeployCmd
  $deployExit = $LASTEXITCODE
  if ($deployExit -eq 0) { break }
  Write-Host "Deploy attempt $attempt failed (exit $deployExit). Waiting 15s..." -ForegroundColor DarkYellow
  Start-Sleep -Seconds 15
}

# Remove leftover app_offline.htm from earlier publishes (causes empty 500)
if ($deployExit -eq 0) {
  try {
    & $msdeploy `
      "-verb:delete" `
      "-dest:contentPath=${SiteName}/app_offline.htm,computerName=https://${ServiceHost}:8172/msdeploy.axd?site=${SiteName},userName=${UserName},password=${Password},authType=Basic" `
      "-allowUntrusted" 2>&1 | Out-Null
  } catch {}
}

if ($deployExit -ne 0) {
  Write-Host ""
  Write-Host "DEPLOY FAILED (exit $deployExit)." -ForegroundColor Red
  Write-Host "1. Check SiteASP Web Deploy credentials" -ForegroundColor Yellow
  Write-Host "2. Site name must be: $SiteName" -ForegroundColor Yellow
  Write-Host "3. In panel: Stop website, wait 20s, re-run Publish-Web-DeployOnly.bat" -ForegroundColor Yellow
  Write-Host "4. Install Web Deploy 3.6" -ForegroundColor Yellow
  exit $deployExit
}

Write-Host ""
Write-Host "=== PUBLISH OK ===" -ForegroundColor Green
Write-Host "Open: $PublicSiteUrl" -ForegroundColor Green
Write-Host ""
Write-Host "In MonsterASP panel after publish:" -ForegroundColor Yellow
Write-Host "  1) Click Restart if the site shows 500" -ForegroundColor Yellow
Write-Host "  2) Logs -> enable HttpPlatform Debug logs if needed" -ForegroundColor Yellow
Write-Host "  3) Files -> logs for node_*.log" -ForegroundColor Yellow
Write-Host ""
