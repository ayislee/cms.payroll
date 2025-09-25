// ========================================
// API CLIENT UTILITY
// ========================================

import config from '../config/environment';

class ApiClient {
  constructor() {
    this.baseURL = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Get authentication token from localStorage
  getAuthToken() {
    return localStorage.getItem(config.auth.tokenStorageKey);
  }

  // Get external API key
  getExternalApiKey() {
    return config.external.apiKey;
  }

  // Set auth headers for internal APIs
  getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Set API key headers for external APIs
  getExternalHeaders() {
    return { 'X-API-Key': this.getExternalApiKey() };
  }

  // Generic request method
  async request(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      isExternal = false,
      timeout = this.timeout
    } = options;

    // Determine which headers to use
    const authHeaders = isExternal ? this.getExternalHeaders() : this.getAuthHeaders();
    
    const requestHeaders = {
      ...this.defaultHeaders,
      ...authHeaders,
      ...headers
    };

    const requestOptions = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : null
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Try to parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Handle error responses
  async handleErrorResponse(response) {
    let errorMessage = 'An error occurred';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        this.handleUnauthorized();
        throw new Error('Unauthorized: Please login again');
      case 403:
        throw new Error('Forbidden: You don\'t have permission to perform this action');
      case 404:
        throw new Error('Not Found: The requested resource was not found');
      case 422:
        throw new Error(`Validation Error: ${errorMessage}`);
      case 500:
        throw new Error('Server Error: Please try again later');
      default:
        throw new Error(errorMessage);
    }
  }

  // Handle unauthorized responses
  handleUnauthorized() {
    // Clear stored auth data
    localStorage.removeItem(config.auth.tokenStorageKey);
    localStorage.removeItem(config.auth.userStorageKey);
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // GET request
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  // POST request
  async post(url, data = null, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'POST', 
      body: data 
    });
  }

  // PUT request
  async put(url, data = null, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'PUT', 
      body: data 
    });
  }

  // DELETE request
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // PATCH request
  async patch(url, data = null, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'PATCH', 
      body: data 
    });
  }

  // File upload request
  async upload(url, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    const uploadHeaders = {
      // Don't set Content-Type for FormData, let browser set it
      'Accept': 'application/json'
    };

    return this.request(url, {
      ...options,
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });
  }

  // External API request (with API key)
  async external(url, options = {}) {
    return this.request(url, { ...options, isExternal: true });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
