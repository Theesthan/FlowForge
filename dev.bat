@echo off
title FlowForge - Dev
setlocal EnableDelayedExpansion

:: ── Resolve root (strip trailing backslash) ──────────────────────────────────
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"

echo.
echo  ================================================
echo   FlowForge  -  Local Development Startup
echo  ================================================
echo.

:: ── Patch PATH so Docker works even from double-click ─────────────────────────
if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe"          set "PATH=%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"
if exist "%ProgramW6432%\Docker\Docker\resources\bin\docker.exe"          set "PATH=%ProgramW6432%\Docker\Docker\resources\bin;%PATH%"
if exist "%LOCALAPPDATA%\Programs\Docker\Docker\resources\bin\docker.exe" set "PATH=%LOCALAPPDATA%\Programs\Docker\Docker\resources\bin;%PATH%"

:: ── 1. Check Docker is running ─────────────────────────────────────────────────
echo [1/3] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Docker Desktop is not running.
    echo  Please start Docker Desktop and wait for it to finish loading,
    echo  then run this script again.
    echo.
    pause & exit /b 1
)
echo  Docker OK

:: ── 2. Check .env exists ───────────────────────────────────────────────────────
echo.
echo [2/3] Checking .env...
if not exist "%ROOT%\.env" (
    echo.
    echo  ERROR: .env file not found at project root.
    echo  Copy .env.example to .env and fill in your values:
    echo    copy .env.example .env
    echo.
    pause & exit /b 1
)
echo  .env OK

:: ── 3. Start full stack ────────────────────────────────────────────────────────
echo.
echo [3/3] Starting FlowForge stack (Docker Compose)...
echo  This may take a minute on first run (building images).
echo.

docker compose -f "%ROOT%\infrastructure\docker-compose.yml" up -d --build
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Docker Compose failed.
    echo  Check logs: docker compose -f infrastructure\docker-compose.yml logs
    echo.
    pause & exit /b 1
)

:: ── Wait for init-db to complete ────────────────────────────────────────────────
echo.
echo  Waiting for database schema initialization...
docker compose -f "%ROOT%\infrastructure\docker-compose.yml" wait init-db >nul 2>&1
echo  Database schema ready

:: ── Restart orchestrator (init-db may have completed after it started) ─────────
docker compose -f "%ROOT%\infrastructure\docker-compose.yml" restart orchestrator >nul 2>&1

:: ── Done ───────────────────────────────────────────────────────────────────────
echo.
echo  ================================================
echo   FlowForge is running!
echo  ================================================
echo.
echo   App              http://localhost:3000
echo   GraphQL API      http://localhost:4000/graphql
echo   Orchestrator     http://localhost:4001/health
echo   Runtime (FSM)    http://localhost:4002/health
echo   Grafana          http://localhost:3001          ^(admin / flowforge^)
echo   Prometheus       http://localhost:9090
echo   Jaeger Tracing   http://localhost:16686
echo.
echo  Logs:   docker compose -f infrastructure\docker-compose.yml logs -f
echo  Status: docker compose -f infrastructure\docker-compose.yml ps
echo  Stop:   run stop.bat
echo.
pause
