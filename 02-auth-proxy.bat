@echo off
title FOREVENT :: Auth Proxy [:3001]
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo.
echo  ===================================================
echo   FOREVENT  ^|  Auth Proxy  -^>  http://localhost:3001
echo  ===================================================
echo.

cd /d "%ROOT%"
pnpm --filter auth-proxy dev