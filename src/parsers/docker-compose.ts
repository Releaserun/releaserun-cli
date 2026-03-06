import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { DOCKER_IMAGE_MAP } from '../mapping/packages.js';

export function parseDockerCompose(dir: string): ParseResult {
  const technologies: DetectedTech[] = [];
  const candidates = [
    'docker-compose.yml',
    'docker-compose.yaml',
    'compose.yml',
    'compose.yaml',
  ];

  let content: string | null = null;
  let foundFile = '';

  for (const name of candidates) {
    const filePath = join(dir, name);
    if (existsSync(filePath)) {
      try {
        content = readFileSync(filePath, 'utf-8');
        foundFile = name;
        break;
      } catch {
        continue;
      }
    }
  }

  if (!content) {
    return { technologies };
  }

  const seen = new Set<string>();

  // Match image: lines (handles "image: postgres:16-alpine", "image: redis:7.4", etc.)
  const imageLines = content.match(/^\s*image:\s*['"]?(\S+?)['"]?\s*$/gm);
  if (!imageLines) {
    return { technologies };
  }

  for (const line of imageLines) {
    const match = line.match(/image:\s*['"]?(\S+?)['"]?\s*$/);
    if (!match) continue;

    const image = match[1];
    const parts = image.split('/');
    const lastPart = parts[parts.length - 1];
    const [imageName, tag] = lastPart.split(':');

    const tech = DOCKER_IMAGE_MAP[imageName];
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      const version = tag ? extractVersionFromTag(tag) : 'unknown';
      technologies.push({
        name: tech,
        version: version !== 'latest' ? version : 'unknown',
        source: `${foundFile} (${image})`,
      });
    }
  }

  return { technologies };
}

function extractVersionFromTag(tag: string): string {
  const match = tag.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return tag;
}
