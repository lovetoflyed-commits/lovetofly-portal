# Contributing to Love to Fly Portal

Thank you for your interest in contributing to Love to Fly Portal! This document provides guidelines for contributing to this aviation community platform.

## 🚀 Quick Start

1. **Fork and Clone**: Fork the repository and clone it locally
2. **Install Dependencies**: Run `npm install` or `yarn install`
3. **Set Up Database**: Follow instructions in `documentation/NEON_SETUP.md`
4. **Run Development Server**: `npm run dev` (starts on http://localhost:3000)
5. **Make Changes**: Create a feature branch and implement your changes
6. **Test**: Run `npm run test` and `npm run test:e2e`
7. **Submit PR**: Create a pull request with a clear description

## 📋 Development Guidelines

### For AI Coding Agents

If you're an AI assistant working on this codebase, please read the comprehensive guidelines in [.github/copilot-instructions.md](.github/copilot-instructions.md). This file contains:
- Architecture patterns
- Authentication/authorization patterns
- Database best practices
- API design patterns
- Security guidelines
- Testing patterns
- Code style conventions

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Code is linted with ESLint
- **Naming**:
  - Files: PascalCase for components, camelCase for utilities
  - Variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Database: snake_case

### Git Workflow

1. **Branch Naming**:
   - `feature/description` - New features
   - `fix/description` - Bug fixes
   - `refactor/description` - Code refactoring
   - `docs/description` - Documentation updates

2. **Commit Messages**:
   - Clear and descriptive
   - Present tense ("Add feature" not "Added feature")
   - Reference issues when applicable (`Fixes #123`)

3. **Pull Requests**:
   - Provide clear description of changes
   - Link related issues
   - Ensure all tests pass
   - Update documentation if needed

## 🧪 Testing

- **Unit Tests**: `npm run test`
- **Integration Tests**: `npm run test:integration`
- **E2E Tests**: `npm run test:e2e`
- **All Tests**: `npm run test:all`

Please ensure all existing tests pass and add tests for new functionality.

## 🛡️ Security

- Never commit secrets, API keys, or sensitive data
- Use environment variables for configuration
- Always use parameterized queries for database operations
- Validate all user inputs
- Follow authentication/authorization patterns in the codebase

If you discover a security vulnerability, please email the maintainers directly rather than creating a public issue.

## 🗄️ Database Changes

- Create new migration files using `npm run migrate:create`
- Never edit existing migration files
- Test migrations with `npm run migrate:up` and `npm run migrate:down`
- Update TypeScript types in `src/types/` when schema changes

## 📚 Documentation

When making changes:
- Update relevant documentation in `documentation/` folder
- Update API documentation if endpoints change
- Add inline comments for complex logic
- Update README.md if setup/usage changes

## 🎨 UI/UX Guidelines

- Ensure responsive design (mobile, tablet, desktop)
- Follow existing design patterns and components
- Support internationalization (Portuguese and English)
- Maintain accessibility standards

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots if applicable

## 💡 Feature Requests

We welcome feature suggestions! Please:
- Check if similar request already exists
- Provide clear use case and rationale
- Consider implementation complexity
- Align with project goals (aviation community platform)

## 📝 Code Review Process

- All changes require review before merging
- Address reviewer feedback promptly
- Keep PRs focused and reasonably sized
- Ensure CI/CD checks pass

## 🤝 Community Guidelines

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what's best for the aviation community
- Collaborate openly and share knowledge

## 📖 Additional Resources

- [Quick Start Guide](../documentation/QUICK_START.md)
- [API Documentation](../documentation/API_DOCUMENTATION.md)
- [Setup Instructions](../documentation/SETUP_AND_CONNECTIONS.md)
- [Full Documentation Index](../documentation/README.md)

## ❓ Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues for similar questions
3. Open a new issue with the "question" label

---

Thank you for contributing to Love to Fly Portal! Together we're building a valuable resource for the aviation community. ✈️
