# 🚗 Sistema Valetti - Gerenciamento de Valet Parking

<div align="center">

![Status do Projeto](https://img.shields.io/badge/Status-Em%20Desenvolvimento-green)
![Licença](https://img.shields.io/badge/license-MIT-blue)
![Versão](https://img.shields.io/badge/versão-1.0.0-blue)

</div>

## 📋 Sobre o Projeto

Sistema completo e inovador de gerenciamento de Valet Parking (manobrista) para o mercado brasileiro, que revoluciona a operação de estacionamentos com foco em:

- ✨ Experiência superior do cliente
- ⚡ Otimização operacional em tempo real
- 💰 Gestão financeira integrada e inteligente
- 🔐 Múltiplos níveis de acesso e permissões
- 📈 Escalabilidade para diferentes portes de operação
- ✅ Conformidade com legislação brasileira (LGPD, fiscal, trabalhista)

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

**Backend:**
- Node.js 20 LTS + TypeScript
- Express.js
- PostgreSQL 15+
- Redis 7+ (cache e filas)
- Prisma ORM
- Socket.io (WebSockets)

**Frontend:**
- Next.js 14+ (React 18+)
- TypeScript
- Material-UI v5
- Redux Toolkit
- Recharts

**Mobile:**
- React Native 0.73+
- TypeScript
- React Navigation v6
- WatermelonDB (offline-first)

**Infraestrutura:**
- Docker + Docker Compose (tudo containerizado!)
- Kubernetes (produção)
- CI/CD com GitHub Actions

**🎯 Ambiente Isolado:**
- Tudo roda em containers Docker
- Não precisa instalar Node.js, PostgreSQL ou Redis na máquina
- Fácil de configurar e manter
- Ambiente consistente entre desenvolvedores

## 🚀 Início Rápido (3 Passos)

### 1️⃣ Instale o Docker

**Windows/Mac:**
- Baixe e instale [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
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

## 📖 Documentação Completa

Para instruções detalhadas, consulte:

- **[Guia de Instalação Completo](./docs/INSTALLATION.md)** - Passo a passo detalhado
- **[Guia Rápido](./QUICK_START.md)** - Início super rápido
- **[Documentação da API](./docs/API.md)** - Endpoints e exemplos

---

## 🎮 Comandos Úteis

### Iniciar Sistema
```bash
# Windows
start.bat

# Linux/Mac
./start.sh

# Ou manualmente
docker compose up -d
```

### Parar Sistema
```bash
# Windows
stop.bat

# Linux/Mac
./stop.sh

# Ou manualmente
docker compose stop
```

### Ver Logs
```bash
docker compose logs -f
```

### Reiniciar um Serviço
```bash
docker compose restart backend
```

---

## 🔐 Credenciais Padrão

Após o setup:

| Perfil | Email | Senha |
|--------|-------|-------|
| Super Admin | admin@valetti.com.br | admin123 |
| Administrador | gerente@valetti.com.br | admin123 |
| Manobrista | manobrista1@valetti.com.br | admin123 |

⚠️ **IMPORTANTE:** Altere essas senhas em produção!

---

## 📁 Estrutura do Projeto

```
SistemaValetti/
├── backend/                 # API Backend (Node.js/Express)
│   ├── src/
│   │   ├── modules/         # Módulos funcionais
│   │   ├── shared/          # Código compartilhado
│   │   └── server.ts        # Entry point
│   ├── prisma/              # Schema e migrações
│   └── package.json
│
├── frontend/                # Painel Web (Next.js)
│   ├── src/
│   │   ├── app/             # App Router (Next.js 14+)
│   │   ├── components/      # Componentes React
│   │   └── lib/             # Utilitários
│   └── package.json
│
├── mobile/                  # Apps Mobile (React Native)
│   ├── src/
│   └── package.json
│
├── docs/                    # Documentação
├── docker-compose.yml        # Configuração Docker
├── setup.sh / setup.bat     # Scripts de setup
└── README.md
```

---

## 🎯 Funcionalidades Principais

### Fase 1 - MVP (Implementado)

- ✅ Módulo de entrada/saída básico
- ✅ App manobrista (core)
- ✅ Painel web administrativo
- ✅ Sistema de pagamento (PIX + cartão)
- ✅ Emissão de tickets/QR Code
- ✅ Relatórios básicos
- ✅ Gestão de usuários e permissões

### Fase 2 - Expansão (Planejado)

- ⏳ App do cliente
- ⏳ Módulo financeiro completo
- ⏳ Programa de fidelidade
- ⏳ Mensalistas
- ⏳ NF-e automática
- ⏳ Multi-unidade básico

---

## 🔐 Níveis de Acesso

1. **Super Admin** - Acesso total ao sistema
2. **Administrador** - Gestão completa da unidade
3. **Gerente Operacional** - Dashboard operacional
4. **Supervisor** - Monitoramento em tempo real
5. **Financeiro** - Dashboard financeiro
6. **Recepcionista/Caixa** - Check-in e check-out
7. **Manobrista** - App mobile (versão limitada)
8. **Mensalista** - App de cliente
9. **Auditor** - Read-only

---

## 📊 KPIs e Métricas

- Taxa de Ocupação: > 75%
- Tempo Médio de Busca: < 3 minutos
- Tempo Médio de Estacionamento: < 90 segundos
- NPS: > 70
- Uptime do Sistema: > 99,9%

---

## 🧪 Testes

```bash
# Backend
docker compose exec backend npm run test

# Frontend
docker compose exec frontend npm run test
```

---

## 📝 Documentação

- [Guia de Instalação Completo](./docs/INSTALLATION.md)
- [Guia Rápido](./QUICK_START.md)
- [Documentação da API](./docs/API.md)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [Guia de Contribuição](./docs/CONTRIBUTING.md) para detalhes.

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👥 Equipe

Desenvolvido com ❤️ para revolucionar o mercado de estacionamentos no Brasil.

---

## 📞 Suporte

Para suporte, consulte a [Documentação](./docs/INSTALLATION.md) ou abra uma issue no GitHub.

---

**Status:** 🚧 Em desenvolvimento ativo - Fase 1 (MVP)
