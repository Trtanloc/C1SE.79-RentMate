# Script to start MySQL for RentMate
Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow

# Check if Docker is ready
$dockerReady = $false
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $dockerReady = $true
        Write-Host "Docker is ready!" -ForegroundColor Green
    }
} catch {
    Write-Host "Docker is not ready yet." -ForegroundColor Red
}

if ($dockerReady) {
    Write-Host "Starting MySQL container..." -ForegroundColor Yellow
    docker compose up mysql -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MySQL started successfully!" -ForegroundColor Green
        Write-Host "Waiting for MySQL to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        Write-Host "MySQL should be ready now on localhost:3306" -ForegroundColor Green
    } else {
        Write-Host "Failed to start MySQL container" -ForegroundColor Red
    }
} else {
    Write-Host "`nDocker Desktop is not ready. Please:" -ForegroundColor Red
    Write-Host "1. Wait for Docker Desktop to fully start (check system tray)" -ForegroundColor Yellow
    Write-Host "2. Or restart Docker Desktop" -ForegroundColor Yellow
    Write-Host "3. Then run this script again" -ForegroundColor Yellow
    Write-Host "`nAlternatively, start MySQL service manually:" -ForegroundColor Cyan
    Write-Host "  Run PowerShell as Administrator and execute:" -ForegroundColor Cyan
    Write-Host "  Start-Service -Name MySQL80" -ForegroundColor White
}


