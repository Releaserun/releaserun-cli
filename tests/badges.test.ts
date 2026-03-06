import { describe, it, expect } from 'vitest';
import { generateBadges } from '../src/output/badges.js';
import { injectBadges } from '../src/commands/readme.js';
import type { DetectedTech } from '../src/types.js';

describe('Badge Generation', () => {
  it('should generate version-specific health badges', () => {
    const technologies: DetectedTech[] = [
      { name: 'nodejs', version: '18', source: 'package.json' },
      { name: 'python', version: '3.12', source: 'requirements.txt' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'health' });

    expect(badges).toHaveLength(2);
    expect(badges[0]).toContain('[![Node.js 18 Health]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/health/nodejs/18.svg');
    expect(badges[0]).toContain('https://releaserun.com/nodejs/18/');
    expect(badges[1]).toContain('[![Python 3.12 Health]');
    expect(badges[1]).toContain('https://img.releaserun.com/badge/health/python/3.12.svg');
    expect(badges[1]).toContain('https://releaserun.com/python/3.12/');
  });

  it('should generate badges without version when version is unknown', () => {
    const technologies: DetectedTech[] = [
      { name: 'nodejs', version: 'unknown', source: 'package.json' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'health' });

    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('[![Node.js Health]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/health/nodejs.svg');
    expect(badges[0]).toContain('https://releaserun.com/nodejs/');
  });

  it('should generate EOL badges with version in URL', () => {
    const technologies: DetectedTech[] = [
      { name: 'nodejs', version: '18', source: 'package.json' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'eol' });

    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('[![Node.js 18 Eol]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/eol/nodejs/18.svg');
  });

  it('should add style parameter for non-flat styles', () => {
    const technologies: DetectedTech[] = [
      { name: 'react', version: '18', source: 'package.json' },
    ];

    const badges = generateBadges(technologies, { style: 'flat-square', type: 'health' });

    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('?style=flat-square');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/health/react/18.svg?style=flat-square');
  });

  it('should deduplicate technologies', () => {
    const technologies: DetectedTech[] = [
      { name: 'nodejs', version: '18', source: 'package.json (engines)' },
      { name: 'nodejs', version: '18', source: 'package.json (express)' },
      { name: 'react', version: '18', source: 'package.json' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'health' });

    expect(badges).toHaveLength(2);
    expect(badges.find(b => b.includes('Node.js'))).toBeDefined();
    expect(badges.find(b => b.includes('React'))).toBeDefined();
  });

  it('should handle various technology names with versions', () => {
    const technologies: DetectedTech[] = [
      { name: 'postgresql', version: '15', source: 'requirements.txt' },
      { name: 'golang', version: '1.21', source: 'go.mod' },
      { name: 'rust', version: '1.70', source: 'Cargo.toml' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'health' });

    expect(badges).toHaveLength(3);
    expect(badges[0]).toContain('PostgreSQL');
    expect(badges[0]).toContain('/15.svg');
    expect(badges[1]).toContain('Go');
    expect(badges[1]).toContain('/1.21.svg');
    expect(badges[2]).toContain('Rust');
    expect(badges[2]).toContain('/1.70.svg');
  });

  it('should generate CVE badges with version', () => {
    const technologies: DetectedTech[] = [
      { name: 'django', version: '4.2', source: 'requirements.txt' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'cve' });

    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('[![Django 4.2 Cve]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/cve/django/4.2.svg');
  });

  it('should generate version badges with version in URL', () => {
    const technologies: DetectedTech[] = [
      { name: 'ruby', version: '3.1', source: 'Gemfile' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'v' });

    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('[![Ruby 3.1 V]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/v/ruby/3.1.svg');
  });
});

describe('README Badge Injection', () => {
  it('should replace content between markers', () => {
    const content = [
      '# My Project',
      '',
      '<!-- releaserun:badges:start -->',
      '[![Old Badge](https://old.example.com)]',
      '<!-- releaserun:badges:end -->',
      '',
      'Some content',
    ].join('\n');

    const badgeBlock = [
      '<!-- releaserun:badges:start -->',
      '[![Node.js 22 Health](https://img.releaserun.com/badge/health/nodejs/22.svg)](https://releaserun.com/nodejs/22/)',
      '<!-- releaserun:badges:end -->',
    ].join('\n');

    const result = injectBadges(content, badgeBlock);

    expect(result).toContain('[![Node.js 22 Health]');
    expect(result).not.toContain('[![Old Badge]');
    expect(result).toContain('Some content');
  });

  it('should insert after first heading when no markers exist', () => {
    const content = '# My Project\n\nSome content here.';
    const badgeBlock = '<!-- releaserun:badges:start -->\n[![Badge](url)]\n<!-- releaserun:badges:end -->';

    const result = injectBadges(content, badgeBlock);

    expect(result).toMatch(/# My Project\n\n<!-- releaserun:badges:start -->/);
    expect(result).toContain('Some content here.');
  });

  it('should prepend when no heading exists', () => {
    const content = 'No heading here, just text.';
    const badgeBlock = '<!-- releaserun:badges:start -->\n[![Badge](url)]\n<!-- releaserun:badges:end -->';

    const result = injectBadges(content, badgeBlock);

    expect(result).toMatch(/^<!-- releaserun:badges:start -->/);
    expect(result).toContain('No heading here, just text.');
  });
});
