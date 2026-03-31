@echo off
title FOREVENT :: Expo [Metro Android :8082]
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo.
echo  ===================================================
echo   FOREVENT  ^|  Expo  -^>  Android Dev Client :8082
echo  ===================================================
echo.

:: Configurar adb reverse para ambos puertos
echo [1/3] Configurando adb reverse...
adb reverse tcp:8081 tcp:8082
adb reverse tcp:8082 tcp:8082

:: Limpiar cache de Metro
echo [2/3] Limpiando cache de Metro...
if exist "%ROOT%\apps\expo\node_modules\.cache\metro" (
    rmdir /s /q "%ROOT%\apps\expo\node_modules\.cache\metro"
)

:: Iniciar Metro con localhost forzado
echo [3/3] Iniciando Metro...
echo.
cd /d "%ROOT%\apps\expo"
set "REACT_NATIVE_PACKAGER_HOSTNAME=localhost"
npx expo start --dev-client --clear --port 8082