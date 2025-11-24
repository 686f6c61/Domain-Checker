/**
 * @fileoverview Capa de servicios para comunicación con el backend API
 *
 * Este módulo proporciona una interfaz limpia y centralizada para todas las
 * peticiones HTTP al backend Express. Implementa:
 *
 * CARACTERÍSTICAS:
 * - Cliente Axios preconfigurado con baseURL y timeout
 * - Interceptors para manejo centralizado de errores HTTP
 * - Mapeo de códigos de error a mensajes user-friendly
 * - Rate limiting con peticiones secuenciales (1.2s delay)
 * - Manejo especial de error 403 (API no suscrita)
 * - Encoding automático de parámetros de búsqueda
 *
 * FUNCIONES PRINCIPALES:
 * - searchDomains(): Busca sugerencias de dominios por palabra clave
 * - checkDomainStatus(): Verifica disponibilidad de un dominio específico
 * - checkMultipleDomainStatus(): Verifica múltiples dominios secuencialmente
 * - checkHealth(): Health check del servidor backend
 *
 * MANEJO DE ERRORES:
 * - 400: Solicitud inválida
 * - 403: API no suscrita (mensaje específico con URL)
 * - 429: Rate limit excedido
 * - 5xx: Errores del servidor
 * - Network: Sin conexión al servidor
 *
 * @module client/services/api
 * @requires axios - Cliente HTTP basado en promesas v1.x
 * @requires ../config - Configuración de endpoints y timeouts
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 *
 * @example
 * // Buscar dominios disponibles
 * import { searchDomains } from './services/api';
 * const results = await searchDomains('miempresa');
 *
 * @example
 * // Verificar disponibilidad de un dominio
 * import { checkDomainStatus } from './services/api';
 * const status = await checkDomainStatus('miempresa.com');
 */

import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, HTTP_TIMEOUT } from '../config';

/**
 * Instancia de axios configurada
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: HTTP_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Interceptor para requests - permite agregar auth tokens, logging, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Aquí podrías agregar tokens de autenticación si los necesitas
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor para responses - manejo centralizado de errores
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo de errores HTTP
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data.error || 'Solicitud inválida');
        case 403:
          // Manejar error de suscripción específicamente
          if (data.code === 'API_NOT_SUBSCRIBED') {
            throw new Error(data.error || 'No estás suscrito a la API de dominios.');
          }
          throw new Error(data.error || 'Acceso denegado');
        case 429:
          throw new Error('Demasiadas solicitudes. Por favor, espera un momento.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Error del servidor. Por favor, intenta nuevamente.');
        default:
          throw new Error(data.error || 'Error desconocido');
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
    } else {
      // Error en la configuración de la petición
      throw new Error('Error al realizar la solicitud');
    }
  }
);

/**
 * Busca dominios basados en una consulta
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Object>} Resultados de la búsqueda
 */
export const searchDomains = async (query) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SEARCH, {
      params: { query: encodeURIComponent(query) }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching domains:', error);
    throw error;
  }
};

/**
 * Verifica el estado de un dominio
 * @param {string} domain - Nombre de dominio completo
 * @returns {Promise<Object>} Estado del dominio
 */
export const checkDomainStatus = async (domain) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.STATUS, {
      params: { domain: encodeURIComponent(domain) }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking domain status:', error);
    throw error;
  }
};

/**
 * Espera un tiempo determinado (helper para delays)
 * @param {number} ms - Milisegundos a esperar
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Verifica el estado de múltiples dominios
 * Hace peticiones secuenciales con delay para evitar rate limiting
 * @param {string[]} domains - Array de nombres de dominio
 * @returns {Promise<Object[]>} Array de estados de dominios
 */
export const checkMultipleDomainStatus = async (domains) => {
  try {
    const results = [];

    // Procesar dominios secuencialmente con delay de 1.2 segundos entre cada uno
    for (let i = 0; i < domains.length; i++) {
      try {
        const result = await checkDomainStatus(domains[i]);
        results.push(result);
      } catch (error) {
        console.error(`Error checking domain ${domains[i]}:`, error);
        results.push({
          status: [{
            domain: domains[i],
            status: '',
            summary: '',
            error: error.message
          }]
        });
      }

      // Esperar 1.2 segundos entre requests (excepto después del último)
      if (i < domains.length - 1) {
        await delay(1200);
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking multiple domains:', error);
    throw error;
  }
};

/**
 * Verifica el health del servidor
 * @returns {Promise<Object>} Estado del servidor
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.HEALTH);
    return response.data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

export default apiClient;
