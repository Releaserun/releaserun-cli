import { resolve } from 'node:path';
import { scanDirectory } from '../parsers/index.js';
import { getSlug } from '../mapping/slugs.js';
import { fetchEolData } from '../api/endoflife.js';
import { fetchBadgeData } from '../api/releaserun.js';
import { calculateGrade, calculateOverallGrade } from '../output/grade.js';
import { renderTable } from '../output/table.js';
import type { TechReport, ScanResult, Grade } from '../types.js';

export interface CheckOptions {
  path?: string;
  json?: boolean;
  noColor?: boolean;
  noCache?: boolean;
  verbose?: boolean;
  failOn?: string;
}

export async function runCheck(options: CheckOptions): Promise<ScanResult> {
  const targetDir = resolve(options.path || process.cwd());

  if (options.verbose) {
    process.stderr.write(`\n  Scanning directory: ${targetDir}\n\n`);
  }

  // Scan for technologies
  const detected = scanDirectory(targetDir, { verbose: options.verbose });

  if (detected.length === 0) {
    return {
      grade: '?',
      technologies: [],
      scannedPath: targetDir,
      url: 'https://releaserun.com/tools/dep-eol-scanner/',
    };
  }

  // Fetch data for each technology
  const reports: TechReport[] = [];

  for (const tech of detected) {
    const slug = getSlug(tech.name);

    if (options.verbose) {
      process.stderr.write(`  Fetching data for ${tech.name} (${slug})...\n`);
    }

    // Fetch EOL data and badge data in parallel
    const [eolData, badgeData] = await Promise.all([
      fetchEolData(slug, tech.version, options.noCache).catch(() => null),
      fetchBadgeData(slug, 'health', options.noCache).catch(() => null),
    ]);

    // Determine CVE count (from badge if available, otherwise 0)
    let cves = 0;
    if (badgeData?.value) {
      const cveMatch = badgeData.value.match(/(\d+)\s*CVE/i);
      if (cveMatch) {
        cves = parseInt(cveMatch[1], 10);
      }
    }

    // Use badge grade if available, otherwise calculate
    let grade: Grade;
    if (badgeData?.grade && ['A', 'B', 'C', 'D', 'F'].includes(badgeData.grade)) {
      grade = badgeData.grade as Grade;
    } else {
      grade = calculateGrade(eolData, cves);
    }

    const eolStr = eolData?.eol !== undefined
      ? (typeof eolData.eol === 'string' ? eolData.eol : (eolData.eol ? 'true' : 'false'))
      : null;

    reports.push({
      name: tech.name,
      slug,
      version: tech.version,
      source: tech.source,
      eol: eolStr,
      cves,
      grade,
      latest: eolData?.latest,
      lts: typeof eolData?.lts === 'boolean' ? eolData.lts : !!eolData?.lts,
    });
  }

  const overallGrade = calculateOverallGrade(reports.map(r => r.grade));

  return {
    grade: overallGrade,
    technologies: reports,
    scannedPath: targetDir,
    url: 'https://releaserun.com/tools/dep-eol-scanner/',
  };
}

export function getExitCode(result: ScanResult, failOn: string = 'F'): number {
  const gradeOrder: Grade[] = ['A', 'B', 'C', 'D', 'F'];
  const failIndex = gradeOrder.indexOf(failOn as Grade);
  if (failIndex === -1) return 0;

  for (const tech of result.technologies) {
    if (tech.grade === '?') continue;
    const techIndex = gradeOrder.indexOf(tech.grade);
    if (techIndex >= failIndex) {
      return tech.grade === 'F' ? 2 : 1;
    }
  }

  return 0;
}

export async function printCheckResult(result: ScanResult, options: CheckOptions): Promise<void> {
  if (options.json) {
    const { renderJson } = await import('../output/json.js');
    console.log(renderJson(result));
  } else {
    console.log(renderTable(result, options.noColor));
  }
}
