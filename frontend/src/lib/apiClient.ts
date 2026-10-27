/**
 * Centralized API client.
 *
 * All API calls go through this module to ensure consistent
 * base URL, headers, and error handling.
 */
import axios from 'axios'

const apiOrigin = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: `${apiOrigin}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

// Response interceptor — normalize error shape
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

export default apiClient
