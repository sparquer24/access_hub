# Test login API endpoint
Write-Host "Testing Login API..." -ForegroundColor Yellow
Write-Host ""

$uri = "http://localhost:5001/api/v2/auth/login"
$body = @{
    username = "superadmin"
    password = "Admin@123"
} | ConvertTo-Json

Write-Host "Endpoint: $uri" -ForegroundColor Cyan
Write-Host "Credentials: superadmin / Admin@123" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "SUCCESS: Login working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User Details:" -ForegroundColor Cyan
    Write-Host "  Username: $($response.data.user.username)" -ForegroundColor White
    Write-Host "  Email: $($response.data.user.email)" -ForegroundColor White
    Write-Host "  Role: $($response.data.user.role.name)" -ForegroundColor White
    Write-Host ""
    Write-Host "Tokens Generated:" -ForegroundColor Cyan
    Write-Host "  Access Token: Yes (length: $($response.data.access_token.Length))" -ForegroundColor White
    Write-Host "  Refresh Token: Yes (length: $($response.data.refresh_token.Length))" -ForegroundColor White
    Write-Host ""
    Write-Host "Login API is working correctly!" -ForegroundColor Green
}
catch {
    Write-Host "FAILED: Login not working!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        $_.ErrorDetails.Message
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if server is running: http://localhost:5001/api/health" -ForegroundColor Gray
    Write-Host "2. Verify credentials are correct" -ForegroundColor Gray
    Write-Host "3. Check server logs for errors" -ForegroundColor Gray
}
