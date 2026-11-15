@echo off
REM Start ASTRA locally (Windows). Works with no internet connection.
cd /d "%~dp0"
if "%PORT%"=="" set PORT=8080
echo Starting ASTRA on http://localhost:%PORT% ...
start "" "http://localhost:%PORT%"
node server.mjs
