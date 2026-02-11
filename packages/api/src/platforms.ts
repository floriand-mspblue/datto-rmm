/**
 * Datto RMM Platform identifiers.
 *
 * The Datto RMM API is hosted on multiple regional platforms.
 * All platforms share the same API schema.
 */
export const Platform = {
  PINOTAGE: 'pinotage',
  MERLOT: 'merlot',
  CONCORD: 'concord',
  VIDAL: 'vidal',
  ZINFANDEL: 'zinfandel',
  SYRAH: 'syrah',
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

/**
 * Base domain URLs for each Datto RMM platform (without /api suffix).
 * Used for constructing both API and auth endpoints.
 */
export const PLATFORM_BASE_URLS: Record<Platform, string> = {
  [Platform.PINOTAGE]: 'https://pinotage-api.centrastage.net',
  [Platform.MERLOT]: 'https://merlot-api.centrastage.net',
  [Platform.CONCORD]: 'https://concord-api.centrastage.net',
  [Platform.VIDAL]: 'https://vidal-api.centrastage.net',
  [Platform.ZINFANDEL]: 'https://zinfandel-api.centrastage.net',
  [Platform.SYRAH]: 'https://syrah-api.centrastage.net',
} as const;

/**
 * API URLs for each Datto RMM platform (with /api suffix).
 * Used as the base URL for all API requests.
 */
export const PLATFORM_URLS: Record<Platform, string> = {
  [Platform.PINOTAGE]: `${PLATFORM_BASE_URLS[Platform.PINOTAGE]}/api`,
  [Platform.MERLOT]: `${PLATFORM_BASE_URLS[Platform.MERLOT]}/api`,
  [Platform.CONCORD]: `${PLATFORM_BASE_URLS[Platform.CONCORD]}/api`,
  [Platform.VIDAL]: `${PLATFORM_BASE_URLS[Platform.VIDAL]}/api`,
  [Platform.ZINFANDEL]: `${PLATFORM_BASE_URLS[Platform.ZINFANDEL]}/api`,
  [Platform.SYRAH]: `${PLATFORM_BASE_URLS[Platform.SYRAH]}/api`,
} as const;

/**
 * Get the base API URL for a platform.
 */
export function getPlatformUrl(platform: Platform): string {
  return PLATFORM_URLS[platform];
}

/**
 * Get the OAuth token endpoint for a platform.
 *
 * The token endpoint is at /auth/oauth/token on the base domain,
 * NOT under the /api path. This matches Datto's official API documentation.
 *
 * Example: https://syrah-api.centrastage.net/auth/oauth/token
 */
export function getTokenEndpoint(platform: Platform): string {
  return `${PLATFORM_BASE_URLS[platform]}/auth/oauth/token`;
}
