import { describe, it, expect } from 'vitest';
import { generateBadges } from '../src/output/badges.js';
import type { DetectedTech } from '../src/types.js';

describe('Badge Generation', () => {
  it('should generate health badges by default', () => {
    const technologies: DetectedTech[] = [
      { name: 'nodejs', version: '18.0', source: 'package.json' },
      { name: 'python', version: '3.9', source: 'requirements.txt' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'health' });
    
    expect(badges).toHaveLength(2);
    expect(badges[0]).toContain('[![Node.js Health]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/health/nodejs.svg');
    expect(badges[1]).toContain('[![Python Health]');
    expect(badges[1]).toContain('https://img.releaserun.com/badge/health/python.svg');
  });

  it('should generate EOL badges with correct type', () => {
    const technologies: DetectedTech[] = [
      { name: 'nodejs', version: '18.0', source: 'package.json' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'eol' });
    
    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('[![Node.js Eol]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/eol/nodejs.svg');
  });

  it('should add style parameter for non-flat styles', () => {
    const technologies: DetectedTech[] = [
      { name: 'react', version: '18.2', source: 'package.json' },
    ];

    const badges = generateBadges(technologies, { style: 'flat-square', type: 'health' });
    
    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('?style=flat-square');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/health/react.svg?style=flat-square');
  });

  it('should deduplicate technologies', () => {
    const technologies: DetectedTech[] = [
      { name: 'nodejs', version: '18.0', source: 'package.json (engines)' },
      { name: 'nodejs', version: '18.0', source: 'package.json (express)' },
      { name: 'react', version: '18.2', source: 'package.json' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'health' });
    
    expect(badges).toHaveLength(2); // Should be deduplicated
    expect(badges.find(b => b.includes('Node.js'))).toBeDefined();
    expect(badges.find(b => b.includes('React'))).toBeDefined();
  });

  it('should handle various technology names', () => {
    const technologies: DetectedTech[] = [
      { name: 'postgresql', version: '15.0', source: 'requirements.txt' },
      { name: 'golang', version: '1.21', source: 'go.mod' },
      { name: 'rust', version: '1.70', source: 'Cargo.toml' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'health' });
    
    expect(badges).toHaveLength(3);
    expect(badges[0]).toContain('PostgreSQL');
    expect(badges[1]).toContain('Go'); // golang -> Go slug mapping
    expect(badges[2]).toContain('Rust');
  });

  it('should generate CVE badges', () => {
    const technologies: DetectedTech[] = [
      { name: 'django', version: '4.2', source: 'requirements.txt' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'cve' });
    
    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('[![Django Cve]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/cve/django.svg');
  });

  it('should generate version badges', () => {
    const technologies: DetectedTech[] = [
      { name: 'ruby', version: '3.1', source: 'Gemfile' },
    ];

    const badges = generateBadges(technologies, { style: 'flat', type: 'v' });
    
    expect(badges).toHaveLength(1);
    expect(badges[0]).toContain('[![Ruby V]');
    expect(badges[0]).toContain('https://img.releaserun.com/badge/v/ruby.svg');
  });
});