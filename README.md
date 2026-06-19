# WhatsApp API (Multi-tenant)

API REST para integração com WhatsApp via [Baileys 7](https://github.com/WhiskeySockets/Baileys), construída com **Bun** e **Hono**. Suporta múltiplos tenants com sessões isoladas no **MariaDB**.

## Funcionalidades

- Conectar / desconectar / verificar status da conexão WhatsApp
- Enviar mensagens:
  - Texto
  - Links (com preview)
  - Imagens (URL ou base64)
  - Botões de resposta rápida
  - Botão com link externo (CTA URL)
  - Envio em massa para múltiplos contatos
- Recebimento básico de mensagens (para validação/testes)
- Autenticação JWT multi-tenant (validação apenas — tokens emitidos externamente)

## Stack

| Tecnologia | Uso |
|------------|-----|
| [Bun](https://bun.sh) | Runtime, testes, servidor HTTP |
| [Hono](https://hono.dev) | Framework HTTP |
| [@whiskeysockets/baileys](https://www.npmjs.com/package/@whiskeysockets/baileys) 7.0.0-rc13 | Cliente WhatsApp Web |
| MariaDB + Bun.SQL | Persistência multi-tenant |
| jsonwebtoken | Validação JWT |

## Pré-requisitos

- [Bun](https://bun.sh) >= 1.2
- MariaDB 10.5+
- Token JWT válido (emitido pelo microserviço de autenticação)

## Instalação

```bash
git clone <repo-url>
cd whtasapp-api
bun install
cp .env.example .env
# Edite .env com suas credenciais
```

### Configuração (.env)

```env
PORT=3000
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USERNAME=user
DATABASE_PASSWORD=password
DATABASE_NAME=whatsapp_api
JWT_SECRET_KEY=sua-chave-secreta
JWT_SECRET_KEY_PUBLIC=sua-chave-publica

# Testes de ação
TEST_TENANT_ID=1
TEST_JWT_TOKEN=eyJ...
TEST_RECIPIENT_PHONE=5511999999999
```

### Banco de dados

Crie o banco e execute as migrations:

```bash
# No MariaDB
CREATE DATABASE whatsapp_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Rodar migrations
bun run migrate
```

## Executando

```bash
# Desenvolvimento (hot reload)
bun run dev

# Produção
bun run start
```

Servidor padrão: `http://0.0.0.0:3000`

## Autenticação

Todas as rotas `/whatsapp/*` exigem:

```
Authorization: Bearer <JWT>
```

O campo `id` do payload JWT identifica o **tenant**. A validação usa `src/core/services/token.ts` — mesma chave secreta do microserviço emissor.

## API Reference

### Conexão

#### `POST /whatsapp/connect`

Inicia conexão WhatsApp. Se não houver sessão salva, retorna QR code em `data.qrCode`.

```bash
curl -X POST http://localhost:3000/whatsapp/connect \
  -H "Authorization: Bearer $TOKEN"
```

Resposta:
```json
{
  "success": true,
  "data": {
    "status": "qr_pending",
    "phoneNumber": null,
    "qrCode": "2@...",
    "isConnected": false,
    "lastConnectedAt": null
  }
}
```

#### `GET /whatsapp/status`

Verifica situação da conexão.

#### `POST /whatsapp/disconnect`

Encerra o socket sem remover credenciais.

#### `POST /whatsapp/logout`

Logout completo — remove credenciais do banco.

### Mensagens

#### Texto — `POST /whatsapp/messages/text`

```json
{ "to": "5511999999999", "text": "Olá!" }
```

#### Link — `POST /whatsapp/messages/link`

```json
{ "to": "5511999999999", "text": "Veja https://example.com" }
```

#### Imagem — `POST /whatsapp/messages/image`

```json
{
  "to": "5511999999999",
  "imageUrl": "https://example.com/photo.jpg",
  "caption": "Legenda opcional"
}
```

Ou com base64: `"imageBase64": "<base64>"`

#### Botões — `POST /whatsapp/messages/buttons`

```json
{
  "to": "5511999999999",
  "text": "Escolha:",
  "footer": "Opcional",
  "buttons": [
    { "id": "sim", "text": "Sim" },
    { "id": "nao", "text": "Não" }
  ]
}
```

#### Botão com link — `POST /whatsapp/messages/link-button`

```json
{
  "to": "5511999999999",
  "text": "Acesse nosso site",
  "buttonText": "Abrir site",
  "url": "https://example.com"
}
```

#### Envio em massa — `POST /whatsapp/messages/bulk`

```json
{
  "recipients": ["5511111111111", "5522222222222"],
  "message": {
    "type": "text",
    "text": "Mensagem para todos"
  }
}
```

Tipos suportados em `message.type`: `text`, `link`, `image`, `buttons`, `link_button`.

#### Última mensagem recebida — `GET /whatsapp/messages/last-received`

Retorna a última mensagem recebida (uso em testes).

### Health

#### `GET /health/health`

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-06-19T12:00:00.000Z"
  }
}
```

## Testes

```bash
# Todos os testes (unit + integration; action skipped se .env incompleto)
bun test

# Por categoria
bun test tests/unit
bun test tests/integration
bun test tests/action   # Requer servidor rodando + .env configurado
```

### Testes de ação

1. Configure `TEST_TENANT_ID`, `TEST_JWT_TOKEN` e `TEST_RECIPIENT_PHONE` no `.env`
2. Inicie o servidor: `bun run dev`
3. Conecte o WhatsApp: `POST /whatsapp/connect` e escaneie o QR
4. Execute: `bun test tests/action`

## Arquitetura

```
Cliente HTTP
    │
    ▼
Hono (app.ts)
    ├── middleware/auth.ts  → JWT → tenantId
    └── routes/
            whatsapp.routes.ts
                │
                ▼
        modules/whatsapp/
            connection-manager.ts  → Baileys socket por tenant
            message-sender.ts      → Envio de mensagens
            auth-state.ts          → Credenciais no MariaDB
            session-repository.ts  → Status/sessões
```

Cada tenant possui:
- Registro em `tenants`
- Sessão em `whatsapp_sessions`
- Credenciais Baileys em `whatsapp_auth_creds` + `whatsapp_auth_keys`
- Mensagens recebidas em `received_messages`

## Estrutura do projeto

Ver [AGENTS.md](./AGENTS.md) para guia completo de desenvolvimento e regras para agentes de IA.

Ver [TODO.md](./TODO.md) para acompanhamento do desenvolvimento.

## Licença

MIT — ver [LICENSE](./LICENSE)
