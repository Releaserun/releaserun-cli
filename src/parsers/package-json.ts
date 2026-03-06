import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { NPM_TECH_MAP, NPM_INDICATOR_MAP } from '../mapping/packages.js';

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

  // Initialize seen with technologies already detected (e.g. from engines.node)
  const seen = new Set<string>(technologies.map(t => t.name));

  for (const [pkgName, versionRange] of Object.entries(allDeps)) {
    // Direct version match (package version IS the tech version)
    const directTech = NPM_TECH_MAP[pkgName];
    if (directTech && !seen.has(directTech)) {
      seen.add(directTech);
      const version = parseVersionConstraint(versionRange);
      if (version && version !== '*' && version !== 'latest' && version !== 'x') {
        technologies.push({
          name: directTech,
          version,
          source: `package.json (${pkgName})`,
        });
      } else {
        technologies.push({
          name: directTech,
          version: 'unknown',
          source: `package.json (${pkgName})`,
        });
      }
      continue;
    }

    // Indicator only (detects tech, but client version ≠ tech version)
    const indicatorTech = NPM_INDICATOR_MAP[pkgName];
    if (indicatorTech && !seen.has(indicatorTech)) {
      seen.add(indicatorTech);
      technologies.push({
        name: indicatorTech,
        version: 'unknown',
        source: `package.json (${pkgName})`,
      });
    }
  }

  return { technologies };
}

function parseVersionConstraint(constraint: string): string {
  const trimmed = constraint.trim();

  // Handle wildcards and non-version values
  if (trimmed === '*' || trimmed === 'latest' || trimmed === 'x' || trimmed === '') {
    return trimmed || 'unknown';
  }

  // Strip common prefixes: ^, ~, >=, =, v
  const cleaned = trimmed.replace(/^[\^~>=<v\s]+/, '').trim();
  // Take first version if there's a range (e.g. ">=16.0.0 <18.0.0")
  const first = cleaned.split(/\s/)[0];
  // Extract major.minor (drop patch for API lookups)
  const match = first.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    // For engines.node ">=18.0.0", return "18" not "18.0"
    if (match[2] === '0') {
      return match[1];
    }
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}
