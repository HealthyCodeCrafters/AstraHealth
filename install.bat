@echo off
REM ASTRA standalone installer (Windows 10/11)
cd /d "%~dp0"
echo === ASTRA standalone installer ===

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is required but not installed.
  echo Install Node.js 18 or newer from https://nodejs.org and run this script again.
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -e "console.log(process.versions.node)"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% lss 18 (
  echo Node.js 18 or newer is required.
  pause
  exit /b 1
)

echo Node.js found.
echo No packages to install — the app is pre-built and the server has zero dependencies.
echo Run start.bat to launch ASTRA.
pause
