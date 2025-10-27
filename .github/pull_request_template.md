## 📋 Pull Request

### 🎯 Description

<!-- Provide a clear and concise description of your changes -->



### 🔗 Related Issues

<!-- Link to related issues using keywords: Closes #123, Fixes #456, Relates to #789 -->

- Closes #
- Fixes #
- Relates to #

### 🏷️ Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 **Bug Fix** (non-breaking change which fixes an issue)
- [ ] ✨ **New Feature** (non-breaking change which adds functionality)
- [ ] 💥 **Breaking Change** (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 **Documentation** (changes to documentation only)
- [ ] ♻️ **Refactoring** (code changes that neither fix a bug nor add a feature)
- [ ] ⚡ **Performance** (changes that improve performance)
- [ ] 🧪 **Test** (adding missing tests or correcting existing tests)
- [ ] 🔧 **Chore** (changes to build process, dependencies, or tooling)
- [ ] 🎨 **Style** (changes that do not affect the meaning of the code)

### 🎨 Domain Area

<!-- Mark all relevant areas -->

- [ ] 🔐 Security & Encryption
- [ ] 📊 Database & Migrations
- [ ] 🌐 API & Endpoints
- [ ] 📱 WhatsApp Flows
- [ ] 🐳 Docker & Deployment
- [ ] 🔄 CI/CD
- [ ] 📝 Documentation
- [ ] 🧪 Testing
- [ ] ⚙️ Configuration
- [ ] 📋 Logging
- [ ] Other: _____

---

## 🧪 Testing

### How Has This Been Tested?

<!-- Describe the tests you ran to verify your changes -->

- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Manual Testing
- [ ] E2E Tests

**Test Configuration:**
<!-- Describe your test environment -->

- **Node.js version:** 
- **PostgreSQL version:** 
- **Docker version:** 
- **OS:** 

### Test Evidence

<!-- Provide evidence of testing (logs, screenshots, test results) -->

```bash
# Paste test output here
```

---

## 📸 Screenshots/Videos (if applicable)

<!-- Add screenshots or videos to help explain your changes -->

| Before | After |
|--------|-------|
| -      | -     |

---

## ✅ Checklist

### Code Quality

- [ ] My code follows the project's style guidelines (ESLint + Prettier)
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have used meaningful variable and function names
- [ ] I have removed commented-out code and console.logs

### Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested edge cases and error scenarios

### Documentation

- [ ] I have made corresponding changes to the documentation
- [ ] I have updated JSDoc comments for new/modified functions
- [ ] I have updated the README.md (if needed)
- [ ] I have updated CLAUDE.md (if architecture changed)

### Architecture & Best Practices

- [ ] My changes follow DDD (Domain-Driven Design) architecture
- [ ] I have maintained separation of concerns (Domain/Application/Infrastructure)
- [ ] I have used dependency injection where appropriate
- [ ] I have handled errors properly with meaningful messages

### Security

- [ ] My code does not introduce security vulnerabilities
- [ ] I have not committed sensitive data (keys, tokens, passwords)
- [ ] I have validated and sanitized user inputs
- [ ] I have followed secure coding practices

### Database

- [ ] I have created migrations for database changes
- [ ] Migrations are reversible (have both up and down)
- [ ] I have tested migrations on a clean database

### Dependencies

- [ ] I have minimized new dependencies
- [ ] New dependencies are necessary and well-maintained
- [ ] I have updated package.json and package-lock.json
- [ ] I have checked for security vulnerabilities (`npm audit`)

### Commits

- [ ] My commits follow [Conventional Commits](https://www.conventionalcommits.org/) format
- [ ] Each commit has a clear, descriptive message
- [ ] Commits are atomic (one logical change per commit)

### CI/CD

- [ ] All CI checks pass
- [ ] No TypeScript compilation errors
- [ ] Linting passes
- [ ] Build succeeds

---

## 💥 Breaking Changes

<!-- If this PR introduces breaking changes, describe them here -->

**Does this PR introduce breaking changes?**
- [ ] Yes
- [ ] No

**If yes, describe:**

- **What breaks:**
- **Why it's necessary:**
- **Migration path:**
- **Affected users:**

---

## 📝 Additional Notes

<!-- Any additional information, context, or concerns -->



---

## 🙋 Contributor Checklist

- [ ] I have read the [CONTRIBUTING.md](https://github.com/guilhermejansen/whatsapp-flows-server/blob/main/CONTRIBUTING.md) guide
- [ ] I am willing to address review feedback
- [ ] I understand this PR will be reviewed before merging
- [ ] I have signed off my commits (if required)

---

## 📋 Reviewer Checklist

<!-- For maintainers reviewing this PR -->

- [ ] Code quality and style are acceptable
- [ ] Tests are comprehensive and pass
- [ ] Documentation is updated
- [ ] No security concerns
- [ ] CI/CD passes
- [ ] Breaking changes are acceptable and documented
- [ ] Commits follow conventions
- [ ] Architecture aligns with DDD principles

---

**Thank you for contributing to WhatsApp Flows Server! 🎉**

<!-- 
Semantic Release will automatically generate version numbers and changelogs based on commit messages.

Commit message format:
- feat: new feature (triggers minor version bump)
- fix: bug fix (triggers patch version bump)
- feat!: or BREAKING CHANGE: (triggers major version bump)
- docs: documentation only
- chore: maintenance tasks
-->
