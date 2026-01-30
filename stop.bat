@echo off
echo 🛑 Parando Sistema Valetti...

docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    docker-compose stop
) else (
    docker compose stop
)

echo ✅ Sistema parado!
pause
