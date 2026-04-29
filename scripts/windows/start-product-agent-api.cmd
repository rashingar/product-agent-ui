@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "UI_ROOT=%%~fI"

if defined PRODUCT_AGENT_DIR (
  set "PRODUCT_AGENT_ROOT=%PRODUCT_AGENT_DIR%"
) else (
  set "PRODUCT_AGENT_ROOT=%UI_ROOT%\..\Product-Agent"
)

for %%I in ("%PRODUCT_AGENT_ROOT%") do set "PRODUCT_AGENT_ROOT=%%~fI"

echo Starting Product-Agent API from:
echo %PRODUCT_AGENT_ROOT%
echo.

if not exist "%PRODUCT_AGENT_ROOT%" (
  echo Product-Agent directory was not found.
  echo Set PRODUCT_AGENT_DIR to the local Product-Agent repository path.
  echo.
  pause
  exit /b 1
)

if not defined PRODUCT_AGENT_API_CMD (
  echo PRODUCT_AGENT_API_CMD is not set.
  echo Set PRODUCT_AGENT_API_CMD to the command that starts the Product-Agent API on 127.0.0.1:8000.
  echo.
  echo Example:
  echo set PRODUCT_AGENT_API_CMD=python -m your.api.module
  echo.
  pause
  exit /b 1
)

cd /d "%PRODUCT_AGENT_ROOT%" || (
  echo Could not change directory to %PRODUCT_AGENT_ROOT%.
  pause
  exit /b 1
)

echo Running:
echo %PRODUCT_AGENT_API_CMD%
echo.

call %PRODUCT_AGENT_API_CMD%
if errorlevel 1 (
  echo.
  echo Product-Agent API command exited with an error.
  pause
  exit /b 1
)

endlocal
