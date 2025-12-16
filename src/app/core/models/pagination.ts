/**
 * Generic paginated response from API
 */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Pagination query parameters
 */
export interface PageParams {
  page: number;
  size: number;
}
