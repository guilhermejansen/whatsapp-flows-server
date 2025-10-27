# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **production-ready WhatsApp Flows Server** implementing the [WhatsApp Flows API](https://developers.facebook.com/docs/whatsapp/flows/) using **Domain-Driven Design (DDD)** architecture. The server handles encrypted WhatsApp Flow interactions with dual endpoints (Data API + Webhooks), PostgreSQL persistence, and automated CI/CD workflows.

**Critical Constraint**: Flow endpoint responses **MUST complete in < 3 seconds** (WhatsApp timeout requirement).

## Quick Commands

### Development
```bash
npm run dev              # Start with TSX watch mode
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production server
```

### Database
```bash
npm run migrate          # Run PostgreSQL migrations (runs auto in Docker)
npm run seed             # Seed default CSAT feedback flow
npm run seed:csat        # Seed alternative CSAT template
```

### Encryption & Keys
```bash
npm run generate-keys    # Generate RSA-2048 key pair → outputs .env format
npm run validate-keys    # Verify keys + Meta API sync
npm run register-key     # Register public key with Meta platform
```

### Code Quality
```bash
npm run lint             # ESLint validation
npm run format           # Prettier formatting
npm run format:check     # Check formatting without changes
npm run commit           # Interactive Conventional Commits helper
```

### Docker
```bash
make docker-up           # Start services (app + postgres)
make docker-logs         # Tail application logs
make docker-migrate      # Run migrations in container
make db-shell            # Open psql shell
docker-compose exec app npm run generate-keys  # Generate keys in container
```

## Architecture (Domain-Driven Design)

### Layer Structure

**Critical**: Dependencies flow unidirectionally: `Infrastructure → Application → Domain`

```
src/
├── domain/              # Pure business logic (NO external dependencies)
│   ├── flows/           # Flow, FlowSession entities + repositories interfaces
│   │   ├── entities/    # Flow, FlowSession, FlowResponse
│   │   ├── services/    # FlowEngine, FlowValidator, FlowTokenMapper
│   │   └── value-objects/  # FlowToken, FlowVersion, ScreenId
│   ├── encryption/      # Encryption value objects + interface
│   └── webhooks/        # WebhookEvent entity + CallbackForwarder service
│
├── application/         # Use cases (orchestrate domain + repositories)
│   ├── use-cases/flows/     # HandleFlowRequestUseCase, CreateFlowUseCase
│   ├── use-cases/webhooks/  # ProcessWebhookUseCase
│   └── dtos/            # Data Transfer Objects + Zod schemas
│
├── infrastructure/      # External implementations (DB, HTTP, logging)
│   ├── database/        # PostgreSQL repositories (implements domain interfaces)
│   ├── http/            # Express routes, controllers, middlewares
│   ├── security/        # EncryptionService (RSA/AES with IV flip)
│   └── logging/         # Winston logger
│
├── config/              # Environment config, security, Swagger
├── shared/              # Cross-layer utilities, errors, constants
└── main.ts              # Application bootstrap
```

### Key Design Patterns

**FlowEngine** (domain/flows/services/FlowEngine.ts): Processes flow actions
- `ping` → Health check response
- `INIT` → Load first screen + create session
- `data_exchange` → Merge data + return current screen
- `navigate` → Navigate to `next_screen`
- `complete` → Mark session completed

**HandleFlowRequestUseCase** (application/use-cases/flows/HandleFlowRequestUseCase.ts):
1. Decrypt request (RSA + AES)
2. Identify flow via **3-layer fallback**:
   - Path parameter `/flows/endpoint/:flowName` (primary)
   - Token mapping cache (populated during ping)
   - `DEFAULT_FLOW_NAME` environment variable
3. Get/create session
4. Process action via FlowEngine
5. Update session
6. Encrypt response (AES with **IV flip** ⚠️)

**ProcessWebhookUseCase** (application/use-cases/webhooks/ProcessWebhookUseCase.ts):
1. Validate `X-Hub-Signature-256` header (HMAC SHA-256)
2. Parse `nfm_reply.response_json` (**string** → JSON)
3. Retrieve session by `flow_token`
4. Mark session completed
5. Forward to callback webhook (exponential backoff retries)

## Critical Implementation Details

### 1. WhatsApp IV Flip Pattern (MANDATORY)

**Decryption (inbound)**: Use normal IV from request
**Encryption (outbound)**: MUST reverse IV bytes before encrypting

```typescript
// infrastructure/security/EncryptionService.ts
public encryptResponse(data, aesKey, initialVector) {
  const iv = Buffer.from(initialVector, 'base64');
  const flippedIV = Buffer.from(iv).map(byte => ~byte); // Bitwise NOT each byte

  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, flippedIV);
  // ... encrypt + return base64 string (NOT JSON)
}
```

**Failure to flip IV results in WhatsApp error 421.**

### 2. Webhook Signature Validation

**CRITICAL**: Raw request body MUST be used for HMAC validation (before JSON parsing).

```typescript
// infrastructure/http/express/middlewares/validate-request.ts
// Middleware captures raw body: req.rawBody = Buffer.from(req.body)
// Then validate: hmac('sha256', META_APP_SECRET).update(rawBody).digest('hex')
```

### 3. Response Time Enforcement

- `FLOW_ENDPOINT_TIMEOUT` default: 2500ms (environment configurable)
- Middleware enforces timeout → HTTP 408 if exceeded
- Logs warning if request takes > 2.5 seconds

### 4. Database Migrations

**Auto-run on container boot** via `scripts/migrations/run-migrations.ts` (called in docker-entrypoint.sh).

Manual run: `npm run migrate` or `docker-compose exec app npm run migrate`

**Schema**: PostgreSQL 18 with:
- `flows` → Flow JSON templates + status
- `flow_sessions` → Active user sessions with JSONB session_data
- `flow_responses` → Completed flow results
- `webhook_events` → Audit trail with callback status

Migrations live in `scripts/migrations/` numbered sequentially.

## Common Development Tasks

### Adding a New Flow

**Method 1: Via API**
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-flow",
    "version": "7.2",
    "flow_json": {...},  # WhatsApp Flow JSON spec
    "description": "Custom flow description"
  }'
```

**Method 2: Seed Script**
```bash
# Copy template
cp scripts/seed-csat-template.ts scripts/seed-my-flow.ts

# Edit flow JSON in new file
# Add script to package.json: "seed:my-flow": "tsx scripts/seed-my-flow.ts"

npm run seed:my-flow
```

Configure in WhatsApp Manager:
```
Flow Endpoint URL: https://your-domain.com/flows/endpoint/my-custom-flow
```

### Testing Encryption Locally

```bash
# Ensure .env has PRIVATE_KEY, PUBLIC_KEY, META_* credentials
npm run validate-keys  # Verifies key pairing + Meta API sync
npm run test-encryption  # (if test script exists)
```

### Debugging Flow Requests

Enable verbose logging:
```bash
# Set in .env
LOG_LEVEL=debug

# Watch logs
docker-compose logs -f app | grep "Flow request"
```

Common issues:
- **"Failed to decrypt AES key"** → Check `.env` has proper key format (with `\n` escapes)
- **"Session not found"** → Client must send INIT before other actions
- **"Flow not active"** → Update flow status in database: `UPDATE flows SET status = 'active' WHERE name = 'flow-name';`

### Running Tests

**No test suite is included yet**, but structure supports:
- Unit tests for `FlowEngine`, `FlowValidator`, `EncryptionService`
- Integration tests for Express routes with test database

Recommended test framework: Jest + Supertest

## Environment Variables Reference

**Required for Production**:
- `PRIVATE_KEY` → RSA-2048 private key (PEM with `\n`)
- `PUBLIC_KEY` → RSA public key (PEM with `\n`)
- `META_APP_SECRET` → For webhook signature validation
- `META_VERIFY_TOKEN` → For webhook verification endpoint
- `META_ACCESS_TOKEN` → For WhatsApp API calls
- `META_PHONE_NUMBER_ID` → WhatsApp Business phone number ID
- `META_WABA_ID` → WhatsApp Business Account ID
- `CALLBACK_WEBHOOK_URL` → Your external webhook for completed flows
- `DATABASE_URL` or individual `DB_*` variables

**Important Defaults**:
- `FLOW_ENDPOINT_TIMEOUT=2500` (must be < 3000)
- `DEFAULT_FLOW_NAME=csat-feedback` (fallback identifier)
- `API_TOKEN` → Bearer token for `/api/flows` routes (defaults to META_ACCESS_TOKEN if unset)

See `AGENTS.md` for complete environment variable documentation.

## CI/CD & Semantic Release

**Conventional Commits Required**:
```bash
git commit -m "feat: add multi-language support"  # Minor version bump
git commit -m "fix: resolve webhook parsing issue"  # Patch version bump
git commit -m "feat!: migrate to PostgreSQL 18"  # Major version bump (breaking)
git commit -m "docs: update README"  # No release
```

Use `npm run commit` for interactive Commitizen helper.

**GitHub Actions Workflows**:
- **CI** (all branches): lint, format check, typecheck, build
- **Semantic Release** (main branch): version bump, changelog, GitHub release, Docker image build (multi-arch: AMD64 + ARM64)

Docker images published to: `setupautomatizado/whatsapp-flows-server:latest` and versioned tags.

## Key Files & Their Purpose

- `src/main.ts` → Bootstrap application, database connection, graceful shutdown
- `src/server.ts` → Express server creation, middleware registration, route mounting
- `src/config/env.config.ts` → Environment variable parsing + Zod validation
- `src/domain/flows/services/FlowEngine.ts` → Core flow navigation logic
- `src/infrastructure/security/EncryptionService.ts` → RSA/AES encryption with IV flip
- `src/application/use-cases/flows/HandleFlowRequestUseCase.ts` → Main flow request handler
- `src/application/use-cases/webhooks/ProcessWebhookUseCase.ts` → Webhook event processor
- `scripts/migrations/run-migrations.ts` → Migration runner (auto-executed in Docker)
- `AGENTS.md` → Complete business rules, operational runbook, troubleshooting
- `SECURITY.md` → Security policy, vulnerability reporting

## Troubleshooting Quick Reference

| Issue | Diagnostic | Solution |
|-------|-----------|----------|
| "Failed to decrypt AES key" | Check private key format | Regenerate with `npm run generate-keys`, ensure `.env` has `\n` escapes |
| "Webhook signature invalid" | Verify `META_APP_SECRET` | Check Meta dashboard, ensure raw body used in validation |
| "Database connection refused" | Check PostgreSQL status | `docker-compose ps`, verify `DATABASE_URL` |
| "Migrations failed" | Check DB permissions | Run manually: `npm run migrate`, check migration logs |
| WhatsApp error 421 | IV flip not implemented | Verify encryption service reverses IV bytes |
| Timeout errors | Response time > 3s | Check `FLOW_ENDPOINT_TIMEOUT`, optimize database queries |
| "Session not found" | Missing INIT action | Ensure client sends INIT before data_exchange/navigate |

See `AGENTS.md` for comprehensive troubleshooting guide.

## Security Considerations

- **Never commit** `.env`, `keys/`, or secrets to Git (already in `.gitignore`)
- **Always use HTTPS** in production (required by WhatsApp)
- **Rotate keys quarterly**: `META_ACCESS_TOKEN`, `API_TOKEN`, RSA keys
- **Validate webhooks**: Signature validation is mandatory, never skip
- **Run as non-root**: Docker container uses `node:20-alpine` with non-root user
- **Keep dependencies updated**: Dependabot enabled for security patches

## Additional Resources

- **AGENTS.md**: Complete business rules, performance budgets, operational procedures
- **README.md**: Setup guides, architecture diagrams, API reference
- **CONTRIBUTING.md**: Contribution guidelines, code standards
- **SECURITY.md**: Security policy, vulnerability reporting contact
- **WhatsApp Flows Docs**: https://developers.facebook.com/docs/whatsapp/flows/
- **Encryption Guide**: https://developers.facebook.com/docs/whatsapp/flows/guides/encryption/
- **Flow JSON Spec**: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/
