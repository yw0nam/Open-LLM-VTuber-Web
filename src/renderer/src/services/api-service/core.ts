/**
 * Core HTTP client for API requests
 * Provides base configuration, headers, and error handling
 */

import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_BASE_URL = "http://127.0.0.1:5500/v1";

let baseURL = DEFAULT_BASE_URL;

/**
 * Set the base URL for all API requests
 * @param url - The base URL (e.g., 'http://127.0.0.1:5500/v1')
 */
export function setBaseURL(url: string): void {
  baseURL = url;
}

/**
 * Get the current base URL
 */
export function getBaseURL(): string {
  return baseURL;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Parse error response from the server
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const error = await response.json();
      return error.message || error.detail || JSON.stringify(error);
    }
    return await response.text();
  } catch {
    return response.statusText || "Unknown error";
  }
}

// ============================================================================
// HTTP Client
// ============================================================================

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Build URL with query parameters
 */
function buildURL(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path, baseURL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Core fetch wrapper with error handling and validation
 */
async function request<T>(
  path: string,
  options: RequestOptions = {},
  schema?: z.ZodSchema<T>,
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  const url = buildURL(path, params);

  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  if (
    !headers.has("Content-Type") &&
    fetchOptions.body &&
    typeof fetchOptions.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response);
      throw new APIError(
        `API request failed: ${errorMessage}`,
        response.status,
        errorMessage,
      );
    }

    // Parse response
    const data = await response.json();

    // Validate response if schema provided
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        console.error("API response validation failed:", result.error);
        throw new APIError("Invalid response format from server");
      }
      return result.data;
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or other errors
    throw new APIError(
      error instanceof Error ? error.message : "Network request failed",
      undefined,
      error,
    );
  }
}

/**
 * GET request
 */
export async function get<T>(
  path: string,
  options?: RequestOptions,
  schema?: z.ZodSchema<T>,
): Promise<T> {
  return request(path, { ...options, method: "GET" }, schema);
}

/**
 * POST request
 */
export async function post<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
  schema?: z.ZodSchema<T>,
): Promise<T> {
  return request(
    path,
    {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    },
    schema,
  );
}

/**
 * PATCH request
 */
export async function patch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
  schema?: z.ZodSchema<T>,
): Promise<T> {
  return request(
    path,
    {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    },
    schema,
  );
}

/**
 * DELETE request
 */
export async function del<T>(
  path: string,
  options?: RequestOptions,
  schema?: z.ZodSchema<T>,
): Promise<T> {
  return request(path, { ...options, method: "DELETE" }, schema);
}

/**
 * POST request with FormData (for multipart/form-data)
 */
export async function postFormData<T>(
  path: string,
  formData: FormData,
  options?: RequestOptions,
  schema?: z.ZodSchema<T>,
): Promise<T> {
  // Don't set Content-Type header - browser will set it automatically with boundary
  const { headers, ...restOptions } = options || {};

  return request(
    path,
    {
      ...restOptions,
      method: "POST",
      body: formData,
    },
    schema,
  );
}
