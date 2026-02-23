import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { NPM_TECH_MAP } from '../mapping/packages.js';

export function parsePackageJson(dir: string): ParseResult {
  const filePath = join(dir, 'package.json');
  const technologies: DetectedTech[] = [];

  if (!existsSync(filePath)) {
    return { technologies };
  }

  let pkg: Record<string, unknown>;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    pkg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { technologies };
  }

  // Extract Node.js version from engines.node
  const engines = pkg.engines as Record<string, string> | undefined;
  if (engines?.node) {
    const nodeVersion = parseVersionConstraint(engines.node);
    if (nodeVersion) {
      technologies.push({
        name: 'nodejs',
        version: nodeVersion,
        source: 'package.json (engines.node)',
      });
    }
  }

  // Scan dependencies and devDependencies for known packages
  const allDeps: Record<string, string> = {
    ...((pkg.dependencies as Record<string, string>) || {}),
    ...((pkg.devDependencies as Record<string, string>) || {}),
  };

  const seen = new Set<string>();

  for (const [pkgName, versionRange] of Object.entries(allDeps)) {
    const tech = NPM_TECH_MAP[pkgName];
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      const version = parseVersionConstraint(versionRange);
      technologies.push({
        name: tech,
        version: version || 'unknown',
        source: `package.json (${pkgName})`,
      });
    }
  }

  return { technologies };
}

function parseVersionConstraint(constraint: string): string {
  // Strip common prefixes: ^, ~, >=, =, v
  const cleaned = constraint.replace(/^[\^~>=<v\s]+/, '').trim();
  // Take first version if there's a range (e.g. ">=16.0.0 <18.0.0")
  const first = cleaned.split(/\s/)[0];
  // Extract major.minor (drop patch for API lookups)
  const match = first.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}
