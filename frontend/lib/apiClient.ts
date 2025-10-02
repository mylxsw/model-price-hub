export interface ApiClientOptions {
  baseUrl?: string;
  getToken?: () => string | null;
}

const defaultBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiClient {
  constructor(private readonly options: ApiClientOptions = {}) {}

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };
    const token = this.options.getToken?.();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private get baseUrl() {
    return this.options.baseUrl ?? defaultBaseUrl;
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...this.buildHeaders(),
        ...init?.headers
      },
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
      ...init,
      headers: {
        ...this.buildHeaders(),
        ...init?.headers
      }
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail ?? `Request failed: ${response.status}`);
    }
    return response.json();
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.post<T>(path, body, { method: "PUT" });
  }

  async delete(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.buildHeaders()
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail ?? `Request failed: ${response.status}`);
    }
  }
}
