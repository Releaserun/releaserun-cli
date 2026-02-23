import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { GO_TECH_MAP } from '../mapping/packages.js';

export function parseGoMod(dir: string): ParseResult {
  const filePath = join(dir, 'go.mod');
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

  // Extract Go version
  const goVersionMatch = content.match(/^go\s+(\d+\.\d+)/m);
  if (goVersionMatch) {
    technologies.push({
      name: 'golang',
      version: goVersionMatch[1],
      source: 'go.mod (go directive)',
    });
  }

  // Parse require blocks and single requires
  const seen = new Set<string>();
  const requireBlockMatch = content.match(/require\s*\(([\s\S]*?)\)/g);
  const singleRequireMatch = content.match(/^require\s+(\S+)\s+v?(\S+)/gm);

  const lines: string[] = [];

  if (requireBlockMatch) {
    for (const block of requireBlockMatch) {
      const inner = block.replace(/require\s*\(/, '').replace(/\)/, '');
      lines.push(...inner.split('\n'));
    }
  }

  if (singleRequireMatch) {
    lines.push(...singleRequireMatch.map(l => l.replace(/^require\s+/, '')));
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    const match = trimmed.match(/^(\S+)\s+v?(\d+\.\d+)/);
    if (!match) continue;

    const modulePath = match[1];
    const version = match[2];

    // Check full path first, then check prefixes
    let tech: string | undefined;
    for (const [pattern, techName] of Object.entries(GO_TECH_MAP)) {
      if (modulePath.startsWith(pattern)) {
        tech = techName;
        break;
      }
    }

    if (tech && !seen.has(tech)) {
      seen.add(tech);
      technologies.push({
        name: tech,
        version,
        source: `go.mod (${modulePath})`,
      });
    }
  }

  return { technologies };
}
