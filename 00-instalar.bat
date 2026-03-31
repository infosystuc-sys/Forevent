@echo off
title FOREVENT - Instalacion segura
set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo ================================================
echo   FOREVENT  ^|  Instalacion segura (Windows)
echo ================================================
echo.

:: Verificar que pnpm esta disponible
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm no encontrado. Instala con: npm install -g pnpm@8
    pause & exit /b 1
)

:: Matar procesos Node que puedan bloquear archivos
echo [1/3] Cerrando procesos Node.js existentes...
taskkill /f /im node.exe >nul 2>&1

:: Instalar sin ejecutar scripts de ciclo de vida (evita || true en cmd)
echo [2/3] Ejecutando pnpm install --ignore-scripts ...
pnpm install --ignore-scripts
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] pnpm install fallo con codigo %errorlevel%.
    echo.
    echo  Windows Defender bloquea el rename atomico de pnpm (EPERM).
    echo  SOLUCION: ejecuta el script de instalacion como Administrador:
    echo.
    echo    Clic derecho en ADMIN-instalar.ps1 -^> "Ejecutar como administrador"
    echo.
    echo  Ese script agrega la exclusion de Defender y reintenta la instalacion.
    echo.
    pause & exit /b 1
)

:: Ejecutar el patch de Hermes manualmente (porque --ignore-scripts lo salto)
echo [3/3] Aplicando patch Hermes para React Native...
node patches\fix-hermes-reserved-words.js
if %errorlevel% neq 0 (
    echo [WARN] El patch de Hermes fallo. Puede no afectar el backend ni Expo Go.
)

echo.
echo  Instalacion completada. Ahora podes abrir las 3 terminales:
echo    01-backend.bat     -> Next.js  :3000
echo    02-auth-proxy.bat  -> Nitro    :3001
echo    03-expo.bat        -> Expo     Android
echo.
pause
