import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';

const CACHE_DIR = join(homedir(), '.cache', 'releaserun');
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheKey(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

function getCachePath(key: string): string {
  return join(CACHE_DIR, `${key}.json`);
}

export function getCached<T>(url: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  try {
    const key = getCacheKey(url);
    const path = getCachePath(key);

    if (!existsSync(path)) return null;

    const raw = readFileSync(path, 'utf-8');
    const entry: CacheEntry = JSON.parse(raw);

    if (Date.now() - entry.timestamp > ttlMs) {
      return null; // Expired
    }

    return entry.data as T;
  } catch {
    return null;
  }
}

export function setCache(url: string, data: unknown): void {
  try {
    ensureCacheDir();
    const key = getCacheKey(url);
    const path = getCachePath(key);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    };
    writeFileSync(path, JSON.stringify(entry), 'utf-8');
  } catch {
    // Cache write failure is non-critical
  }
}
