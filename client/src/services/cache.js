/**
 * @fileoverview Sistema de caché LRU (Least Recently Used) en memoria
 *
 * Implementa un sistema de caché inteligente para optimizar el rendimiento
 * de la aplicación almacenando temporalmente los resultados de búsquedas.
 *
 * CARACTERÍSTICAS:
 * - Estrategia LRU: Elimina automáticamente las entradas menos usadas
 * - TTL configurable: Expiración automática después de 5 minutos
 * - Tamaño máximo: Límite de 100 entradas en memoria
 * - Generación de keys: Normalización automática de parámetros
 * - Validación de expiración: Elimina entradas vencidas al acceder
 * - Patrón Singleton: Una única instancia compartida en toda la app
 *
 * VENTAJAS:
 * - Reduce llamadas innecesarias a la API
 * - Mejora velocidad de búsquedas repetidas (~10x más rápido)
 * - Ahorra requests del plan de RapidAPI
 * - Experiencia de usuario más fluida
 *
 * ALGORITMO LRU:
 * - Al acceder: Mueve el elemento al final (más reciente)
 * - Al insertar: Si está lleno, elimina el primero (más antiguo)
 * - Map de JavaScript mantiene orden de inserción
 *
 * @module client/services/cache
 * @requires ../config - Configuración de caché (TTL, MAX_SIZE, ENABLED)
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 *
 * @example
 * // Usar caché en componente
 * import cache from './services/cache';
 *
 * const cacheKey = cache.generateKey('search', { query: 'ejemplo' });
 * const cached = cache.get(cacheKey);
 *
 * if (cached) {
 *   return cached; // Hit: 10x más rápido
 * }
 *
 * const results = await apiCall();
 * cache.set(cacheKey, results); // Guardar para siguiente vez
 */

import { CACHE_CONFIG } from '../config';

/**
 * Clase para manejar caché LRU (Least Recently Used)
 */
class Cache {
  constructor(maxSize = CACHE_CONFIG.MAX_SIZE, ttl = CACHE_CONFIG.TTL) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.enabled = CACHE_CONFIG.ENABLED;
  }

  /**
   * Genera una clave de caché a partir de los parámetros
   * @param {string} key - Clave base
   * @param {Object} params - Parámetros adicionales
   * @returns {string} Clave de caché
   */
  generateKey(key, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    return paramStr ? `${key}?${paramStr}` : key;
  }

  /**
   * Obtiene un valor del caché
   * @param {string} key - Clave de caché
   * @returns {*} Valor cacheado o null
   */
  get(key) {
    if (!this.enabled) return null;

    const item = this.cache.get(key);

    if (!item) return null;

    // Verificar si expiró
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar acceso (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  /**
   * Guarda un valor en el caché
   * @param {string} key - Clave de caché
   * @param {*} value - Valor a cachear
   */
  set(key, value) {
    if (!this.enabled) return;

    // Si el caché está lleno, eliminar el más antiguo (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  /**
   * Elimina un valor del caché
   * @param {string} key - Clave de caché
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Obtiene el tamaño actual del caché
   * @returns {number} Número de entradas
   */
  size() {
    return this.cache.size;
  }

  /**
   * Habilita o deshabilita el caché
   * @param {boolean} enabled - Estado del caché
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}

// Instancia singleton de caché
const cacheInstance = new Cache();

export default cacheInstance;
