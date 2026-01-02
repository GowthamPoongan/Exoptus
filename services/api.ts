/**
 * API Service
 *
 * Central API client for backend communication.
 * Handles authentication, request/response intercepting, and error handling.
 */

// For mobile device testing, you need to use your computer's IP address
// To find your IP: Windows (ipconfig), Mac/Linux (ifconfig | grep inet)
// Set EXPO_PUBLIC_API_URL environment variable to override this default
const DEV_API_URL = "http://localhost:3000";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

const API_BASE_URL = API_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
}

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Set auth token for authenticated requests
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Build headers
  private getHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Generic request method
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers, body } = config;

    try {
      console.log(`📡 API Request: ${method} ${this.baseUrl}${endpoint}`);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: this.getHeaders(headers),
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      const data = await response.json();
      console.log(`📡 API Data:`, JSON.stringify(data).substring(0, 200));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Request failed",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("❌ API Error:", error.message);
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
