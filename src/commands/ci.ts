import { runCheck, getExitCode } from './check.js';
import { renderJson } from '../output/json.js';
import { renderTable } from '../output/table.js';

export interface CiCommandOptions {
  path?: string;
  json?: boolean;
  noCache?: boolean;
  verbose?: boolean;
  failOn?: string;
}

export async function runCi(options: CiCommandOptions): Promise<void> {
  const result = await runCheck({
    path: options.path,
    noColor: true,
    noCache: options.noCache,
    verbose: options.verbose,
    failOn: options.failOn,
  });

  if (options.json) {
    console.log(renderJson(result));
  } else {
    console.log(renderTable(result, true));
  }

  const exitCode = getExitCode(result, options.failOn);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
