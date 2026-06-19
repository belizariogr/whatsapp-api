# AGENTS.md — Guide for AI Agents

This document guides AI agents (Cursor, Copilot, etc.) when working in this repository.

## Overview

Multi-tenant WhatsApp API built with **Bun**, **Hono**, and **Baileys 7** (`@whiskeysockets/baileys@7.0.0-rc13`). Each tenant is identified by the JWT `id` field (validated in `src/core/services/token.ts`). **This API does not issue tokens** — it only validates tokens issued by another microservice.

## Mandatory rules

### Code and architecture

1. **Always follow best practices** — readable, typed code with clear responsibilities and easy maintenance.
2. **Module separation** — each domain in its own folder (`src/modules/whatsapp/`, `src/db/`, etc.).
3. **Routes in separate files** — one route file per domain in `src/routes/` (e.g. `whatsapp.routes.ts`, `health.routes.ts`).
4. **Utilities grouped by type** — helper functions in `src/utils/` by category:
   - `utils/strings.ts` — string manipulation
   - `utils/phone.ts` — phone/JID normalization
   - `utils/response.ts` — standardized HTTP responses
   - New helpers: create a file per type (`utils/dates.ts`, `utils/validation.ts`, etc.), **not** a generic `helpers.ts`.
5. **Multi-tenant everywhere** — every query and business logic must filter/isolate by `tenantId`.
6. **Do not create JWT tokens** — use only `Token.verify()` from the existing service.
7. **Minimal scope** — change only what is necessary; do not refactor unrelated code.

### Database

- Use native **Bun.SQL** (`import { SQL } from 'bun'`) via `src/db/client.ts`.
- New tables/columns: add a numbered migration in `src/db/migrations/`.
- Run migrations: `bun run migrate`.

### WhatsApp / Baileys

- Version: `@whiskeysockets/baileys@7.0.0-rc13` (Baileys 7).
- Sessions persisted in MariaDB (`auth-state.ts`), not loose files in production.
- Interactive buttons: `interactiveButtons` with `quick_reply` and `cta_url`.
- Message receiving: minimal implementation for tests (`connection-manager.ts` → `received_messages`).

### Tests

- Framework: **Bun test** (`bun test`).
- After each implementation, run `bun test` and fix failures.
- Structure:
  - `tests/unit/` — pure functions and isolated modules (mocks)
  - `tests/integration/` — HTTP routes with Hono app
  - `tests/action/` — real tests (requires `.env` with `TEST_TENANT_ID`, `TEST_JWT_TOKEN`, `TEST_RECIPIENT_PHONE`)
- New modules must have corresponding tests.

## Folder structure

```
src/
├── index.ts                 # Bootstrap (migrations + server)
├── app.ts                   # Hono app (middlewares + routes)
├── config/env.ts            # Environment variables
├── core/services/token.ts   # JWT validation (do not change contract)
├── db/
│   ├── client.ts
│   └── migrations/
├── middleware/auth.ts       # JWT → tenantId
├── modules/whatsapp/
│   ├── auth-state.ts        # Baileys auth in MariaDB
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

## Main endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/whatsapp/connect` | Start connection (returns QR if needed) |
| POST | `/whatsapp/disconnect` | Close socket without deleting session |
| POST | `/whatsapp/logout` | Full logout (deletes credentials) |
| GET | `/whatsapp/status` | Connection status |
| POST | `/whatsapp/messages/text` | Plain text |
| POST | `/whatsapp/messages/link` | Text with link (preview) |
| POST | `/whatsapp/messages/image` | Image (URL or base64) |
| POST | `/whatsapp/messages/buttons` | Quick reply buttons |
| POST | `/whatsapp/messages/link-button` | External link button |
| POST | `/whatsapp/messages/bulk` | Send to multiple numbers |
| GET | `/whatsapp/messages/last-received` | Last received message (tests) |
| GET | `/health/health` | Health check |

All `/whatsapp/*` routes require the `Authorization: Bearer <JWT>` header.

## Useful commands

```bash
bun install          # Install dependencies
bun run dev          # Development with watch
bun run start        # Production
bun run migrate      # Run migrations
bun test             # All tests
bun test tests/unit  # Unit tests only
```

## API response conventions

Success:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "error": { "code": "CODE", "message": "..." } }
```

## What NOT to do

- Do not commit `.env` or credentials.
- Do not use `useMultiFileAuthState` in production (use `auth-state.ts` with MariaDB).
- Do not add JWT creation/refresh endpoints.
- Do not mix business logic inside route handlers — delegate to modules.
- Do not skip tests after implementations.
