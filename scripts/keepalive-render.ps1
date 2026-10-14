# Script Keep-Alive para Render Backend (DARSIL ERP)
# Evita que el contenedor gratuito se suspenda tras 15 minutos de inactividad
$Url = "https://darsil-backend.onrender.com/health"
$IntervalMinutes = 10

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " DARSIL ERP - Render 24/7 Keep-Alive Service     " -ForegroundColor Yellow
Write-Host " URL: $Url" -ForegroundColor Gray
Write-Host " Frecuencia: Cada $IntervalMinutes minutos" -ForegroundColor Gray
Write-Host " Presiona Ctrl+C para detener." -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 30 -UseBasicParsing
        $stopwatch.Stop()
        $ms = [math]::Round($stopwatch.Elapsed.TotalMilliseconds)
        
        if ($response.StatusCode -eq 200) {
            Write-Host "[$timestamp] [OK 200] Backend activo en ${ms}ms" -ForegroundColor Green
        } else {
            Write-Host "[$timestamp] [STATUS $($response.StatusCode)] en ${ms}ms" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[$timestamp] [ALERTA] No se pudo conectar: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}
