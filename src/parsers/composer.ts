import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { PHP_TECH_MAP } from '../mapping/packages.js';

export function parseComposerJson(dir: string): ParseResult {
  const filePath = join(dir, 'composer.json');
  const technologies: DetectedTech[] = [];

  if (!existsSync(filePath)) {
    return { technologies };
  }

  let composer: Record<string, unknown>;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    composer = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { technologies };
  }

  // Extract PHP version from require.php
  const require = composer.require as Record<string, string> | undefined;
  if (require?.php) {
    const version = parseVersionConstraint(require.php);
    if (version) {
      technologies.push({
        name: 'php',
        version: version,
        source: 'composer.json (require.php)',
      });
    }
  }

  // Scan require and require-dev for known packages
  const allDeps: Record<string, string> = {
    ...(require || {}),
    ...((composer['require-dev'] as Record<string, string>) || {}),
  };

  const seen = new Set<string>();

  for (const [pkgName, versionConstraint] of Object.entries(allDeps)) {
    // Skip php version (already handled above)
    if (pkgName === 'php') continue;

    const tech = PHP_TECH_MAP[pkgName];
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      const version = parseVersionConstraint(versionConstraint);
      technologies.push({
        name: tech,
        version: version || 'unknown',
        source: `composer.json (${pkgName})`,
      });
    }
  }

  // If no PHP version found but composer.json exists, assume PHP 8.0
  if (!technologies.some(t => t.name === 'php')) {
    technologies.push({
      name: 'php',
      version: '8.0',
      source: 'composer.json',
    });
  }

  return { technologies };
}

function parseVersionConstraint(constraint: string): string {
  // Strip PHP/Composer version prefixes: ^, ~, >=, =, v
  const cleaned = constraint.replace(/^[\^~>=<v\s]+/, '').trim();
  // Take first version if there's a range or OR condition
  const first = cleaned.split(/[\s\|]/)[0];
  // Extract major.minor
  const match = first.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}