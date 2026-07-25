# Contributing to Enterprise Skills Hub

Thank you for your interest in contributing to Enterprise Skills Hub! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a simple code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept constructive criticism gracefully
- Prioritize the community's best interests

## Getting Started

### Prerequisites

- Node.js 20+
- Podman or Docker
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/skillshub.git
   cd skillshub
   ```

3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

4. Set up environment:
   ```bash
   cp .env.example .env
   ```

5. Start infrastructure:
   ```bash
   podman compose up -d
   ```

6. Initialize database:
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

7. Start development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add OAuth2 support
fix(skills): resolve version conflict on publish
docs(readme): update setup instructions
```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes and test locally

3. Run quality checks:
   ```bash
   npm run typecheck
   npm run build
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature
   ```

## Pull Request Process

### Before Submitting

- [ ] Code follows project conventions (see AGENTS.md)
- [ ] TypeScript type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changes are documented (update CHANGELOG.md if needed)
- [ ] Commit messages follow Conventional Commits
- [ ] No sensitive data (API keys, passwords) in commits

### Submitting a PR

1. Go to the [original repository](https://github.com/aaronpliu/skillshub)
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template:
   - Clear description of changes
   - Related issue numbers
   - Testing steps
   - Screenshots (if UI changes)

### PR Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

## Coding Standards

### TypeScript

- Use strict mode
- Prefer interfaces over types for objects
- Use explicit return types for exported functions
- Avoid `any` - use `unknown` when necessary

### React / Next.js

- Use App Router patterns
- All pages are client components (`"use client"`)
- Use tRPC hooks for data fetching
- Tailwind CSS for styling
- Keep components under 200 lines

### tRPC

- Use appropriate procedure types (public/protected)
- Validate all inputs with Zod
- Return descriptive error messages
- Log errors with context

### Database

- Use Prisma ORM
- Include timestamps on all models
- Use meaningful index names
- Document complex queries

## Reporting Bugs

### Before Reporting

- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Gather reproduction steps

### Bug Report Template

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs if applicable

## Suggesting Features

### Before Suggesting

- Check existing issues and discussions
- Ensure the feature aligns with project goals
- Consider implementation complexity

### Feature Request Template

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- Problem statement
- Proposed solution
- Alternative solutions considered
- Use cases
- Implementation ideas (optional)

## Questions?

- Read [AGENTS.md](AGENTS.md) for AI agent guidelines
- Check [README.md](README.md) for project overview
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guides
- Open a discussion for general questions

## Recognition

Contributors will be recognized in:
- Release notes
- Contributors section of README
- Project documentation

Thank you for contributing to Enterprise Skills Hub!
