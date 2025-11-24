/**
 * @fileoverview Extensión de Chrome para Domain Checker
 *
 * Script principal de la extensión de navegador que permite verificar
 * disponibilidad de dominios sin abrir la aplicación web completa.
 * Funciona de manera independiente conectándose directamente a Domainr API.
 *
 * CARACTERÍSTICAS:
 * - Popup compacto con búsqueda rápida
 * - Verificación en tiempo real de dominios
 * - Expansión automática con 11 TLDs comunes
 * - Exportación de resultados (TXT, CSV)
 * - Almacenamiento seguro de API key en Chrome Storage
 * - Detección de errores de API (rate limiting, suscripción)
 * - Interfaz minimalista responsiva
 *
 * ARQUITECTURA:
 * - Vanilla JavaScript (sin frameworks)
 * - Chrome Storage API para persistencia
 * - Fetch API para peticiones HTTP
 * - DOM manipulation para UI dinámica
 *
 * NOTA IMPORTANTE:
 * Esta extensión todavía usa Domainr API directamente. Para usar
 * Domains API de Layered, actualizar RAPIDAPI_HOST y endpoints.
 *
 * PERMISOS REQUERIDOS (manifest.json):
 * - storage: Para guardar API key
 * - activeTab: Para acceder a la pestaña actual
 *
 * @module extension/popup
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 *
 * @see {@link https://developer.chrome.com/docs/extensions/mv3/getstarted/} Chrome Extensions Guide
 */

// Elementos DOM
const searchForm = document.getElementById('search-form');
const domainQueryInput = document.getElementById('domain-query');
const resultsContainer = document.getElementById('results');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const exportButtons = document.getElementById('export-buttons');
const expandSearchButton = document.getElementById('expand-search');
const exportTxtButton = document.getElementById('export-txt');
const exportCsvButton = document.getElementById('export-csv');

// Estado de la aplicación
let currentQuery = '';
let searchResults = [];
let isExpanded = false;

// API Key almacenada
let apiKey = '';

// Constantes
const RAPIDAPI_HOST = 'domainr.p.rapidapi.com';
const API_KEY_STORAGE_KEY = 'domain_checker_api_key';

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar la API key guardada en el almacenamiento
  chrome.storage.sync.get([API_KEY_STORAGE_KEY], (result) => {
    if (result[API_KEY_STORAGE_KEY]) {
      apiKey = result[API_KEY_STORAGE_KEY];
    } else {
      // Si no hay API key guardada, pedirla al usuario
      promptForApiKey();
    }
  });

  // Configurar manejadores de eventos
  searchForm.addEventListener('submit', handleSearch);
  expandSearchButton.addEventListener('click', handleExpandSearch);
  exportTxtButton.addEventListener('click', exportToTXT);
  exportCsvButton.addEventListener('click', exportToCSV);
});

/**
 * Solicita la API key al usuario
 */
function promptForApiKey() {
  apiKey = prompt(
    'Para usar Domain Checker, necesita una clave API de RapidAPI para Domainr.\n' +
    '1. Regístrate en RapidAPI: https://rapidapi.com/\n' +
    '2. Busca la API de Domainr y suscríbete (hay opciones gratuitas)\n' +
    '3. Copia tu clave API y pégala a continuación:'
  );
  
  if (apiKey) {
    // Guardar la API key en el almacenamiento
    chrome.storage.sync.set({ [API_KEY_STORAGE_KEY]: apiKey });
  } else {
    showError('Se requiere una clave API para usar esta extensión.');
  }
}

/**
 * Maneja la búsqueda de dominios
 * @param {Event} e - Evento del formulario
 */
async function handleSearch(e) {
  e.preventDefault();
  
  currentQuery = domainQueryInput.value.trim();
  if (!currentQuery) return;
  if (!apiKey) {
    promptForApiKey();
    return;
  }
  
  // Reiniciar estado
  searchResults = [];
  isExpanded = false;
  showLoading();
  clearResults();
  hideError();
  hideExportButtons();
  
  try {
    // Buscar dominios basados en la consulta
    const domainResults = await searchDomains(currentQuery);
    
    if (domainResults && domainResults.length > 0) {
      // Verificar disponibilidad de cada dominio
      const domainsWithStatus = await checkDomainsStatus(domainResults);
      searchResults = domainsWithStatus;
      
      // Mostrar resultados
      displayResults(searchResults);
      showExportButtons();
    } else {
      showError('No se encontraron dominios para esta consulta.');
    }
  } catch (error) {
    console.error('Error en la búsqueda:', error);
    showError('Error al buscar dominios. Verifica tu clave API y conexión.');
  } finally {
    hideLoading();
  }
}

/**
 * Busca dominios usando la API de Domainr
 * @param {string} query - Consulta de búsqueda
 * @returns {Promise<Array>} - Resultados de la búsqueda
 */
async function searchDomains(query) {
  const url = `https://${RAPIDAPI_HOST}/v2/search?query=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  });
  
  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

/**
 * Verifica el estado de disponibilidad de varios dominios
 * @param {Array} domains - Lista de objetos de dominio
 * @returns {Promise<Array>} - Dominios con información de estado
 */
async function checkDomainsStatus(domains) {
  // Crear un array de promesas para verificaciones en paralelo
  const statusPromises = domains.map(domain => {
    return checkDomainStatus(domain.domain)
      .then(statusData => {
        return {
          ...domain,
          status: statusData.status || '',
          summary: statusData.summary || ''
        };
      })
      .catch(error => {
        console.error(`Error checking status for ${domain.domain}:`, error);
        return {
          ...domain,
          status: '',
          summary: ''
        };
      });
  });
  
  // Esperar a que todas las verificaciones se completen
  return Promise.all(statusPromises);
}

/**
 * Verifica el estado de un dominio específico
 * @param {string} domain - Nombre de dominio
 * @returns {Promise<Object>} - Datos de estado del dominio
 */
async function checkDomainStatus(domain) {
  const url = `https://${RAPIDAPI_HOST}/v2/status?domain=${encodeURIComponent(domain)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  });
  
  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.status[0] || {};
}

/**
 * Muestra los resultados en la interfaz
 * @param {Array} results - Resultados de búsqueda de dominios
 */
function displayResults(results) {
  clearResults();
  
  results.forEach(result => {
    const domainItem = document.createElement('div');
    domainItem.className = `domain-item ${getDomainStatusClass(result.summary)}`;
    
    const domainName = document.createElement('div');
    domainName.className = 'domain-name';
    domainName.textContent = result.domain;
    
    const domainActions = document.createElement('div');
    domainActions.className = 'domain-actions';
    
    const domainStatus = document.createElement('div');
    domainStatus.className = `domain-status ${getDomainStatusClass(result.summary)}`;
    domainStatus.textContent = getDomainStatusText(result.summary);
    
    domainActions.appendChild(domainStatus);
    
    // Añadir botones de búsqueda para dominios disponibles
    if (result.summary === 'inactive') {
      const searchButtons = document.createElement('div');
      searchButtons.className = 'search-buttons';
      
      // Crear botones para diferentes motores de búsqueda
      const engines = {
        google: '#4285F4',
        bing: '#008373',
        duckduckgo: '#DE5833',
        brave: '#FB542B'
      };
      
      Object.entries(engines).forEach(([engine, color]) => {
        const searchButton = document.createElement('a');
        searchButton.className = `search-button ${engine}`;
        searchButton.style.backgroundColor = color;
        searchButton.href = getSearchUrl(engine, result.domain);
        searchButton.target = '_blank';
        searchButton.title = `Buscar en ${engine.charAt(0).toUpperCase() + engine.slice(1)}`;
        searchButton.textContent = engine.charAt(0).toUpperCase();
        
        searchButton.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.tabs.create({ url: searchButton.href });
        });
        
        searchButtons.appendChild(searchButton);
      });
      
      domainActions.appendChild(searchButtons);
    }
    
    domainItem.appendChild(domainName);
    domainItem.appendChild(domainActions);
    resultsContainer.appendChild(domainItem);
  });
}

/**
 * Determina la clase CSS para un estado de dominio
 * @param {string} summary - Resumen del estado del dominio
 * @returns {string} - Nombre de clase CSS
 */
function getDomainStatusClass(summary) {
  if (!summary) return '';
  return summary === 'inactive' ? 'available' : 'unavailable';
}

/**
 * Obtiene el texto descriptivo para un estado de dominio
 * @param {string} summary - Resumen del estado del dominio
 * @returns {string} - Texto descriptivo
 */
function getDomainStatusText(summary) {
  if (!summary) return 'Desconocido';
  return summary === 'inactive' ? 'Disponible' : 'No disponible';
}

/**
 * Construye una URL de búsqueda para un motor específico
 * @param {string} engine - Nombre del motor de búsqueda
 * @param {string} domain - Nombre de dominio
 * @returns {string} - URL de búsqueda
 */
function getSearchUrl(engine, domain) {
  const searchQuery = `comprar dominio ${domain}`;
  const encodedQuery = encodeURIComponent(searchQuery);
  
  const urls = {
    google: `https://www.google.com/search?q=${encodedQuery}`,
    bing: `https://www.bing.com/search?q=${encodedQuery}`,
    duckduckgo: `https://duckduckgo.com/?q=${encodedQuery}`,
    brave: `https://search.brave.com/search?q=${encodedQuery}`
  };
  
  return urls[engine] || urls.google;
}

/**
 * Maneja la expansión de la búsqueda con más TLDs
 */
async function handleExpandSearch() {
  if (!currentQuery || isExpanded) return;
  
  showLoading();
  hideError();
  
  try {
    // TLDs comunes para probar
    const commonTLDs = ['com', 'net', 'org', 'io', 'co', 'app', 'dev', 'tech', 'ai', 'shop', 'store'];
    const queryBase = currentQuery.trim().replace(/\s+/g, '');
    
    // Buscar cada variación de TLD
    const additionalQueries = commonTLDs.map(tld => `${queryBase}.${tld}`);
    const searchPromises = additionalQueries.map(query => searchDomains(query));
    
    const searchResults = await Promise.all(searchPromises);
    
    // Combinar y eliminar duplicados
    const allDomains = new Set();
    const combinedResults = [];
    
    searchResults.forEach(resultSet => {
      if (resultSet && resultSet.length > 0) {
        resultSet.forEach(result => {
          if (!allDomains.has(result.domain)) {
            allDomains.add(result.domain);
            combinedResults.push(result);
          }
        });
      }
    });
    
    // Verificar el estado de los dominios adicionales
    if (combinedResults.length > 0) {
      const newDomainsWithStatus = await checkDomainsStatus(combinedResults);
      
      // Filtrar duplicados con los resultados originales
      const currentDomains = new Set(searchResults.map(r => r.domain));
      const filteredNewResults = newDomainsWithStatus.filter(r => !currentDomains.has(r.domain));
      
      // Añadir nuevos resultados
      searchResults = [...searchResults, ...filteredNewResults];
      displayResults(searchResults);
      
      // Marcar como expandido y ocultar el botón de expansión
      isExpanded = true;
      expandSearchButton.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error expanding search:', error);
    showError('Error al expandir la búsqueda. Inténtalo de nuevo.');
  } finally {
    hideLoading();
  }
}

/**
 * Exporta los resultados a un archivo TXT
 */
function exportToTXT() {
  if (!searchResults.length) return;
  
  let content = 'RESULTADOS DE BÚSQUEDA DE DOMINIOS\n';
  content += '==============================\n\n';
  content += `Búsqueda: ${currentQuery}\n`;
  content += `Fecha: ${new Date().toLocaleString()}\n\n`;
  content += 'DOMINIOS:\n';
  
  searchResults.forEach(result => {
    content += `\n- ${result.domain}`;
    content += `\n  Estado: ${getDomainStatusText(result.summary)}`;
    content += '\n';
  });

  downloadFile(content, `dominios-${currentQuery.replace(/\s+/g, '-')}.txt`, 'text/plain');
}

/**
 * Exporta los resultados a un archivo CSV
 */
function exportToCSV() {
  if (!searchResults.length) return;
  
  let content = 'Dominio,Estado,Tipo\n';
  
  searchResults.forEach(result => {
    content += `${result.domain},${getDomainStatusText(result.summary)},${result.zone}\n`;
  });

  downloadFile(content, `dominios-${currentQuery.replace(/\s+/g, '-')}.csv`, 'text/csv');
}

/**
 * Descarga un archivo con el contenido especificado
 * @param {string} content - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} contentType - Tipo MIME del contenido
 */
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

// Funciones auxiliares de UI

function showLoading() {
  loadingElement.classList.remove('hidden');
}

function hideLoading() {
  loadingElement.classList.add('hidden');
}

function showError(message) {
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
}

function hideError() {
  errorElement.classList.add('hidden');
}

function clearResults() {
  resultsContainer.innerHTML = '';
}

function showExportButtons() {
  exportButtons.classList.remove('hidden');
}

function hideExportButtons() {
  exportButtons.classList.add('hidden');
}
