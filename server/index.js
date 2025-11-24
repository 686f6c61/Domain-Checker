/**
 * @fileoverview Servidor API para la aplicación Domain Checker
 *
 * Este módulo configura un servidor Express con seguridad reforzada que actúa como
 * backend para la aplicación Domain Checker. Proporciona endpoints para:
 * - Búsqueda de dominios disponibles con múltiples TLDs
 * - Verificación de disponibilidad usando Domains API (RapidAPI)
 * - Health check para monitoreo
 *
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Rate limiting (100 req/15min por IP)
 * - CORS con whitelist configurable
 * - Helmet.js para headers de seguridad HTTP
 * - Validación y sanitización de inputs
 * - Timeouts en requests externos (10s)
 * - Logging estructurado con Winston
 * - Graceful shutdown
 *
 * API EXTERNA UTILIZADA:
 * - Domains API by Layered (via RapidAPI)
 * - Endpoint: https://domains-api.p.rapidapi.com
 * - Documentación: https://rapidapi.com/layered-layered-default/api/domains-api
 *
 * @module server/index
 * @requires express - Framework web minimalista para Node.js v5.x
 * @requires cors - Middleware para habilitar CORS
 * @requires axios - Cliente HTTP basado en promesas v1.x
 * @requires dotenv - Carga variables de entorno desde .env
 * @requires express-rate-limit - Middleware de rate limiting v8.x
 * @requires helmet - Middleware de seguridad HTTP headers v8.x
 * @requires winston - Logger profesional con niveles y transports v3.x
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 *
 * @example
 * // Iniciar servidor en desarrollo
 * NODE_ENV=development npm run dev
 *
 * @example
 * // Iniciar servidor en producción
 * NODE_ENV=production npm start
 */

// Importación de dependencias
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');

// Cargar variables de entorno desde .env
dotenv.config();

// Validar variables de entorno críticas
if (!process.env.RAPIDAPI_KEY) {
  console.error('ERROR: RAPIDAPI_KEY is not defined in environment variables');
  console.error('Please create a .env file with your RapidAPI key');
  process.exit(1);
}

// Configurar logger con Winston
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;

/**
 * Configuración de middleware
 */

// Helmet para seguridad de headers HTTP
app.use(helmet());

// CORS configurado de forma segura
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = CLIENT_URL.split(',').map(url => url.trim());

    if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Parse JSON payloads
app.use(express.json());

// Rate limiting para prevenir abuso
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Aplicar rate limiting a todas las rutas /api
app.use('/api/', limiter);

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    query: req.query
  });
  next();
});

/**
 * Definición de rutas API
 *
 * Esta sección implementa los puntos finales REST de nuestra API
 * que interactúan con el servicio Domainr a través de RapidAPI
 */

/**
 * Helper function para sanitizar inputs
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Helper function para manejo de errores de API
 */
const handleApiError = (error, res, logger, context) => {
  if (error.response) {
    // El servidor respondió con un código de error
    const status = error.response.status;
    const message = error.response.data?.message || error.response.statusText;

    logger.error(`API Error (${context}):`, {
      status,
      message,
      data: error.response.data
    });

    switch (status) {
      case 401:
        return res.status(503).json({
          error: 'API authentication failed. Please check your API key.',
          code: 'API_AUTH_ERROR'
        });
      case 403:
        // Verificar si es un error de suscripción
        if (message && message.includes('not subscribed')) {
          return res.status(403).json({
            error: 'No estás suscrito a esta API. Por favor, ve a https://rapidapi.com/layered-layered-default/api/domains-api y suscríbete a un plan (hay opciones gratuitas).',
            code: 'API_NOT_SUBSCRIBED',
            subscriptionUrl: 'https://rapidapi.com/layered-layered-default/api/domains-api'
          });
        }
        return res.status(503).json({
          error: 'Access forbidden. Please check your API credentials.',
          code: 'API_FORBIDDEN'
        });
      case 429:
        return res.status(429).json({
          error: 'Too many requests to external service',
          code: 'API_RATE_LIMIT'
        });
      case 404:
        return res.status(404).json({
          error: 'Resource not found',
          code: 'NOT_FOUND'
        });
      default:
        return res.status(502).json({
          error: 'External service error',
          code: 'API_ERROR'
        });
    }
  } else if (error.request) {
    // La petición se hizo pero no hubo respuesta
    logger.error(`No response from API (${context}):`, error.message);
    return res.status(504).json({
      error: 'External service timeout',
      code: 'API_TIMEOUT'
    });
  } else {
    // Error en la configuración de la petición
    logger.error(`Request setup error (${context}):`, error.message);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @returns {object} Estado del servidor
 * @access  Público
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

/**
 * @route   GET /api/search
 * @desc    Busca dominios basados en una consulta proporcionada
 * @param   {string} query - Término de búsqueda para encontrar dominios relacionados
 * @returns {object} Resultados de la búsqueda con sugerencias de dominios
 * @access  Público
 */
app.get('/api/search', async (req, res) => {
  try {
    // Extraer y sanitizar parámetro de consulta
    const query = sanitizeInput(req.query.query);

    // Validación de entrada
    if (!query) {
      return res.status(400).json({
        error: 'Query parameter is required',
        code: 'MISSING_QUERY'
      });
    }

    if (query.length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters',
        code: 'QUERY_TOO_SHORT'
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        error: 'Query must be less than 100 characters',
        code: 'QUERY_TOO_LONG'
      });
    }

    logger.debug(`Searching domains for query: ${query}`);

    // Generar lista de dominios sugeridos con diferentes TLDs
    const tlds = ['com', 'net', 'org', 'io', 'co', 'app', 'dev', 'ai', 'me', 'tech', 'online'];
    const suggestions = tlds.map(tld => ({
      domain: `${query}.${tld}`,
      path: `/domains/${query}.${tld}`,
      subdomain: '',
      zone: tld
    }));

    logger.debug(`Generated ${suggestions.length} domain suggestions for query: ${query}`);

    // Devolver formato compatible con Domainr API
    res.json({
      results: suggestions
    });
  } catch (error) {
    handleApiError(error, res, logger, 'search');
  }
});

/**
 * @route   GET /api/status
 * @desc    Verifica el estado de disponibilidad de un dominio
 * @param   {string} domain - Nombre de dominio completo a verificar
 * @returns {object} Información del estado del dominio
 * @access  Público
 */
app.get('/api/status', async (req, res) => {
  try {
    // Extraer y sanitizar parámetro de dominio
    const domain = sanitizeInput(req.query.domain);

    // Validación de entrada
    if (!domain) {
      return res.status(400).json({
        error: 'Domain parameter is required',
        code: 'MISSING_DOMAIN'
      });
    }

    // Validación básica de formato de dominio
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        error: 'Invalid domain format',
        code: 'INVALID_DOMAIN'
      });
    }

    logger.debug(`Checking status for domain: ${domain}`);

    // Realizar petición a la nueva API de Domains
    const response = await axios.get(`https://domains-api.p.rapidapi.com/domains/${domain}`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'domains-api.p.rapidapi.com'
      },
      timeout: API_TIMEOUT
    });

    logger.debug(`Status check successful for domain: ${domain}`);

    // Transformar respuesta al formato compatible con Domainr
    const domainInfo = response.data;
    const isAvailable = domainInfo.availability === 'available';

    // Devolver en formato compatible con el cliente
    res.json({
      status: [{
        domain: domain,
        zone: domainInfo.tld || domain.split('.').pop(),
        status: isAvailable ? 'inactive' : 'active',
        summary: isAvailable ? 'available' : 'taken',
        availability: domainInfo.availability
      }]
    });
  } catch (error) {
    handleApiError(error, res, logger, 'status');
  }
});

/**
 * Manejador de rutas no encontradas (404)
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

/**
 * Manejador global de errores
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

/**
 * Iniciar el servidor en el puerto especificado
 *
 * @listens {number} PORT - Puerto en el que escucha el servidor
 */
const server = app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version
  });
});

/**
 * Manejo de cierre graceful
 */
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, closing server gracefully...`);

  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Manejo de excepciones no capturadas
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  gracefulShutdown('unhandledRejection');
});
