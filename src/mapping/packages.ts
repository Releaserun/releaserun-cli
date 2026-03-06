// Package name to technology mapping

// Packages where the npm version IS the technology version (safe to use version)
export const NPM_TECH_MAP: Record<string, string> = {
  // React ecosystem (react 18.2 = React 18.2)
  'react': 'react',
  'react-dom': 'react',

  // Vue ecosystem (vue 3.3 = Vue 3.3)
  'vue': 'vue',

  // Angular (@angular/core 17 = Angular 17)
  '@angular/core': 'angular',

  // Build tools (version = product version)
  'typescript': 'typescript',
  'webpack': 'webpack',
  'vite': 'vite',
  'esbuild': 'esbuild',
  'electron': 'electron',
};

// Packages that indicate a technology is used, but the npm package version
// is NOT the technology version (client libraries, frameworks, etc.)
// These detect the tech but set version to 'unknown'.
export const NPM_INDICATOR_MAP: Record<string, string> = {
  // Node.js frameworks — express 4.18 is NOT Node.js 4.18
  'express': 'nodejs',
  'fastify': 'nodejs',
  'koa': 'nodejs',
  '@nestjs/core': 'nodejs',
  'nestjs': 'nodejs',
  'hapi': 'nodejs',
  'next': 'nodejs',
  'gatsby': 'nodejs',
  'nuxt': 'nodejs',

  // Database clients — pg 8.11 is NOT PostgreSQL 8.11
  'pg': 'postgresql',
  'pg-promise': 'postgresql',
  'mysql2': 'mysql',
  'mysql': 'mysql',
  'redis': 'redis',
  'ioredis': 'redis',
  'mongoose': 'mongodb',
  'mongodb': 'mongodb',
};

// Python packages where the pip version IS the tech version
export const PIP_TECH_MAP: Record<string, string> = {
  'django': 'django',
  'flask': 'flask',
};

// Python packages that indicate a tech but version doesn't match
export const PIP_INDICATOR_MAP: Record<string, string> = {
  'fastapi': 'python',
  'sqlalchemy': 'python',
  'celery': 'python',
  'psycopg2': 'postgresql',
  'psycopg2-binary': 'postgresql',
  'mysqlclient': 'mysql',
  'redis': 'redis',
  'pymongo': 'mongodb',
  'numpy': 'python',
  'pandas': 'python',
  'scipy': 'python',
  'tensorflow': 'python',
  'torch': 'python',
  'requests': 'python',
};

// Go modules: ALL are indicators (module version ≠ tech version)
// Go version comes from the `go` directive, not from module versions
export const GO_TECH_MAP: Record<string, string> = {};

export const GO_INDICATOR_MAP: Record<string, string> = {
  'github.com/gin-gonic/gin': 'golang',
  'github.com/labstack/echo': 'golang',
  'github.com/gofiber/fiber': 'golang',
  'github.com/gorilla/mux': 'golang',
  'github.com/lib/pq': 'postgresql',
  'github.com/go-sql-driver/mysql': 'mysql',
  'github.com/go-redis/redis': 'redis',
  'go.mongodb.org/mongo-driver': 'mongodb',
  'gorm.io/gorm': 'golang',
};

// Ruby: rails version = Rails version (correct), rest are indicators
export const RUBY_TECH_MAP: Record<string, string> = {
  'rails': 'rails',
};

export const RUBY_INDICATOR_MAP: Record<string, string> = {
  'sinatra': 'ruby',
  'pg': 'postgresql',
  'mysql2': 'mysql',
  'redis': 'redis',
  'mongoid': 'mongodb',
  'puma': 'ruby',
  'sidekiq': 'ruby',
};

// Rust crates: all are indicators (crate version ≠ Rust version)
export const RUST_TECH_MAP: Record<string, string> = {};

export const RUST_INDICATOR_MAP: Record<string, string> = {
  'actix-web': 'rust',
  'rocket': 'rust',
  'warp': 'rust',
  'axum': 'rust',
  'tokio': 'rust',
  'serde': 'rust',
  'clap': 'rust',
  'diesel': 'rust',
  'sqlx': 'rust',
};

// Java: spring-boot version IS Spring Boot version (correct)
export const JAVA_TECH_MAP: Record<string, string> = {
  'org.springframework.boot:spring-boot-starter': 'spring-boot',
  'spring-boot-starter': 'spring-boot',
};

export const JAVA_INDICATOR_MAP: Record<string, string> = {
  'org.springframework:spring-core': 'spring',
  'spring-core': 'spring',
  'io.quarkus:quarkus-core': 'quarkus',
  'quarkus-core': 'quarkus',
  'org.apache.maven.plugins:maven-compiler-plugin': 'maven',
  'maven-compiler-plugin': 'maven',
  'junit': 'java',
  'org.junit.jupiter:junit-jupiter': 'java',
};

// PHP: laravel/symfony versions are correct
export const PHP_TECH_MAP: Record<string, string> = {
  'laravel/framework': 'laravel',
  'symfony/symfony': 'symfony',
  'symfony/framework-bundle': 'symfony',
};

export const PHP_INDICATOR_MAP: Record<string, string> = {
  'cakephp/cakephp': 'php',
  'zendframework/zend-framework': 'php',
  'laminas/laminas-mvc': 'php',
  'doctrine/orm': 'php',
  'monolog/monolog': 'php',
  'guzzlehttp/guzzle': 'php',
  'phpunit/phpunit': 'php',
};

export const DOCKER_IMAGE_MAP: Record<string, string> = {
  'node': 'nodejs',
  'python': 'python',
  'ruby': 'ruby',
  'golang': 'golang',
  'go': 'golang',
  'rust': 'rust',
  'java': 'java',
  'openjdk': 'java',
  'php': 'php',
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'mysql': 'mysql',
  'redis': 'redis',
  'mongo': 'mongodb',
  'nginx': 'nginx',
  'alpine': 'alpine-linux',
  'ubuntu': 'ubuntu',
  'debian': 'debian',
};
