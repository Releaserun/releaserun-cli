import { resolve } from 'node:path';
import { scanDirectory } from '../parsers/index.js';
import { getSlug } from '../mapping/slugs.js';
import { fetchEolData, fetchProductCycles } from '../api/endoflife.js';
import { fetchBadgeData } from '../api/releaserun.js';
import { calculateGrade, calculateOverallGrade } from '../output/grade.js';
import { renderTable } from '../output/table.js';
import type { TechReport, ScanResult, Grade, DetectedTech } from '../types.js';

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

  // Resolve minimum constraints to actual latest supported version
  const resolved = await resolveConstraints(detected, options);

  // Fetch data for each technology
  const reports: TechReport[] = [];

  for (const tech of resolved) {
    const slug = getSlug(tech.name);

    if (options.verbose) {
      process.stderr.write(`  Fetching data for ${tech.name} (${slug})...\n`);
    }

    // Skip API calls for unknown versions — we can't grade what we don't know
    const hasVersion = tech.version && tech.version !== 'unknown';

    // Fetch EOL data and badge data in parallel (only if version is known)
    const [eolData, badgeData] = hasVersion
      ? await Promise.all([
          fetchEolData(slug, tech.version, options.noCache).catch(() => null),
          fetchBadgeData(slug, 'health', options.noCache, tech.version).catch(() => null),
        ])
      : [null, null];

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

/**
 * For technologies detected with constraintType='minimum' (e.g. >=18),
 * resolve to the highest ACTIVE cycle from endoflife.date that satisfies
 * the minimum.  Pinned / range versions pass through unchanged.
 */
async function resolveConstraints(
  detected: DetectedTech[],
  options: CheckOptions,
): Promise<DetectedTech[]> {
  const results: DetectedTech[] = [];

  for (const tech of detected) {
    if (tech.constraintType !== 'minimum' || !tech.version) {
      results.push(tech);
      continue;
    }

    const slug = getSlug(tech.name);
    try {
      const cycles = await fetchProductCycles(slug, options.noCache);
      if (!cycles || cycles.length === 0) {
        // Can't resolve — keep original but annotate source
        results.push({
          ...tech,
          source: `${tech.source} (min constraint)`,
        });
        continue;
      }

      const today = new Date().toISOString().slice(0, 10);
      const minMajor = parseMajor(tech.version);
      const minMinor = parseMinor(tech.version);

      // Find highest active cycle that is >= the minimum version.
      // Prefer LTS cycles when available (e.g. Node even-numbered releases).
      let bestLts: { cycle: string; major: number; minor: number } | null = null;
      let bestAny: { cycle: string; major: number; minor: number } | null = null;

      for (const c of cycles) {
        // Skip EOL cycles
        if (c.eol === true) continue;
        if (typeof c.eol === 'string' && c.eol <= today) continue;

        const cMajor = parseMajor(c.cycle);
        const cMinor = parseMinor(c.cycle);

        // Must be >= minimum
        if (cMajor < minMajor) continue;
        if (cMajor === minMajor && cMinor < minMinor) continue;

        const isHigher = (cur: typeof bestAny) =>
          !cur || cMajor > cur.major || (cMajor === cur.major && cMinor > cur.minor);

        const entry = { cycle: c.cycle, major: cMajor, minor: cMinor };
        if (isHigher(bestAny)) bestAny = entry;
        if (c.lts && isHigher(bestLts)) bestLts = entry;
      }

      const best = bestLts ?? bestAny;

      if (best) {
        if (options.verbose) {
          process.stderr.write(
            `  Resolved ${tech.name} ${tech.originalConstraint} → ${best.cycle}\n`,
          );
        }
        results.push({
          ...tech,
          version: best.cycle,
          source: `${tech.source} (resolved from ${tech.originalConstraint})`,
          constraintType: 'pinned', // now resolved
        });
      } else {
        // No active cycle found >= minimum — keep original but annotate
        results.push({
          ...tech,
          source: `${tech.source} (min constraint)`,
        });
      }
    } catch {
      results.push({
        ...tech,
        source: `${tech.source} (min constraint)`,
      });
    }
  }

  return results;
}

function parseMajor(v: string): number {
  const m = v.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseMinor(v: string): number {
  const m = v.match(/^\d+\.(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
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
