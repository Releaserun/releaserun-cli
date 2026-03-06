import { resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { scanDirectory } from '../parsers/index.js';
import { generateBadges } from '../output/badges.js';
import type { BadgeOptions } from '../output/badges.js';

export interface ReadmeCommandOptions {
  path?: string;
  write?: boolean;
  readme?: string;
  style?: string;
  type?: string;
  verbose?: boolean;
}

const START_MARKER = '<!-- releaserun:badges:start -->';
const END_MARKER = '<!-- releaserun:badges:end -->';

export function runReadme(options: ReadmeCommandOptions): void {
  const targetDir = resolve(options.path || process.cwd());

  if (options.verbose) {
    process.stderr.write(`\n  Scanning directory: ${targetDir}\n\n`);
  }

  const detected = scanDirectory(targetDir, { verbose: options.verbose });

  if (detected.length === 0) {
    console.log('\n  No technologies detected. Check that dependency files exist.\n');
    return;
  }

  const badgeOptions: BadgeOptions = {
    style: (options.style as 'flat' | 'flat-square') || 'flat',
    type: (options.type as 'health' | 'eol' | 'v' | 'cve') || 'health',
  };

  const badges = generateBadges(detected, badgeOptions);
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
  const startIdx = content.indexOf(START_MARKER);
  const endIdx = content.indexOf(END_MARKER);

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
