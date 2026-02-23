import type { DetectedTech } from '../types.js';
import { getSlug } from '../mapping/slugs.js';

const BADGE_BASE = 'https://img.releaserun.com/badge';

export interface BadgeOptions {
  style: 'flat' | 'flat-square';
  type: 'health' | 'eol' | 'v' | 'cve';
}

/**
 * Generate markdown badge lines for detected technologies.
 */
export function generateBadges(
  technologies: DetectedTech[],
  options: BadgeOptions = { style: 'flat', type: 'health' },
): string[] {
  const seen = new Set<string>();
  const badges: string[] = [];

  for (const tech of technologies) {
    const slug = getSlug(tech.name);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const label = formatTechLabel(tech.name);
    const styleParam = options.style !== 'flat' ? `?style=${options.style}` : '';
    const url = `${BADGE_BASE}/${options.type}/${slug}.svg${styleParam}`;
    const link = `https://releaserun.com/tools/dep-eol-scanner/`;

    badges.push(`[![${label} ${capitalize(options.type)}](${url})](${link})`);
  }

  return badges;
}

/**
 * Format the badge output for terminal display.
 */
export function renderBadgeOutput(technologies: DetectedTech[], options: BadgeOptions): string {
  const badges = generateBadges(technologies, options);
  const lines: string[] = [];

  lines.push('');
  lines.push(`  Detected ${technologies.length} technologies. Badge markdown:`);
  lines.push('');

  for (const badge of badges) {
    lines.push(`  ${badge}`);
  }

  lines.push('');

  // Try to copy to clipboard
  const allBadges = badges.join('\n');
  tryClipboard(allBadges);

  return lines.join('\n');
}

function formatTechLabel(name: string): string {
  const labels: Record<string, string> = {
    'nodejs': 'Node.js',
    'python': 'Python',
    'ruby': 'Ruby',
    'golang': 'Go',
    'java': 'Java',
    'php': 'PHP',
    'rust': 'Rust',
    'react': 'React',
    'vue': 'Vue.js',
    'angular': 'Angular',
    'django': 'Django',
    'flask': 'Flask',
    'rails': 'Rails',
    'express': 'Express',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'redis': 'Redis',
    'mongodb': 'MongoDB',
    'nginx': 'Nginx',
    'typescript': 'TypeScript',
    'electron': 'Electron',
    'webpack': 'webpack',
    'vite': 'Vite',
  };
  return labels[name.toLowerCase()] || name.replace(/\b\w/g, c => c.toUpperCase());
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function tryClipboard(text: string): Promise<void> {
  try {
    // Try native clipboard via child process (works on macOS/Linux/Windows)
    const { exec } = await import('node:child_process');
    const { platform } = await import('node:os');
    const os = platform();

    let cmd: string;
    if (os === 'darwin') {
      cmd = 'pbcopy';
    } else if (os === 'linux') {
      cmd = 'xclip -selection clipboard';
    } else if (os === 'win32') {
      cmd = 'clip';
    } else {
      return;
    }

    const child = exec(cmd);
    if (child.stdin) {
      child.stdin.write(text);
      child.stdin.end();
    }
    process.stderr.write('  Copied to clipboard! Paste into your README.md\n');
  } catch {
    // Clipboard not available - that's fine
  }
}
