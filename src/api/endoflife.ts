import { getCached, setCache } from './cache.js';
import type { EolData } from '../types.js';

const BASE_URL = 'https://endoflife.date/api';
const TIMEOUT_MS = 8000;

export interface EolApiResponse {
  cycle: string;
  releaseDate?: string;
  eol: string | boolean;
  latest: string;
  lts: string | boolean;
  support?: string | boolean;
  extendedSupport?: string | boolean;
}

export async function fetchEolData(
  product: string,
  version: string,
  noCache = false,
): Promise<EolData | null> {
  // Clean up version - endoflife.date usually wants major or major.minor
  const cleanVersion = version.replace(/^v/, '');
  const url = `${BASE_URL}/${product}/${cleanVersion}.json`;

  // Check cache first
  if (!noCache) {
    const cached = getCached<EolData>(url);
    if (cached) return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'releaserun-cli/1.0.0',
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      // Try with just major version
      if (cleanVersion.includes('.')) {
        const major = cleanVersion.split('.')[0];
        return fetchEolData(product, major, noCache);
      }
      return null;
    }

    const data = (await response.json()) as EolApiResponse;

    const result: EolData = {
      eol: data.eol,
      lts: data.lts,
      latest: data.latest,
      releaseDate: data.releaseDate,
      support: data.support,
    };

    setCache(url, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Fetch all cycles for a product (to find the right cycle for a version)
 */
export async function fetchProductCycles(
  product: string,
  noCache = false,
): Promise<EolApiResponse[] | null> {
  const url = `${BASE_URL}/${product}.json`;

  if (!noCache) {
    const cached = getCached<EolApiResponse[]>(url);
    if (cached) return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'releaserun-cli/1.0.0',
      },
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const data = (await response.json()) as EolApiResponse[];
    setCache(url, data);
    return data;
  } catch {
    return null;
  }
}
