// Package name to technology mapping

export const NPM_TECH_MAP: Record<string, string> = {
  // Node.js frameworks
  'express': 'nodejs',
  'fastify': 'nodejs',
  'koa': 'nodejs',
  '@nestjs/core': 'nodejs',
  'nestjs': 'nodejs',
  'hapi': 'nodejs',

  // React ecosystem
  'react': 'react',
  'react-dom': 'react',
  'next': 'react',
  'gatsby': 'react',

  // Vue ecosystem
  'vue': 'vue',
  'nuxt': 'vue',

  // Angular
  '@angular/core': 'angular',
  'angular': 'angular',

  // Databases
  'pg': 'postgresql',
  'pg-promise': 'postgresql',
  'mysql2': 'mysql',
  'mysql': 'mysql',
  'redis': 'redis',
  'ioredis': 'redis',
  'mongoose': 'mongodb',
  'mongodb': 'mongodb',

  // Others
  'typescript': 'typescript',
  'webpack': 'webpack',
  'vite': 'vite',
  'esbuild': 'esbuild',
  'electron': 'electron',
};

export const PIP_TECH_MAP: Record<string, string> = {
  'django': 'django',
  'flask': 'flask',
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

export const GO_TECH_MAP: Record<string, string> = {
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

export const RUBY_TECH_MAP: Record<string, string> = {
  'rails': 'rails',
  'sinatra': 'ruby',
  'pg': 'postgresql',
  'mysql2': 'mysql',
  'redis': 'redis',
  'mongoid': 'mongodb',
  'puma': 'ruby',
  'sidekiq': 'ruby',
};

export const RUST_TECH_MAP: Record<string, string> = {
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

export const JAVA_TECH_MAP: Record<string, string> = {
  'org.springframework.boot:spring-boot-starter': 'spring-boot',
  'spring-boot-starter': 'spring-boot',
  'org.springframework:spring-core': 'spring',
  'spring-core': 'spring',
  'io.quarkus:quarkus-core': 'quarkus',
  'quarkus-core': 'quarkus',
  'org.apache.maven.plugins:maven-compiler-plugin': 'maven',
  'maven-compiler-plugin': 'maven',
  'junit': 'java',
  'org.junit.jupiter:junit-jupiter': 'java',
};

export const PHP_TECH_MAP: Record<string, string> = {
  'laravel/framework': 'laravel',
  'symfony/symfony': 'symfony',
  'symfony/framework-bundle': 'symfony',
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
  'mysql': 'mysql',
  'redis': 'redis',
  'mongo': 'mongodb',
  'nginx': 'nginx',
  'alpine': 'alpine-linux',
  'ubuntu': 'ubuntu',
  'debian': 'debian',
};
