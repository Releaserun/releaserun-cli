# Contributing to ReleaseRun CLI

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/Releaserun/releaserun-cli.git
cd releaserun-cli
npm install
npm run build
```

## Running Tests

```bash
npm test
```

## Adding a New Scanner

Each scanner lives in `src/scanners/` and implements the `Scanner` interface:

1. Create a new file in `src/scanners/` (e.g. `composer.ts`)
2. Implement `detect()` to check if the lockfile/manifest exists
3. Implement `scan()` to parse dependencies and check them against the endoflife.date API
4. Register your scanner in `src/scanners/index.ts`
5. Add tests in `tests/`

## Supported Ecosystems

- **Node.js** - `package.json` / `package-lock.json`
- **Python** - `requirements.txt` / `Pipfile.lock`
- **Go** - `go.mod` / `go.sum`
- **Rust** - `Cargo.toml` / `Cargo.lock`
- **Ruby** - `Gemfile` / `Gemfile.lock`
- **Java** - `pom.xml`
- **Docker** - `Dockerfile`

## Pull Requests

- Fork the repo and create a branch from `main`
- Add tests for any new functionality
- Make sure `npm test` passes
- Keep PRs focused on a single change

## Reporting Bugs

Open an issue with:
- Your Node.js version (`node -v`)
- The command you ran
- Expected vs actual output
- The lockfile/manifest that triggered the bug (sanitize any private package names)

## Code of Conduct

Be respectful. We're all here to build useful tools.
