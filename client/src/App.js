/**
 * @fileoverview Componente principal de la aplicación Domain Checker
 *
 * Este componente React implementa la interfaz completa de usuario para:
 * - Buscar dominios disponibles con palabras clave
 * - Verificar disponibilidad en tiempo real de múltiples TLDs
 * - Expandir búsqueda con variaciones automáticas (11 TLDs comunes)
 * - Exportar resultados en formatos TXT y CSV
 * - Enlaces directos a buscadores (Google, Bing, DuckDuckGo, Brave)
 *
 * CARACTERÍSTICAS:
 * - Caché LRU integrado (5min TTL) para búsquedas repetidas
 * - Manejo de rate limiting con peticiones secuenciales
 * - Hooks optimizados (useCallback) para rendimiento
 * - Diseño responsivo minimalista en blanco y negro
 * - Exportación con prevención de memory leaks (URL.revokeObjectURL)
 *
 * ARQUITECTURA:
 * - Consume API REST del backend Express
 * - Capa de servicios separada (api.js, cache.js)
 * - Configuración centralizada (config.js)
 * - Manejo de errores con Promise.allSettled
 *
 * @module client/App
 * @requires react - Biblioteca UI declarativa v19.x
 * @requires react-icons/fa - Iconos Font Awesome como componentes React
 * @requires ./services/api - Capa de servicios para peticiones HTTP
 * @requires ./services/cache - Sistema de caché LRU en memoria
 * @requires ./config - Configuración centralizada de la aplicación
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 *
 * @example
 * // Uso básico en index.js
 * import App from './App';
 * ReactDOM.render(<App />, document.getElementById('root'));
 */

import React, { useState, useCallback, useEffect } from 'react';
import './App.css';

// Importar iconos de Font Awesome para la interfaz de usuario
import { FaSearch, FaFileAlt, FaFileCsv, FaExternalLinkAlt, FaGithub, FaCalendarAlt, FaGlobe, FaLaptopCode, FaRegCheckCircle, FaRegTimesCircle, FaInfoCircle } from 'react-icons/fa';

// Importar servicios y configuración
import { searchDomains, checkMultipleDomainStatus } from './services/api';
import cache from './services/cache';
import { COMMON_TLDS, DOMAIN_STATUS_TEXT } from './config';

/**
 * Componente principal de la aplicación
 * @component
 * @returns {JSX.Element} Componente App renderizado
 */
function App() {
  // Estado para almacenar la consulta de búsqueda
  const [query, setQuery] = useState('');
  // Estado para almacenar los resultados de la búsqueda
  const [results, setResults] = useState([]);
  // Estado para controlar la visualización de carga
  const [loading, setLoading] = useState(false);
  // Estado para manejar mensajes de error
  const [error, setError] = useState('');
  // Estado para controlar si la búsqueda ha sido expandida
  const [expanded, setExpanded] = useState(false);

  /**
   * Maneja la búsqueda de dominios cuando se envía el formulario
   *
   * @async
   * @function handleSearch
   * @param {Event} e - Evento del formulario
   * @returns {Promise<void>}
   */
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const searchQuery = query.trim();

    // Verificar caché primero
    const cacheKey = cache.generateKey('search', { query: searchQuery });
    const cachedResults = cache.get(cacheKey);

    if (cachedResults) {
      setResults(cachedResults);
      setExpanded(false);
      return;
    }

    // Actualizar estados para iniciar la búsqueda
    setLoading(true);
    setError('');
    setResults([]);
    setExpanded(false);

    try {
      // Obtener sugerencias de dominios desde la API
      const searchResponse = await searchDomains(searchQuery);

      if (searchResponse.results && searchResponse.results.length > 0) {
        // Extraer lista de dominios de los resultados
        const domains = searchResponse.results.map(result => result.domain);

        // Verificar estado de cada dominio (usa Promise.allSettled internamente)
        const statusResponses = await checkMultipleDomainStatus(domains);

        // Combinar resultados con la información de estado
        const combinedResults = searchResponse.results.map((result, index) => {
          const statusData = statusResponses[index]?.status?.[0] || {};
          return {
            ...result,
            status: statusData.status || '',
            summary: statusData.summary || ''
          };
        });

        // Guardar en caché
        cache.set(cacheKey, combinedResults);

        // Actualizar estado con los resultados combinados
        setResults(combinedResults);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'No se pudo buscar dominios. Por favor, intenta nuevamente.');
    } finally {
      // Finalizar estado de carga independientemente del resultado
      setLoading(false);
    }
  }, [query]);

  /**
   * Determina la clase CSS a aplicar según el estado del dominio
   * 
   * @function getDomainStatusClass
   * @param {string} summary - Resumen del estado del dominio
   * @returns {string} Clase CSS correspondiente al estado
   */
  const getDomainStatusClass = (summary) => {
    if (!summary) return '';
    if (summary === 'inactive') return 'available';
    return 'unavailable';
  };

  /**
   * Obtiene el texto descriptivo para el estado del dominio
   *
   * @function getDomainStatusText
   * @param {string} summary - Resumen del estado del dominio
   * @returns {string} Texto legible para el usuario
   */
  const getDomainStatusText = useCallback((summary) => {
    return DOMAIN_STATUS_TEXT[summary] || DOMAIN_STATUS_TEXT.default;
  }, []);

  /**
   * Construye las URLs para buscar un dominio en diferentes motores de búsqueda
   * 
   * @function getSearchUrls
   * @param {string} domain - Nombre de dominio a buscar
   * @returns {Object} Objeto con URLs para cada motor de búsqueda
   */
  const getSearchUrls = (domain) => {
    const searchQuery = `comprar dominio ${domain}`;
    return {
      google: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,
      brave: `https://search.brave.com/search?q=${encodeURIComponent(searchQuery)}`
    };
  };

  /**
   * Exporta los resultados de búsqueda a un archivo de texto (TXT)
   *
   * @function exportToTXT
   * @returns {void}
   */
  const exportToTXT = useCallback(() => {
    if (!results.length) return;

    // Generar contenido del archivo
    let content = 'RESULTADOS DE BÚSQUEDA DE DOMINIOS\n';
    content += '==============================\n\n';
    content += `Búsqueda: ${query}\n`;
    content += `Fecha: ${new Date().toLocaleString()}\n\n`;
    content += 'DOMINIOS:\n';

    // Añadir cada resultado al contenido
    results.forEach(result => {
      content += `\n- ${result.domain}`;
      content += `\n  Estado: ${getDomainStatusText(result.summary)}`;
      content += '\n';
    });

    // Crear y descargar el archivo
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dominios-${query.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar memoria del blob URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [results, query, getDomainStatusText]);

  /**
   * Exporta los resultados de búsqueda a un archivo CSV
   *
   * @function exportToCSV
   * @returns {void}
   */
  const exportToCSV = useCallback(() => {
    if (!results.length) return;

    let content = 'Dominio,Estado,Tipo\n';

    results.forEach(result => {
      content += `${result.domain},${getDomainStatusText(result.summary)},${result.zone}\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dominios-${query.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar memoria del blob URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [results, query, getDomainStatusText]);

  /**
   * Expande la búsqueda con variantes del término original en diferentes TLDs
   *
   * @async
   * @function handleExpandSearch
   * @returns {Promise<void>}
   */
  const handleExpandSearch = useCallback(async () => {
    if (loading || !query.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Generar consultas adicionales basadas en el término original
      const queryBase = query.trim().replace(/\s+/g, '');
      const additionalQueries = [...COMMON_TLDS.map(tld => `${queryBase}.${tld}`), queryBase];

      // Ejecutar búsquedas en paralelo para cada variante (con Promise.allSettled)
      const searchPromises = additionalQueries.map(q => searchDomains(q));
      const searchResults = await Promise.allSettled(searchPromises);

      // Extraer dominios únicos de todas las búsquedas para evitar duplicados
      const allDomains = new Set();
      const combinedResults = [];

      searchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.results && result.value.results.length > 0) {
          result.value.results.forEach(domainResult => {
            if (!allDomains.has(domainResult.domain)) {
              allDomains.add(domainResult.domain);
              combinedResults.push(domainResult);
            }
          });
        }
      });

      // Verificar el estado de disponibilidad de cada dominio
      if (combinedResults.length > 0) {
        const domains = combinedResults.map(result => result.domain);

        // Verificar estado (usa Promise.allSettled internamente)
        const statusResponses = await checkMultipleDomainStatus(domains);

        // Combinar la información de dominio con su estado
        const newResults = combinedResults.map((result, index) => {
          const statusData = statusResponses[index]?.status?.[0] || {};
          return {
            ...result,
            status: statusData.status || '',
            summary: statusData.summary || ''
          };
        });

        // Combinar con resultados existentes eliminando duplicados
        const combinedDomains = new Set(results.map(r => r.domain));
        const filteredNewResults = newResults.filter(r => !combinedDomains.has(r.domain));

        setResults([...results, ...filteredNewResults]);
        setExpanded(true); // Marcar la búsqueda como expandida
      }
    } catch (err) {
      console.error('Error expanding search:', err);
      setError(err.message || 'No se pudo expandir la búsqueda. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [loading, query, results]);

  return (
    <div className="App">
      <div className="header">
        <h1>Domain Checker</h1>
        <p>Estaba cansado de entrar en buscadores de dominios y me cree uno propio</p>
      </div>
      
      <div className="domain-form">
        <div className="search-info">
          <FaInfoCircle className="info-icon" /> 
          <span>Busca nombres de dominio y verifica su disponibilidad al instante</span>
        </div>
        <form onSubmit={handleSearch}>
          <div className="input-group">
            <span className="input-icon"><FaGlobe /></span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe un nombre o palabra clave..."
            />
            <button type="submit"><FaSearch /> Buscar</button>
          </div>
        </form>
      </div>
      
      {loading && <div className="loading">Buscando dominios...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!loading && results.length > 0 && (
        <>
          <div className="export-buttons">
            <button onClick={exportToTXT} className="export-btn txt">
              <FaFileAlt /> Exportar TXT
            </button>
            <button onClick={exportToCSV} className="export-btn csv">
              <FaFileCsv /> Exportar CSV
            </button>
            {!expanded && (
              <button onClick={handleExpandSearch} className="export-btn expand" disabled={loading}>
                <FaSearch /> Listar más dominios
              </button>
            )}
          </div>
          <div className="results">
            {results.map((result, index) => (
            <div 
              key={index} 
              className={`domain-item ${getDomainStatusClass(result.summary)}`}
            >
              <div className="domain-name">{result.domain}</div>
              <div className="domain-actions">
                <div className={`domain-status ${getDomainStatusClass(result.summary)}`}>
                  {result.summary === 'inactive' ? <FaRegCheckCircle /> : <FaRegTimesCircle />} {getDomainStatusText(result.summary)}
                </div>
                
                {result.summary === 'inactive' && (
                  <div className="search-buttons">
                    {Object.entries(getSearchUrls(result.domain)).map(([engine, url]) => (
                      <a 
                        key={engine} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`search-button ${engine}`}
                        title={`Buscar en ${engine.charAt(0).toUpperCase() + engine.slice(1)}`}
                      >
                        <FaExternalLinkAlt />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
      
      <div className="powered-by">
        <div>Powered by Domainr API</div>
        <div className="author-info">
          <a href="https://github.com/686f6c61" target="_blank" rel="noopener noreferrer" className="github-link">
            <FaGithub /> github.com/686f6c61
          </a>
          <span className="date-info">
            <FaCalendarAlt /> Mayo 2025
          </span>
          <span className="tech-info">
            <FaLaptopCode /> React + Node.js
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
