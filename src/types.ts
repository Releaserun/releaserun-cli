// Shared types for releaserun CLI

export interface DetectedTech {
  name: string;
  version: string;
  source: string;
  /** How confident are we in this version? */
  constraintType?: 'pinned' | 'minimum' | 'range';
  /** Original constraint string (e.g. ">=3.10", "18 || 20 || 22") */
  originalConstraint?: string;
}

export interface ParseResult {
  technologies: DetectedTech[];
}

export interface EolData {
  eol: string | boolean;
  lts: string | boolean;
  latest: string;
  releaseDate?: string;
  support?: string | boolean;
}

export interface TechReport {
  name: string;
  slug: string;
  version: string;
  source: string;
  eol: string | null;
  cves: number;
  grade: Grade;
  latest?: string;
  lts?: boolean;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F' | '?';

export interface ScanResult {
  grade: Grade;
  technologies: TechReport[];
  scannedPath: string;
  url: string;
}
