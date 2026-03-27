@echo off
cd /d "%~dp0"

echo.
echo  Stopping FlowForge (all services)...
docker compose -f infrastructure\docker-compose.yml down
if %errorlevel% neq 0 (
    echo  WARNING: docker compose down returned an error.
) else (
    echo  All services stopped.
)

echo.
pause
