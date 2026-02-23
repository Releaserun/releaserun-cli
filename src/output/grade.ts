import type { Grade, EolData } from '../types.js';

/**
 * Calculate a health grade based on EOL data and CVE count.
 *
 * A: Supported, no CVEs, not approaching EOL
 * B: Supported, minor CVEs or approaching EOL in 6+ months
 * C: Approaching EOL (less than 6 months away)
 * D: EOL within 3 months or past EOL less than 3 months ago
 * F: EOL (past) or critical CVEs
 * ?: Unable to determine
 */
export function calculateGrade(eolData: EolData | null, cves: number): Grade {
  if (!eolData) {
    // No data available - if we have CVE info, use that
    if (cves >= 5) return 'F';
    if (cves >= 3) return 'D';
    if (cves >= 1) return 'C';
    return '?';
  }

  const isEol = getEolStatus(eolData.eol);
  const monthsUntilEol = getMonthsUntilEol(eolData.eol);

  // F: Already EOL or critical CVEs
  if (isEol === true || cves >= 5) {
    return 'F';
  }

  // D: EOL within 3 months
  if (monthsUntilEol !== null && monthsUntilEol <= 3) {
    return 'D';
  }

  // D: Many CVEs
  if (cves >= 3) {
    return 'D';
  }

  // C: Approaching EOL (less than 6 months)
  if (monthsUntilEol !== null && monthsUntilEol <= 6) {
    return 'C';
  }

  // C: Some CVEs
  if (cves >= 1) {
    return 'C';
  }

  // B: Supported but not LTS, or getting older
  if (monthsUntilEol !== null && monthsUntilEol <= 12) {
    return 'B';
  }

  // A: Fully supported, no CVEs, lots of time left
  return 'A';
}

/**
 * Calculate overall grade from individual grades
 */
export function calculateOverallGrade(grades: Grade[]): Grade {
  if (grades.length === 0) return '?';

  const gradeOrder: Grade[] = ['F', 'D', 'C', 'B', 'A'];
  let worst = 4; // Start at A

  for (const grade of grades) {
    if (grade === '?') continue;
    const idx = gradeOrder.indexOf(grade);
    if (idx < worst) {
      worst = idx;
    }
  }

  return gradeOrder[worst];
}

function getEolStatus(eol: string | boolean): boolean | null {
  if (typeof eol === 'boolean') return eol;

  // Parse date string
  const eolDate = new Date(eol);
  if (isNaN(eolDate.getTime())) return null;

  return eolDate.getTime() < Date.now();
}

function getMonthsUntilEol(eol: string | boolean): number | null {
  if (typeof eol === 'boolean') {
    return eol ? -1 : null; // true = already EOL, false = no known EOL date
  }

  const eolDate = new Date(eol);
  if (isNaN(eolDate.getTime())) return null;

  const now = new Date();
  const diffMs = eolDate.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30); // Approximate months
}

export function formatEolDate(eol: string | boolean | null): string {
  if (eol === null || eol === undefined) return 'unknown';
  if (typeof eol === 'boolean') return eol ? 'Yes (EOL)' : 'No';

  const date = new Date(eol);
  if (isNaN(date.getTime())) return String(eol);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const year = date.getFullYear().toString().slice(2);
  return `${months[date.getMonth()]} ${year}`;
}
