# Contributing to Kenya Quest

Thank you for your interest in contributing to Kenya Quest!

## Getting Started

1. **Prerequisites**: Node.js 22.12 or newer.
2. **Clone and Setup**:
   ```sh
   git clone https://github.com/waynekiprotich/kenya-quest.git
   cd kenya-quest
   npm ci
   npm run setup
   ```
3. **Local Development**:
   ```sh
   npm run dev
   ```
   This concurrently runs the client on `http://localhost:5173` and the Cloudflare API Worker on port `8787`.

## Quality Checks & Testing

Before submitting a pull request, ensure all tests and format checks pass:

```sh
# Run full suite: progress, proxy, and worker tests + typecheck + builds
npm run check

# Check formatting
npm run format:check

# Auto-format files
npm run format
```

## Commit Conventions

We follow Conventional Commits:

- `feat(...)`: New feature or user-facing addition
- `fix(...)`: Bug fix
- `docs(...)`: Documentation updates
- `chore(...)`: Maintenance, dependency, or configuration tasks
- `ci(...)`: GitHub Actions or CI configuration changes
- `refactor(...)`: Code changes that neither fix bugs nor add features

## Pull Requests

1. Create a feature branch from `main`.
2. Keep changes focused and well-scoped.
3. Ensure all CI checks pass.
4. Submit your pull request with a concise summary of changes.
