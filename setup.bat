@echo off
echo 🚀 Sistema Valetti - Setup Automatizado
echo ======================================
echo.

REM Verificar se Docker está instalado
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker não está instalado. Por favor, instale o Docker primeiro:
    echo    https://docs.docker.com/get-docker/
    exit /b 1
)

REM Verificar se Docker Compose está instalado
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    docker-compose version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro.
        exit /b 1
    )
    set COMPOSE_CMD=docker-compose
) else (
    set COMPOSE_CMD=docker compose
)

echo ✅ Docker encontrado
echo.

REM Criar arquivo .env se não existir
if not exist "backend\.env" (
    echo 📝 Criando arquivo .env...
    copy "backend\.env.example" "backend\.env"
    echo ✅ Arquivo .env criado. Por favor, edite backend\.env se necessário.
    echo.
)

REM Criar diretórios necessários
echo 📁 Criando diretórios...
if not exist "backend\logs" mkdir "backend\logs"
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "frontend\.next" mkdir "frontend\.next"
echo ✅ Diretórios criados
echo.

REM Construir e iniciar containers
echo 🐳 Construindo e iniciando containers Docker...
%COMPOSE_CMD% up -d --build

echo.
echo ⏳ Aguardando serviços iniciarem...
timeout /t 10 /nobreak >nul

REM Executar migrações do banco de dados
echo 🗄️  Executando migrações do banco de dados...
%COMPOSE_CMD% exec -T backend npx prisma generate
%COMPOSE_CMD% exec -T backend npx prisma migrate deploy

REM Executar seed
echo 🌱 Populando banco de dados com dados iniciais...
%COMPOSE_CMD% exec -T backend npm run prisma:seed

echo.
echo ✅ Setup concluído com sucesso!
echo.
echo 📝 Serviços disponíveis:
echo    - Backend API: http://localhost:3000
echo    - Frontend Web: http://localhost:3001
echo    - PostgreSQL: localhost:5432
echo    - Redis: localhost:6379
echo.
echo 📝 Credenciais padrão:
echo    - Super Admin: admin@valetti.com.br / admin123
echo    - Administrador: gerente@valetti.com.br / admin123
echo.
echo 🔧 Comandos úteis:
echo    - Ver logs: %COMPOSE_CMD% logs -f
echo    - Parar serviços: %COMPOSE_CMD% down
echo    - Reiniciar: %COMPOSE_CMD% restart
echo.

pause
