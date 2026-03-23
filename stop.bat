@echo off
cd /d "%~dp0"

echo.
echo  Stopping FlowForge infrastructure (Postgres + Redis)...
docker compose -f infrastructure/docker-compose.yml stop postgres redis
if %errorlevel% neq 0 (
    echo  WARNING: docker compose stop returned an error. Containers may already be stopped.
) else (
    echo  Postgres and Redis stopped.
)

echo.
echo  NOTE: Service windows (Web, API, Orchestrator, Runtime, Worker) must be
echo        closed manually — press Ctrl+C in each window.
echo.
pause
