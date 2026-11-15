@echo off
REM Stop the local ASTRA server (Windows).
if "%PORT%"=="" set PORT=8080
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
  taskkill /PID %%p /F >nul 2>nul
  echo ASTRA stopped.
  goto :done
)
echo ASTRA is not running.
:done
pause
