import { getCached, setCache } from './cache.js';

const BADGE_BASE = 'https://img.releaserun.com/badge';
const TIMEOUT_MS = 8000;

export interface BadgeData {
  grade: string | null;
  label: string;
  value: string;
}

/**
 * Fetch badge SVG from releaserun and parse out the grade/value text.
 */
export async function fetchBadgeData(
  product: string,
  type: string = 'health',
  noCache = false,
): Promise<BadgeData | null> {
  const url = `${BADGE_BASE}/${type}/${product}.svg`;

  if (!noCache) {
    const cached = getCached<BadgeData>(url);
    if (cached) return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'releaserun-cli/1.0.0',
      },
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const svgText = await response.text();
    const result = parseSvgBadge(svgText);

    if (result) {
      setCache(url, result);
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Parse SVG badge text to extract label and value.
 * Shields.io-style badges have <text> elements with the label and value.
 */
function parseSvgBadge(svg: string): BadgeData | null {
  try {
    // Extract text content from SVG <text> elements
    const textMatches = svg.match(/<text[^>]*>([^<]+)<\/text>/g);
    if (!textMatches || textMatches.length < 2) return null;

    // Usually: label appears first, value appears second (duplicated for shadow)
    const texts: string[] = [];
    for (const match of textMatches) {
      const content = match.replace(/<[^>]+>/g, '').trim();
      if (content && !texts.includes(content)) {
        texts.push(content);
      }
    }

    if (texts.length < 2) return null;

    const label = texts[0];
    const value = texts[1];

    // Try to extract grade from value (A, B, C, D, F)
    const gradeMatch = value.match(/^([A-F])[+-]?$/);
    const grade = gradeMatch ? gradeMatch[1] : null;

    return { grade, label, value };
  } catch {
    return null;
  }
}
