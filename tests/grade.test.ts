import { describe, it, expect } from 'vitest';
import { calculateGrade, calculateOverallGrade, formatEolDate } from '../src/output/grade.js';
import type { EolData } from '../src/types.js';

describe('Grade Calculation', () => {
  it('should return F for EOL technologies', () => {
    const eolData: EolData = {
      eol: '2023-01-01',
      lts: false,
      latest: '3.11.0',
    };
    
    const grade = calculateGrade(eolData, 0);
    expect(grade).toBe('F');
  });

  it('should return F for high CVE count', () => {
    const eolData: EolData = {
      eol: '2025-12-31',
      lts: false,
      latest: '3.11.0',
    };
    
    const grade = calculateGrade(eolData, 6);
    expect(grade).toBe('F');
  });

  it('should return D for approaching EOL', () => {
    // EOL in 2 months
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    
    const eolData: EolData = {
      eol: futureDate.toISOString().split('T')[0],
      lts: false,
      latest: '3.11.0',
    };
    
    const grade = calculateGrade(eolData, 0);
    expect(grade).toBe('D');
  });

  it('should return C for low CVE count', () => {
    // Use a date far in the future to avoid EOL effects
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    
    const eolData: EolData = {
      eol: futureDate.toISOString().split('T')[0],
      lts: false,
      latest: '3.11.0',
    };
    
    const grade = calculateGrade(eolData, 1);
    expect(grade).toBe('C');
  });

  it('should return A for healthy technologies', () => {
    // EOL in 2 years
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    
    const eolData: EolData = {
      eol: futureDate.toISOString().split('T')[0],
      lts: true,
      latest: '3.11.0',
    };
    
    const grade = calculateGrade(eolData, 0);
    expect(grade).toBe('A');
  });

  it('should handle missing EOL data', () => {
    const grade = calculateGrade(null, 0);
    expect(grade).toBe('?');
  });

  it('should handle missing EOL data with CVEs', () => {
    const grade = calculateGrade(null, 2);
    expect(grade).toBe('C');
  });
});

describe('Overall Grade Calculation', () => {
  it('should return worst grade', () => {
    const grades = ['A', 'B', 'F', 'C'] as const;
    const overall = calculateOverallGrade(grades);
    expect(overall).toBe('F');
  });

  it('should ignore unknown grades', () => {
    const grades = ['A', '?', 'B'] as const;
    const overall = calculateOverallGrade(grades);
    expect(overall).toBe('B');
  });

  it('should return ? for empty array', () => {
    const overall = calculateOverallGrade([]);
    expect(overall).toBe('?');
  });
});

describe('EOL Date Formatting', () => {
  it('should format date correctly', () => {
    const formatted = formatEolDate('2025-04-30');
    expect(formatted).toBe('Apr 25');
  });

  it('should handle boolean true', () => {
    const formatted = formatEolDate(true);
    expect(formatted).toBe('Yes (EOL)');
  });

  it('should handle boolean false', () => {
    const formatted = formatEolDate(false);
    expect(formatted).toBe('No');
  });

  it('should handle null/undefined', () => {
    expect(formatEolDate(null)).toBe('unknown');
    expect(formatEolDate(undefined)).toBe('unknown');
  });
});