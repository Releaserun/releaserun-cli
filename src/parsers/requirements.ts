import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { PIP_TECH_MAP } from '../mapping/packages.js';

export function parseRequirementsTxt(dir: string): ParseResult {
  const technologies: DetectedTech[] = [];
  const seen = new Set<string>();

  // Try requirements.txt
  const reqPath = join(dir, 'requirements.txt');
  if (existsSync(reqPath)) {
    parseReqFile(reqPath, 'requirements.txt', technologies, seen);
  }

  // Try Pipfile
  const pipfilePath = join(dir, 'Pipfile');
  if (existsSync(pipfilePath)) {
    parsePipfile(pipfilePath, technologies, seen);
  }

  // If we found any pip packages, Python is implied
  if (technologies.length > 0 && !seen.has('python')) {
    technologies.unshift({
      name: 'python',
      version: 'unknown',
      source: existsSync(reqPath) ? 'requirements.txt' : 'Pipfile',
    });
  }

  return { technologies };
}

function parseReqFile(
  filePath: string,
  sourceName: string,
  technologies: DetectedTech[],
  seen: Set<string>,
): void {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) {
      continue;
    }

    // Parse "package==1.2.3" or "package>=1.2" or "package"
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*(?:[>=<~!]+\s*([0-9][^\s,;]*))?/);
    if (!match) continue;

    const pkgName = match[1].toLowerCase();
    const version = match[2] || 'unknown';

    const tech = PIP_TECH_MAP[pkgName];
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      technologies.push({
        name: tech,
        version: extractMajorMinor(version),
        source: `${sourceName} (${pkgName})`,
      });
    }
  }
}

function parsePipfile(
  filePath: string,
  technologies: DetectedTech[],
  seen: Set<string>,
): void {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }

  // Extract python_version from Pipfile
  const pythonMatch = content.match(/python_version\s*=\s*"([^"]+)"/);
  if (pythonMatch && !seen.has('python')) {
    seen.add('python');
    technologies.push({
      name: 'python',
      version: pythonMatch[1],
      source: 'Pipfile (python_version)',
    });
  }

  // Parse package entries
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*"?([^"]*)"?/);
    if (!match) continue;

    const pkgName = match[1].toLowerCase();
    const tech = PIP_TECH_MAP[pkgName];
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      const version = match[2].replace(/[>=<~^*]/g, '').trim() || 'unknown';
      technologies.push({
        name: tech,
        version: extractMajorMinor(version),
        source: `Pipfile (${pkgName})`,
      });
    }
  }
}

function extractMajorMinor(version: string): string {
  const match = version.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return version;
}
