import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parsePackageJson } from '../src/parsers/package-json.js';
import { parseRequirementsTxt } from '../src/parsers/requirements.js';
import { parseGoMod } from '../src/parsers/go-mod.js';
import { parseGemfile } from '../src/parsers/gemfile.js';
import { parseCargoToml } from '../src/parsers/cargo-toml.js';
import { parsePomXml } from '../src/parsers/pom-xml.js';
import { parseComposerJson } from '../src/parsers/composer.js';

const testDir = join(process.cwd(), 'test-fixtures');

beforeEach(() => {
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('Package.json Parser', () => {
  it('should extract Node.js version from engines', () => {
    const packageJson = {
      name: 'test-project',
      engines: { node: '>=18.0.0' },
      dependencies: { express: '^4.18.0' },
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    const result = parsePackageJson(testDir);
    
    expect(result.technologies).toHaveLength(2);
    expect(result.technologies[0].name).toBe('nodejs');
    expect(result.technologies[0].version).toBe('18.0');
    expect(result.technologies[1].name).toBe('nodejs'); // express maps to nodejs
  });

  it('should handle missing package.json', () => {
    const result = parsePackageJson(testDir);
    expect(result.technologies).toHaveLength(0);
  });

  it('should extract React from dependencies', () => {
    const packageJson = {
      name: 'test-project',
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    const result = parsePackageJson(testDir);
    
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].name).toBe('react');
    expect(result.technologies[0].version).toBe('18.2');
  });
});

describe('Requirements.txt Parser', () => {
  it('should extract Python packages', () => {
    const requirements = 'django==4.2.0\nrequests>=2.28.0\npsycopg2-binary==2.9.5';
    
    writeFileSync(join(testDir, 'requirements.txt'), requirements);
    const result = parseRequirementsTxt(testDir);
    
    expect(result.technologies).toHaveLength(3);
    expect(result.technologies.find(t => t.name === 'django')).toBeDefined();
    expect(result.technologies.find(t => t.name === 'python')).toBeDefined();
    expect(result.technologies.find(t => t.name === 'postgresql')).toBeDefined();
  });

  it('should infer Python version', () => {
    const requirements = 'django==4.2.0';
    
    writeFileSync(join(testDir, 'requirements.txt'), requirements);
    const result = parseRequirementsTxt(testDir);
    
    const python = result.technologies.find(t => t.name === 'python');
    expect(python).toBeDefined();
    expect(python?.version).toBe('unknown');
  });
});

describe('Go.mod Parser', () => {
  it('should extract Go version and modules', () => {
    const goMod = `module github.com/example/app

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.0
)`;
    
    writeFileSync(join(testDir, 'go.mod'), goMod);
    const result = parseGoMod(testDir);
    
    expect(result.technologies.length).toBeGreaterThanOrEqual(2);
    expect(result.technologies.find(t => t.name === 'golang')).toBeDefined();
    expect(result.technologies.find(t => t.name === 'postgresql')).toBeDefined();
  });
});

describe('Gemfile Parser', () => {
  it('should extract Ruby version and gems', () => {
    const gemfile = `ruby '3.1.0'

gem 'rails', '~> 7.0.0'
gem 'pg', '~> 1.1'`;
    
    writeFileSync(join(testDir, 'Gemfile'), gemfile);
    const result = parseGemfile(testDir);
    
    expect(result.technologies.length).toBeGreaterThanOrEqual(2);
    expect(result.technologies.find(t => t.name === 'ruby')).toBeDefined();
    expect(result.technologies.find(t => t.name === 'rails')).toBeDefined();
  });
});

describe('Cargo.toml Parser', () => {
  it('should extract Rust edition and dependencies', () => {
    const cargoToml = `[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4.3"
serde = "1.0"`;
    
    writeFileSync(join(testDir, 'Cargo.toml'), cargoToml);
    const result = parseCargoToml(testDir);
    
    expect(result.technologies.length).toBeGreaterThanOrEqual(1);
    expect(result.technologies.find(t => t.name === 'rust')).toBeDefined();
    expect(result.technologies.find(t => t.name === 'rust' && t.version === '1.56')).toBeDefined();
  });
});

describe('pom.xml Parser', () => {
  it('should extract Java version and dependencies', () => {
    const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
            <version>3.1.0</version>
        </dependency>
    </dependencies>
</project>`;
    
    writeFileSync(join(testDir, 'pom.xml'), pomXml);
    const result = parsePomXml(testDir);
    
    expect(result.technologies).toHaveLength(2);
    expect(result.technologies.find(t => t.name === 'java')).toBeDefined();
    expect(result.technologies.find(t => t.name === 'spring-boot')).toBeDefined();
  });
});

describe('composer.json Parser', () => {
  it('should extract PHP version and packages', () => {
    const composerJson = {
      name: 'example/app',
      require: {
        php: '^8.1',
        'laravel/framework': '^10.0',
      },
    };
    
    writeFileSync(join(testDir, 'composer.json'), JSON.stringify(composerJson));
    const result = parseComposerJson(testDir);
    
    expect(result.technologies).toHaveLength(2);
    expect(result.technologies.find(t => t.name === 'php')).toBeDefined();
    expect(result.technologies.find(t => t.name === 'laravel')).toBeDefined();
  });
});