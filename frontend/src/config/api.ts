/**
 * API Configuration - Environment-based URLs
 */

const getBackendBaseUrl = (): string => {
try {
    const url = import.meta.env.VITE_BACKEND_BASE_URL;
    if (!url) {
        console.warn('VITE_BACKEND_BASE_URL is not defined in environment variables');
        return 'http://localhost:9000';
    }
    return url;
} catch (error) {
    console.error('Error loading backend URL:', error);
    return 'http://localhost:9000';
}
};

const getAIServiceBaseUrl = (): string => {
  return import.meta.env.VITE_AI_SERVICE_BASE_URL;
};

export const API_CONFIG = {
  BACKEND_BASE_URL: getBackendBaseUrl(),
  BACKEND_API_URL: `${getBackendBaseUrl()}/api`,
  AI_SERVICE_BASE_URL: getAIServiceBaseUrl(),
  AI_SERVICE_API_URL: `${getAIServiceBaseUrl()}`,
} as const;

export default API_CONFIG;
