# WhatsApp Flow Server — Project Index

This guide collects every rule that governs the WhatsApp Flow Server. It combines the business constraints enforced at runtime with the engineering practices required to keep the service production-ready.

---

## Contents
- [Core Overview](#core-overview)
- [Business Rules](#business-rules)
  - [Flow Lifecycle & Actions](#flow-lifecycle--actions)
  - [Flow Identification](#flow-identification)
  - [Flow JSON Requirements](#flow-json-requirements)
  - [Session Management](#session-management)
  - [Encryption & Key Handling](#encryption--key-handling)
  - [Webhook Processing](#webhook-processing)
  - [Callback Delivery](#callback-delivery)
  - [Performance, Timeouts & Rate Limits](#performance-timeouts--rate-limits)
  - [Data Persistence Rules](#data-persistence-rules)
  - [Logging & Observability](#logging--observability)
- [Development Practices](#development-practices)
  - [Architecture Expectations](#architecture-expectations)
  - [Local Environment & Tooling](#local-environment--tooling)
  - [Environment Variables](#environment-variables)
  - [Security Baselines](#security-baselines)
  - [Coding Standards](#coding-standards)
  - [Testing & Quality Gates](#testing--quality-gates)
  - [Git, CI/CD & Releases](#git-cicd--releases)
  - [Documentation & Communication](#documentation--communication)
- [Operational Runbook](#operational-runbook)
  - [Daily & Weekly Tasks](#daily--weekly-tasks)
  - [Essential Commands](#essential-commands)
  - [Monitoring & Alerting](#monitoring--alerting)
  - [Troubleshooting Aids](#troubleshooting-aids)
- [HTTP Endpoint Summary](#http-endpoint-summary)
- [Database Schema Snapshot](#database-schema-snapshot)
- [Glossary & References](#glossary--references)

---

## Core Overview

- **Purpose**: Provide a production-grade, TypeScript-based backend that implements the WhatsApp Flow Data API and webhook contract with Meta, enforcing encryption, webhook validation, and flow orchestration rules.
- **Architecture**: Domain-Driven Design with clear separation across `domain`, `application`, and `infrastructure` layers (`src/`).
- **Tech Stack**: Node.js ≥ 20, TypeScript 5.9, Express 5, PostgreSQL 18, Zod v4, native `crypto` for RSA/AES, Winston logging, Axios for outbound callbacks, Docker multi-arch images.
- **Deployment**: Docker-first, with automatic migrations, semantic-release driven versioning, and GitHub Actions CI (build, lint, release, Docker publish).
- **Key External Integrations**: WhatsApp Business Platform (flows, encryption keys, callbacks), PostgreSQL, external callback webhook URL.

---

## Business Rules

### Flow Lifecycle & Actions
- Supported Flow actions (src/shared/constants/flow-actions.ts): `ping`, `INIT`, `data_exchange`, `navigate`, `complete`.
- All requests must decrypt successfully and respond in **< 3 seconds**; the Flow endpoint enforces a 2.5 second timeout for safety.
- `FlowEngine` (src/domain/flows/services/FlowEngine.ts) governs action handling:
  - `ping`: returns `{ version: '7.2', data: { status: 'active' } }`.
  - `INIT`: loads the first screen and marks the session as started.
  - `data_exchange`: merges incoming data into the session state and returns the current screen payload.
  - `navigate`: validates `next_screen`, updates session navigation, returns the new screen state.
  - `complete`: merges final data, marks session as `completed`, and acknowledges.
- Unknown actions raise `ValidationError`.

### Flow Identification
- Identification is a **three-layer fallback** implemented in `HandleFlowRequestUseCase` (src/application/use-cases/flows/HandleFlowRequestUseCase.ts):
  1. **Path parameter** `/flows/endpoint/:flowName` (primary source).
  2. **Token mapping cache** (`FlowTokenMapper`, TTL = 1 hour) populated during `ping` → `INIT` sequences.
  3. **DEFAULT_FLOW_NAME** from environment config (last resort).
- Failure across all layers returns `ValidationError` with guidance to use explicit path parameters.
- Flows must exist, be marked as `active`, and remain consistent across the request lifecycle.

### Flow JSON Requirements
- Validation performed by `FlowValidator` through Zod schemas (src/domain/flows/services/FlowValidator.ts and src/application/dtos/validation-schemas.ts):
  - `version`: format `X.Y`, major between 2 and 7, default `7.2`.
  - `screens`: 1–20 entries, unique `id`s, first screen treated as entry point, at least one screen must have `terminal: true`.
  - `layout`: structured format (`SingleColumnLayout` or `Form`) with at least one child component.
  - Components accept WhatsApp Flow attributes, on-click actions must be `navigate`, `complete`, or `data_exchange`.
  - `data_channel_uri` optional; must be a valid URL if provided.
- Flow metadata constraints:
  - `name`: unique, alphanumeric, spaces/hyphen/underscore allowed, ≤255 characters.
  - `status`: `active`, `inactive`, or `deprecated` (only `active` flows can execute).
  - `metaFlowId` and `templateName`: optional, ≤255 characters.

### Session Management
- `FlowSession` entity (src/domain/flows/entities/FlowSession.ts):
  - Lifecycles: `active` → `completed`/`expired`/`error`, tracked timestamps (`startedAt`, `lastActivityAt`, `completedAt`).
  - Session data merged cumulatively via `updateSessionData`.
  - Navigation updates `current_screen`; `complete()` marks the session done.
- Repositories (src/infrastructure/database/repositories/FlowSessionRepositoryPg.ts):
  - `findByFlowToken` ensures each token maps to a single live session.
  - `findExpiredSessions(hoursAgo)` & `markExpiredSessions(hoursAgo)` support background expiration jobs (none scheduled by default—configure via cron/worker in production).
  - Sessions remove automatically if flow deleted (cascade).
- Session creation occurs only on `INIT` when no session exists for the token.
- Missing session for non-INIT actions results in `ValidationError` with instructions to start from `INIT`.

### Encryption & Key Handling
- Implemented via `EncryptionService` (src/infrastructure/security/EncryptionService.ts):
  - RSA-2048 OAEP SHA-256 private key decryption for AES key (`decryptAesKey`).
  - AES-128-GCM decryption with provided IV (no flip) for inbound payloads.
  - AES-128-GCM encryption with **bitwise-not IV flip** for outbound responses (**critical WhatsApp requirement**).
  - Responses returned as base64 strings only; WhatsApp expects raw string, not JSON.
- `PRIVATE_KEY`, `PUBLIC_KEY`, optional `PASSPHRASE` must be present at boot; missing keys abort startup.
- `npm run generate-keys` produces RSA pair in `keys/`, prints `.env` format. Never commit private keys.
- `npm run register-key` registers the public key with Meta; `npm run validate-keys` verifies pairing and Meta sync.

### Webhook Processing
- `WebhookController` (src/infrastructure/http/express/controllers/WebhookController.ts):
  - `GET /webhooks/whatsapp`: echo `hub.challenge` when `hub.verify_token` matches `META_VERIFY_TOKEN`.
  - `POST /webhooks/whatsapp`: immediately returns `200` and processes payload asynchronously.
- `ProcessWebhookUseCase` enforces:
  - `X-Hub-Signature-256` validation via HMAC SHA-256 (throws `InvalidSignatureError` if missing or invalid).
  - `nfm_reply.response_json` **must** be parsed from string to JSON before use.
  - Flow session retrieved by `flow_token` (webhook never provides `flow_id`), session marked `completed`, phone number captured if absent.
  - Response stored via `FlowResponseRepository` along with raw webhook payload for auditing.
- Any processing failure updates webhook event record and rethrows for logging; signature validation failure is reported as `ValidationError`.

### Callback Delivery
- `CallbackClient` (src/infrastructure/http/axios/callback-client.ts) implements outbound callbacks:
  - Sends JSON payload `{ event_type: 'flow_completed', flow_token, flow_id, phone_number, response_data, timestamp }`.
  - Honors `CALLBACK_TIMEOUT` and `CALLBACK_MAX_RETRIES` (exponential backoff: 1s, 2s, 4s …).
  - Logs success or failure; failures mark webhook event for reprocessing. Use a scheduler to retry failed callbacks via `WebhookEventRepository.findFailedCallbacks`.
- Missing or failing callbacks do **not** block webhook acknowledgement to Meta.

### Performance, Timeouts & Rate Limits
- Flow endpoint timeout set by `FLOW_ENDPOINT_TIMEOUT` (default 2500 ms) via `timeoutHandler`. Requests exceeding limit return HTTP 408.
- Global rate limiter (config/security.config.ts) defaults: 100 requests/minute; skipped for `/health`.
- Dedicated rate limiters:
  - Flow endpoint: 300 requests/minute.
  - Webhooks: 500 requests/minute.
- Express app always uses compression, CORS, and Helmet (with CSP, HSTS) before hitting business logic.
- Responders log warnings for requests exceeding 2.5 seconds.

### Data Persistence Rules
- PostgreSQL schema (scripts/migrations):
  - `flows`: unique `name`, JSONB payload, status check constraint, triggers maintain `updated_at`.
  - `flow_sessions`: tracks token, phone, current screen, status, `session_data` JSONB, timestamps, `updated_at` added in migration 005.
  - `flow_responses`: stores session linkage, webhook payload, `received_at`.
  - `webhook_events`: audit trail storing raw payload, signature status, callbacks.
- `gen_random_uuid()` used for primary keys—ensure `pgcrypto` extension enabled in target database.
- Cascading deletes ensure orphan data removed when parent flows or sessions vanish.
- Automatic migrations run on container boot via Docker entrypoint; manual run with `npm run migrate`.

### Logging & Observability
- Winston logger (src/infrastructure/logging) configured with level from `LOG_LEVEL`, writes to file and console.
- Request logging middleware captures method, path, duration, IP, user agent.
- All errors funnel through `errorHandler`, returning structured JSON with `success`, `error`, `timestamp`.
- Sensitive data (keys, tokens) intentionally omitted from logs; encrypted payloads never logged.
- Health endpoint reports environment, DB status, uptime, latency.

---

## Development Practices

### Architecture Expectations
- **Domain layer (`src/domain`)**: Pure business entities, value objects, interfaces, domain services. No IO or framework dependencies.
- **Application layer (`src/application`)**: Use cases orchestrating domain logic and repositories, DTO definitions, validation schemas.
- **Infrastructure layer (`src/infrastructure`)**: External adapters for HTTP, database, logging, security, and integrations.
- **Config (`src/config`)**: Environment parsing (Zod validated), security policies, Swagger spec, database pool creation.
- **Shared (`src/shared`)**: Cross-layer utilities, type definitions, constants, and custom errors.
- Keep cross-layer dependencies unidirectional: infrastructure depends on domain/application, not vice versa.

### Local Environment & Tooling
- Require Node.js ≥ 20, npm ≥ 8, PostgreSQL 18 (or Docker).
- Suggested workflow:
  ```bash
  npm ci
  cp .env.example .env            # Add secrets
  npm run generate-keys           # Optional helper
  npm run migrate
  npm run dev                     # TSX watch server
  ```
- Docker-first alternatives:
  ```bash
  make docker-init   # interactive setup
  make docker-up     # start services
  make docker-migrate
  ```
- Swagger UI available at `/docs`, JSON spec at `/docs.json`.
- Use `npm run build` before packaging, `npm start` runs compiled output (`dist/`).

### Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Execution environment flag (`development`, `production`, `test`). |
| `PORT` | No | `3000` | HTTP port. |
| `HOST` | No | `0.0.0.0` | Bind address. |
| `FLOW_ENDPOINT_TIMEOUT` | No | `2500` | Timeout (ms) enforced for Flow endpoint to keep < 3s SLA. |
| `DATABASE_URL` | Conditional | – | Full Postgres connection string; overrides individual DB_* vars. |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Yes (if no `DATABASE_URL`) | `localhost` / `5432` / `whatsapp_flows` / `postgres` / `postgres` | Database connectivity. |
| `DB_POOL_MIN` / `DB_POOL_MAX` | No | 2 / 10 | PG pool sizing. |
| `PRIVATE_KEY` | **Yes** | – | RSA-2048 private key in PEM format (escaped newlines). |
| `PASSPHRASE` | No | – | Optional passphrase for the private key. |
| `PUBLIC_KEY` | **Yes** | – | RSA public key registered with Meta. |
| `META_APP_SECRET` | **Yes** | – | Secret for webhook signature validation. |
| `META_VERIFY_TOKEN` | **Yes** | – | Token WhatsApp sends during webhook verification. |
| `META_ACCESS_TOKEN` | **Yes** | – | OAuth token to manage keys and send flows. |
| `META_PHONE_NUMBER_ID` | **Yes** | – | Phone number ID associated with WhatsApp Business account. |
| `META_WABA_ID` | **Yes** | – | WhatsApp Business Account ID. |
| `CALLBACK_WEBHOOK_URL` | **Yes** | – | External URL to receive completed flow callbacks. |
| `CALLBACK_TIMEOUT` | No | `5000` | Axios timeout (ms) for callback delivery. |
| `CALLBACK_MAX_RETRIES` | No | `3` | Retry attempts for callback forwarding. |
| `API_TOKEN` | Recommended | – | Bearer token for `/api/flows` routes (falls back to `META_ACCESS_TOKEN` if unset). |
| `CORS_ORIGINS` | No | `*` | Comma-separated list of allowed origins. |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Global limiter window (ms). |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Global limiter allowance per window. |
| `LOG_LEVEL` | No | `debug` | Winston log level (`error` … `silly`). |
| `LOG_FILE_PATH` | No | `./logs/app.log` | File sink for logs (only path for container). |
| `LOG_MAX_FILES` | No | `7` | Rolling file retention. |
| `DEFAULT_FLOW_NAME` | No | `csat-feedback` | Last-resort flow identifier when no other resolution succeeds. |

> All environment variables are validated at startup; missing mandatory entries abort the process.

### Security Baselines
- Never commit `.env`, keys, or secrets; `.gitignore` already covers them.
- Enforce HTTPS (required by Meta). Offload TLS at gateway/load balancer.
- Rotate API_TOKEN, Meta access tokens, and RSA keys regularly (suggested: quarterly or when staff changes).
- Limit database exposure to internal networks; enable TLS for DB connections where possible.
- Configure firewalls or WAF rules for webhook endpoints; consider IP allow-listing.
- Review `SECURITY.md` for a detailed deployment checklist and vulnerability reporting flow.

### Coding Standards
- TypeScript strict mode; prefer explicit types in public interfaces.
- Rely on shared `ValidationError`, `NotFoundError`, etc. for consistency.
- Validate incoming data with Zod schemas via `validateRequest` middleware (Express layer) or inside use cases.
- Avoid leaking infrastructure types into domain layer; map responses through DTOs.
- Keep business logic inside use cases or domain services; controllers should orchestrate only.
- Run formatters and linters before committing:
  ```bash
  npm run lint
  npm run format:check
  ```
- Follow Domain-Driven conventions: entities encapsulate invariants, value objects guard primitive obsession.
- Keep comments focused on clarifying domain decisions or non-obvious implementations (encryption, IV flip, fallback strategy).

### Testing & Quality Gates
- No automated tests are bundled yet, but structure supports:
  - Unit tests for `FlowEngine`, `FlowValidator`, `WebhookValidator`, `EncryptionService`.
  - Integration tests for Express routes (supertest) with in-memory or test Postgres.
- Before PRs: run lint, format check, `npm run build`, optionally `npm run migrate` against test DB.
- For encryption verification, use `npm run validate-keys` with sandbox credentials.
- Add fixtures for Flow JSON and webhook payloads when building tests.

### Git, CI/CD & Releases
- Conventional Commits required; Commitlint + Husky pre-commit hooks enforce style.
- `npm run commit` launches Commitizen for interactive commit generation.
- GitHub Actions pipeline handles lint/build/test and semantic-release versioning.
- Docker images built multi-arch (AMD64/ARM64), published to Docker Hub (see README badges).
- Branching model: feature branches from `main`, PR required. Keep PRs updated/rebased.
- Semantic-release auto-updates changelog, GitHub releases, npm metadata.

### Documentation & Communication
- Primary docs live in `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, and this index file.
- Swagger spec generated from JSDoc annotations in `src/infrastructure/http/express/routes`.
- Update documentation concurrently with feature changes; lacking docs is considered a regression.
- Encourage adding troubleshooting notes when new edge cases are discovered (`TROUBLESHOOTING.md` placeholder referenced).
- Support channels:
  - Issues for bugs.
  - GitHub Discussions for questions/ideas.
  - Email security reports to `guilherme@setupautomatizado.com.br`.

---

## Operational Runbook

### Daily & Weekly Tasks
- **Daily**
  - Review error logs (`logs/app.log` or `docker-compose logs app`) for decryption failures, signature mismatches, callback errors.
  - Monitor webhook processing queue; inspect rows in `webhook_events` where `processed = false` or `callback_sent = false`.
  - Confirm Flow endpoint latency stays < 3 seconds (APM or nginx logs).
- **Weekly**
  - Rotate logs and ensure disk space is stable.
  - Validate Meta access token expiration timeline.
  - Run `npm audit` / Docker image scans.
  - Check for stale flow sessions (`status = 'active'` with `last_activity_at` beyond SLA) and use `markExpiredSessions`.
- **Monthly**
  - Re-run `npm run validate-keys` to confirm RSA keys still align with Meta.
  - Test disaster recovery (DB backup/restore).
  - Review rate limit configuration and adjust if traffic patterns change.

### Essential Commands

| Purpose | Command |
| --- | --- |
| Install dependencies | `npm ci` |
| Start dev server (watch mode) | `npm run dev` |
| Build TypeScript | `npm run build` |
| Start compiled server | `npm start` |
| Run database migrations | `npm run migrate` |
| Generate RSA key pair | `npm run generate-keys` |
| Register public key with Meta | `npm run register-key` |
| Validate key alignment | `npm run validate-keys` |
| Lint / format check | `npm run lint` / `npm run format:check` |
| Launch Docker stack | `make docker-up` |
| Run interactive Docker setup | `make docker-init` |
| Tail application logs | `make docker-logs` or `docker-compose logs -f app` |
| Open Postgres shell | `make db-shell` |

### Monitoring & Alerting
- Set alerts on:
  - HTTP 4xx/5xx spikes on `/flows/endpoint` or `/webhooks/whatsapp`.
  - Timeout events logged by `timeoutHandler`.
  - Repeated decryption or signature validation failures (possible key mismatch).
  - Callback retries exceeding `CALLBACK_MAX_RETRIES`.
  - Database connection pool exhaustion.
  - Disk usage for `logs/` and Postgres volumes.
- Recommended telemetry additions:
  - Expose Prometheus metrics for latency, rate limiter hits, callback success rate.
  - Instrument queue length from `webhook_events`.

### Troubleshooting Aids
- Common failure modes (detailed in README and scripts output):
  - **Failed to decrypt AES key** → Regenerate/regenerate keys, ensure `.env` formatting preserves `\n`.
  - **Webhook signature invalid** → Confirm `META_APP_SECRET` matches Meta dashboard, ensure raw body used in validation, verify header presence.
  - **Session not found** → Check Flow identification fallback; ensure ping/INIT order or configure `DEFAULT_FLOW_NAME`.
  - **Callback failures** → Inspect external webhook availability, network ACLs, or payload expectations.
  - **Database connection refused** → Confirm Postgres is reachable, credentials match, container healthy.
- Logs provide contextual metadata (flow token, action, duration) to accelerate debugging.

---

## HTTP Endpoint Summary

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/health` | GET | No | Health check (DB connectivity, uptime, environment). |
| `/docs` | GET | No | Swagger UI. |
| `/docs.json` | GET | No | Swagger spec JSON. |
| `/api/flows` | POST | Bearer token (`API_TOKEN` or `META_ACCESS_TOKEN`) | Create flow (validates Flow JSON). |
| `/api/flows` | GET | Bearer token | List flows (optional status filter). |
| `/api/flows/:id` | GET | Bearer token | Retrieve flow by UUID. |
| `/api/flows/:id` | PUT | Bearer token + admin role (placeholder) | Update flow metadata or Flow JSON. |
| `/api/flows/:id` | DELETE | Bearer token + admin role | Remove flow (cascades to sessions/responses). |
| `/flows/endpoint/:flowName?` | POST | No | WhatsApp Flow Data endpoint; encrypted payload, <3s SLA, path parameter optional (fallbacks apply). |
| `/webhooks/whatsapp` | GET | No | WhatsApp webhook verification (`hub.challenge`). |
| `/webhooks/whatsapp` | POST | `X-Hub-Signature-256` required | Receives WhatsApp events (processes `nfm_reply`). |

Notes:
- `/api/flows` routes currently assume admin access; `authorizeRole(['admin'])` placeholder treats all authenticated users as admin.
- Flow endpoint expects body `{ encrypted_aes_key, encrypted_flow_data, initial_vector }`.
- Webhook endpoint expects payload conforming to WhatsApp webhook schema; raw body captured for signature validation.

---

## Database Schema Snapshot

| Table | Purpose | Key Columns / Constraints |
| --- | --- | --- |
| `flows` | Stores Flow templates and metadata | `id UUID PK`, `name UNIQUE`, `status CHECK ('active','inactive','deprecated')`, `flow_json JSONB`, `updated_at` trigger. |
| `flow_sessions` | Tracks live user sessions | `flow_token UNIQUE`, `status CHECK ('active','completed','expired','error')`, JSONB `session_data`, timestamps, cascades on `flow_id`. |
| `flow_responses` | Persists completed flow results | FK to `flow_sessions` & `flows`, stores `response_data` JSONB and raw webhook payload. |
| `webhook_events` | Audits inbound webhooks and callbacks | Signature validation status, callback delivery metadata, processed flags, timestamps. |

Indexes support high-frequency lookups (`flow_token`, `status`, `received_at`). Ensure `pgcrypto` extension is enabled for `gen_random_uuid()`.

---

## Glossary & References

- **Flow Token**: WhatsApp-issued token that identifies an individual flow interaction; used to rehydrate sessions and correlate webhooks.
- **IV Flip**: Bitwise NOT applied to each byte of AES IV when encrypting responses to WhatsApp (mandatory for compatibility).
- **NFM Reply**: `nfm_reply` interactive WhatsApp webhook when a flow completes; `response_json` is delivered as a string.
- **Callback Webhook**: Customer-owned endpoint receiving normalized flow completion payloads.
- **Semantic Release**: Automates versioning and changelog generation from Conventional Commits.

### Internal References
- Domain logic: `src/domain/`
- Use cases: `src/application/use-cases/`
- HTTP controllers & middlewares: `src/infrastructure/http/express/`
- Encryption: `src/infrastructure/security/EncryptionService.ts`
- Database migrations: `scripts/migrations/`
- Docker workflows: `Dockerfile`, `docker-compose.yml`, `Makefile`, `scripts/docker-init.sh`
- Contribution guidelines: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`

### External References
- WhatsApp Flows API: <https://developers.facebook.com/docs/whatsapp/flows/>
- Flow JSON specification: <https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/>
- Encryption guide: <https://developers.facebook.com/docs/whatsapp/flows/guides/encryption/>
- Webhook signature docs: <https://developers.facebook.com/docs/graph-api/webhooks/getting-started>

---

This index should remain the authoritative summary of project rules. Update it whenever business logic, architecture standards, or operational procedures evolve.
