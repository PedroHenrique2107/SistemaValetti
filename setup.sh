#!/bin/bash

echo "🚀 Sistema Valetti - Setup Automatizado"
echo "======================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker encontrado"
echo ""

# Criar arquivo .env se não existir
if [ ! -f backend/.env ]; then
    echo "📝 Criando arquivo .env..."
    cp backend/.env.example backend/.env
    echo "✅ Arquivo .env criado. Por favor, edite backend/.env se necessário."
    echo ""
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p frontend/.next
echo "✅ Diretórios criados"
echo ""

# Construir e iniciar containers
echo "🐳 Construindo e iniciando containers Docker..."
docker-compose up -d --build

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Executar migrações do banco de dados
echo "🗄️  Executando migrações do banco de dados..."
docker-compose exec -T backend npx prisma generate
docker-compose exec -T backend npx prisma migrate deploy

# Executar seed
echo "🌱 Populando banco de dados com dados iniciais..."
docker-compose exec -T backend npm run prisma:seed

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "📝 Serviços disponíveis:"
echo "   - Backend API: http://localhost:3000"
echo "   - Frontend Web: http://localhost:3001"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "📝 Credenciais padrão:"
echo "   - Super Admin: admin@valetti.com.br / admin123"
echo "   - Administrador: gerente@valetti.com.br / admin123"
echo ""
echo "🔧 Comandos úteis:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Parar serviços: docker-compose down"
echo "   - Reiniciar: docker-compose restart"
echo ""
