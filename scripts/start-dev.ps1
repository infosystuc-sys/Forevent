# scripts/start-dev.ps1 — Levanta el entorno de desarrollo completo
# Uso: pwsh -File scripts/start-dev.ps1
#
# Abre 2 ventanas de terminal:
#   1. Backend (Next.js :3000 + auth-proxy :3001 via turbo)
#   2. Metro/Expo (dev-client :8082)

$ErrorActionPreference = "SilentlyContinue"
$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Set-Location $ROOT

# ─── 1. Matar procesos en puertos 3000, 3001, 8082 ────────────────────────────
Write-Host "`n[1/4] Liberando puertos 3000, 3001, 8082..." -ForegroundColor Cyan

$ports = @(3000, 3001, 8082)
$killed = @()

foreach ($port in $ports) {
    $connections = netstat -ano 2>$null | Select-String ":$port\s"
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
                taskkill /PID $pid /F 2>$null | Out-Null
                $killed += "Puerto ${port}: PID $pid ($($proc.ProcessName))"
            }
        } catch { }
    }
}

if ($killed.Count -gt 0) {
    $killed | ForEach-Object { Write-Host "  Cerrado: $_" -ForegroundColor Yellow }
} else {
    Write-Host "  Puertos libres." -ForegroundColor Green
}

# ─── 2. Limpiar cache de Metro ─────────────────────────────────────────────────
Write-Host "`n[2/4] Limpiando cache de Metro..." -ForegroundColor Cyan

$metroCachePath = Join-Path $ROOT "apps\expo\node_modules\.cache\metro"
$expoCachePath  = Join-Path $ROOT "apps\expo\.expo"

if (Test-Path $metroCachePath) {
    Remove-Item -Recurse -Force $metroCachePath -ErrorAction SilentlyContinue
    Write-Host "  Metro cache eliminado." -ForegroundColor Green
} else {
    Write-Host "  Metro cache ya limpio." -ForegroundColor Green
}

if (Test-Path $expoCachePath) {
    Remove-Item -Recurse -Force $expoCachePath -ErrorAction SilentlyContinue
    Write-Host "  .expo cache eliminado." -ForegroundColor Green
}

# ─── 3. Levantar backend (turbo dev) ───────────────────────────────────────────
Write-Host "`n[3/4] Levantando backend (Next.js :3000 + auth-proxy :3001)..." -ForegroundColor Cyan

$backendScript = @"
Set-Location '$ROOT'
`$env:NODE_OPTIONS = '--env-file=.env'
Write-Host '--- Backend (turbo dev) ---' -ForegroundColor Magenta
Write-Host 'Next.js en http://localhost:3000' -ForegroundColor Gray
Write-Host 'Auth-proxy en http://localhost:3001' -ForegroundColor Gray
Write-Host ''
pnpm dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# ─── 4. Esperar y levantar Metro ───────────────────────────────────────────────
Write-Host "`n[4/4] Esperando 5s para que el backend inicie..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$expoDir = Join-Path $ROOT "apps\expo"

$metroScript = @"
Set-Location '$expoDir'
`$env:NODE_OPTIONS = '--env-file=../../.env'
Write-Host '--- Metro / Expo Dev Client ---' -ForegroundColor Magenta
Write-Host 'Puerto: 8082' -ForegroundColor Gray
Write-Host ''
npx expo start --dev-client --clear --port 8082
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $metroScript

# ─── Instrucciones finales ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Entorno de desarrollo levantado" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "  Auth:     http://localhost:3001" -ForegroundColor Gray
Write-Host "  Metro:    http://localhost:8082" -ForegroundColor Gray
Write-Host ""
Write-Host "  Metro corriendo en puerto 8082" -ForegroundColor Yellow
Write-Host "  Abri la app Forevent en el Pixel 6 Pro" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Tip: Si ves pantalla roja, ejecuta:" -ForegroundColor DarkGray
Write-Host "    pwsh -File scripts/start-dev.ps1" -ForegroundColor DarkGray
Write-Host ""
