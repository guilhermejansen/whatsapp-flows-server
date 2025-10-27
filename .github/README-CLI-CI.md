# GitHub Templates & Configuration

This directory contains all GitHub-specific templates and automation configurations for **WhatsApp Flows Server**.

## 📋 What's Inside

### Issue Templates

Professional YAML-based issue templates with structured forms:

- **🐛 Bug Report** (`ISSUE_TEMPLATE/bug_report.yml`)
  - Comprehensive bug reporting with environment details
  - Severity classification
  - Log collection and reproduction steps
  
- **✨ Feature Request** (`ISSUE_TEMPLATE/feature_request.yml`)
  - Structured feature proposals
  - Benefits analysis and alternatives
  - Implementation ideas and breaking changes assessment
  
- **📚 Documentation** (`ISSUE_TEMPLATE/documentation.yml`)
  - Documentation issues and improvements
  - Translation requests
  - Example requests
  
- **❓ Question** (`ISSUE_TEMPLATE/question.yml`)
  - General questions about the project
  - Category-based organization
  - Context gathering

**Configuration:**
- `ISSUE_TEMPLATE/config.yml` - Links to discussions, security, docs, and support

### Pull Request Template

Comprehensive PR template (`pull_request_template.md`) with:
- 35+ checklist items across 9 categories
- Code quality, testing, documentation, security checks
- Breaking changes section
- Architecture compliance verification

### Community Files

- **CODE_OF_CONDUCT.md** - Contributor Covenant v2.1
- **SUPPORT.md** - Complete support guide with channels and response times
- **CODEOWNERS** - Automatic code review assignments by domain

### Automation Configs

- **FUNDING.yml** - GitHub Sponsors + custom links
- **labels.yml** - 50+ organized labels for issues/PRs
- **stale.yml** - Auto-management of inactive issues/PRs
- **auto-assign.yml** - Auto-assign reviewers to PRs
- **release-drafter.yml** - Auto-draft release notes

## 🚀 Setup Instructions

### 1. Labels

Apply labels to your repository:

```bash
# Install github-label-sync globally (optional)
npm install -g github-label-sync

# Sync labels (replace YOUR_TOKEN)
npx github-label-sync --access-token YOUR_TOKEN --labels .github/labels.yml guilhermejansen/whatsapp-flows-server

# Or with environment variable
export GITHUB_ACCESS_TOKEN=YOUR_TOKEN
npx github-label-sync --labels .github/labels.yml guilhermejansen/whatsapp-flows-server
```

**Label Categories:**
- 🚨 **Priority**: critical, high, medium, low
- 🏷️ **Type**: bug, enhancement, documentation, security, performance, etc.
- 📊 **Status**: needs-triage, in-progress, blocked, released, etc.
- 🎯 **Domain**: encryption, database, api, flows, docker, webhooks
- ⏱️ **Effort**: small, medium, large
- 👥 **Community**: good first issue, help wanted, hacktoberfest

### 2. GitHub Apps (Optional)

Install these GitHub Apps for enhanced automation:

#### Stale Bot
**Purpose:** Automatically mark and close inactive issues/PRs

1. Go to https://github.com/apps/stale
2. Click "Install"
3. Select `guilhermejansen/whatsapp-flows-server`
4. Configuration is in `.github/stale.yml`

**Settings:**
- Issues: 60 days inactive → stale, +14 days → close
- PRs: 30 days inactive → stale, +7 days → close
- Exemptions: security, critical, high priority labels

#### Release Drafter
**Purpose:** Auto-generate release notes from PRs

1. Go to https://github.com/apps/release-drafter
2. Click "Install"
3. Select `guilhermejansen/whatsapp-flows-server`
4. Configuration is in `.github/release-drafter.yml`

**Features:**
- Categorizes PRs by type
- Generates changelog automatically
- Version resolution (major/minor/patch)
- Works alongside semantic-release

#### Auto Assign
**Purpose:** Automatically assign reviewers to PRs

1. Go to https://github.com/apps/auto-assign
2. Click "Install"
3. Select `guilhermejansen/whatsapp-flows-server`
4. Configuration is in `.github/auto-assign.yml`

**Settings:**
- Auto-assigns @guilhermejansen as reviewer
- Skips WIP/draft PRs
- Assigns PR author as assignee

### 3. Branch Protection (Recommended)

Configure branch protection for `main`:

**Repository Settings → Branches → Add rule**

Recommended settings:
- ✅ Require pull request reviews before merging (1 approval)
- ✅ Require status checks to pass (CI, build, lint)
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Include administrators
- ✅ Allow force pushes (only for maintainers)

### 4. Issue Templates

Issue templates are automatically available when creating new issues. Users will see:

1. **Choose template** page with 4 options
2. Structured YAML forms for each type
3. Links to discussions and documentation

**No additional setup needed!** Templates are active once pushed to main branch.

### 5. Code Owners

`CODEOWNERS` file automatically:
- Requests reviews from @guilhermejansen on all PRs
- Organizes ownership by domain (database, security, API, etc.)
- Works with GitHub's auto-assign feature

**No setup needed** - works automatically!

## 📊 Label Management

### Viewing Labels

```bash
# View all labels
gh label list

# View labels by color
gh label list --json name,color,description
```

### Updating Labels

Edit `.github/labels.yml` and re-sync:

```bash
npx github-label-sync --access-token YOUR_TOKEN --labels .github/labels.yml guilhermejansen/whatsapp-flows-server
```

### Allow Additional Labels

If you want to keep manually created labels:

```bash
npx github-label-sync --allow-added-labels --access-token YOUR_TOKEN --labels .github/labels.yml guilhermejansen/whatsapp-flows-server
```

## 🔧 Customization

### Issue Templates

Edit YAML files in `ISSUE_TEMPLATE/`:
- Add/remove fields
- Change validation rules
- Modify labels
- Update assignees

### PR Template

Edit `pull_request_template.md`:
- Customize checklist items
- Add project-specific sections
- Modify required information

### Labels

Edit `labels.yml`:
- Add new labels
- Change colors (hex format)
- Update descriptions
- Organize into categories

### Stale Bot

Edit `stale.yml`:
- Adjust inactivity days
- Modify exempt labels
- Customize messages
- Change limits

## 📚 Best Practices

### For Contributors

1. **Choose the right template** when creating issues
2. **Fill all required fields** for faster resolution
3. **Add relevant labels** to categorize issues
4. **Link related issues/PRs** for context
5. **Follow PR checklist** before requesting review

### For Maintainers

1. **Triage new issues** within 24-48 hours
2. **Apply labels consistently** for better organization
3. **Review PR checklists** before approving
4. **Use status labels** to track progress
5. **Close stale issues** that bot doesn't catch

### Label Usage

**Priority Labels** - Set on critical bugs and important features
- `priority: critical` - Immediate attention needed
- `priority: high` - Next sprint/release
- `priority: medium` - Normal timeline
- `priority: low` - Nice to have

**Status Labels** - Track issue lifecycle
- `needs-triage` - New, needs categorization
- `in-progress` - Actively being worked on
- `blocked` - Waiting on external factor
- `released` - Fixed in a release

**Domain Labels** - Organize by area of codebase
- `domain: encryption` - RSA/AES security
- `domain: database` - PostgreSQL operations
- `domain: api` - API endpoints
- `domain: flows` - WhatsApp Flows integration

## 🔗 Resources

- [GitHub Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates)
- [CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Labels Best Practices](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
- [Semantic Release](https://github.com/semantic-release/semantic-release)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 📧 Questions?

If you have questions about these templates or configurations:

- 💬 [GitHub Discussions](https://github.com/guilhermejansen/whatsapp-flows-server/discussions)
- 📧 Email: guilherme@setupautomatizado.com.br
- 🐛 [Create an Issue](https://github.com/guilhermejansen/whatsapp-flows-server/issues/new/choose)

---

**Last Updated**: January 2025

**Maintained by**: Guilherme Jansen ([@guilhermejansen](https://github.com/guilhermejansen))
