# AGENTS.md — Guia para Agentes de IA

Este documento orienta agentes de IA (Cursor, Copilot, etc.) ao trabalhar neste repositório.

## Visão geral

API multi-tenant de WhatsApp construída com **Bun**, **Hono** e **Baileys 7** (`@whiskeysockets/baileys@7.0.0-rc13`). Cada tenant é identificado pelo campo `id` do JWT (validado em `src/core/services/token.ts`). **Esta API não emite tokens** — apenas valida tokens emitidos por outro microserviço.

## Regras obrigatórias

### Código e arquitetura

1. **Boas práticas sempre** — código legível, tipado, com responsabilidades claras e fácil manutenção.
2. **Separação de módulos** — cada domínio em pasta própria (`src/modules/whatsapp/`, `src/db/`, etc.).
3. **Rotas em arquivos separados** — uma rota por arquivo em `src/routes/` (ex.: `whatsapp.routes.ts`, `health.routes.ts`).
4. **Utilitários agrupados por tipo** — funções helper em `src/utils/` por categoria:
   - `utils/strings.ts` — manipulação de strings
   - `utils/phone.ts` — normalização de telefones/JIDs
   - `utils/response.ts` — respostas HTTP padronizadas
   - Novos helpers: criar arquivo por tipo (`utils/dates.ts`, `utils/validation.ts`, etc.), **não** um arquivo genérico `helpers.ts`.
5. **Multi-tenant em tudo** — toda query e lógica de negócio deve filtrar/isolar por `tenantId`.
6. **Não criar tokens JWT** — usar apenas `Token.verify()` do serviço existente.
7. **Escopo mínimo** — alterar apenas o necessário; não refatorar código não relacionado à tarefa.

### Banco de dados

- Usar **Bun.SQL** nativo (`import { SQL } from 'bun'`) via `src/db/client.ts`.
- Novas tabelas/colunas: adicionar migration numerada em `src/db/migrations/`.
- Executar migrations: `bun run migrate`.

### WhatsApp / Baileys

- Versão: `@whiskeysockets/baileys@7.0.0-rc13` (Baileys 7).
- Sessões persistidas no MariaDB (`auth-state.ts`), não em arquivos soltos em produção.
- Botões interativos: `interactiveButtons` com `quick_reply` e `cta_url`.
- Recebimento de mensagens: implementação mínima para testes (`connection-manager.ts` → `received_messages`).

### Testes

- Framework: **Bun test** (`bun test`).
- Após cada implementação, rodar `bun test` e corrigir falhas.
- Estrutura:
  - `tests/unit/` — funções puras e módulos isolados (mocks)
  - `tests/integration/` — rotas HTTP com app Hono
  - `tests/action/` — testes reais (requer `.env` com `TEST_TENANT_ID`, `TEST_JWT_TOKEN`, `TEST_RECIPIENT_PHONE`)
- Novos módulos devem ter testes correspondentes.

## Estrutura de pastas

```
src/
├── index.ts                 # Bootstrap (migrations + servidor)
├── app.ts                   # App Hono (middlewares + rotas)
├── config/env.ts            # Variáveis de ambiente
├── core/services/token.ts   # Validação JWT (não alterar contrato)
├── db/
│   ├── client.ts
│   └── migrations/
├── middleware/auth.ts       # JWT → tenantId
├── modules/whatsapp/
│   ├── auth-state.ts        # Auth Baileys no MariaDB
│   ├── connection-manager.ts
│   ├── message-sender.ts
│   ├── session-repository.ts
│   └── types.ts
├── routes/
│   ├── health.routes.ts
│   └── whatsapp.routes.ts
└── utils/
    ├── strings.ts
    ├── phone.ts
    └── response.ts
tests/
├── unit/
├── integration/
├── action/
└── helpers/
```

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/whatsapp/connect` | Inicia conexão (retorna QR se necessário) |
| POST | `/whatsapp/disconnect` | Encerra socket sem apagar sessão |
| POST | `/whatsapp/logout` | Logout completo (apaga credenciais) |
| GET | `/whatsapp/status` | Status da conexão |
| POST | `/whatsapp/messages/text` | Texto simples |
| POST | `/whatsapp/messages/link` | Texto com link (preview) |
| POST | `/whatsapp/messages/image` | Imagem (URL ou base64) |
| POST | `/whatsapp/messages/buttons` | Botões de resposta rápida |
| POST | `/whatsapp/messages/link-button` | Botão com link externo |
| POST | `/whatsapp/messages/bulk` | Envio para múltiplos números |
| GET | `/whatsapp/messages/last-received` | Última mensagem recebida (testes) |
| GET | `/health/health` | Health check |

Todas as rotas `/whatsapp/*` exigem header `Authorization: Bearer <JWT>`.

## Comandos úteis

```bash
bun install          # Instalar dependências
bun run dev          # Desenvolvimento com watch
bun run start        # Produção
bun run migrate      # Rodar migrations
bun test             # Todos os testes
bun test tests/unit  # Apenas unitários
```

## Convenções de resposta API

Sucesso:
```json
{ "success": true, "data": { ... } }
```

Erro:
```json
{ "success": false, "error": { "code": "CODE", "message": "..." } }
```

## O que NÃO fazer

- Não commitar `.env` ou credenciais.
- Não usar `useMultiFileAuthState` em produção (usar `auth-state.ts` com MariaDB).
- Não adicionar endpoint de criação/refresh de JWT.
- Não misturar lógica de negócio dentro de handlers de rota — delegar aos módulos.
- Não pular testes após implementações.
