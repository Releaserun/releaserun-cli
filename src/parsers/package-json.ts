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
    const parsed = parseVersionConstraint(engines.node);
    if (parsed.version) {
      technologies.push({
        name: 'nodejs',
        version: parsed.version,
        source: 'package.json (engines.node)',
        constraintType: parsed.constraintType,
        originalConstraint: parsed.isConstraint ? engines.node.trim() : undefined,
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
      const parsed = parseVersionConstraint(versionRange);
      if (parsed.version && parsed.version !== '*' && parsed.version !== 'latest' && parsed.version !== 'x') {
        technologies.push({
          name: directTech,
          version: parsed.version,
          source: `package.json (${pkgName})`,
          constraintType: parsed.constraintType,
          originalConstraint: parsed.isConstraint ? versionRange.trim() : undefined,
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

interface ParsedConstraint {
  version: string;
  constraintType: 'pinned' | 'minimum' | 'range';
  isConstraint: boolean;
}

function parseVersionConstraint(constraint: string): ParsedConstraint {
  const trimmed = constraint.trim();

  // Handle wildcards and non-version values
  if (trimmed === '*' || trimmed === 'latest' || trimmed === 'x' || trimmed === '') {
    return { version: trimmed || 'unknown', constraintType: 'pinned', isConstraint: false };
  }

  // Detect constraint type
  const hasOr = /\|\|/.test(trimmed);
  const hasGte = /^>=/.test(trimmed);
  const hasCaret = /^\^/.test(trimmed);
  const hasTilde = /^~/.test(trimmed);
  const hasRange = /\s+-\s+/.test(trimmed);

  // For || ranges (e.g. "18 || 20 || 22"), pick the HIGHEST version
  if (hasOr) {
    const parts = trimmed.split(/\s*\|\|\s*/);
    let highest = '';
    let highestMajor = -1;
    for (const part of parts) {
      const cleaned = part.replace(/^[\^~>=<v\s]+/, '').trim();
      const m = cleaned.match(/^(\d+)/);
      if (m) {
        const major = parseInt(m[1], 10);
        if (major > highestMajor) {
          highestMajor = major;
          highest = cleaned;
        }
      }
    }
    if (highest) {
      const m = highest.match(/^(\d+)(?:\.(\d+))?/);
      const version = m ? (m[2] && m[2] !== '0' ? `${m[1]}.${m[2]}` : m[1]) : highest;
      return { version, constraintType: 'range', isConstraint: true };
    }
  }

  // For >= constraints, this is a MINIMUM. Store it but flag it.
  if (hasGte) {
    const cleaned = trimmed.replace(/^>=\s*/, '').split(/\s/)[0].replace(/^v/, '');
    const match = cleaned.match(/^(\d+)(?:\.(\d+))?/);
    if (match) {
      const version = match[2] && match[2] !== '0'
        ? `${match[1]}.${match[2]}`
        : match[1];
      return { version, constraintType: 'minimum', isConstraint: true };
    }
  }

  // For ^ and ~ (semver ranges), these are close to pinned for major.minor
  // ^18.0.0 means >=18.0.0 <19.0.0 — effectively "uses 18.x"
  // ~18.0.0 means >=18.0.0 <18.1.0 — effectively "uses 18.0.x"
  // These are reasonable to treat as the stated version
  if (hasCaret || hasTilde) {
    const cleaned = trimmed.replace(/^[\^~]\s*/, '').trim();
    const match = cleaned.match(/^(\d+)(?:\.(\d+))?/);
    if (match) {
      const version = match[2] && match[2] !== '0'
        ? `${match[1]}.${match[2]}`
        : match[1];
      return { version, constraintType: 'pinned', isConstraint: false };
    }
  }

  // Plain version (pinned)
  const cleaned = trimmed.replace(/^[=v\s]+/, '').trim().split(/\s/)[0];
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    const version = match[2] && match[2] !== '0'
      ? `${match[1]}.${match[2]}`
      : match[1];
    return { version, constraintType: 'pinned', isConstraint: false };
  }
  return { version: cleaned, constraintType: 'pinned', isConstraint: false };
}
