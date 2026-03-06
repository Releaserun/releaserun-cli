import { resolve } from 'node:path';
import { scanDirectory } from '../parsers/index.js';
import { renderBadgeOutput } from '../output/badges.js';
import { resolveConstraints } from '../resolve.js';
import type { BadgeOptions } from '../output/badges.js';

export interface BadgesCommandOptions {
  path?: string;
  badgeStyle?: string;
  badgeType?: string;
  verbose?: boolean;
  noCache?: boolean;
}

export async function runBadges(options: BadgesCommandOptions): Promise<void> {
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
    style: (options.badgeStyle as 'flat' | 'flat-square') || 'flat',
    type: (options.badgeType as 'health' | 'eol' | 'v' | 'cve') || 'health',
  };

  const output = renderBadgeOutput(resolved, badgeOptions);
  console.log(output);
}
