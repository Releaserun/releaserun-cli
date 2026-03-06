import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';

interface VersionFileConfig {
  filename: string;
  tech: string;
  // 'major' for techs where release cycles are major versions (Node.js 22, not 22.12)
  // 'major.minor' for techs where release cycles are major.minor (Python 3.12, Go 1.23)
  versionStyle: 'major' | 'major.minor';
}

const VERSION_FILES: VersionFileConfig[] = [
  { filename: '.node-version', tech: 'nodejs', versionStyle: 'major' },
  { filename: '.nvmrc', tech: 'nodejs', versionStyle: 'major' },
  { filename: '.python-version', tech: 'python', versionStyle: 'major.minor' },
  { filename: '.ruby-version', tech: 'ruby', versionStyle: 'major.minor' },
  { filename: '.go-version', tech: 'golang', versionStyle: 'major.minor' },
];

export function parseVersionFiles(dir: string): ParseResult {
  const technologies: DetectedTech[] = [];
  const seen = new Set<string>();

  // Check individual version files
  for (const config of VERSION_FILES) {
    const filePath = join(dir, config.filename);
    if (!existsSync(filePath)) continue;

    try {
      const content = readFileSync(filePath, 'utf-8').trim();
      const version = extractVersion(content, config.versionStyle);
      if (version && !seen.has(config.tech)) {
        seen.add(config.tech);
        technologies.push({
          name: config.tech,
          version,
          source: config.filename,
        });
      }
    } catch {
      continue;
    }
  }

  // Parse .tool-versions (asdf)
  const toolVersionsPath = join(dir, '.tool-versions');
  if (existsSync(toolVersionsPath)) {
    try {
      const content = readFileSync(toolVersionsPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const parts = trimmed.split(/\s+/);
        if (parts.length < 2) continue;

        const toolName = parts[0].toLowerCase();
        const version = extractVersion(parts[1]);

        const techMap: Record<string, { tech: string; style: 'major' | 'major.minor' }> = {
          'nodejs': { tech: 'nodejs', style: 'major' },
          'node': { tech: 'nodejs', style: 'major' },
          'python': { tech: 'python', style: 'major.minor' },
          'ruby': { tech: 'ruby', style: 'major.minor' },
          'golang': { tech: 'golang', style: 'major.minor' },
          'go': { tech: 'golang', style: 'major.minor' },
          'java': { tech: 'java', style: 'major' },
          'rust': { tech: 'rust', style: 'major.minor' },
          'php': { tech: 'php', style: 'major.minor' },
          'elixir': { tech: 'elixir', style: 'major.minor' },
          'erlang': { tech: 'erlang', style: 'major.minor' },
        };

        const entry = techMap[toolName];
        if (entry && !seen.has(entry.tech)) {
          const parsedVersion = extractVersion(parts[1], entry.style);
          if (parsedVersion) {
            seen.add(entry.tech);
            technologies.push({
              name: entry.tech,
              version: parsedVersion,
              source: `.tool-versions (${toolName})`,
            });
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return { technologies };
}

function extractVersion(raw: string, style: 'major' | 'major.minor' = 'major.minor'): string {
  // Strip 'v' prefix
  const cleaned = raw.replace(/^v/, '').trim();
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    if (style === 'major') {
      // For Node.js etc: 22.12.0 → 22 (release cycles are major versions)
      return match[1];
    }
    // For Python/Go/Ruby: 3.12.0 → 3.12 (release cycles are major.minor)
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}
