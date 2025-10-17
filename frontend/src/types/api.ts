/**
 * General API types
 */

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface ApiError {
  detail: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
