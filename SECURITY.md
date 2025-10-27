# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The WhatsApp Flow Server team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report a Security Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing:

**📧 guilherme@setupautomatizado.com.br**

Include the following information:

- **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it

This information will help us triage your report more quickly.

### What to Expect

- **Acknowledgment**: You will receive an acknowledgment within **48 hours**.
- **Investigation**: Our security team will investigate and determine the severity and impact.
- **Updates**: We will keep you informed about our progress every **5-7 days**.
- **Fix Timeline**: Critical vulnerabilities will be patched within **7 days**, high severity within **30 days**.
- **Public Disclosure**: We will coordinate with you on the public disclosure timeline.
- **Credit**: You will be credited in the security advisory (if desired).

## Security Best Practices

### For Users

When deploying WhatsApp Flow Server, follow these security practices:

#### 1. Environment Variables

- ✅ **Never commit** `.env` files to version control
- ✅ **Use strong passwords** for database credentials
- ✅ **Rotate secrets** regularly (every 3-6 months)
- ✅ **Use environment-specific** configurations

```bash
# Generate secure tokens
openssl rand -hex 32  # For API_TOKEN
openssl rand -base64 32  # For other secrets
```

#### 2. Encryption Keys

- ✅ **Generate strong RSA-2048 keys**
- ✅ **Store private keys securely** (never in code)
- ✅ **Use encrypted key storage** when possible
- ✅ **Backup keys securely** (encrypted backups)
- ✅ **Rotate keys annually**

```bash
# Generate keys with passphrase
npm run generate-keys
# Enter strong passphrase when prompted
```

#### 3. Network Security

- ✅ **Always use HTTPS** in production (required by WhatsApp)
- ✅ **Configure firewall** to restrict database access
- ✅ **Use VPN/private network** for database connections
- ✅ **Enable rate limiting** on endpoints
- ✅ **Implement IP whitelisting** for webhook endpoints

#### 4. Docker Security

- ✅ **Run as non-root user** (already configured)
- ✅ **Scan images** for vulnerabilities regularly
- ✅ **Keep base images updated**
- ✅ **Use official images only**
- ✅ **Limit container resources**

```bash
# Scan Docker image for vulnerabilities
docker scan setupautomatizado/whatsapp-flows-server:latest
```

#### 5. Database Security

- ✅ **Use strong database passwords**
- ✅ **Restrict database access** (firewall rules)
- ✅ **Enable SSL/TLS** for database connections
- ✅ **Regular backups** (encrypted)
- ✅ **Keep PostgreSQL updated**

#### 6. Application Security

- ✅ **Keep dependencies updated** (Dependabot enabled)
- ✅ **Monitor npm audit** warnings
- ✅ **Validate all inputs** (Zod schemas in place)
- ✅ **Sanitize user data**
- ✅ **Implement request size limits**

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix
```

#### 7. API Security

- ✅ **Use API tokens** for authentication
- ✅ **Validate webhook signatures** (X-Hub-Signature-256)
- ✅ **Implement CORS** properly
- ✅ **Rate limit endpoints**
- ✅ **Log security events**

#### 8. Monitoring & Logging

- ✅ **Enable structured logging** (Winston configured)
- ✅ **Monitor error rates**
- ✅ **Alert on suspicious activity**
- ✅ **Review logs regularly**
- ✅ **Never log sensitive data** (passwords, tokens, keys)

### Security Checklist

Before going to production:

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables properly configured
- [ ] Strong passwords for all services
- [ ] Firewall rules configured
- [ ] Database access restricted
- [ ] Encryption keys generated and secured
- [ ] Public key registered with Meta
- [ ] Webhook signature validation enabled
- [ ] Rate limiting configured
- [ ] CORS origins properly set
- [ ] Logs monitored
- [ ] Backups configured and tested
- [ ] Docker image scanned for vulnerabilities
- [ ] Dependencies up to date
- [ ] Security headers enabled (Helmet configured)

## Known Security Considerations

### WhatsApp Flow Encryption

This implementation correctly handles the **mandatory IV flip pattern** required by WhatsApp:

```typescript
// CRITICAL: Outgoing responses must use FLIPPED IV
const flippedIV = Buffer.from(iv).reverse();
```

**Failure to flip IV will result in error 421 from WhatsApp.**

### Webhook Signature Validation

All webhook requests are validated using `X-Hub-Signature-256`:

```typescript
const signature = crypto
  .createHmac('sha256', META_APP_SECRET)
  .update(JSON.stringify(body))
  .digest('hex');
```

**Never disable signature validation in production.**

### Response JSON Parsing

Webhook `response_json` is a **string** and must be parsed:

```typescript
// CORRECT
const data = JSON.parse(webhook.nfm_reply.response_json);

// WRONG - causes security issues
const data = webhook.nfm_reply.response_json;
```

## Security Updates

Security updates are released as patch versions and will be announced via:

1. **GitHub Security Advisories**: https://github.com/guilhermejansen/whatsapp-flows-server/security/advisories
2. **GitHub Releases**: https://github.com/guilhermejansen/whatsapp-flows-server/releases
3. **Email notification** to maintainers

Subscribe to repository releases to receive security notifications.

## Vulnerability Disclosure Policy

We follow **coordinated vulnerability disclosure**:

1. **Report** security issue privately
2. **Acknowledge** within 48 hours
3. **Investigate** and develop fix
4. **Notify** reporter of fix timeline
5. **Release** security patch
6. **Publish** advisory 7 days after fix
7. **Credit** reporter in advisory

## Security Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

*No vulnerabilities reported yet.*

## Compliance

This project aims to comply with:

- **OWASP Top 10** security risks mitigation
- **CWE/SANS Top 25** most dangerous software errors
- **GDPR** data protection requirements (when handling personal data)
- **PCI DSS** requirements (when handling payment data)

## Security Resources

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Docker Security](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

### Internal Documentation

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common security-related issues
- [README.md](./README.md) - Security section
- [.env.example](./.env.example) - Secure configuration examples

## Contact

- **Security Issues**: guilherme@setupautomatizado.com.br
- **General Questions**: Open a GitHub Discussion
- **Website**: https://setupautomatizado.com.br

---

**Last Updated**: October 2025

**Maintained by**: Guilherme Jansen ([@guilhermejansen](https://github.com/guilhermejansen))
