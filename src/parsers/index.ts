import type { DetectedTech } from '../types.js';
import { parsePackageJson } from './package-json.js';
import { parseRequirementsTxt } from './requirements.js';
import { parseGoMod } from './go-mod.js';
import { parseDockerfile } from './dockerfile.js';
import { parseVersionFiles } from './version-files.js';
import { parseGemfile } from './gemfile.js';
import { parseCargoToml } from './cargo-toml.js';
import { parsePomXml } from './pom-xml.js';
import { parseComposerJson } from './composer.js';

export interface ScanOptions {
  verbose?: boolean;
}

export function scanDirectory(dir: string, options: ScanOptions = {}): DetectedTech[] {
  const allTechs: DetectedTech[] = [];
  const seen = new Map<string, DetectedTech>();

  const parsers = [
    { name: 'version files', fn: parseVersionFiles },
    { name: 'package.json', fn: parsePackageJson },
    { name: 'requirements.txt/Pipfile', fn: parseRequirementsTxt },
    { name: 'go.mod', fn: parseGoMod },
    { name: 'Gemfile', fn: parseGemfile },
    { name: 'Cargo.toml', fn: parseCargoToml },
    { name: 'pom.xml', fn: parsePomXml },
    { name: 'composer.json', fn: parseComposerJson },
    { name: 'Dockerfile', fn: parseDockerfile },
  ];

  for (const parser of parsers) {
    try {
      if (options.verbose) {
        process.stderr.write(`  Scanning: ${parser.name}...\n`);
      }
      const result = parser.fn(dir);
      for (const tech of result.technologies) {
        // Prefer version files over inferred versions, but don't duplicate
        const key = tech.name.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, tech);
          allTechs.push(tech);
        } else if (tech.version !== 'unknown') {
          // Update if we have a more specific version
          const existing = seen.get(key)!;
          if (existing.version === 'unknown') {
            existing.version = tech.version;
            existing.source = tech.source;
          }
        }
      }
    } catch (err) {
      if (options.verbose) {
        process.stderr.write(`  Warning: ${parser.name} parser failed: ${err}\n`);
      }
    }
  }

  return allTechs;
}
