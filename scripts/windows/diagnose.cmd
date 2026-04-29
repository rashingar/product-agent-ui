@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$checks = @(" ^
  "  @{ Name = 'Product-Agent health'; Url = 'http://127.0.0.1:8000/api/health'; Hint = 'Start the Product-Agent API on 127.0.0.1:8000.' }," ^
  "  @{ Name = 'Commerce health'; Url = 'http://127.0.0.1:8001/api/health'; Hint = 'Start pricefetcher-api.' }," ^
  "  @{ Name = 'Commerce catalog summary'; Url = 'http://127.0.0.1:8001/api/catalog/summary'; Hint = 'If commerce health works, check sourceCata.csv or PRICEFETCHER_SOURCE_CATA_PATH.' }," ^
  "  @{ Name = 'Commerce file roots'; Url = 'http://127.0.0.1:8001/api/files/roots'; Hint = 'Check backend file roots configuration.' }," ^
  "  @{ Name = 'Commerce artifact roots'; Url = 'http://127.0.0.1:8001/api/artifacts/roots'; Hint = 'Check the latest price-fetcher backend and artifact roots configuration.' }" ^
  ");" ^
  "$results = @{};" ^
  "foreach ($check in $checks) {" ^
  "  try {" ^
  "    $response = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 5;" ^
  "    $ok = $response.StatusCode -ge 200 -and $response.StatusCode -lt 300;" ^
  "    $results[$check.Name] = $ok;" ^
  "    if ($ok) { Write-Host ('OK   ' + $check.Name + ' - HTTP ' + $response.StatusCode) -ForegroundColor Green }" ^
  "    else { Write-Host ('FAIL ' + $check.Name + ' - HTTP ' + $response.StatusCode) -ForegroundColor Red; Write-Host ('     ' + $check.Hint) }" ^
  "  } catch {" ^
  "    $results[$check.Name] = $false;" ^
  "    Write-Host ('FAIL ' + $check.Name + ' - ' + $_.Exception.Message) -ForegroundColor Red;" ^
  "    Write-Host ('     ' + $check.Hint)" ^
  "  }" ^
  "}" ^
  "if (($results['Commerce health'] -eq $true) -and ($results['Commerce catalog summary'] -ne $true)) {" ^
  "  Write-Host ''; Write-Host 'Hint: Commerce API is running, but catalog summary failed. Check sourceCata.csv.' -ForegroundColor Yellow" ^
  "}"

echo.
pause
endlocal
