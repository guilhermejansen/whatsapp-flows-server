# Support & Help

Welcome to WhatsApp Flows Server support! We're here to help you succeed.

## 📚 Documentation

Before asking for help, please check our comprehensive documentation:

### Core Documentation
- **[README](../README.md)** - Complete project overview, quick start, and deployment guides
- **[CLAUDE.md](../CLAUDE.md)** - Architecture details and DDD patterns
- **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** - Common issues and solutions
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Development setup and contribution guide
- **[SECURITY.md](../SECURITY.md)** - Security policy and best practices

### External Resources
- [WhatsApp Flows Documentation](https://developers.facebook.com/docs/whatsapp/flows/)
- [Flow Endpoint Implementation Guide](https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint/)
- [WhatsApp Flows Encryption](https://developers.facebook.com/docs/whatsapp/flows/guides/encryption/)

---

## 💬 Getting Help

### 1. GitHub Discussions (Recommended)

For **general questions**, **ideas**, and **community discussions**:

👉 **[Open a Discussion](https://github.com/guilhermejansen/whatsapp-flows-server/discussions)**

**Categories:**
- 💡 **Ideas** - Feature suggestions and improvements
- 🙏 **Q&A** - General questions about the project
- 🎉 **Show and Tell** - Share your implementations
- 📣 **Announcements** - Project updates and news

---

### 2. GitHub Issues

For **bug reports** and **specific problems**:

👉 **[Create an Issue](https://github.com/guilhermejansen/whatsapp-flows-server/issues/new/choose)**

**Before creating an issue:**
- [ ] Search existing issues to avoid duplicates
- [ ] Read the [Troubleshooting Guide](../TROUBLESHOOTING.md)
- [ ] Prepare relevant logs and error messages
- [ ] Include environment details (Node.js, Docker, OS versions)

**Issue Types:**
- 🐛 **Bug Report** - Something isn't working
- ✨ **Feature Request** - Suggest a new feature
- 📚 **Documentation** - Docs issues or improvements
- ❓ **Question** - Ask a specific question

---

### 3. Email Support

For **private inquiries** or **commercial support**:

📧 **guilherme@setupautomatizado.com.br**

**Use email for:**
- Private/sensitive issues
- Commercial support inquiries
- Partnership opportunities
- Custom development requests

**Response time:** Usually within 24-48 hours (business days)

---

### 4. Professional Support

Need **expert help** with deployment, customization, or integration?

🌐 **[Setup Automatizado](https://setupautomatizado.com.br)**

**Services:**
- ⚙️ Custom WhatsApp Flows development
- 🚀 Production deployment assistance
- 🔐 Security audits and hardening
- 📊 Performance optimization
- 🎓 Training and consulting
- 🛠️ Priority support

---

## 🔒 Security Issues

**DO NOT** report security vulnerabilities through public issues!

For **security vulnerabilities**, please:

1. **Email privately:** guilherme@setupautomatizado.com.br
2. **Use GitHub Security Advisories:** [Report a vulnerability](https://github.com/guilhermejansen/whatsapp-flows-server/security/advisories/new)

See our [Security Policy](../SECURITY.md) for details.

---

## 🐛 Common Issues

Before asking for help, check if your issue is covered here:

### Encryption Issues

**Error: "Failed to decrypt AES key"**
```bash
# Test your encryption setup
npm run test-encryption

# Regenerate keys if needed
npm run generate-keys
```

**Error 421 from WhatsApp**
- This usually means IV flip is not working correctly
- Check `EncryptionService.ts` - IV must be reversed for outgoing encryption
- See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md#encryption-errors)

### Database Issues

**Migration errors:**
```bash
# Check PostgreSQL version (must be 18+)
psql --version

# Run migrations manually
npm run migrate

# Reset database (⚠️ development only!)
npm run db:reset
```

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Rebuild image
docker-compose build --no-cache
```

### API Issues

**Webhook not receiving events:**
- Verify URL is publicly accessible
- Check webhook signature validation
- Verify `META_APP_SECRET` matches Meta dashboard
- Review logs for signature mismatch errors

---

## 📖 Self-Help Resources

### Quick Links
- [FAQ (Discussions)](https://github.com/guilhermejansen/whatsapp-flows-server/discussions/categories/q-a)
- [Installation Guide](../README.md#-quick-start)
- [Docker Deployment](../README.md#-docker-deployment)
- [API Reference](../README.md#-api-reference)
- [Environment Variables](../README.md#-configuration)

### Learning Path

**New to WhatsApp Flows?**
1. Read [WhatsApp Flows Overview](https://developers.facebook.com/docs/whatsapp/flows/)
2. Review our [System Architecture](../README.md#-architecture)
3. Follow [Quick Start Guide](../README.md#-quick-start)
4. Join [GitHub Discussions](https://github.com/guilhermejansen/whatsapp-flows-server/discussions)

**Ready to Deploy?**
1. Review [Production Deployment](../README.md#-docker-deployment)
2. Check [Security Best Practices](../SECURITY.md)
3. Set up monitoring and backups
4. Test your Flow before going live

---

## 🤝 Contributing

Want to help improve the project?

- Read our [Contributing Guide](../CONTRIBUTING.md)
- Check [Good First Issues](https://github.com/guilhermejansen/whatsapp-flows-server/labels/good%20first%20issue)
- Join discussions and help others
- Submit bug fixes and features

---

## 📊 Response Times

| Channel | Response Time | Best For |
|---------|---------------|----------|
| 💬 Discussions | 1-3 days | General questions, ideas |
| 🐛 Issues | 1-5 days | Bug reports, feature requests |
| 📧 Email | 1-2 days | Private inquiries |
| 🌐 Professional | Same day | Commercial support |

*Response times are estimates and may vary based on issue complexity and maintainer availability.*

---

## ✅ How to Ask Good Questions

To get the best help, include:

1. **Clear description** of the problem
2. **Steps to reproduce** the issue
3. **Expected vs. actual** behavior
4. **Environment details** (Node.js, Docker, OS versions)
5. **Relevant logs** (with sensitive data removed!)
6. **What you've tried** so far

**Good example:**
```
I'm getting "Failed to decrypt AES key" error when WhatsApp sends INIT action.

Environment:
- Node.js 20.10.0
- Docker 24.0.7
- Ubuntu 22.04

Steps to reproduce:
1. Started server with docker-compose
2. Configured Flow in WhatsApp Manager
3. User clicks Flow button
4. Server returns 500 error

Error log:
[2025-01-27 10:30:15] ERROR: Failed to decrypt AES key

I've tried:
- Regenerating keys with npm run generate-keys
- Restarting container
- Checking PRIVATE_KEY format in .env

Full logs attached.
```

---

## 🌟 Community

Join our growing community:

- ⭐ **Star the repo** to show support
- 👀 **Watch for updates** and releases
- 🔄 **Share your experience** in discussions
- 🤝 **Help others** with their questions

---

**Thank you for using WhatsApp Flows Server!** 🎉

We appreciate your patience and participation in making this project better for everyone.
