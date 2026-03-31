@echo off
title FOREVENT :: Backend [Next.js :3000]
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo.
echo  ===================================================
echo   FOREVENT  ^|  Backend  -^>  http://localhost:3000
echo  ===================================================
echo.

cd /d "%ROOT%"
pnpm --filter nextjs dev