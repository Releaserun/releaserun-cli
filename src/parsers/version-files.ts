import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';

interface VersionFileConfig {
  filename: string;
  tech: string;
}

const VERSION_FILES: VersionFileConfig[] = [
  { filename: '.node-version', tech: 'nodejs' },
  { filename: '.nvmrc', tech: 'nodejs' },
  { filename: '.python-version', tech: 'python' },
  { filename: '.ruby-version', tech: 'ruby' },
  { filename: '.go-version', tech: 'golang' },
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
      const version = extractVersion(content);
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

        const techMap: Record<string, string> = {
          'nodejs': 'nodejs',
          'node': 'nodejs',
          'python': 'python',
          'ruby': 'ruby',
          'golang': 'golang',
          'go': 'golang',
          'java': 'java',
          'rust': 'rust',
          'php': 'php',
          'elixir': 'elixir',
          'erlang': 'erlang',
        };

        const tech = techMap[toolName];
        if (tech && version && !seen.has(tech)) {
          seen.add(tech);
          technologies.push({
            name: tech,
            version,
            source: `.tool-versions (${toolName})`,
          });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return { technologies };
}

function extractVersion(raw: string): string {
  // Strip 'v' prefix and extract major.minor
  const cleaned = raw.replace(/^v/, '').trim();
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}
