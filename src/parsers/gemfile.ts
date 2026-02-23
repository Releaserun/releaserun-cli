import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { RUBY_TECH_MAP } from '../mapping/packages.js';

export function parseGemfile(dir: string): ParseResult {
  const filePath = join(dir, 'Gemfile');
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

  // Extract Ruby version from ruby directive
  const rubyVersionMatch = content.match(/^ruby\s+['"]([^'"]+)['"]/m);
  if (rubyVersionMatch) {
    const version = parseVersionConstraint(rubyVersionMatch[1]);
    if (version) {
      technologies.push({
        name: 'ruby',
        version: version,
        source: 'Gemfile (ruby directive)',
      });
    }
  }

  // Extract gems
  const seen = new Set<string>();
  const gemMatches = content.matchAll(/^gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/gm);
  
  for (const match of gemMatches) {
    const gemName = match[1];
    const versionConstraint = match[2];
    
    const tech = RUBY_TECH_MAP[gemName];
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      const version = versionConstraint ? parseVersionConstraint(versionConstraint) : 'latest';
      technologies.push({
        name: tech,
        version: version || 'unknown',
        source: `Gemfile (${gemName})`,
      });
    }
  }

  return { technologies };
}

function parseVersionConstraint(constraint: string): string {
  // Strip common Ruby version prefixes: ~>, >=, =, v
  const cleaned = constraint.replace(/^[~>=<v\s]+/, '').trim();
  // Take first version if there's a range
  const first = cleaned.split(/\s/)[0];
  // Extract major.minor
  const match = first.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}