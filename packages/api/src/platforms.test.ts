import { describe, it, expect } from 'vitest';
import { Platform, PLATFORM_URLS, PLATFORM_BASE_URLS, getPlatformUrl, getTokenEndpoint } from './platforms.js';

describe('Platform', () => {
  it('should have all expected platforms', () => {
    expect(Platform.PINOTAGE).toBe('pinotage');
    expect(Platform.MERLOT).toBe('merlot');
    expect(Platform.CONCORD).toBe('concord');
    expect(Platform.VIDAL).toBe('vidal');
    expect(Platform.ZINFANDEL).toBe('zinfandel');
    expect(Platform.SYRAH).toBe('syrah');
  });
});

describe('PLATFORM_BASE_URLS', () => {
  it('should have base domain URLs for all platforms (without /api)', () => {
    expect(PLATFORM_BASE_URLS[Platform.PINOTAGE]).toBe('https://pinotage-api.centrastage.net');
    expect(PLATFORM_BASE_URLS[Platform.MERLOT]).toBe('https://merlot-api.centrastage.net');
    expect(PLATFORM_BASE_URLS[Platform.CONCORD]).toBe('https://concord-api.centrastage.net');
    expect(PLATFORM_BASE_URLS[Platform.VIDAL]).toBe('https://vidal-api.centrastage.net');
    expect(PLATFORM_BASE_URLS[Platform.ZINFANDEL]).toBe('https://zinfandel-api.centrastage.net');
    expect(PLATFORM_BASE_URLS[Platform.SYRAH]).toBe('https://syrah-api.centrastage.net');
  });
});

describe('PLATFORM_URLS', () => {
  it('should have API URLs for all platforms (with /api)', () => {
    expect(PLATFORM_URLS[Platform.PINOTAGE]).toBe('https://pinotage-api.centrastage.net/api');
    expect(PLATFORM_URLS[Platform.MERLOT]).toBe('https://merlot-api.centrastage.net/api');
    expect(PLATFORM_URLS[Platform.CONCORD]).toBe('https://concord-api.centrastage.net/api');
    expect(PLATFORM_URLS[Platform.VIDAL]).toBe('https://vidal-api.centrastage.net/api');
    expect(PLATFORM_URLS[Platform.ZINFANDEL]).toBe('https://zinfandel-api.centrastage.net/api');
    expect(PLATFORM_URLS[Platform.SYRAH]).toBe('https://syrah-api.centrastage.net/api');
  });
});

describe('getPlatformUrl', () => {
  it('should return the correct API URL for each platform', () => {
    expect(getPlatformUrl(Platform.MERLOT)).toBe('https://merlot-api.centrastage.net/api');
    expect(getPlatformUrl(Platform.PINOTAGE)).toBe('https://pinotage-api.centrastage.net/api');
  });
});

describe('getTokenEndpoint', () => {
  it('should return the OAuth token endpoint at /auth/oauth/token for a platform', () => {
    expect(getTokenEndpoint(Platform.MERLOT)).toBe(
      'https://merlot-api.centrastage.net/auth/oauth/token'
    );
    expect(getTokenEndpoint(Platform.PINOTAGE)).toBe(
      'https://pinotage-api.centrastage.net/auth/oauth/token'
    );
    expect(getTokenEndpoint(Platform.SYRAH)).toBe(
      'https://syrah-api.centrastage.net/auth/oauth/token'
    );
  });
});
