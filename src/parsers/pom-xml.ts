import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, DetectedTech } from '../types.js';
import { JAVA_TECH_MAP } from '../mapping/packages.js';

export function parsePomXml(dir: string): ParseResult {
  const filePath = join(dir, 'pom.xml');
  const technologies: DetectedTech[] = [];

  if (!existsSync(filePath)) {
    return { technologies };
  }

  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return { technologies };
  }

  // Extract Java version from maven.compiler.source/target or java.version
  const javaVersionPatterns = [
    /<maven\.compiler\.source>([^<]+)<\/maven\.compiler\.source>/,
    /<maven\.compiler\.target>([^<]+)<\/maven\.compiler\.target>/,
    /<java\.version>([^<]+)<\/java\.version>/,
  ];

  for (const pattern of javaVersionPatterns) {
    const match = content.match(pattern);
    if (match) {
      const version = parseVersionConstraint(match[1]);
      if (version) {
        technologies.push({
          name: 'java',
          version: version,
          source: 'pom.xml (compiler version)',
        });
        break; // Take the first one found
      }
    }
  }

  // Extract dependencies
  const seen = new Set<string>();
  
  // Find all <dependency> blocks
  const dependencyPattern = /<dependency>[\s\S]*?<\/dependency>/g;
  const dependencies = content.match(dependencyPattern) || [];

  for (const dep of dependencies) {
    const groupIdMatch = dep.match(/<groupId>([^<]+)<\/groupId>/);
    const artifactIdMatch = dep.match(/<artifactId>([^<]+)<\/artifactId>/);
    const versionMatch = dep.match(/<version>([^<]+)<\/version>/);

    if (groupIdMatch && artifactIdMatch) {
      const groupId = groupIdMatch[1];
      const artifactId = artifactIdMatch[1];
      const version = versionMatch ? versionMatch[1] : 'latest';
      
      // Check both full coordinate and artifactId
      const fullCoordinate = `${groupId}:${artifactId}`;
      const tech = JAVA_TECH_MAP[fullCoordinate] || JAVA_TECH_MAP[artifactId];
      
      if (tech && !seen.has(tech)) {
        seen.add(tech);
        const parsedVersion = parseVersionConstraint(version);
        technologies.push({
          name: tech,
          version: parsedVersion || 'unknown',
          source: `pom.xml (${artifactId})`,
        });
      }
    }
  }

  // If no Java version found but pom.xml exists, assume Java 8 (common default)
  if (!technologies.some(t => t.name === 'java')) {
    technologies.push({
      name: 'java',
      version: '8',
      source: 'pom.xml',
    });
  }

  return { technologies };
}

function parseVersionConstraint(constraint: string): string {
  // Strip Maven version ranges and prefixes
  const cleaned = constraint.replace(/[\[\]()]/g, '').replace(/^[>=<\s]+/, '').trim();
  // Take first version if there's a range (e.g. "1.8,)" -> "1.8")
  const first = cleaned.split(/[,\s]/)[0];
  // Extract major version or major.minor
  const match = first.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return match[2] !== undefined ? `${match[1]}.${match[2]}` : match[1];
  }
  return cleaned;
}