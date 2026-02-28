import JSONBig from "json-bigint";

const BASE_URL = "http://localhost:8000";

// Map to cleanly deduplicate concurrent identical GET requests
const pendingGetRequests = new Map<string, Promise<unknown>>();

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const method = (options.method || "GET").toUpperCase();
  const cacheKey = method === "GET" ? url : null;

  // Deduplicate identical simultaneous GET requests to prevent "multiple getter" loops and StrictMode duplicate calls
  if (cacheKey && pendingGetRequests.has(cacheKey)) {
    return pendingGetRequests.get(cacheKey) as Promise<T>;
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    credentials: options.credentials || "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        try {
          const text = await response.text();
          errorData = text ? JSONBig({ storeAsString: true }).parse(text) : {};
        } catch {
          // ignore parsing error for error bodies
        }

        throw new Error(
          (errorData.detail as string) ||
          `API Error: ${response.status} ${response.statusText}`,
        );
      }

      const text = await response.text();
      return (text ? JSONBig({ storeAsString: true }).parse(text) : {}) as T;
    } catch (error) {
      console.error(`Fetch error at ${url}:`, error);
      throw error;
    } finally {
      // Remove from pending map shortly after resolving to allow for minor timing discrepancies
      // e.g React StrictMode or slightly delayed sibling component mounts.
      if (cacheKey) {
        setTimeout(() => pendingGetRequests.delete(cacheKey), 100);
      }
    }
  })();

  if (cacheKey) {
    pendingGetRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}
