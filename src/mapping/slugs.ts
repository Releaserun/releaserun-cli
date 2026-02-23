// Maps technology names to API slugs used by endoflife.date and releaserun badge API

export const TECH_TO_SLUG: Record<string, string> = {
  'nodejs': 'nodejs',
  'node': 'nodejs',
  'python': 'python',
  'ruby': 'ruby',
  'golang': 'go',
  'go': 'go',
  'rust': 'rust',
  'java': 'java',
  'php': 'php',
  'typescript': 'typescript',

  // Frameworks
  'react': 'react',
  'vue': 'vue',
  'angular': 'angular',
  'django': 'django',
  'flask': 'flask',
  'rails': 'rails',
  'laravel': 'laravel',
  'symfony': 'symfony',
  'spring-boot': 'spring-boot',
  'express': 'express',

  // Databases
  'postgresql': 'postgresql',
  'mysql': 'mysql',
  'redis': 'redis',
  'mongodb': 'mongodb',

  // Infrastructure
  'nginx': 'nginx',
  'alpine-linux': 'alpine',
  'ubuntu': 'ubuntu',
  'debian': 'debian',
  'electron': 'electron',
  'webpack': 'webpack',
  'vite': 'vite',
  'esbuild': 'esbuild',
};

export function getSlug(techName: string): string {
  const lower = techName.toLowerCase();
  return TECH_TO_SLUG[lower] || lower;
}
