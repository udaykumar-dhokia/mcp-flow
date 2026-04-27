# Contributing to mcp-flow

First off, thank you for considering contributing to mcp-flow! It's people like you that make mcp-flow such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct.

## How Can I Contribute?

### Reporting Bugs

- Use a clear and descriptive title for the issue.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Explain which behavior you expected to see instead and why.

### Suggesting Enhancements

- Use a clear and descriptive title for the issue.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Explain why this enhancement would be useful to most mcp-flow users.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js (v20+)
- pnpm (v9+)

### Installation

```bash
pnpm install
```

### Running Locally

```bash
pnpm dev
```

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### JavaScript/TypeScript Styleguide

- We use ESLint and Prettier. Run `pnpm lint` to check for style issues.
