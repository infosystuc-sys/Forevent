# ============================================================
#  FOREVENT - Instalacion con exclusion de Windows Defender
#  Ejecutar con: clic derecho -> "Ejecutar como administrador"
# ============================================================
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  FOREVENT  |  Instalacion completa (Admin)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Agregar exclusion a Windows Defender para esta carpeta
Write-Host "[1/4] Agregando exclusion de Windows Defender..." -ForegroundColor Yellow
try {
    Add-MpPreference -ExclusionPath $ROOT
    Write-Host "      OK: $ROOT excluido del escaneo en tiempo real." -ForegroundColor Green
} catch {
    Write-Host "      WARN: No se pudo agregar exclusion: $_" -ForegroundColor Red
    Write-Host "      Continuando de todas formas..." -ForegroundColor Yellow
}

# 2. Matar procesos Node que puedan bloquear archivos
Write-Host "[2/4] Cerrando procesos Node.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 500

# 3. Limpiar node_modules residuales si existen
Write-Host "[3/4] Limpiando node_modules residuales..." -ForegroundColor Yellow
$dirs = @(
    "$ROOT\node_modules",
    "$ROOT\apps\expo\node_modules",
    "$ROOT\apps\nextjs\node_modules",
    "$ROOT\apps\auth-proxy\node_modules",
    "$ROOT\packages\api\node_modules",
    "$ROOT\packages\auth\node_modules",
    "$ROOT\packages\db\node_modules",
    "$ROOT\packages\ui\node_modules",
    "$ROOT\packages\validators\node_modules",
    "$ROOT\tooling\eslint\node_modules",
    "$ROOT\tooling\prettier\node_modules",
    "$ROOT\tooling\tailwind\node_modules"
)
foreach ($d in $dirs) {
    if (Test-Path $d) {
        Remove-Item -Recurse -Force $d -ErrorAction SilentlyContinue
        Write-Host "      Borrado: $d" -ForegroundColor DarkGray
    }
}

# 4. Instalar con pnpm (Defender ya excluido, no habra EPERM)
Write-Host "[4/4] Ejecutando pnpm install --ignore-scripts..." -ForegroundColor Yellow
Set-Location $ROOT
& pnpm install --ignore-scripts
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] pnpm install fallo con codigo $LASTEXITCODE" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# 5. Generar Prisma Client (necesario porque --ignore-scripts lo salteo)
Write-Host ""
Write-Host "[5/5] Generando Prisma Client..." -ForegroundColor Yellow
& pnpm exec prisma generate --schema=packages/db/prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Prisma generate fallo. Verifica DATABASE_URL en .env" -ForegroundColor Red
} else {
    Write-Host "      OK: Prisma Client generado." -ForegroundColor Green
}

# Patch de Hermes (se ejecuta manualmente porque usamos --ignore-scripts)
Write-Host ""
Write-Host "[+] Aplicando patch Hermes para React Native..." -ForegroundColor Yellow
& node patches\fix-hermes-reserved-words.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Patch Hermes fallo. El backend y auth-proxy seguiran funcionando." -ForegroundColor Yellow
} else {
    Write-Host "      OK: Patch Hermes aplicado." -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Instalacion completada con exito!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Proximos pasos:" -ForegroundColor White
Write-Host "  Terminal 1: doble clic en  01-backend.bat" -ForegroundColor Cyan
Write-Host "  Terminal 2: doble clic en  02-auth-proxy.bat" -ForegroundColor Cyan
Write-Host "  Terminal 3: doble clic en  03-expo.bat" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para salir"
