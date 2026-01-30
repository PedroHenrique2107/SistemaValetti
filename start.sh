#!/bin/bash

echo "🚀 Iniciando Sistema Valetti..."
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Verificar se os containers já existem
if docker ps -a | grep -q valetti-postgres; then
    echo "▶️  Iniciando containers existentes..."
    docker-compose start
else
    echo "📦 Containers não encontrados. Execute './setup.sh' primeiro."
    exit 1
fi

echo ""
echo "✅ Sistema iniciado!"
echo ""
echo "📝 Serviços disponíveis:"
echo "   - Backend API: http://localhost:3000"
echo "   - Frontend Web: http://localhost:3001"
echo ""
echo "📊 Ver logs: docker-compose logs -f"
echo "🛑 Parar: docker-compose stop"
echo ""
