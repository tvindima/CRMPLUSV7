/**
 * Configurações da aplicação mobile
 */

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@crmplus:access_token',
  REFRESH_TOKEN: '@crmplus:refresh_token',
  USER_DATA: '@crmplus:user_data',
  THEME_MODE: '@crmplus:theme_mode',
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const APP_CONFIG = {
  NAME: 'CRM PLUS',
  VERSION: '0.1.0',
  BUILD: '1',
};
