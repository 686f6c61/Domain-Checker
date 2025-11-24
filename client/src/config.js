/**
 * @fileoverview Configuración centralizada de la aplicación Domain Checker
 *
 * Este archivo contiene todas las constantes, configuraciones y valores
 * predeterminados utilizados en toda la aplicación frontend. Centralizar
 * la configuración facilita el mantenimiento y modificaciones.
 *
 * SECCIONES:
 * - API Configuration: URLs, endpoints y timeouts
 * - Environment: Detección de entorno (dev/prod)
 * - Cache Configuration: Parámetros del sistema de caché LRU
 * - Domain Constants: TLDs comunes y mapeo de estados
 *
 * VENTAJAS DE CENTRALIZACIÓN:
 * - Un solo lugar para cambiar configuraciones
 * - Fácil migración entre entornos
 * - Evita hardcoding en componentes
 * - Tipado y autocompletado en IDE
 * - Reutilización de constantes
 *
 * VARIABLES DE ENTORNO:
 * - REACT_APP_API_URL: URL del backend (ej: https://api.tudominio.com)
 * - REACT_APP_ENV: Entorno de ejecución (development/production)
 * - NODE_ENV: Entorno de Node.js (automático en build)
 *
 * @module client/config
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 *
 * @example
 * // Importar configuración en componentes
 * import { API_BASE_URL, COMMON_TLDS } from './config';
 *
 * @example
 * // Usar endpoints de API
 * import { API_ENDPOINTS } from './config';
 * const url = `${API_BASE_URL}${API_ENDPOINTS.SEARCH}`;
 */

/**
 * URL base de la API
 * En desarrollo usa localhost:5000
 * En producción usa la variable de entorno REACT_APP_API_URL
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Endpoints de la API
 */
export const API_ENDPOINTS = {
  SEARCH: '/api/search',
  STATUS: '/api/status',
  HEALTH: '/health'
};

/**
 * Configuración de timeout para requests HTTP
 */
export const HTTP_TIMEOUT = 10000; // 10 segundos

/**
 * Entorno de ejecución
 */
export const ENV = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

/**
 * Es entorno de desarrollo?
 */
export const IS_DEV = ENV === 'development';

/**
 * Es entorno de producción?
 */
export const IS_PROD = ENV === 'production';

/**
 * Configuración de caché
 */
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 5 * 60 * 1000, // 5 minutos en milisegundos
  MAX_SIZE: 100 // Máximo número de entradas en caché
};

/**
 * TLDs comunes para búsqueda expandida
 */
export const COMMON_TLDS = [
  'com', 'net', 'org', 'io', 'co',
  'app', 'dev', 'tech', 'ai', 'shop', 'store'
];

/**
 * Estados de dominio
 */
export const DOMAIN_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  UNDELEGATED: 'undelegated',
  AVAILABLE: 'available'
};

/**
 * Textos de estado de dominio
 */
export const DOMAIN_STATUS_TEXT = {
  [DOMAIN_STATUS.ACTIVE]: 'No disponible (Registrado)',
  [DOMAIN_STATUS.INACTIVE]: 'Disponible',
  [DOMAIN_STATUS.UNDELEGATED]: 'Disponible',
  [DOMAIN_STATUS.AVAILABLE]: 'Disponible',
  default: 'Estado desconocido'
};
