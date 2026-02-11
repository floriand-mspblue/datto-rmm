import type { AuthConfig } from './middleware.js';

/**
 * OAuth 2.0 client credentials for Datto RMM API.
 */
export interface OAuthCredentials {
  /** API Key (used as username in password grant) */
  apiKey: string;
  /** API Secret (used as password in password grant) */
  apiSecret: string;
}

/**
 * OAuth token response from the Datto RMM API.
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Manages OAuth 2.0 tokens for the Datto RMM API.
 *
 * Uses the Resource Owner Password Credentials (password) grant type
 * with a public client, matching Datto's official API documentation:
 * - Basic Auth: public-client:public
 * - grant_type: password
 * - username: API Key
 * - password: API Secret
 *
 * Features:
 * - Automatic token caching
 * - Proactive token refresh (5 minutes before expiry)
 * - Request deduplication for concurrent refresh attempts
 *
 * @example
 * ```ts
 * const tokenManager = new OAuthTokenManager(
 *   { apiKey: 'xxx', apiSecret: 'yyy' },
 *   'https://syrah-api.centrastage.net/auth/oauth/token'
 * );
 *
 * const token = await tokenManager.getToken();
 * ```
 */
export class OAuthTokenManager {
  private token: string | null = null;
  private expiresAt = 0;
  private refreshPromise: Promise<string> | null = null;

  constructor(
    private readonly credentials: OAuthCredentials,
    private readonly tokenEndpoint: string,
  ) {}

  /**
   * Get a valid access token.
   *
   * Returns a cached token if still valid, otherwise refreshes.
   * Concurrent calls during refresh will share the same promise.
   */
  async getToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    const bufferMs = 5 * 60 * 1000;
    if (this.token && Date.now() < this.expiresAt - bufferMs) {
      return this.token;
    }

    // Deduplicate concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshToken();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Force a token refresh.
   *
   * Uses the password grant type with public-client:public as the
   * Basic Auth credentials, and the API key/secret as username/password
   * in the request body. This matches Datto's official API documentation.
   */
  async refreshToken(): Promise<string> {
    // Basic Auth with public-client:public (matches curl --user public-client:public)
    const basicAuth = btoa('public-client:public');

    // Send API key as username and API secret as password in the body
    const body = new URLSearchParams({
      grant_type: 'password',
      username: this.credentials.apiKey,
      password: this.credentials.apiSecret,
    });

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OAuth token request failed: ${response.status} - ${errorText}`,
      );
    }

    const data = (await response.json()) as TokenResponse;
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    return this.token;
  }

  /**
   * Clear the cached token.
   */
  clearToken(): void {
    this.token = null;
    this.expiresAt = 0;
  }

  /**
   * Convert to an AuthConfig for use with createAuthMiddleware.
   */
  toAuthConfig(): AuthConfig {
    return {
      getToken: () => this.getToken(),
    };
  }
}
