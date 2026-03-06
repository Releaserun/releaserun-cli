import { resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { scanDirectory } from '../parsers/index.js';
import { generateBadges } from '../output/badges.js';
import { resolveConstraints } from '../resolve.js';
import type { BadgeOptions } from '../output/badges.js';

export interface ReadmeCommandOptions {
  path?: string;
  write?: boolean;
  readme?: string;
  style?: string;
  type?: string;
  verbose?: boolean;
  noCache?: boolean;
}

const START_MARKER = '<!-- releaserun:badges:start -->';
const END_MARKER = '<!-- releaserun:badges:end -->';

export async function runReadme(options: ReadmeCommandOptions): Promise<void> {
  const targetDir = resolve(options.path || process.cwd());

  if (options.verbose) {
    process.stderr.write(`\n  Scanning directory: ${targetDir}\n\n`);
  }

  const detected = scanDirectory(targetDir, { verbose: options.verbose });

  if (detected.length === 0) {
    console.log('\n  No technologies detected. Check that dependency files exist.\n');
    return;
  }

  const resolved = await resolveConstraints(detected, { noCache: options.noCache, verbose: options.verbose });

  const badgeOptions: BadgeOptions = {
    style: (options.style as 'flat' | 'flat-square') || 'flat',
    type: (options.type as 'health' | 'eol' | 'v' | 'cve') || 'health',
  };

  const badges = generateBadges(resolved, badgeOptions);
  const badgeBlock = [START_MARKER, ...badges, END_MARKER].join('\n');

  if (!options.write) {
    console.log('\n' + badgeBlock + '\n');
    return;
  }

  const readmePath = resolve(targetDir, options.readme || 'README.md');

  if (!existsSync(readmePath)) {
    console.error(`  README not found at ${readmePath}`);
    process.exit(1);
  }

  const content = readFileSync(readmePath, 'utf-8');
  const updated = injectBadges(content, badgeBlock);

  writeFileSync(readmePath, updated, 'utf-8');
  console.log(`  Badges written to ${readmePath}`);
}

export function injectBadges(content: string, badgeBlock: string): string {
  // Find marker positions that are NOT inside code fences
  const startIdx = findMarkerOutsideCodeFences(content, START_MARKER);
  const endIdx = findMarkerOutsideCodeFences(content, END_MARKER);

  if (startIdx !== -1 && endIdx !== -1) {
    return content.substring(0, startIdx) + badgeBlock + content.substring(endIdx + END_MARKER.length);
  }

  // Insert after first heading
  const headingMatch = content.match(/^(#\s+.*)$/m);
  if (headingMatch) {
    const headingEnd = content.indexOf(headingMatch[0]) + headingMatch[0].length;
    return content.substring(0, headingEnd) + '\n\n' + badgeBlock + '\n' + content.substring(headingEnd);
  }

  // Prepend if no heading found
  return badgeBlock + '\n\n' + content;
}

/**
 * Find the index of a marker in content, but only if it's outside code fences.
 * Returns -1 if not found or only found inside code fences.
 */
function findMarkerOutsideCodeFences(content: string, marker: string): number {
  // Build list of code fence ranges
  const fenceRanges: Array<{ start: number; end: number }> = [];
  const fenceRegex = /^```/gm;
  let match: RegExpExecArray | null;
  const fencePositions: number[] = [];

  while ((match = fenceRegex.exec(content)) !== null) {
    fencePositions.push(match.index);
  }

  for (let i = 0; i + 1 < fencePositions.length; i += 2) {
    fenceRanges.push({ start: fencePositions[i], end: fencePositions[i + 1] });
  }

  // Search for all occurrences of the marker and return the first one outside fences
  let searchFrom = 0;
  while (true) {
    const idx = content.indexOf(marker, searchFrom);
    if (idx === -1) return -1;

    const insideFence = fenceRanges.some(r => idx >= r.start && idx < r.end);
    if (!insideFence) return idx;

    searchFrom = idx + marker.length;
  }
}
