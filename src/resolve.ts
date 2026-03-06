import { getSlug } from './mapping/slugs.js';
import { fetchProductCycles } from './api/endoflife.js';
import type { DetectedTech } from './types.js';

export interface ResolveOptions {
  noCache?: boolean;
  verbose?: boolean;
}

/**
 * For technologies detected with constraintType='minimum' (e.g. >=18),
 * resolve to the highest ACTIVE cycle from endoflife.date that satisfies
 * the minimum.  Pinned / range versions pass through unchanged.
 */
export async function resolveConstraints(
  detected: DetectedTech[],
  options: ResolveOptions = {},
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
        results.push({
          ...tech,
          source: `${tech.source} (min constraint)`,
        });
        continue;
      }

      const today = new Date().toISOString().slice(0, 10);
      const minMajor = parseMajor(tech.version);
      const minMinor = parseMinor(tech.version);

      let bestLts: { cycle: string; major: number; minor: number } | null = null;
      let bestAny: { cycle: string; major: number; minor: number } | null = null;

      for (const c of cycles) {
        if (c.eol === true) continue;
        if (typeof c.eol === 'string' && c.eol <= today) continue;

        const cMajor = parseMajor(c.cycle);
        const cMinor = parseMinor(c.cycle);

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
          constraintType: 'pinned',
        });
      } else {
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
