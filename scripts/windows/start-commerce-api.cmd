@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "UI_ROOT=%%~fI"

if defined PRICE_FETCHER_DIR (
  set "PRICE_FETCHER_ROOT=%PRICE_FETCHER_DIR%"
) else (
  set "PRICE_FETCHER_ROOT=%UI_ROOT%\..\price-fetcher"
)

for %%I in ("%PRICE_FETCHER_ROOT%") do set "PRICE_FETCHER_ROOT=%%~fI"

echo Starting Commerce API from:
echo %PRICE_FETCHER_ROOT%
echo.

if not exist "%PRICE_FETCHER_ROOT%" (
  echo Price-fetcher directory was not found.
  echo Set PRICE_FETCHER_DIR to the local price-fetcher repository path.
  echo.
  pause
  exit /b 1
)

cd /d "%PRICE_FETCHER_ROOT%" || (
  echo Could not change directory to %PRICE_FETCHER_ROOT%.
  pause
  exit /b 1
)

if exist ".venv\Scripts\activate.bat" (
  call ".venv\Scripts\activate.bat"
)

where pricefetcher-api >nul 2>nul
if errorlevel 1 (
  echo pricefetcher-api was not found on PATH.
  echo Run:
  echo python -m pip install -e .
  echo.
  pause
  exit /b 1
)

pricefetcher-api
if errorlevel 1 (
  echo.
  echo pricefetcher-api exited with an error.
  pause
  exit /b 1
)

endlocal
