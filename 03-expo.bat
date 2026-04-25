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
echo [1/2] Configurando adb reverse...
adb reverse tcp:8081 tcp:8082
adb reverse tcp:8082 tcp:8082

:: Iniciar Metro con cache (arranque rapido)
echo [2/2] Iniciando Metro...
echo.
cd /d "%ROOT%\apps\expo"
set "REACT_NATIVE_PACKAGER_HOSTNAME=localhost"
npx expo start --dev-client --port 8082