import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { PIP_TECH_MAP, PIP_INDICATOR_MAP } from '../mapping/packages.js';

export function parsePyprojectToml(dir: string): ParseResult {
  const filePath = join(dir, 'pyproject.toml');
  const technologies: DetectedTech[] = [];

  if (!existsSync(filePath)) {
    return { technologies };
  }

  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return { technologies };
  }

  const seen = new Set<string>();

  // Extract requires-python (e.g. requires-python = ">=3.11")
  const pythonMatch = content.match(/requires-python\s*=\s*["']([^"']+)["']/);
  if (pythonMatch) {
    const version = extractVersion(pythonMatch[1]);
    if (version) {
      seen.add('python');
      technologies.push({
        name: 'python',
        version,
        source: 'pyproject.toml (requires-python)',
      });
    }
  }

  // Extract dependencies from [project] section
  // TOML arrays: dependencies = ["django>=5.0", "psycopg[binary]>=3.1"]
  // Can't use simple regex for [] because extras like [binary] contain brackets
  // Instead, find the dependencies array start and manually find its end
  const depsStart = content.match(/\[project\][\s\S]*?dependencies\s*=\s*\[/);
  let depsBlock = '';
  if (depsStart) {
    const startIdx = (depsStart.index ?? 0) + depsStart[0].length;
    let depth = 1;
    let i = startIdx;
    while (i < content.length && depth > 0) {
      if (content[i] === '[') depth++;
      if (content[i] === ']') depth--;
      if (depth > 0) depsBlock += content[i];
      i++;
    }
  }
  if (depsBlock) {
    // Match quoted strings in the array
    const pkgMatches = depsBlock.matchAll(/["']([^"']+)["']/g);
    
    for (const match of pkgMatches) {
      const spec = match[1].trim();
      // Parse "django>=5.0" or "psycopg[binary]>=3.1" or "redis"
      const pkgMatch = spec.match(/^([a-zA-Z0-9_-]+)(?:\[[^\]]*\])?\s*(?:[>=<~!]+\s*([0-9][^\s,;]*))?/);
      if (!pkgMatch) continue;

      const pkgName = pkgMatch[1].toLowerCase();
      const version = pkgMatch[2] || 'unknown';

      // Direct match (pip version = tech version)
      const directTech = PIP_TECH_MAP[pkgName];
      if (directTech && !seen.has(directTech)) {
        seen.add(directTech);
        technologies.push({
          name: directTech,
          version: extractMajorMinor(version),
          source: `pyproject.toml (${pkgName})`,
        });
        continue;
      }

      // Indicator match
      const indicatorTech = PIP_INDICATOR_MAP[pkgName];
      if (indicatorTech && !seen.has(indicatorTech)) {
        seen.add(indicatorTech);
        technologies.push({
          name: indicatorTech,
          version: 'unknown',
          source: `pyproject.toml (${pkgName})`,
        });
      }
    }
  }

  // If dependencies found but no python version, add unknown
  if (technologies.length > 0 && !seen.has('python')) {
    technologies.unshift({
      name: 'python',
      version: 'unknown',
      source: 'pyproject.toml',
    });
  }

  return { technologies };
}

function extractVersion(constraint: string): string {
  const cleaned = constraint.replace(/^[>=<~!]+\s*/, '').trim();
  const match = cleaned.match(/^(\d+)\.(\d+)/);
  if (match) {
    return `${match[1]}.${match[2]}`;
  }
  const majorMatch = cleaned.match(/^(\d+)/);
  return majorMatch ? majorMatch[1] : '';
}

function extractMajorMinor(version: string): string {
  const match = version.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return version;
}
