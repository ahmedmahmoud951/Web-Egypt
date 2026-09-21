@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"

REM Copy to Publish-Web.bat and fill PASSWORD (do not commit real password)
set "SITE=site92916"
set "USER=site92916"
set "HOST=site92916.siteasp.net"
set "PASS=YOUR_WEBDEPLOY_PASSWORD"
set "PUBLIC_URL=https://webtodayegypt.runasp.net"
set "API_URL=https://todayegypt.runasp.net"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Publish-Web.ps1" -SiteName "%SITE%" -UserName "%USER%" -ServiceHost "%HOST%" -Password "%PASS%" -PublicSiteUrl "%PUBLIC_URL%" -ApiUrl "%API_URL%"
pause
endlocal
