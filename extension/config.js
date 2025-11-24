/**
 * @fileoverview Configuración centralizada para la extensión Chrome
 *
 * Contiene todas las constantes y configuraciones utilizadas en la
 * extensión de navegador. Centraliza URLs de API, claves de storage,
 * configuración de caché y mapeo de estados de dominios.
 *
 * NOTA IMPORTANTE:
 * Esta configuración aún apunta a Domainr API (domainr.p.rapidapi.com).
 * Para migrar a Domains API de Layered:
 * - Cambiar HOST a: 'domains-api.p.rapidapi.com'
 * - Cambiar BASE_URL a: 'https://domains-api.p.rapidapi.com'
 * - Actualizar ENDPOINTS:
 *   - SEARCH: Generar localmente (no hay endpoint de búsqueda)
 *   - STATUS: '/domains/{domain}' (sin /v2)
 * - Adaptar formato de respuestas en popup.js
 *
 * CHROME STORAGE:
 * La API key se almacena de forma segura en Chrome Storage sync,
 * lo que permite sincronización entre dispositivos del usuario.
 *
 * @module extension/config
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 */

/**
 * Configuración de la API
 */
export const API_CONFIG = {
  HOST: 'domainr.p.rapidapi.com',
  BASE_URL: 'https://domainr.p.rapidapi.com',
  ENDPOINTS: {
    SEARCH: '/v2/search',
    STATUS: '/v2/status'
  },
  TIMEOUT: 10000 // 10 segundos
};

/**
 * Claves para Chrome Storage
 */
export const STORAGE_KEYS = {
  API_KEY: 'domain_checker_api_key',
  CACHE_PREFIX: 'dc_cache_'
};

/**
 * Configuración de caché
 */
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 5 * 60 * 1000, // 5 minutos
  MAX_SIZE: 50
};

/**
 * TLDs comunes para búsqueda expandida
 */
export const COMMON_TLDS = [
  'com', 'net', 'org', 'io', 'co',
  'app', 'dev', 'tech', 'ai', 'shop', 'store'
];

/**
 * Estados de dominio y sus textos
 */
export const DOMAIN_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  UNDELEGATED: 'undelegated',
  AVAILABLE: 'available'
};

export const DOMAIN_STATUS_TEXT = {
  [DOMAIN_STATUS.ACTIVE]: 'No disponible (Registrado)',
  [DOMAIN_STATUS.INACTIVE]: 'Disponible',
  [DOMAIN_STATUS.UNDELEGATED]: 'Disponible',
  [DOMAIN_STATUS.AVAILABLE]: 'Disponible',
  default: 'Estado desconocido'
};
