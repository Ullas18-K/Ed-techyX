/**
 * API Configuration - Environment-based URLs
 */

const getBackendBaseUrl = (): string => {
  return import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:9000';
};

const getAIServiceBaseUrl = (): string => {
  return import.meta.env.VITE_AI_SERVICE_BASE_URL || 'http://localhost:8001';
};

export const API_CONFIG = {
  BACKEND_BASE_URL: getBackendBaseUrl(),
  BACKEND_API_URL: `${getBackendBaseUrl()}/api`,
  AI_SERVICE_BASE_URL: getAIServiceBaseUrl(),
  AI_SERVICE_API_URL: `${getAIServiceBaseUrl()}/api`,
} as const;

export default API_CONFIG;
