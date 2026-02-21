# Simple API health check test
$uri = "http://localhost:5001/api/health"
try {
    $response = Invoke-RestMethod -Uri $uri -Method Get
    Write-Host "API Status: $($response.status)" -ForegroundColor Green
    Write-Host "Version: $($response.version)" -ForegroundColor Cyan
}
catch {
    Write-Host "API Error: $($_.Exception.Message)" -ForegroundColor Red
}
