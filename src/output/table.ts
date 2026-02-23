import chalk from 'chalk';
import Table from 'cli-table3';
import type { TechReport, Grade, ScanResult } from '../types.js';
import { formatEolDate } from './grade.js';

function gradeColor(grade: Grade): string {
  switch (grade) {
    case 'A': return chalk.green.bold(grade);
    case 'B': return chalk.green(grade);
    case 'C': return chalk.yellow(grade);
    case 'D': return chalk.red(grade);
    case 'F': return chalk.red.bold(grade);
    case '?': return chalk.gray(grade);
  }
}

function techName(name: string): string {
  // Capitalize first letter of each word
  return name.replace(/\b\w/g, c => c.toUpperCase());
}

export function renderTable(result: ScanResult, noColor = false): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(noColor
    ? '  releaserun v1.0.0 -- Stack Health Check'
    : `  ${chalk.bold('releaserun')} v1.0.0 -- Stack Health Check`);
  lines.push('');
  lines.push(`  Scanning ${result.scannedPath}...`);

  if (result.technologies.length === 0) {
    lines.push('');
    lines.push('  No technologies detected. Check that dependency files exist.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`  Found ${result.technologies.length} technologies`);
  lines.push('');

  const table = new Table({
    head: noColor
      ? ['Technology', 'Version', 'EOL', 'CVEs', 'Grade']
      : [
          chalk.white.bold('Technology'),
          chalk.white.bold('Version'),
          chalk.white.bold('EOL'),
          chalk.white.bold('CVEs'),
          chalk.white.bold('Grade'),
        ],
    style: {
      head: [],
      border: noColor ? [] : ['gray'],
    },
    chars: {
      'top': '-', 'top-mid': '+', 'top-left': '+', 'top-right': '+',
      'bottom': '-', 'bottom-mid': '+', 'bottom-left': '+', 'bottom-right': '+',
      'left': '|', 'left-mid': '+', 'mid': '-', 'mid-mid': '+',
      'right': '|', 'right-mid': '+', 'middle': '|',
    },
  });

  for (const tech of result.technologies) {
    const eolStr = tech.eol ? formatEolDate(tech.eol) : '--';
    const cveStr = tech.cves > 0 ? String(tech.cves) : '0';
    const gradeStr = noColor ? tech.grade : gradeColor(tech.grade);

    table.push([
      techName(tech.name),
      tech.version,
      eolStr,
      cveStr,
      gradeStr,
    ]);
  }

  lines.push(table.toString());
  lines.push('');

  const overallStr = noColor
    ? `  Overall Grade: ${result.grade}`
    : `  Overall Grade: ${gradeColor(result.grade)}`;

  const needAttention = result.technologies.filter(t => ['C', 'D', 'F'].includes(t.grade));
  if (needAttention.length > 0) {
    lines.push(`${overallStr} (${needAttention.length} of ${result.technologies.length} technologies need attention)`);
  } else {
    lines.push(overallStr);
  }

  lines.push('');

  // Warnings for problematic technologies
  for (const tech of result.technologies) {
    if (tech.grade === 'F' && tech.eol) {
      lines.push(noColor
        ? `  ! ${techName(tech.name)} ${tech.version} has reached EOL. Upgrade recommended.`
        : `  ${chalk.red('!')} ${techName(tech.name)} ${tech.version} has reached EOL. Upgrade recommended.`);
    } else if (tech.grade === 'D') {
      lines.push(noColor
        ? `  ! ${techName(tech.name)} ${tech.version} is approaching EOL. Plan an upgrade.`
        : `  ${chalk.yellow('!')} ${techName(tech.name)} ${tech.version} is approaching EOL. Plan an upgrade.`);
    }
    if (tech.cves > 0) {
      lines.push(noColor
        ? `  ! ${techName(tech.name)} has ${tech.cves} known CVE(s). Check releaserun.com/tools/cve-dashboard/`
        : `  ${chalk.yellow('!')} ${techName(tech.name)} has ${tech.cves} known CVE(s). Check releaserun.com/tools/cve-dashboard/`);
    }
  }

  lines.push('');
  lines.push(`  Full report: ${result.url}`);
  lines.push('');

  return lines.join('\n');
}
