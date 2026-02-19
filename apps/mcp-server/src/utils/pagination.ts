/**
 * Standard pagination parameters used across Datto RMM API.
 */
export interface PaginationParams {
  page?: number;
  max?: number;
}

/**
 * Default page size for list operations.
 */
export const DEFAULT_PAGE_SIZE = 250;

/**
 * Maximum page size allowed by the API.
 */
export const MAX_PAGE_SIZE = 250;

/**
 * Normalize pagination parameters with defaults.
 */
export function normalizePagination(params?: PaginationParams): Required<PaginationParams> {
  return {
    page: params?.page ?? 1,
    max: Math.min(params?.max ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}

/**
 * Extract pagination info from a paginated response.
 */
export interface PageInfo {
  page: number;
  totalPages: number;
  count: number;
  hasMore: boolean;
}

/**
 * Parse pagination info from API response.
 */
export function parsePageInfo(response: {
  pageDetails?: {
    page?: number;
    totalPages?: number;
    count?: number;
  } | null;
}): PageInfo {
  const details = response.pageDetails;
  const page = details?.page ?? 1;
  const totalPages = details?.totalPages ?? 1;
  const count = details?.count ?? 0;

  return {
    page,
    totalPages,
    count,
    hasMore: page < totalPages,
  };
}

/**
 * Remove undefined, null, empty string, and zero values from query params.
 * Prevents the Datto API from treating empty/default values as active filters.
 * The AI agent sends empty strings and 0 for optional params it doesn't need,
 * which the API interprets as "filter where field equals empty/zero" → 0 results.
 */
export function cleanQuery<T extends Record<string, unknown>>(params: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}
