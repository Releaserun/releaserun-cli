import type { ScanResult } from '../types.js';

export function renderJson(result: ScanResult): string {
  const output = {
    grade: result.grade,
    technologies: result.technologies.map(t => ({
      name: t.name,
      slug: t.slug,
      version: t.version,
      eol: t.eol || null,
      cves: t.cves,
      grade: t.grade,
      latest: t.latest || null,
    })),
    scannedPath: result.scannedPath,
    url: result.url,
  };

  return JSON.stringify(output, null, 2);
}
