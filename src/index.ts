#!/usr/bin/env node

import { Command } from 'commander';
import { runCheck, getExitCode } from './commands/check.js';
import { runBadges } from './commands/badges.js';
import { runCi } from './commands/ci.js';
import { renderTable } from './output/table.js';
import { renderJson } from './output/json.js';

const program = new Command();

program
  .name('releaserun')
  .description('Scan your project for EOL dependencies, CVEs, and version health. Get a grade.')
  .version('1.0.0');

program
  .command('check')
  .description('Scan a directory for dependency files and report EOL/CVE status')
  .option('-p, --path <dir>', 'Directory to scan (default: cwd)')
  .option('--json', 'Output JSON instead of table')
  .option('--no-color', 'Disable terminal colours')
  .option('--no-cache', 'Bypass response cache')
  .option('--verbose', 'Show detailed output')
  .option('--fail-on <grade>', 'Exit non-zero if any tech is below this grade', 'F')
  .action(async (opts) => {
    try {
      const result = await runCheck({
        path: opts.path,
        json: opts.json,
        noColor: opts.color === false,
        noCache: opts.cache === false,
        verbose: opts.verbose,
        failOn: opts.failOn,
      });

      if (opts.json) {
        console.log(renderJson(result));
      } else {
        console.log(renderTable(result, opts.color === false));
      }

      const exitCode = getExitCode(result, opts.failOn);
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('badges')
  .description('Generate README badge markdown for detected technologies')
  .option('-p, --path <dir>', 'Directory to scan (default: cwd)')
  .option('--badge-style <style>', 'Badge style: flat or flat-square', 'flat')
  .option('--badge-type <type>', 'Badge type: health, eol, v, or cve', 'health')
  .option('--verbose', 'Show detailed output')
  .action((opts) => {
    try {
      runBadges({
        path: opts.path,
        badgeStyle: opts.badgeStyle,
        badgeType: opts.badgeType,
        verbose: opts.verbose,
      });
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('ci')
  .description('CI-optimised output (no colours, machine-readable)')
  .option('-p, --path <dir>', 'Directory to scan (default: cwd)')
  .option('--json', 'Output JSON')
  .option('--no-cache', 'Bypass response cache')
  .option('--verbose', 'Show detailed output')
  .option('--fail-on <grade>', 'Exit non-zero if any tech is below this grade', 'F')
  .action(async (opts) => {
    try {
      await runCi({
        path: opts.path,
        json: opts.json,
        noCache: opts.cache === false,
        verbose: opts.verbose,
        failOn: opts.failOn,
      });
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();
