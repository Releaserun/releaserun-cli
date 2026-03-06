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

  // Parse FROM lines (capture whole line for proper parsing)
  const fromLines = content.match(/^FROM\s+.+$/gm);
  if (!fromLines) {
    return { technologies };
  }

  for (const fromLine of fromLines) {
    // Handle --platform flag and AS alias
    const match = fromLine.match(/^FROM\s+(?:--\w+=\S+\s+)*(\S+)/);
    if (!match) continue;

    let image = match[1];

    // Strip AS alias if stuck to image (shouldn't happen but defensive)
    image = image.split(/\s+/)[0];

    // Skip unresolved ARG/ENV variables (e.g. ${NODE_VERSION})
    if (image.includes('${') || image.includes('$')) {
      continue;
    }

    // Skip digest-only references (e.g. python@sha256:abc123)
    if (image.includes('@sha256:')) {
      // Try to extract image name for detection, but version unknown
      const digestImage = image.split('@')[0];
      const digestParts = digestImage.split('/');
      const digestLast = digestParts[digestParts.length - 1];
      const digestTech = DOCKER_IMAGE_MAP[digestLast];
      if (digestTech && !seen.has(digestTech)) {
        seen.add(digestTech);
        technologies.push({
          name: digestTech,
          version: 'unknown',
          source: `${foundFile} (FROM ${image})`,
        });
      }
      continue;
    }

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
