# Contributing to WhatsApp Flow Server

First off, thank you for considering contributing to WhatsApp Flow Server! It's people like you that make this project a great tool for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to guilherme@setupautomatizado.com.br.

### Our Standards

**Examples of behavior that contributes to creating a positive environment include:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior include:**

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** after following the steps
- **Explain which behavior you expected to see instead** and why
- **Include logs and error messages**
- **Include your environment details** (Node.js version, OS, Docker version, etc.)

**Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots/Logs**
If applicable, add screenshots or logs to help explain your problem.

**Environment:**
 - OS: [e.g., Ubuntu 22.04]
 - Node.js: [e.g., 20.10.0]
 - Docker: [e.g., 24.0.7]
 - Version: [e.g., 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the steps
- **Describe the current behavior** and **explain the expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin? You can start by looking through these beginner-friendly issues:

- **Good first issue** - issues which should only require a few lines of code
- **Help wanted** - issues which should be a bit more involved than beginner issues

### Pull Requests

1. Follow the [Development Setup](#development-setup) guide
2. Create a branch from `main`
3. Make your changes following our [Coding Standards](#coding-standards)
4. Write or update tests as needed
5. Update documentation as needed
6. Follow the [Commit Message Guidelines](#commit-message-guidelines)
7. Push to your fork and submit a pull request

---

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- Docker & Docker Compose
- PostgreSQL 18 (if not using Docker)
- Git

### Initial Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/whatsapp-flows-server.git
cd whatsapp-flows-server

# 3. Add upstream remote
git remote add upstream https://github.com/guilhermejansen/whatsapp-flows-server.git

# 4. Install dependencies
npm install

# 5. Setup Husky (git hooks)
npm run prepare

# 6. Copy environment file
cp .env.example .env
nano .env  # Configure with your test credentials

# 7. Start PostgreSQL (Docker)
docker-compose up -d postgres

# 8. Run migrations
npm run migrate

# 9. Generate test keys
npm run generate-keys
# Copy to .env

# 10. Start development server
npm run dev
```

### Running Tests

```bash
# Lint
npm run lint

# Format check
npm run format:check

# TypeScript check
npx tsc --noEmit

# Build
npm run build
```

### Docker Development

```bash
# Build image
docker build -t whatsapp-flow-dev .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Shell access
docker-compose exec app sh
```

---

## Coding Standards

### TypeScript

- Use **TypeScript strict mode**
- Prefer **interfaces** over types for object shapes
- Use **type annotations** explicitly for function parameters and returns
- Avoid **any** type; use **unknown** if type is truly unknown
- Use **const** by default; **let** when reassignment is needed

### Code Style

- **ESLint** configuration must pass
- **Prettier** formatting must be followed
- **2 spaces** for indentation (enforced by Prettier)
- **Single quotes** for strings (enforced by Prettier)
- **Semicolons** required (enforced by Prettier)

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint
npm run lint
```

### Naming Conventions

- **Classes**: PascalCase (`FlowEngine`, `FlowSession`)
- **Interfaces**: PascalCase with I prefix (`IFlowRepository`)
- **Functions/Methods**: camelCase (`processFlowRequest`)
- **Variables**: camelCase (`flowToken`, `sessionData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Files**: kebab-case (`flow-engine.ts`, `handle-flow-request.ts`)

### Project Structure

Follow **Domain-Driven Design (DDD)** architecture:

```
src/
├── domain/              # Business entities and rules
│   ├── flows/           # Flow domain
│   ├── encryption/      # Encryption domain
│   └── webhooks/        # Webhook domain
├── application/         # Use cases (business logic)
│   ├── dtos/            # Data Transfer Objects
│   └── use-cases/       # Application use cases
├── infrastructure/      # External implementations
│   ├── database/        # Database repositories
│   ├── http/            # HTTP server & routes
│   └── security/        # Security implementations
└── shared/              # Common utilities
```

### Documentation

- Add **JSDoc comments** for public APIs
- Update **README.md** for new features
- Create/update **tests** for new functionality
- Add **examples** when appropriate

```typescript
/**
 * Processes a Flow request with encryption handling
 * @param request - Encrypted Flow request from WhatsApp
 * @returns Encrypted Flow response
 * @throws EncryptionError if decryption fails
 */
async function processFlowRequest(request: FlowRequest): Promise<FlowResponse> {
  // Implementation
}
```

---

## Commit Message Guidelines

We follow **Conventional Commits** specification for commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semi colons, etc)
- **refactor**: Code refactoring (neither fixes bug nor adds feature)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Other changes (dependencies, config, etc)
- **revert**: Revert previous commit

### Scope

Optional, but recommended. Examples:
- `feat(encryption)`: Feature in encryption module
- `fix(webhook)`: Bug fix in webhook handling
- `docs(readme)`: README documentation update

### Subject

- Use **imperative mood** ("add feature" not "added feature")
- Don't capitalize first letter
- No period at the end
- Limit to **50 characters**

### Body

- Explain **what** and **why** (not how)
- Wrap at **72 characters**
- Separate from subject with blank line

### Footer

- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

```bash
# Feature
git commit -m "feat(flows): add support for multiple flow templates

Implements multi-flow support allowing users to manage
multiple Flow templates simultaneously.

Closes #42"

# Bug fix
git commit -m "fix(encryption): resolve IV flip issue

Correctly reverses IV buffer for WhatsApp encryption
as per API requirements."

# Breaking change
git commit -m "feat(database)!: migrate to PostgreSQL 18

BREAKING CHANGE: Database volume path changed from
/var/lib/postgresql/data to /var/lib/postgresql.
Migration required for existing deployments."

# Documentation
git commit -m "docs: update deployment guide with SSL instructions"

# Chore
git commit -m "chore(deps): update dependencies to latest versions"
```

### Using Commitizen (Helper)

```bash
# Interactive commit
npm run commit

# Follow prompts to create properly formatted commit
```

---

## Pull Request Process

### Before Submitting

1. **Test your changes** thoroughly
   ```bash
   npm run lint
   npm run format:check
   npx tsc --noEmit
   npm run build
   ```

2. **Update documentation**
   - README.md if adding features
   - JSDoc comments for new functions
   - CHANGELOG.md (handled automatically by semantic-release)

3. **Add tests** if applicable
   - Unit tests for business logic
   - Integration tests for APIs

4. **Ensure CI passes**
   - All checks must be green

### PR Title

Follow Conventional Commits format:
```
feat(flows): add multi-template support
fix(webhook): resolve signature validation
docs: update installation guide
```

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] Any dependent changes have been merged

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least one maintainer approval required
3. **Testing**: Changes tested in development environment
4. **Documentation**: All docs updated appropriately

### After Approval

- **Squash commits** if requested
- **Rebase** on latest main if needed
- Maintainer will **merge** when ready
- Semantic release will handle versioning

---

## Community

### Get Help

- 💬 **Discussions**: [GitHub Discussions](https://github.com/guilhermejansen/whatsapp-flows-server/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/guilhermejansen/whatsapp-flows-server/issues)
- 📧 **Email**: guilherme@setupautomatizado.com.br

### Stay Updated

- ⭐ **Star** the repository
- 👁️ **Watch** for releases
- 📢 Follow [@guilhermejansen](https://github.com/guilhermejansen)

### Recognition

Contributors are recognized in:
- Release notes
- CONTRIBUTORS.md file
- Project README

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

**Thank you for contributing to WhatsApp Flow Server! 🎉**

**Questions?** Feel free to open a discussion or contact the maintainers.
