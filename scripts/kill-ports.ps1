# Libera los puertos 3000 y 3001 en Windows
# Usa netstat para encontrar PIDs y taskkill para cerrarlos

$ports = @(3000, 3001)
$killed = @()

foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port\s"
    $pids = @()
    foreach ($line in $connections) {
        if ($line -match '\s+(\d+)\s*$') {
            $pid = $matches[1]
            if ($pid -ne "0" -and $pid -notin $pids) {
                $pids += $pid
            }
        }
    }
    foreach ($pid in $pids) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                taskkill /PID $pid /F 2>$null
                $killed += "Puerto $port : PID $pid ($($proc.ProcessName))"
            }
        } catch { }
    }
}

if ($killed.Count -gt 0) {
    Write-Host "Procesos cerrados:" -ForegroundColor Yellow
    $killed | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Host "Puertos libres, todo listo." -ForegroundColor Green
}
