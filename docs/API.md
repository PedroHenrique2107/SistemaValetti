# Documentação da API - Sistema Valetti

Base URL: `http://localhost:3000/api`

## Autenticação

A maioria das rotas requer autenticação via JWT. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

## Endpoints

### Autenticação

#### POST /auth/login
Login de usuário

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "role": "MANOBRISTA",
    "parkingId": "uuid"
  }
}
```

#### POST /auth/register
Registro de novo usuário (requer autenticação de admin)

**Body:**
```json
{
  "email": "novo@example.com",
  "password": "senha123",
  "name": "Nome Completo",
  "phone": "+5511999999999",
  "role": "MANOBRISTA",
  "parkingId": "uuid"
}
```

#### POST /auth/refresh
Renovar token de acesso

**Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

#### GET /auth/me
Obter informações do usuário autenticado

### Veículos

#### GET /vehicles
Listar veículos

**Query Params:**
- `status`: Filtrar por status (ESTACIONADO, EM_MOVIMENTACAO, etc)
- `parkingId`: Filtrar por estacionamento
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 50)

#### GET /vehicles/:id
Obter detalhes de um veículo

#### POST /vehicles
Criar novo veículo

**Body:**
```json
{
  "plate": "ABC1234",
  "model": "Civic",
  "brand": "Honda",
  "color": "Branco",
  "year": 2020,
  "type": "CARRO",
  "parkingId": "uuid"
}
```

#### PUT /vehicles/:id
Atualizar veículo

#### DELETE /vehicles/:id
Deletar veículo (apenas admins)

### Estacionamento

#### POST /parking/check-in
Realizar check-in de veículo

**Body:**
```json
{
  "vehicleId": "uuid",
  "spotId": "uuid",
  "manobristaId": "uuid",
  "inspectionData": {},
  "expectedExitTime": "2024-01-01T18:00:00Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "ticketNumber": "TKT-1234567890-ABC",
  "qrCode": "data:image/png;base64,...",
  "vehicle": {...},
  "spot": {...},
  "entryTime": "2024-01-01T10:00:00Z"
}
```

#### POST /parking/check-out
Realizar check-out de veículo

**Body:**
```json
{
  "checkInId": "uuid",
  "manobristaId": "uuid",
  "paymentMethod": "PIX",
  "exitInspection": {}
}
```

#### GET /parking/check-in
Listar check-ins

**Query Params:**
- `page`, `limit`: Paginação
- `vehicleId`: Filtrar por veículo
- `parkingId`: Filtrar por estacionamento

#### GET /parking/status
Obter status do estacionamento

**Response:**
```json
{
  "parking": {
    "id": "uuid",
    "name": "Estacionamento Centro",
    "totalSpots": 100,
    "activeSpots": 85
  },
  "vehicles": {
    "ESTACIONADO": 45,
    "EM_MOVIMENTACAO": 2,
    "SOLICITADO_SAIDA": 3
  },
  "spots": {
    "occupied": 45,
    "available": 40,
    "total": 85
  }
}
```

### Pagamentos

#### POST /payments
Criar pagamento

**Body:**
```json
{
  "checkOutId": "uuid",
  "method": "PIX",
  "amount": 25.50
}
```

#### GET /payments
Listar pagamentos

#### GET /payments/:id
Obter detalhes de um pagamento

#### POST /payments/:id/process
Processar pagamento

#### POST /payments/:id/cancel
Cancelar pagamento

### Dashboard

#### GET /dashboard/stats
Estatísticas gerais do dashboard

#### GET /dashboard/revenue
Estatísticas de receita

**Query Params:**
- `startDate`: Data inicial (ISO 8601)
- `endDate`: Data final (ISO 8601)

#### GET /dashboard/operational
Estatísticas operacionais

#### GET /dashboard/vehicles
Estatísticas de veículos

### Usuários

#### GET /users
Listar usuários (apenas admins)

#### GET /users/:id
Obter detalhes de um usuário

#### POST /users
Criar novo usuário (apenas admins)

#### PUT /users/:id
Atualizar usuário

#### DELETE /users/:id
Deletar usuário (apenas admins)

## Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Erro de validação
- `401`: Não autenticado
- `403`: Acesso negado
- `404`: Não encontrado
- `409`: Conflito (ex: recurso já existe)
- `429`: Muitas requisições (rate limit)
- `500`: Erro interno do servidor

## WebSockets

O sistema utiliza Socket.io para atualizações em tempo real.

### Eventos

**Cliente → Servidor:**
- `join:parking`: Entrar em uma sala de estacionamento
  ```json
  { "parkingId": "uuid" }
  ```

**Servidor → Cliente:**
- `vehicle:checked-in`: Veículo fez check-in
- `vehicle:checked-out`: Veículo fez check-out
- `vehicle:exit-requested`: Solicitação de saída

## Exemplo de Uso

```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'senha123'
  })
});

const { token } = await response.json();

// Fazer check-in
const checkIn = await fetch('http://localhost:3000/api/parking/check-in', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    vehicleId: 'uuid-do-veiculo'
  })
});
```

## Rate Limiting

- Geral: 100 requisições por 15 minutos por IP
- Autenticação: 5 tentativas por 15 minutos por IP

## Paginação

Todas as listagens suportam paginação:

```
GET /vehicles?page=1&limit=50
```

Response inclui:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```
