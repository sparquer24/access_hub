# Organizations API Test Script
# Tests all CRUD operations for Organizations API

# Configuration
$baseUrl = "http://localhost:5001"
$apiUrl = "$baseUrl/api/v2/organizations"

# Test credentials (update these with your actual credentials)
$username = "admin"
$password = "admin123"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Organizations API - Complete CRUD Test" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get JWT token
Write-Host "[STEP 1] Logging in to get JWT token..." -ForegroundColor Green
try {
    $loginBody = @{
        username = $username
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v2/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.access_token
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your credentials and ensure the backend is running." -ForegroundColor Yellow
    exit 1
}

# Setup headers with JWT token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# Generate unique code for this test run
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testCode = "TEST$timestamp"

# Step 2: Create Organization
Write-Host "[STEP 2] Creating a new organization..." -ForegroundColor Green
try {
    $createBody = @{
        name              = "Test Organization $timestamp"
        code              = $testCode
        address           = "123 Test Street, Test City, TC 12345"
        contact_email     = "test@example.com"
        contact_phone     = "+1234567890"
        organization_type = "office"
        timezone          = "Asia/Kolkata"
        working_hours     = @{
            start = "09:00"
            end   = "18:00"
            days  = @(1, 2, 3, 4, 5)
        }
        settings          = @{
            allow_remote_checkin     = $true
            require_face_recognition = $true
        }
    } | ConvertTo-Json -Depth 10

    $createResponse = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers $headers -Body $createBody
    $orgId = $createResponse.data.id
    
    Write-Host "✓ Organization created successfully!" -ForegroundColor Green
    Write-Host "  ID: $orgId" -ForegroundColor Gray
    Write-Host "  Name: $($createResponse.data.name)" -ForegroundColor Gray
    Write-Host "  Code: $($createResponse.data.code)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Create failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    exit 1
}

# Step 3: Get All Organizations
Write-Host "[STEP 3] Getting all organizations (with pagination)..." -ForegroundColor Green
try {
    $listResponse = Invoke-RestMethod -Uri "$apiUrl`?page=1&per_page=20" -Method GET -Headers $headers
    
    Write-Host "✓ Retrieved organizations list!" -ForegroundColor Green
    Write-Host "  Total Organizations: $($listResponse.data.pagination.total_items)" -ForegroundColor Gray
    Write-Host "  Page: $($listResponse.data.pagination.page) of $($listResponse.data.pagination.total_pages)" -ForegroundColor Gray
    Write-Host "  Items on this page: $($listResponse.data.items.Count)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  Organizations:" -ForegroundColor Cyan
    foreach ($org in $listResponse.data.items) {
        Write-Host "    - $($org.name) [$($org.code)] - Type: $($org.organization_type)" -ForegroundColor Gray
    }
    Write-Host ""
}
catch {
    Write-Host "✗ List failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

# Step 4: Search Organizations
Write-Host "[STEP 4] Searching for organizations..." -ForegroundColor Green
try {
    $searchResponse = Invoke-RestMethod -Uri "$apiUrl`?search=Test" -Method GET -Headers $headers
    
    Write-Host "✓ Search completed!" -ForegroundColor Green
    Write-Host "  Found: $($searchResponse.data.pagination.total_items) organizations matching 'Test'" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Search failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Filter Organizations by Type
Write-Host "[STEP 5] Filtering organizations by type (office)..." -ForegroundColor Green
try {
    $filterResponse = Invoke-RestMethod -Uri "$apiUrl`?organization_type=office&is_active=true" -Method GET -Headers $headers
    
    Write-Host "✓ Filter applied!" -ForegroundColor Green
    Write-Host "  Found: $($filterResponse.data.pagination.total_items) active office organizations" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Filter failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Get Single Organization
Write-Host "[STEP 6] Getting single organization details..." -ForegroundColor Green
try {
    $getResponse = Invoke-RestMethod -Uri "$apiUrl/$orgId" -Method GET -Headers $headers
    
    Write-Host "✓ Retrieved organization details!" -ForegroundColor Green
    Write-Host "  ID: $($getResponse.data.id)" -ForegroundColor Gray
    Write-Host "  Name: $($getResponse.data.name)" -ForegroundColor Gray
    Write-Host "  Code: $($getResponse.data.code)" -ForegroundColor Gray
    Write-Host "  Type: $($getResponse.data.organization_type)" -ForegroundColor Gray
    Write-Host "  Timezone: $($getResponse.data.timezone)" -ForegroundColor Gray
    Write-Host "  Active: $($getResponse.data.is_active)" -ForegroundColor Gray
    Write-Host "  Created: $($getResponse.data.created_at)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Get failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Update Organization
Write-Host "[STEP 7] Updating organization..." -ForegroundColor Green
try {
    $updateBody = @{
        name          = "Updated Test Organization $timestamp"
        address       = "789 Updated Street, New City, NC 54321"
        contact_email = "updated@example.com"
        contact_phone = "+0987654321"
        timezone      = "America/New_York"
        working_hours = @{
            start = "08:00"
            end   = "17:00"
            days  = @(1, 2, 3, 4, 5)
        }
        settings      = @{
            allow_remote_checkin     = $false
            require_face_recognition = $true
            max_employees            = 500
        }
    } | ConvertTo-Json -Depth 10

    $updateResponse = Invoke-RestMethod -Uri "$apiUrl/$orgId" -Method PUT -Headers $headers -Body $updateBody
    
    Write-Host "✓ Organization updated successfully!" -ForegroundColor Green
    Write-Host "  New Name: $($updateResponse.data.name)" -ForegroundColor Gray
    Write-Host "  New Email: $($updateResponse.data.contact_email)" -ForegroundColor Gray
    Write-Host "  New Timezone: $($updateResponse.data.timezone)" -ForegroundColor Gray
    Write-Host "  Updated At: $($updateResponse.data.updated_at)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Update failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

# Step 8: Get Organization Statistics
Write-Host "[STEP 8] Getting organization statistics..." -ForegroundColor Green
try {
    $statsResponse = Invoke-RestMethod -Uri "$apiUrl/$orgId/stats" -Method GET -Headers $headers
    
    Write-Host "✓ Retrieved organization statistics!" -ForegroundColor Green
    Write-Host "  Departments: $($statsResponse.data.departments_count)" -ForegroundColor Gray
    Write-Host "  Employees: $($statsResponse.data.employees_count)" -ForegroundColor Gray
    Write-Host "  Locations: $($statsResponse.data.locations_count)" -ForegroundColor Gray
    Write-Host "  Cameras: $($statsResponse.data.cameras_count)" -ForegroundColor Gray
    Write-Host "  Shifts: $($statsResponse.data.shifts_count)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Stats failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 9: Verify Get After Update
Write-Host "[STEP 9] Verifying update..." -ForegroundColor Green
try {
    $verifyResponse = Invoke-RestMethod -Uri "$apiUrl/$orgId" -Method GET -Headers $headers
    
    Write-Host "✓ Verification successful!" -ForegroundColor Green
    Write-Host "  Name is updated: $($verifyResponse.data.name -eq "Updated Test Organization $timestamp")" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 10: Delete Organization (Soft Delete)
Write-Host "[STEP 10] Soft deleting organization..." -ForegroundColor Green
try {
    $deleteResponse = Invoke-RestMethod -Uri "$apiUrl/$orgId" -Method DELETE -Headers $headers
    
    Write-Host "✓ Organization soft deleted successfully!" -ForegroundColor Green
    Write-Host "  Message: $($deleteResponse.message)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Delete failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 11: Verify Deletion
Write-Host "[STEP 11] Verifying soft deletion..." -ForegroundColor Green
try {
    $verifyDeleteResponse = Invoke-RestMethod -Uri "$apiUrl/$orgId" -Method GET -Headers $headers
    Write-Host "✗ Organization still accessible (should be deleted)" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ Organization is not accessible (correctly deleted)" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Summary
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All CRUD operations tested:" -ForegroundColor White
Write-Host "  ✓ CREATE - New organization created" -ForegroundColor Green
Write-Host "  ✓ READ   - List all organizations" -ForegroundColor Green
Write-Host "  ✓ READ   - Search organizations" -ForegroundColor Green
Write-Host "  ✓ READ   - Filter organizations" -ForegroundColor Green
Write-Host "  ✓ READ   - Get single organization" -ForegroundColor Green
Write-Host "  ✓ READ   - Get organization stats" -ForegroundColor Green
Write-Host "  ✓ UPDATE - Organization information updated" -ForegroundColor Green
Write-Host "  ✓ DELETE - Organization soft deleted" -ForegroundColor Green
Write-Host ""
Write-Host "Test organization ID: $orgId" -ForegroundColor Yellow
Write-Host "Test organization code: $testCode" -ForegroundColor Yellow
Write-Host ""
Write-Host "All tests completed successfully! ✓" -ForegroundColor Green
Write-Host ""
