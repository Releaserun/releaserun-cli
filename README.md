# releaserun

[![npm version](https://badge.fury.io/js/releaserun.svg)](https://badge.fury.io/js/releaserun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Health](https://img.releaserun.com/badge/health/nodejs.svg)](https://releaserun.com/tools/dep-eol-scanner/)
[![Python Health](https://img.releaserun.com/badge/health/python.svg)](https://releaserun.com/tools/dep-eol-scanner/)

Scan your project for end-of-life dependencies, known CVEs, and version health issues. Get an A-F grade for your entire stack in seconds. No signup, no API key, runs locally.

```bash
npx releaserun check
```

## Why

Every team has that one dependency running an EOL version. Python 3.8 hit end-of-life in October 2024, but it still accounts for a huge chunk of Python projects out there. Node 16 is long dead. Kubernetes 1.27 stopped getting patches months ago.

The problem isn't that people don't care. It's that nobody checks systematically. You upgrade when something breaks, not before.

`releaserun` fixes that. Point it at any project directory and it'll tell you exactly what's out of date, what's approaching EOL, and what has known CVEs. Works in CI too, so you can fail builds when your stack drifts too far.

Built by the team behind [ReleaseRun](https://releaserun.com), which tracks release lifecycles for 300+ technologies.

## Install

```bash
# Run without installing (recommended)
npx releaserun check

# Or install globally
npm install -g releaserun
```

Requires Node.js 18 or later.

## Commands

### `releaserun check`

Scan a directory for dependency files and report health status for every detected technology.

```bash
releaserun check                    # scan current directory
releaserun check --path ./my-app    # scan a specific directory
releaserun check --json             # JSON output for scripting
releaserun check --fail-on D        # exit non-zero if anything grades D or worse
releaserun check --verbose          # show API calls and timing
```

Example output:

```
  releaserun v1.0.0 — Stack Health Check

  Scanning /Users/dev/myproject...
  Found 5 technologies

  ┌─────────────┬─────────┬────────┬──────┬───────┐
  │ Technology  │ Version │ EOL    │ CVEs │ Grade │
  ├─────────────┼─────────┼────────┼──────┼───────┤
  │ Node.js     │ 18.0    │ Apr 25 │ 0    │ F     │
  │ React       │ 18.2    │ --     │ 0    │ A     │
  │ Python      │ 3.9     │ Oct 25 │ 3    │ F     │
  │ Django      │ 4.2     │ Apr 26 │ 0    │ D     │
  │ Express     │ 4.18    │ --     │ 0    │ A     │
  └─────────────┴─────────┴────────┴──────┴───────┘

  Overall Grade: F (2 of 5 technologies need attention)

  ! Node.js 18.0 has reached EOL. Upgrade recommended.
  ! Django 4.2 is approaching EOL. Plan an upgrade.
```

### `releaserun badges`

Auto-detect your stack and generate [ReleaseRun badges](https://releaserun.com/badges/builder/) for your README.

```bash
releaserun badges                          # health badges (default)
releaserun badges --badge-type eol         # EOL status badges
releaserun badges --badge-type cve         # CVE count badges
releaserun badges --badge-style flat-square # flat-square style
```

Output (copied to clipboard automatically):

```markdown
[![Node.js Health](https://img.releaserun.com/badge/health/nodejs.svg)](https://releaserun.com/tools/dep-eol-scanner/)
[![Python Health](https://img.releaserun.com/badge/health/python.svg)](https://releaserun.com/tools/dep-eol-scanner/)
[![React Health](https://img.releaserun.com/badge/health/react.svg)](https://releaserun.com/tools/dep-eol-scanner/)
```

Every badge links back to the [Dependency EOL Scanner](https://releaserun.com/tools/dep-eol-scanner/) where visitors can run their own check. Want more badge types? Try the [Badge Builder](https://releaserun.com/badges/builder/).

### `releaserun ci`

CI-optimized output. No colors, no table formatting. Useful for parsing in scripts.

```bash
releaserun ci                  # plain text
releaserun ci --json           # JSON output
releaserun ci --fail-on D      # exit 1 if any D grade, exit 2 if any F
```

## Supported Files

Detects technologies from 10+ file formats. Drop it into any project.

| File | What it finds |
|------|---------------|
| `package.json` | Node.js version (from `engines`), npm packages mapped to tech |
| `requirements.txt` / `Pipfile` | Python, pip packages (Django, Flask, FastAPI, etc.) |
| `go.mod` | Go version, module dependencies |
| `Gemfile` | Ruby version, gems (Rails, Sinatra, etc.) |
| `Cargo.toml` | Rust edition, crate dependencies |
| `pom.xml` | Java version, Maven artifacts |
| `composer.json` | PHP version, Composer packages |
| `Dockerfile` | Base image detection (node:20, python:3.11, etc.) |
| `.tool-versions` | asdf-managed runtimes |
| `.node-version` / `.python-version` / `.ruby-version` | Single-runtime version files |

100+ package-to-technology mappings built in. Express, React, Django, Rails, Spring Boot, Laravel, Gin, Actix, PostgreSQL, Redis, and many more.

## Grading

| Grade | Meaning |
|-------|---------|
| **A** | Fully supported, no CVEs, plenty of runway |
| **B** | Supported, EOL in 6-12 months |
| **C** | Approaching EOL (<6 months) or minor CVEs |
| **D** | EOL imminent (<3 months) or moderate CVEs |
| **F** | Already past EOL or 5+ known CVEs |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All technologies grade B or above |
| `1` | Any technology grades C or D |
| `2` | Any technology grades F |

This makes it plug into any CI system:

```yaml
# GitHub Actions
- name: Check stack health
  run: npx releaserun check --fail-on D

# GitLab CI
stack-check:
  script: npx releaserun check --fail-on D

# Pre-commit hook
npx releaserun check --fail-on F
```

## All Options

| Flag | Description | Default |
|------|-------------|---------|
| `--path <dir>` | Directory to scan | current directory |
| `--json` | JSON output | `false` |
| `--fail-on <grade>` | Exit non-zero below this grade | `F` |
| `--badge-style <s>` | `flat` or `flat-square` | `flat` |
| `--badge-type <t>` | `health`, `eol`, `v`, or `cve` | `health` |
| `--no-color` | Disable terminal colors | `false` |
| `--no-cache` | Skip local response cache | `false` |
| `--verbose` | Show API calls and timing | `false` |

## How It Works

1. Scans your project directory for known dependency files
2. Parses each file to extract technology names and versions
3. Checks [endoflife.date](https://endoflife.date) and [ReleaseRun](https://releaserun.com) APIs for EOL dates and CVE counts
4. Caches responses locally (`~/.cache/releaserun/`, 1-hour TTL) so repeated runs are instant
5. Grades each technology A-F and generates warnings

No data leaves your machine except API calls to check version status. Your dependency files are never uploaded anywhere.

## Web Alternative

Don't want to install anything? The same checks are available as free browser-based tools at [releaserun.com/tools](https://releaserun.com/tools/):

- [Dependency EOL Scanner](https://releaserun.com/tools/dep-eol-scanner/) - paste your package.json, requirements.txt, etc.
- [Dockerfile Security Linter](https://releaserun.com/tools/dockerfile-linter/) - security and best practice checks
- [K8s Deprecation Checker](https://releaserun.com/tools/k8s-deprecation-checker/) - find deprecated APIs in manifests
- [Stack Health Scorecard](https://releaserun.com/tools/stack-health/) - pick your stack, get a grade
- [30 free tools total](https://releaserun.com/tools/) - no signup, no API key

## Contributing

Issues and PRs welcome. If a technology or package mapping is missing, open an issue.

## License

MIT

## Links

- [ReleaseRun](https://releaserun.com) - Track release lifecycles for 300+ technologies
- [Free Developer Tools](https://releaserun.com/tools/) - 30 browser-based stack health tools
- [Badge Builder](https://releaserun.com/badges/builder/) - Generate version/EOL/CVE badges
- [Badge API Docs](https://releaserun.github.io/badges) - Full badge API reference with examples
- [EOL Calendar](https://releaserun.com/eol-calendar/) - Upcoming end-of-life dates
- [GitHub Action](https://github.com/Releaserun/releaserun-action) - Automated version checks in CI
