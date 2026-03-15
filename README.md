# releaserun

[![npm version](https://badge.fury.io/js/releaserun.svg)](https://badge.fury.io/js/releaserun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- releaserun:badges:start -->
[![Node.js 22 Health](https://img.releaserun.com/badge/health/nodejs/22.svg)](https://releaserun.com/nodejs/22/)
[![TypeScript 5.3 Health](https://img.releaserun.com/badge/health/typescript/5.3.svg)](https://releaserun.com/typescript/5.3/)
<!-- releaserun:badges:end -->

Scan your project for end-of-life dependencies, known CVEs, and version health issues. Get an A-F grade for your entire stack in seconds.

**Version-aware**: badges and grades are pinned to the versions YOUR project actually uses, not generic "latest version" data.

```bash
npx releaserun check
```

## What it does

Point it at any project directory. It reads your dependency files, figures out what you're running, and tells you what's healthy, what's approaching EOL, and what has known CVEs.

```
  releaserun v1.4.0 — Stack Health Check

  ┌─────────────┬─────────┬────────┬──────┬───────┐
  │ Technology  │ Version │ EOL    │ CVEs │ Grade │
  ├─────────────┼─────────┼────────┼──────┼───────┤
  │ Node.js     │ 22      │ Apr 27 │ 0    │ A     │
  │ React       │ 19      │ --     │ 0    │ B     │
  │ TypeScript  │ 5.7     │ --     │ 0    │ A     │
  │ PostgreSQL  │ 16      │ Nov 28 │ 0    │ A     │
  │ Redis       │ 7.4     │ --     │ 0    │ A     │
  └─────────────┴─────────┴────────┴──────┴───────┘

  Overall Grade: A
```

The versions come from your actual files. Node.js 22 from `.nvmrc`, PostgreSQL 16 from `docker-compose.yml`, React 19 from `package.json`. Not guesses.

## Install

```bash
# Run without installing
npx releaserun check

# Or install globally
npm install -g releaserun
```

Requires Node.js 18+.

## Commands

### `releaserun check`

Scan and grade your stack.

```bash
releaserun check                    # scan current directory
releaserun check --path ./my-app    # scan a specific path
releaserun check --json             # JSON output for scripting
releaserun check --fail-on D        # exit non-zero if anything grades D or worse
releaserun check --verbose          # show what's being scanned and fetched
```

### `releaserun badges`

Generate version-specific badge markdown for your README.

```bash
releaserun badges                          # health badges (default)
releaserun badges --type eol               # EOL status badges
releaserun badges --type cve               # CVE count badges
releaserun badges --style flat-square      # flat-square style
```

Output (copied to clipboard):

```markdown
[![Node.js 22 Health](https://img.releaserun.com/badge/health/nodejs/22.svg)](https://releaserun.com/nodejs/22/)
[![Python 3.12 Health](https://img.releaserun.com/badge/health/python/3.12.svg)](https://releaserun.com/python/3.12/)
[![PostgreSQL 16 Health](https://img.releaserun.com/badge/health/postgresql/16.svg)](https://releaserun.com/postgresql/16/)
```

Badges are pinned to the versions detected in your project. `PostgreSQL 16` comes from your `docker-compose.yml`, not from the `pg` npm package version.

### `releaserun readme`

Inject badges directly into your README with auto-updating markers.

```bash
releaserun readme                   # preview what would be injected
releaserun readme --write           # write badges into README.md
releaserun readme --readme DOCS.md  # target a different file
```

Badges go between `<!-- releaserun:badges:start -->` and `<!-- releaserun:badges:end -->` markers. Run it again and it replaces the old badges with fresh ones. No markers yet? It inserts them after the first heading.

### `releaserun ci`

CI-optimized output. No colors, no table formatting.

```bash
releaserun ci --json --fail-on D
```

## What it scans

| File | What it detects |
|------|-----------------|
| `package.json` | Node.js (from `engines`), React, Vue, Angular, TypeScript, webpack, etc. |
| `pyproject.toml` | Python (from `requires-python`), Django, Flask, database clients |
| `requirements.txt` / `Pipfile` | Python packages, framework detection |
| `go.mod` | Go version (from directive), database client detection |
| `Gemfile` | Ruby version, Rails |
| `Cargo.toml` | Rust (from `rust-version` or edition), crate detection |
| `pom.xml` | Java version, Spring Boot |
| `composer.json` | PHP version, Laravel, Symfony |
| `Dockerfile` | Base images (node:22, python:3.12, postgres:16, etc.) |
| `docker-compose.yml` | Service images (postgres:16, redis:7.4, etc.) |
| `.nvmrc` / `.node-version` | Node.js version |
| `.python-version` | Python version |
| `.ruby-version` / `.go-version` | Ruby/Go version |
| `.tool-versions` | asdf-managed runtimes |

**Version accuracy matters.** Client library versions are never confused with server versions. `pg:8.13` in package.json detects "PostgreSQL is used" but doesn't claim it's PostgreSQL 8.13. The actual version comes from your Dockerfile or docker-compose.yml where you define `postgres:16`.

## How version detection works

Sources are checked in priority order:

1. **Version files** (`.nvmrc`, `.python-version`) - what you actually run locally
2. **Lock/config files** (`package.json engines`, `pyproject.toml requires-python`, `go.mod go directive`, `Cargo.toml rust-version`)
3. **Dependency lists** - direct-match packages (react 19 = React 19) vs indicators (express 4.18 = "Node.js is used, version unknown")
4. **Dockerfile** - base image tags (`FROM python:3.12-slim`)
5. **docker-compose.yml** - service images (`image: postgres:16`)

Later sources fill in gaps. If `pg` in package.json detects PostgreSQL (unknown version), and docker-compose.yml has `postgres:16`, the final result is PostgreSQL 16.

## Grading

| Grade | Meaning |
|-------|---------|
| **A** | Fully supported, no CVEs, plenty of runway |
| **B** | Supported, EOL in 6-12 months |
| **C** | Approaching EOL (<6 months) or minor CVEs |
| **D** | EOL imminent (<3 months) or moderate CVEs |
| **F** | Past EOL or critical CVEs |
| **?** | Version unknown, can't determine health |

Technologies with unknown versions get `?` instead of a fake grade. We'd rather be honest than misleading.

## CI Integration

```yaml
# GitHub Actions
- name: Check stack health
  run: npx releaserun check --fail-on D

# Or use the dedicated action with PR comments and badge auto-update
- uses: Releaserun/releaserun-action@v2
  with:
    path: '.'
    comment: 'true'
    update-readme: 'true'
```

Exit codes: `0` = all clear, `1` = something grades C/D, `2` = something grades F.

## All Options

| Flag | Description | Default |
|------|-------------|---------|
| `--path <dir>` | Directory to scan | `.` |
| `--json` | JSON output | `false` |
| `--fail-on <grade>` | Exit non-zero at or below this grade | `F` |
| `--style <s>` | Badge style: `flat` or `flat-square` | `flat` |
| `--type <t>` | Badge type: `health`, `eol`, `v`, `cve` | `health` |
| `--write` | Write badges to README (readme command) | `false` |
| `--readme <file>` | Target file for readme command | `README.md` |
| `--no-color` | Disable terminal colors | `false` |
| `--no-cache` | Skip local response cache | `false` |
| `--verbose` | Show scanning details | `false` |

## Privacy

No dependency files are uploaded. The only network calls are to check version status against public APIs ([endoflife.date](https://endoflife.date), [ReleaseRun badge API](https://releaserun.github.io/badges)). Responses are cached locally for 1 hour.

## Links

- [ReleaseRun](https://releaserun.com) - Release lifecycle tracking for 300+ technologies
- [Badge API Docs](https://releaserun.github.io/badges) - Full badge reference
- [GitHub Action](https://github.com/Releaserun/releaserun-action) - CI integration with PR comments and health badges ([Marketplace](https://github.com/marketplace/actions/releaserun-stack-health-check))
- [Free Developer Tools](https://releaserun.com/tools/) - 65 free developer tools: Terraform security scanner, K8s security linter, GitHub Actions security/version auditors, npm/PyPI/Go/Rust/Maven dependency health, vulnerability scanner, and more (no signup)

## License

MIT

 
