import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { RUST_TECH_MAP } from '../mapping/packages.js';

export function parseCargoToml(dir: string): ParseResult {
  const filePath = join(dir, 'Cargo.toml');
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

  // Extract Rust edition (approximates version)
  const editionMatch = content.match(/^edition\s*=\s*["'](\d+)["']/m);
  if (editionMatch) {
    const edition = editionMatch[1];
    // Map edition to approximate Rust version
    const versionMap: Record<string, string> = {
      '2015': '1.0',
      '2018': '1.31',
      '2021': '1.56',
      '2024': '1.76',
    };
    const rustVersion = versionMap[edition] || edition;
    technologies.push({
      name: 'rust',
      version: rustVersion,
      source: `Cargo.toml (edition ${edition})`,
    });
  }

  // Parse dependencies sections
  const sections = ['dependencies', 'dev-dependencies', 'build-dependencies'];
  const seen = new Set<string>();

  for (const section of sections) {
    const sectionMatch = content.match(new RegExp(`\\[${section}\\]([^\\[]*)`, 'i'));
    if (sectionMatch) {
      const sectionContent = sectionMatch[1];
      // Match crate = "version" or crate = { version = "..." }
      const crateMatches = sectionContent.matchAll(/^(\w+(?:-\w+)*)\s*=\s*(?:"([^"]+)"|{[^}]*version\s*=\s*"([^"]+)")/gm);
      
      for (const match of crateMatches) {
        const crateName = match[1];
        const version = match[2] || match[3];
        
        const tech = RUST_TECH_MAP[crateName];
        if (tech && !seen.has(tech)) {
          seen.add(tech);
          const parsedVersion = version ? parseVersionConstraint(version) : 'latest';
          technologies.push({
            name: tech,
            version: parsedVersion || 'unknown',
            source: `Cargo.toml (${crateName})`,
          });
        }
      }
    }
  }

  // If no Rust version found but Cargo.toml exists, assume latest
  if (!technologies.some(t => t.name === 'rust')) {
    technologies.push({
      name: 'rust',
      version: 'latest',
      source: 'Cargo.toml',
    });
  }

  return { technologies };
}

function parseVersionConstraint(constraint: string): string {
  // Strip Cargo version prefixes: ^, ~, >=, =
  const cleaned = constraint.replace(/^[\^~>=<\s]+/, '').trim();
  // Take first version if there's a range
  const first = cleaned.split(/[,\s]/)[0];
  // Extract major.minor
  const match = first.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}