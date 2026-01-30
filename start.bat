@echo off
echo 🚀 Iniciando Sistema Valetti...
echo.

REM Verificar se Docker está rodando
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker primeiro.
    pause
    exit /b 1
)

REM Verificar comando docker compose
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set COMPOSE_CMD=docker-compose
) else (
    set COMPOSE_CMD=docker compose
)

REM Verificar se os containers já existem
docker ps -a | findstr valetti-postgres >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ▶️  Iniciando containers existentes...
    %COMPOSE_CMD% start
) else (
    echo 📦 Containers não encontrados. Execute 'setup.bat' primeiro.
    pause
    exit /b 1
)

echo.
echo ✅ Sistema iniciado!
echo.
echo 📝 Serviços disponíveis:
echo    - Backend API: http://localhost:3000
echo    - Frontend Web: http://localhost:3001
echo.
echo 📊 Ver logs: %COMPOSE_CMD% logs -f
echo 🛑 Parar: %COMPOSE_CMD% stop
echo.

pause
