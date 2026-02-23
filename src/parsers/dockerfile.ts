import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { DOCKER_IMAGE_MAP } from '../mapping/packages.js';

export function parseDockerfile(dir: string): ParseResult {
  const technologies: DetectedTech[] = [];

  // Try Dockerfile, dockerfile, Dockerfile.dev, etc.
  const candidates = ['Dockerfile', 'dockerfile', 'Dockerfile.dev', 'Dockerfile.prod'];
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

  // Parse FROM lines
  const fromLines = content.match(/^FROM\s+(\S+)/gm);
  if (!fromLines) {
    return { technologies };
  }

  for (const fromLine of fromLines) {
    const match = fromLine.match(/^FROM\s+(?:--platform=\S+\s+)?(\S+)/);
    if (!match) continue;

    const image = match[1];

    // Parse image:tag format
    // Handle registry/image:tag, image:tag, image
    const parts = image.split('/');
    const lastPart = parts[parts.length - 1];
    const [imageName, tag] = lastPart.split(':');

    const tech = DOCKER_IMAGE_MAP[imageName];
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      const version = extractVersionFromTag(tag || 'latest');
      technologies.push({
        name: tech,
        version,
        source: `${foundFile} (FROM ${image})`,
      });
    }
  }

  return { technologies };
}

function extractVersionFromTag(tag: string): string {
  // Try to extract version number from tags like "3.9-slim", "20-alpine", "16.04"
  const match = tag.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return tag;
}
