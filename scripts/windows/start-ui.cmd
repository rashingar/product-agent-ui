@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "UI_ROOT=%%~fI"

cd /d "%UI_ROOT%" || (
  echo Could not change directory to %UI_ROOT%.
  pause
  exit /b 1
)

echo Starting Product-Agent UI from:
echo %UI_ROOT%
echo.

npm run dev
if errorlevel 1 (
  echo.
  echo npm run dev exited with an error.
  pause
  exit /b 1
)

endlocal
