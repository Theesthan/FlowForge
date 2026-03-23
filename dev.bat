@echo off
title FlowForge - Dev

:: ── Resolve root (strip trailing backslash) ──────────────────────────────────
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"

echo.
echo  ================================================
echo   FlowForge  -  Local Development Startup
echo  ================================================
echo.

:: ── Patch PATH so tools work even from double-click ──────────────────────────
:: Node.js — simple if-exist checks (avoid for-loop with parentheses in vars)
if exist "%ProgramFiles%\nodejs\node.exe"   set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramW6432%\nodejs\node.exe"   set "PATH=%ProgramW6432%\nodejs;%PATH%"

:: pnpm global bin
if exist "%APPDATA%\npm\pnpm.cmd" (
    set "PATH=%APPDATA%\npm;%PATH%"
    set "PNPM=%APPDATA%\npm\pnpm.cmd"
) else if exist "%USERPROFILE%\AppData\Roaming\npm\pnpm.cmd" (
    set "PATH=%USERPROFILE%\AppData\Roaming\npm;%PATH%"
    set "PNPM=%USERPROFILE%\AppData\Roaming\npm\pnpm.cmd"
) else (
    set "PNPM=pnpm"
)

:: Docker — simple if-exist checks
if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe"          set "PATH=%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"
if exist "%ProgramW6432%\Docker\Docker\resources\bin\docker.exe"          set "PATH=%ProgramW6432%\Docker\Docker\resources\bin;%PATH%"
if exist "%LOCALAPPDATA%\Programs\Docker\Docker\resources\bin\docker.exe" set "PATH=%LOCALAPPDATA%\Programs\Docker\Docker\resources\bin;%PATH%"


:: ── 1. Check prerequisites ────────────────────────────────────────────────────
echo [1/6] Checking prerequisites...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js not found. Download from https://nodejs.org
    echo.
    pause & exit /b 1
)

call "%PNPM%" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  pnpm not found - installing now...
    call npm install -g pnpm@9.4.0
    if %errorlevel% neq 0 (
        echo.
        echo  ERROR: Failed to install pnpm.
        echo  Try manually: npm install -g pnpm@9.4.0
        echo.
        pause & exit /b 1
    )
    set "PNPM=%APPDATA%\npm\pnpm.cmd"
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Docker Desktop is not running.
    echo  Please start Docker Desktop and wait for it to finish loading,
    echo  then run this script again.
    echo.
    pause & exit /b 1
)
echo  Node.js OK  ^|  pnpm OK  ^|  Docker OK


:: ── 2. Start Postgres + Redis ─────────────────────────────────────────────────
echo.
echo [2/6] Starting Postgres + Redis (Docker Compose)...
docker compose -f "%ROOT%\infrastructure\docker-compose.yml" up postgres redis -d --wait
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Docker Compose failed to start.
    echo  Check logs with: docker compose -f infrastructure\docker-compose.yml logs
    echo.
    pause & exit /b 1
)
echo  Postgres :5433  ^|  Redis :6380  - healthy


:: ── 3. Copy .env to service directories ──────────────────────────────────────
echo.
echo [3/6] Distributing .env...
copy /Y "%ROOT%\.env" "%ROOT%\apps\api\.env"              >nul 2>&1
copy /Y "%ROOT%\.env" "%ROOT%\apps\web\.env.local"        >nul 2>&1
copy /Y "%ROOT%\.env" "%ROOT%\services\orchestrator\.env" >nul 2>&1
copy /Y "%ROOT%\.env" "%ROOT%\services\runtime\.env"      >nul 2>&1
copy /Y "%ROOT%\.env" "%ROOT%\services\worker\.env"       >nul 2>&1
copy /Y "%ROOT%\.env" "%ROOT%\packages\config\.env"       >nul 2>&1
copy /Y "%ROOT%\.env" "%ROOT%\packages\db\.env"           >nul 2>&1
echo  Done


:: ── 4. Install dependencies ───────────────────────────────────────────────────
echo.
echo [4/6] Installing dependencies...
call "%PNPM%" install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: pnpm install failed.
    echo.
    pause & exit /b 1
)
echo  Done


:: ── 5. Build shared packages ──────────────────────────────────────────────────
echo.
echo [5/6] Building shared packages (types -^> config -^> db)...

echo   types...
call "%PNPM%" --filter @flowforge/types run build
if %errorlevel% neq 0 ( echo  ERROR: types build failed ^& pause ^& exit /b 1 )

echo   config...
call "%PNPM%" --filter @flowforge/config run build
if %errorlevel% neq 0 ( echo  ERROR: config build failed ^& pause ^& exit /b 1 )

echo   prisma generate...
call "%PNPM%" --filter @flowforge/db run db:generate 2>nul

echo   db...
call "%PNPM%" --filter @flowforge/db run build
if %errorlevel% neq 0 ( echo  ERROR: db build failed ^& pause ^& exit /b 1 )

echo  Shared packages ready


:: ── 6. Launch services in separate windows ────────────────────────────────────
echo.
echo [6/6] Launching 5 service windows...
echo.
echo   Web           http://localhost:3000
echo   API (GraphQL) http://localhost:4000/graphql
echo   Orchestrator  http://localhost:4001
echo   Runtime (FSM) http://localhost:4002
echo   Worker        background queue processor
echo.

start "FF-Web"          cmd /k ""%PNPM%" --filter @flowforge/web run dev"
timeout /t 2 /nobreak >nul

start "FF-API"          cmd /k ""%PNPM%" --filter @flowforge/api run dev"
timeout /t 1 /nobreak >nul

start "FF-Orchestrator" cmd /k ""%PNPM%" --filter @flowforge/orchestrator run dev"
timeout /t 1 /nobreak >nul

start "FF-Runtime"      cmd /k ""%PNPM%" --filter @flowforge/runtime run dev"
timeout /t 1 /nobreak >nul

start "FF-Worker"       cmd /k ""%PNPM%" --filter @flowforge/worker run dev"


echo  ================================================
echo   All services launched in separate windows.
echo   Wait ~10s then open: http://localhost:3000
echo  ================================================
echo.
echo  To stop: close each service window + run stop.bat
echo.
pause
