/**
 * @fileoverview Servidor API para la aplicación Domain Checker.
 * Este módulo configura un servidor Express que actúa como proxy para la API de Domainr,
 * permitiendo la búsqueda de dominios y la verificación de disponibilidad.
 * 
 * @module server
 * @requires express - Framework de aplicaciones web para Node.js
 * @requires cors - Middleware para habilitar CORS
 * @requires axios - Cliente HTTP para realizar peticiones a la API externa
 * @requires dotenv - Para cargar variables de entorno
 * 
 * @author 686f6c61 <github.com/686f6c61>
 * @version 1.0.0
 * @license MIT
 */

// Importación de dependencias
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env
dotenv.config();

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Configuración de middleware
 * - cors: Permite solicitudes de orígenes cruzados
 * - express.json: Analiza las solicitudes entrantes con carga útil JSON
 */
app.use(cors());
app.use(express.json());

/**
 * Definición de rutas API
 * 
 * Esta sección implementa los puntos finales REST de nuestra API
 * que interactúan con el servicio Domainr a través de RapidAPI
 */

/**
 * @route   GET /api/search
 * @desc    Busca dominios basados en una consulta proporcionada
 * @param   {string} query - Término de búsqueda para encontrar dominios relacionados
 * @returns {object} Resultados de la búsqueda con sugerencias de dominios
 * @access  Público
 */
app.get('/api/search', async (req, res) => {
  try {
    // Extraer parámetro de consulta
    const { query } = req.query;
    
    // Validación de entrada
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Realizar petición a la API externa
    const response = await axios.get('https://domainr.p.rapidapi.com/v2/search', {
      params: { query },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'domainr.p.rapidapi.com'
      }
    });

    // Devolver los resultados al cliente
    res.json(response.data);
  } catch (error) {
    // Manejo de errores centralizado
    console.error('Error searching domains:', error);
    res.status(500).json({ error: 'Failed to search domains' });
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
    // Extraer parámetro de dominio
    const { domain } = req.query;
    
    // Validación de entrada
    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    // Realizar petición a la API externa
    const response = await axios.get('https://domainr.p.rapidapi.com/v2/status', {
      params: { domain },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'domainr.p.rapidapi.com'
      }
    });

    // Devolver los resultados al cliente
    res.json(response.data);
  } catch (error) {
    // Manejo de errores centralizado
    console.error('Error checking domain status:', error);
    res.status(500).json({ error: 'Failed to check domain status' });
  }
});

/**
 * Iniciar el servidor en el puerto especificado
 * 
 * @listens {number} PORT - Puerto en el que escucha el servidor
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
