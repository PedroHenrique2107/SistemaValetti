# 🚀 Guia Rápido de Início - Sistema Valetti

## ⚡ Início Super Rápido (3 passos)

### 1️⃣ Instale o Docker

**Windows/Mac:**
- Baixe e instale [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Ou use o script oficial
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2️⃣ Execute o Setup

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### 3️⃣ Acesse o Sistema

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

**Pronto!** 🎉 Tudo está rodando em containers Docker.

---

## 📋 O que o Setup Faz?

O script `setup.sh` ou `setup.bat` automaticamente:

1. ✅ Verifica se Docker está instalado
2. ✅ Cria arquivo `.env` com configurações padrão
3. ✅ Cria diretórios necessários (logs, uploads)
4. ✅ Constrói as imagens Docker
5. ✅ Inicia todos os containers
6. ✅ Configura o banco de dados PostgreSQL
7. ✅ Executa migrações do Prisma
8. ✅ Popula o banco com dados de exemplo

**Tempo estimado:** 3-5 minutos (na primeira vez)

---

## 🎮 Comandos Úteis

### Iniciar Sistema
```bash
# Windows
start.bat

# Linux/Mac
./start.sh

# Ou manualmente
docker-compose up -d
```

### Parar Sistema
```bash
# Windows
stop.bat

# Linux/Mac
./stop.sh

# Ou manualmente
docker-compose stop
```

### Ver Logs
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Reiniciar um Serviço
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Parar e Remover Tudo
```bash
# Para containers
docker-compose down

# Para containers e volumes (apaga dados!)
docker-compose down -v
```

### Executar Comandos Dentro dos Containers
```bash
# Backend
docker-compose exec backend npm run prisma:studio
docker-compose exec backend npm run prisma:migrate

# Frontend
docker-compose exec frontend npm run build
```

---

## 🔐 Credenciais Padrão

Após o setup, você pode fazer login com:

| Perfil | Email | Senha |
|--------|-------|-------|
| Super Admin | admin@valetti.com.br | admin123 |
| Administrador | gerente@valetti.com.br | admin123 |
| Manobrista 1 | manobrista1@valetti.com.br | admin123 |
| Manobrista 2 | manobrista2@valetti.com.br | admin123 |
| Recepcionista | recepcionista@valetti.com.br | admin123 |

**⚠️ IMPORTANTE:** Altere essas senhas em produção!

---

## 🐛 Solução de Problemas

### Docker não está rodando
```bash
# Verificar status
docker info

# Iniciar Docker Desktop (Windows/Mac)
# Ou iniciar serviço (Linux)
sudo systemctl start docker
```

### Porta já em uso
```bash
# Verificar o que está usando a porta
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Parar o processo ou alterar a porta no docker-compose.yml
```

### Erro ao construir imagens
```bash
# Limpar cache e reconstruir
docker-compose build --no-cache
docker-compose up -d
```

### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Ver logs do PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Erro nas migrações
```bash
# Resetar banco (CUIDADO: apaga dados!)
docker-compose exec backend npm run prisma:reset

# Executar migrações novamente
docker-compose exec backend npx prisma migrate deploy

# Popular novamente
docker-compose exec backend npm run prisma:seed
```

### Containers não iniciam
```bash
# Ver logs detalhados
docker-compose logs

# Verificar recursos do Docker
docker stats

# Reiniciar Docker Desktop (Windows/Mac)
# Ou reiniciar serviço (Linux)
sudo systemctl restart docker
```

---

## 📊 Verificar Status

```bash
# Ver containers rodando
docker-compose ps

# Ver uso de recursos
docker stats

# Ver volumes
docker volume ls

# Ver imagens
docker images
```

---

## 🔄 Atualizar Código

Quando você fizer alterações no código:

1. **Backend/Frontend:** As alterações são refletidas automaticamente (hot reload)
2. **Banco de Dados:** Execute migrações se necessário:
   ```bash
   docker-compose exec backend npx prisma migrate dev
   ```
3. **Dependências:** Se adicionar novas dependências:
   ```bash
   docker-compose exec backend npm install
   docker-compose exec frontend npm install
   docker-compose restart backend frontend
   ```

---

## 🎯 Próximos Passos

1. ✅ Sistema rodando? Acesse http://localhost:3001
2. ✅ Faça login com as credenciais padrão
3. ✅ Explore o dashboard
4. ✅ Configure seu estacionamento
5. ✅ Crie usuários adicionais
6. ✅ Comece a usar!

---

## 💡 Dicas

- **Desenvolvimento:** Use `docker-compose up` (sem `-d`) para ver logs em tempo real
- **Produção:** Use `docker-compose up -d` para rodar em background
- **Backup:** Os dados do PostgreSQL estão em volumes Docker, faça backup regularmente
- **Performance:** Se estiver lento, aumente os recursos do Docker Desktop

---

**Precisa de ajuda?** Consulte a [Documentação Completa](./docs/INSTALLATION.md) ou abra uma issue no GitHub.
