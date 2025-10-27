/**
 * Commitlint Configuration
 * Enforces Conventional Commits specification
 * 
 * Format: <type>(<scope>): <subject>
 * 
 * Examples:
 * - feat: add user authentication
 * - fix(api): resolve endpoint timeout issue
 * - docs: update README with setup instructions
 * - chore(deps): update dependencies
 * - BREAKING CHANGE: remove deprecated API endpoint
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  
  rules: {
    // Type enum - allowed commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Build system changes
        'ci',       // CI/CD changes
        'chore',    // Other changes (dependencies, config, etc)
        'revert',   // Revert previous commit
      ],
    ],
    
    // Subject case - allow any case
    'subject-case': [0],
    
    // Subject length - max 100 characters
    'subject-max-length': [2, 'always', 100],
    
    // Subject empty - must not be empty
    'subject-empty': [2, 'never'],
    
    // Type case - must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    
    // Type empty - must not be empty
    'type-empty': [2, 'never'],
    
    // Scope case - must be lowercase
    'scope-case': [2, 'always', 'lower-case'],
    
    // Header length - max 100 characters
    'header-max-length': [2, 'always', 100],
    
    // Body leading blank - must have blank line
    'body-leading-blank': [2, 'always'],
    
    // Footer leading blank - must have blank line
    'footer-leading-blank': [2, 'always'],
  },
  
  // Custom prompts for interactive commit
  prompt: {
    questions: {
      type: {
        description: 'Select the type of change that you\'re committing',
        enum: {
          feat: {
            description: '🚀 A new feature',
            title: 'Features',
            emoji: '🚀',
          },
          fix: {
            description: '🐛 A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: '📝 Documentation only changes',
            title: 'Documentation',
            emoji: '📝',
          },
          style: {
            description: '💄 Code style changes (formatting, missing semi colons, etc)',
            title: 'Styles',
            emoji: '💄',
          },
          refactor: {
            description: '♻️  Code refactoring (neither fixes a bug nor adds a feature)',
            title: 'Code Refactoring',
            emoji: '♻️',
          },
          perf: {
            description: '⚡ Performance improvements',
            title: 'Performance Improvements',
            emoji: '⚡',
          },
          test: {
            description: '✅ Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '✅',
          },
          build: {
            description: '📦 Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '📦',
          },
          ci: {
            description: '👷 Changes to CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '👷',
          },
          chore: {
            description: '🔧 Other changes that don\'t modify src or test files',
            title: 'Chores',
            emoji: '🔧',
          },
          revert: {
            description: '⏪ Reverts a previous commit',
            title: 'Reverts',
            emoji: '⏪',
          },
        },
      },
      scope: {
        description: 'What is the scope of this change (e.g. component or file name)',
      },
      subject: {
        description: 'Write a short, imperative tense description of the change',
      },
      body: {
        description: 'Provide a longer description of the change',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description: 'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself',
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123".)',
      },
    },
  },
};
