# WhatsApp Flows Server

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Arch-2496ED?logo=docker)](https://hub.docker.com/r/setupautomatizado/whatsapp-flows-server)
[![GitHub Actions](https://github.com/guilhermejansen/whatsapp-flows-server/workflows/CI/badge.svg)](https://github.com/guilhermejansen/whatsapp-flows-server/actions)
[![Semantic Release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

**Production-ready Node.js server for WhatsApp Flows with automated CI/CD, multi-arch Docker support, and DDD architecture**

[Features](#-features) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Architecture](#-architecture) •
[Contributing](#-contributing)

</div>

---

## 📖 Overview

WhatsApp Flow Server is a **robust, production-ready TypeScript server** that implements the [WhatsApp Flows API](https://developers.facebook.com/docs/whatsapp/flows/) using **Domain-Driven Design (DDD)** principles. It provides a complete solution for handling WhatsApp Flow interactions with built-in encryption, webhook processing, and comprehensive CI/CD automation.

### 🎯 What Problem Does It Solve?

WhatsApp Flows enable rich, interactive experiences within WhatsApp, but implementing them requires:

- **Complex encryption** (RSA-2048 + AES-128-GCM with mandatory IV flip)
- **Dual endpoint architecture** (Flow Data API + Webhooks)
- **Strict performance requirements** (<3s response time)
- **Secure key management** and Meta API integration
- **Production-ready infrastructure** with monitoring and scaling

This server **solves all these challenges** with:
- ✅ Pre-configured encryption with IV flip pattern
- ✅ Dual endpoint architecture out-of-the-box
- ✅ Automatic database migrations
- ✅ Multi-architecture Docker support (AMD64 + ARM64)
- ✅ Complete CI/CD pipeline with semantic versioning
- ✅ Production-ready with health checks and logging

---

## ✨ Features

### Core Capabilities

- 🏗️ **Domain-Driven Design** - Clean architecture with separated layers (Domain, Application, Infrastructure)
- 🔐 **WhatsApp Flow Encryption** - Complete RSA-2048 + AES-128-GCM implementation with mandatory IV flip
- 🔄 **Dual Endpoint System** - Flow Data API + Webhook receiver with signature validation
- 📊 **PostgreSQL Storage** - Persistent storage for Flows, Sessions, and Responses
- ✅ **Schema Validation** - Type-safe with Zod v4
- 📝 **Structured Logging** - Winston with rotation and multiple transports

### DevOps & Deployment

- 🐳 **Multi-Arch Docker** - Native support for AMD64 (Intel/AMD) and ARM64 (Apple Silicon, AWS Graviton)
- 🚀 **Automated CI/CD** - GitHub Actions with semantic release and Docker Hub publishing
- 📦 **Conventional Commits** - Automated versioning and changelog generation
- 🔄 **Auto Migrations** - Database migrations run automatically on container startup
- 💪 **Production Ready** - Health checks, monitoring, and graceful shutdown

### Developer Experience

- 🛠️ **TypeScript 5.9** - Full type safety with strict mode
- 🎨 **Modern Stack** - Express 5.x, PostgreSQL 18, Node.js 20+
- 🔧 **Developer Tools** - ESLint, Prettier, Husky, Commitlint
- 📖 **Comprehensive Docs** - Complete guides for setup, deployment, and troubleshooting
- 🧪 **Testing Ready** - Structure prepared for unit and integration tests

---

## 🏛️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WhatsApp Platform                         │
└────────────┬──────────────────────────────────────┬─────────────┘
             │                                      │
             │ Encrypted Flow Data                  │ Webhook Events
             │ (RSA-2048 + AES-128-GCM)            │ (nfm_reply)
             ▼                                      ▼
┌─────────────────────────────┐      ┌──────────────────────────┐
│   Flow Endpoint (Data API)  │      │   Webhook Endpoint       │
│   POST /flows/endpoint/:id  │      │   POST /webhooks/whatsapp│
│                             │      │                          │
│   - Decrypt request         │      │   - Validate signature   │
│   - Process action          │      │   - Parse response_json  │
│   - Return encrypted data   │      │   - Forward to callback  │
│   - < 3s response time      │      │   - Store in database    │
└──────────────┬──────────────┘      └──────────┬───────────────┘
               │                                │
               │                                │
               ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Application Layer                        │
│                                                                  │
│  ┌──────────────────────┐        ┌─────────────────────────┐   │
│  │ HandleFlowRequest    │        │ ProcessWebhook          │   │
│  │ UseCase              │        │ UseCase                 │   │
│  └──────────┬───────────┘        └───────────┬─────────────┘   │
│             │                                 │                 │
│             ▼                                 ▼                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Domain Layer (Business Logic)              │   │
│  │                                                          │   │
│  │  • FlowEngine - Navigation and data exchange           │   │
│  │  • Flow - Immutable Flow templates                     │   │
│  │  • FlowSession - User session tracking                 │   │
│  │  • FlowResponse - Completed Flow data                  │   │
│  │  • EncryptionService - RSA/AES with IV flip            │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                          │
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │   PostgreSQL     │  │   Express HTTP  │  │   Axios HTTP  │  │
│  │   Repositories   │  │   Server        │  │   Client      │  │
│  └──────────────────┘  └─────────────────┘  └───────────────┘  │
│                                                                  │
│  Database Tables:                                               │
│  • flows - Flow JSON templates                                 │
│  • flow_sessions - Active/completed sessions                   │
│  • flow_responses - Completed Flow data                        │
│  • webhook_events - Webhook audit trail                        │
└─────────────────────────────────────────────────────────────────┘
```

### Flow Interaction Sequence

```
User                WhatsApp          Flow Server         Database        Your System
  │                    │                    │                 │                │
  │ Click Flow Button  │                    │                 │                │
  ├───────────────────>│                    │                 │                │
  │                    │                    │                 │                │
  │                    │ POST /flows/endpoint (INIT)          │                │
  │                    ├───────────────────>│                 │                │
  │                    │                    │ Create Session  │                │
  │                    │                    ├────────────────>│                │
  │                    │                    │ Return INIT     │                │
  │                    │<───────────────────┤                 │                │
  │                    │                    │                 │                │
  │  Display Screen 1  │                    │                 │                │
  │<───────────────────┤                    │                 │                │
  │                    │                    │                 │                │
  │ Fill & Submit      │                    │                 │                │
  ├───────────────────>│                    │                 │                │
  │                    │ POST /flows/endpoint (data_exchange) │                │
  │                    ├───────────────────>│                 │                │
  │                    │                    │ Update Session  │                │
  │                    │                    ├────────────────>│                │
  │                    │                    │ Return Screen 2 │                │
  │                    │<───────────────────┤                 │                │
  │                    │                    │                 │                │
  │  Display Screen 2  │                    │                 │                │
  │<───────────────────┤                    │                 │                │
  │                    │                    │                 │                │
  │ Complete Flow      │                    │                 │                │
  ├───────────────────>│                    │                 │                │
  │                    │ POST /flows/endpoint (complete)      │                │
  │                    ├───────────────────>│                 │                │
  │                    │                    │ Mark Complete   │                │
  │                    │                    ├────────────────>│                │
  │                    │                    │                 │                │
  │                    │ POST /webhooks/whatsapp (nfm_reply)  │                │
  │                    ├───────────────────>│                 │                │
  │                    │                    │ Store Response  │                │
  │                    │                    ├────────────────>│                │
  │                    │                    │ Forward Data    │                │
  │                    │                    ├────────────────────────────────>│
  │                    │                    │                 │                │
  │  "Thank you!"      │                    │                 │                │
  │<───────────────────┤                    │                 │                │
```

### Encryption Flow (IV Flip Pattern)

```
WhatsApp Request                    Server Response
     │                                    │
     │  Encrypted with:                  │  Encrypted with:
     │  • AES key encrypted by RSA       │  • FLIPPED IV ⚠️
     │  • Normal IV                      │  • Same AES key
     │                                   │
     ▼                                   ▼
┌────────────────┐              ┌────────────────┐
│ Decrypt AES Key│              │ Flip IV Buffer │
│ with RSA       │              │ (reverse bytes)│
└───────┬────────┘              └────────┬───────┘
        │                                │
        ▼                                ▼
┌────────────────┐              ┌────────────────┐
│ Decrypt Payload│              │ Encrypt Payload│
│ with AES       │              │ with AES       │
│ (normal IV)    │              │ (flipped IV)   │
└───────┬────────┘              └────────┬───────┘
        │                                │
        ▼                                ▼
   Flow Data                      Encrypted Response
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **Docker** & Docker Compose (recommended) or **PostgreSQL** 18+
- **WhatsApp Business Account** with Flows enabled
- **Meta Developer Account** for API credentials

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/guilhermejansen/whatsapp-flows-server.git
cd whatsapp-flows-server

# 2. Configure environment
cp .env.docker.example .env
nano .env  # Edit with your credentials

# 3. Start services
docker-compose up -d

# 4. Generate encryption keys
docker-compose exec app npm run generate-keys
# Copy output to .env

# 5. Restart application
docker-compose restart app

# 6. Register public key with Meta
docker-compose exec app npm run register-key

# 7. Verify health
curl http://localhost:3000/health
```

**Your server is now running!** 🎉

Configure WhatsApp Manager:
- **Flow Endpoint**: `https://your-domain.com/flows/endpoint/csat-feedback`
- **Webhook URL**: `https://your-domain.com/webhooks/whatsapp`

### Option 2: Local Development

```bash
# 1. Clone and install
git clone https://github.com/guilhermejansen/whatsapp-flows-server.git
cd whatsapp-flows-server
npm install

# 2. Setup PostgreSQL
createdb whatsapp_flows
npm run migrate

# 3. Generate keys
npm run generate-keys
# Copy output to .env

# 4. Configure environment
cp .env.example .env
nano .env  # Edit with your credentials

# 5. Register public key
npm run register-key

# 6. Start development server
npm run dev
```

---

## 📦 Docker Deployment

### Multi-Architecture Support

Pre-built images available for **AMD64** (Intel/AMD) and **ARM64** (Apple Silicon, AWS Graviton):

```bash
# Pull latest version
docker pull setupautomatizado/whatsapp-flows-server:latest

# Or specific version
docker pull setupautomatizado/whatsapp-flows-server:1.0.0
```

### Production Deployment

#### 1. Server Setup

```bash
# Create directory
mkdir -p ~/whatsapp-flows-server-production
cd ~/whatsapp-flows-server-production

# Download compose file
curl -O https://raw.githubusercontent.com/guilhermejansen/whatsapp-flows-server/main/docker-compose.yml

# Configure environment
curl -O https://raw.githubusercontent.com/guilhermejansen/whatsapp-flows-server/main/.env.docker.example
cp .env.docker.example .env
nano .env
```

#### 2. SSL Setup (Nginx + Let's Encrypt)

```bash
# Install Nginx + Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/whatsapp-flows-server
```

**Nginx Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WhatsApp requires < 3s response
        proxy_connect_timeout 2s;
        proxy_send_timeout 2s;
        proxy_read_timeout 2s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whatsapp-flows-server /etc/nginx/sites-enabled/
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Restart Nginx
sudo systemctl restart nginx
```

#### 3. Start Application

```bash
# Start services
docker-compose up -d

# Generate keys
docker-compose exec app npm run generate-keys
# Add keys to .env

# Restart
docker-compose restart app

# Register public key
docker-compose exec app npm run register-key

# Verify
curl https://your-domain.com/health
```

### Available Commands

```bash
# View logs
docker-compose logs -f app

# Shell access
docker-compose exec app sh

# Database access
docker-compose exec postgres psql -U whatsapp_flow -d whatsapp_flows

# Run migrations manually
docker-compose exec app npm run migrate

# Backup database
docker-compose exec postgres pg_dump -U whatsapp_flow whatsapp_flows > backup.sql

# Stop services
docker-compose down
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | ✅ | `production` |
| `PORT` | Server port | ✅ | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://user:pass@localhost:5432/db` |
| `PRIVATE_KEY` | RSA private key (PEM format) | ✅ | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `PUBLIC_KEY` | RSA public key (PEM format) | ✅ | `-----BEGIN PUBLIC KEY-----\n...` |
| `META_APP_SECRET` | Meta app secret | ✅ | `your_app_secret` |
| `META_VERIFY_TOKEN` | Webhook verify token | ✅ | `your_verify_token` |
| `META_ACCESS_TOKEN` | WhatsApp API access token | ✅ | `EAAB...` |
| `CALLBACK_WEBHOOK_URL` | Your callback URL for completed flows | ✅ | `https://yourapi.com/webhook` |
| `DEFAULT_FLOW_NAME` | Default flow when not specified | ⚠️ | `csat-feedback` |
| `FLOW_ENDPOINT_TIMEOUT` | Max response time (< 3000ms) | ⚠️ | `2500` |
| `CORS_ORIGINS` | Allowed CORS origins | ⚠️ | `https://app.com` |
| `API_TOKEN` | API authentication token | ⚠️ | Generated with `openssl rand -hex 32` |

**Legend:** ✅ Required | ⚠️ Recommended

### Key Generation

```bash
# Generate RSA-2048 key pair
npm run generate-keys

# Validate keys
npm run validate-keys

# Register public key with Meta
npm run register-key
```

---

## 🔐 Security

### Encryption Implementation

This server implements WhatsApp's **mandatory IV flip pattern** for encryption:

```typescript
// Decryption (incoming from WhatsApp) - Normal IV
const iv = Buffer.from(initialVector, 'base64');
const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, iv);

// Encryption (outgoing to WhatsApp) - FLIPPED IV ⚠️
const iv = Buffer.from(initialVector, 'base64');
const flippedIV = Buffer.from(iv).reverse(); // Must reverse!
const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, flippedIV);
```

**Critical:** If IV is not flipped, WhatsApp returns error 421.

### Security Best Practices

- ✅ **Never commit** private keys to Git
- ✅ **Use environment variables** for all secrets
- ✅ **Rotate tokens** every 3-6 months
- ✅ **Enable HTTPS** in production (required by WhatsApp)
- ✅ **Validate webhooks** with X-Hub-Signature-256
- ✅ **Run as non-root** user in Docker
- ✅ **Keep dependencies** updated via Dependabot

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

---

## 🛣️ API Reference

### Flow Endpoint (Data API)

**Endpoint:** `POST /flows/endpoint/:flowName`

Handles encrypted interactions during Flow execution.

**Actions:**
- `ping` - Health check
- `INIT` - Initialize Flow session
- `data_exchange` - Process user input and navigate
- `navigate` - Explicit screen navigation
- `complete` - Mark Flow as completed

**Headers:**
```
Content-Type: application/json
```

**Example Request (INIT):**
```json
{
  "version": "3.0",
  "action": "INIT",
  "flow_token": "unique_token_123",
  "encrypted_flow_data": "...",
  "encrypted_aes_key": "...",
  "initial_vector": "..."
}
```

**Response:** Encrypted Flow data with next screen

### Webhook Endpoint

**Endpoint:** `POST /webhooks/whatsapp`

Receives `nfm_reply` events when user completes Flow.

**Headers:**
```
Content-Type: application/json
X-Hub-Signature-256: sha256=...
```

**Example Payload:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "type": "interactive",
          "interactive": {
            "type": "nfm_reply",
            "nfm_reply": {
              "response_json": "{\"flow_token\":\"...\",\"data\":...}",
              "name": "flow_name"
            }
          }
        }]
      }
    }]
  }]
}
```

**Important:** `response_json` is a **string**, must be parsed with `JSON.parse()`.

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "database": "connected"
}
```

### Swagger Documentation

Interactive API docs available at `/docs` when server is running.

---

## 📚 Documentation

### Official WhatsApp Flows Resources

- [WhatsApp Flows Overview](https://developers.facebook.com/docs/whatsapp/flows/)
- [Flow Endpoint Implementation](https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint/)
- [Receiving Flow Response](https://developers.facebook.com/docs/whatsapp/flows/guides/receiveflowresponse/)
- [Flow JSON Reference](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/)
- [Encryption Guide](https://developers.facebook.com/docs/whatsapp/flows/guides/encryption/)

---

## 🧪 Development

### Project Structure

```
whatsapp-flow/
├── src/
│   ├── domain/              # Business entities and rules
│   │   ├── flows/           # Flow, FlowSession entities
│   │   ├── encryption/      # Encryption services
│   │   └── webhooks/        # Webhook events
│   ├── application/         # Use cases (business logic)
│   │   ├── dtos/            # Data Transfer Objects
│   │   └── use-cases/       # HandleFlowRequest, ProcessWebhook
│   ├── infrastructure/      # External implementations
│   │   ├── database/        # PostgreSQL repositories
│   │   ├── http/            # Express server & routes
│   │   └── security/        # Encryption implementation
│   ├── shared/              # Common utilities
│   └── main.ts              # Application entry point
├── scripts/                 # Utility scripts
│   ├── migrations/          # SQL migration files
│   ├── generate-keys.ts     # RSA key generator
│   └── seed-*.ts            # Database seeders
├── .github/                 # CI/CD workflows
├── docker-compose.yml       # Docker orchestration
├── Dockerfile              # Multi-arch container
└── tsconfig.json           # TypeScript configuration
```

### Available Scripts

```bash
# Development
npm run dev              # Start with watch mode
npm run build            # Build TypeScript
npm start                # Start production server

# Database
npm run migrate          # Run migrations

# Encryption
npm run generate-keys    # Generate RSA keys
npm run validate-keys    # Validate configuration
npm run register-key     # Register public key with Meta

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Git
npm run commit           # Interactive commit helper (Conventional Commits)
```

### Database Migrations

Migrations run **automatically** on container startup. To run manually:

```bash
# Local
npm run migrate

# Docker
docker-compose exec app npm run migrate
```

### Adding New Flows

**Method 1: Via API**
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-flow",
    "version": "7.2",
    "flow_json": {"version":"7.2","screens":[...]},
    "description": "My custom flow"
  }'
```

Configure in WhatsApp Manager:
```
https://your-domain.com/flows/endpoint/my-flow
```

---

## 🚀 CI/CD Pipeline

### Automated Workflows

This project includes **complete CI/CD automation**:

#### Continuous Integration (on every push/PR)
- ✅ ESLint validation
- ✅ Prettier format check
- ✅ TypeScript compilation check
- ✅ Application build test
- ✅ Security audit (npm audit)

#### Semantic Release (on merge to main)
- ✅ Analyze commits (Conventional Commits)
- ✅ Calculate next version (major/minor/patch)
- ✅ Generate CHANGELOG.md
- ✅ Create GitHub Release
- ✅ Build multi-arch Docker image (AMD64 + ARM64)
- ✅ Publish to Docker Hub with semantic tags

### Conventional Commits

```bash
# Patch version (1.0.0 → 1.0.1)
git commit -m "fix: resolve webhook signature validation"

# Minor version (1.0.0 → 1.1.0)
git commit -m "feat: add support for multiple flows"

# Major version (1.0.0 → 2.0.0)
git commit -m "feat!: migrate to PostgreSQL 18

BREAKING CHANGE: Database volume path changed"

# No release
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

### GitHub Secrets Required

For automated Docker publishing:

```
DOCKER_USERNAME = your_dockerhub_username
DOCKER_TOKEN = your_dockerhub_token
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/whatsapp-flow.git`
3. **Create** a branch: `git checkout -b feat/amazing-feature`
4. **Install** dependencies: `npm install`
5. **Make** your changes
6. **Test** thoroughly
7. **Commit** using Conventional Commits: `git commit -m "feat: add amazing feature"`
8. **Push** to your fork: `git push origin feat/amazing-feature`
9. **Open** a Pull Request

### Code Standards

- ✅ Follow **TypeScript strict mode**
- ✅ Use **Conventional Commits** format
- ✅ Pass **all CI checks** (lint, format, typecheck, build)
- ✅ Add **tests** for new features
- ✅ Update **documentation** as needed
- ✅ Follow **DDD architecture** patterns

### Pull Request Process

1. Ensure CI passes (lint, format, typecheck, build)
2. Update README.md if adding features
3. Request review from maintainers
4. Address review comments
5. Squash commits before merge (if requested)

---

## 📊 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Runtime** | Node.js | ≥ 20.0.0 |
| **Language** | TypeScript | 5.9 |
| **Framework** | Express | 5.x |
| **Database** | PostgreSQL | 18 |
| **Encryption** | Node RSA + Crypto | Native |
| **Validation** | Zod | 4.x |
| **Logging** | Winston | 3.x |
| **Container** | Docker | Multi-arch |
| **CI/CD** | GitHub Actions | Latest |
| **Versioning** | Semantic Release | 23.x |

---

## 📈 Performance

- ⚡ **Response Time**: < 3s (WhatsApp requirement)
- ⚡ **Default Timeout**: 2.5s (configurable)
- 📦 **Docker Image**: ~150MB (multi-stage build)
- 🔄 **Startup Time**: ~5-10s (includes migrations)
- 💾 **Memory Usage**: ~50-100MB (base)

---

## 🐛 Troubleshooting

### Common Issues

**1. "Failed to decrypt AES key"**

```bash
# Regenerate keys
npm run generate-keys

# Test encryption
npm run test-encryption

# Verify .env has correct format (with \n)
```

**2. "Webhook signature validation failed"**

```bash
# Verify META_APP_SECRET matches Meta dashboard
# Check webhook payload is valid JSON
# Ensure X-Hub-Signature-256 header is present
```

**3. "Database connection refused"**

```bash
# Check PostgreSQL is running
docker-compose ps

# Verify DATABASE_URL in .env
# Check network connectivity
```

**4. "Migrations failed"**

```bash
# Run manually with logs
docker-compose exec app npm run migrate

# Check database permissions
# Verify SQL syntax in migration files
```

**5. "WhatsApp error 421"**

```bash
# Verify IV flip is implemented
# Check encryption format (RSA-2048 + AES-128-GCM)
# Ensure public key is registered with Meta
npm run register-key
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

**TL;DR:** You can use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software. Just include the original copyright notice.

---

## 👥 Authors & Contributors

**Guilherme Jansen** - *Initial work & Maintainer*
- Website: [setupautomatizado.com.br](https://setupautomatizado.com.br)
- GitHub: [@guilhermejansen](https://github.com/guilhermejansen)
- Email: guilherme@setupautomatizado.com.br

### Contributors Wall

<a href="https://github.com/guilhermejansen/whatsapp-flows-server/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=guilhermejansen/whatsapp-flows-server" alt="List of contributors" />
</a>

Want to join the board? Check the [contributing guide](./CONTRIBUTING.md) and open your first PR!

### Special Thanks

- Meta/WhatsApp team for the Flows API
- DDD community for architectural patterns
- Open source contributors

---

## 🌟 Star History

If this project helped you, please consider giving it a ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=guilhermejansen/whatsapp-flows-server&type=Date)](https://star-history.com/#guilhermejansen/whatsapp-flows-server&Date)

---

## 📞 Support

### Community Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/guilhermejansen/whatsapp-flows-server/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/guilhermejansen/whatsapp-flows-server/discussions)
- 📖 **Documentation**: Check docs in repository
- 💬 **Questions**: Open a discussion

### Professional Support

For enterprise support, custom integrations, or consulting:
- 📧 Email: guilherme@setupautomatizado.com.br
- 🌐 Website: [setupautomatizado.com.br](https://setupautomatizado.com.br)

---

## 🗺️ Roadmap

- [ ] Unit and integration tests
- [ ] GraphQL API option
- [ ] Admin dashboard (Flow management UI)
- [ ] Multi-tenancy support
- [ ] Flow analytics and metrics
- [ ] Flow template marketplace
- [ ] Kubernetes deployment guides
- [ ] Horizontal scaling documentation
- [ ] Rate limiting per Flow
- [ ] Webhook retry mechanism

---

<div align="center">

**Made with ❤️ by [Guilherme Jansen](https://setupautomatizado.com.br)**

**[⬆ Back to Top](#whatsapp-flows-server)**

</div>
