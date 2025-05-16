/**
 * @fileoverview Componente principal de la aplicación Domain Checker.
 * Este componente implementa la interfaz de usuario para buscar dominios,
 * verificar su disponibilidad y exportar los resultados en diferentes formatos.
 * 
 * @module App
 * @requires React - Biblioteca para construir interfaces de usuario
 * @requires axios - Cliente HTTP para realizar peticiones a la API
 * @requires react-icons/fa - Iconos de Font Awesome para React
 * 
 * @author 686f6c61 <github.com/686f6c61>
 * @version 1.0.0
 * @license MIT
 */

import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Importar iconos de Font Awesome para la interfaz de usuario
import { FaSearch, FaFileAlt, FaFileCsv, FaExternalLinkAlt, FaGithub, FaCalendarAlt, FaGlobe, FaLaptopCode, FaRegCheckCircle, FaRegTimesCircle, FaInfoCircle } from 'react-icons/fa';

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
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Actualizar estados para iniciar la búsqueda
    setLoading(true);
    setError('');
    setResults([]);
    setExpanded(false);
    
    try {
      // Obtener sugerencias de dominios desde la API
      const searchResponse = await axios.get(`http://localhost:5000/api/search?query=${encodeURIComponent(query)}`);
      
      if (searchResponse.data.results && searchResponse.data.results.length > 0) {
        // Extraer lista de dominios de los resultados
        const domains = searchResponse.data.results.map(result => result.domain);
        
        // Crear array de promesas para verificar estado de cada dominio
        const statusPromises = domains.map(domain => 
          axios.get(`http://localhost:5000/api/status?domain=${encodeURIComponent(domain)}`)
        );
        
        // Esperar a que se completen todas las verificaciones de estado
        const statusResponses = await Promise.all(statusPromises);
        
        // Combinar resultados con la información de estado
        const combinedResults = searchResponse.data.results.map((result, index) => {
          const statusData = statusResponses[index].data.status[0] || {};
          return {
            ...result,
            status: statusData.status || '',
            summary: statusData.summary || ''
          };
        });
        
        // Actualizar estado con los resultados combinados
        setResults(combinedResults);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to search domains. Please try again.');
    } finally {
      // Finalizar estado de carga independientemente del resultado
      setLoading(false);
    }
  };

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
  const getDomainStatusText = (summary) => {
    if (!summary) return 'Unknown';
    if (summary === 'inactive') return 'Available';
    return 'Unavailable';
  };

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
  const exportToTXT = () => {
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
  };

  // Función para exportar resultados a un archivo CSV
  const exportToCSV = () => {
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
  };

  /**
   * Expande la búsqueda con variantes del término original en diferentes TLDs
   * 
   * @async
   * @function handleExpandSearch
   * @returns {Promise<void>}
   */
  const handleExpandSearch = async () => {
    if (loading || !query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Lista de TLDs comunes para expandir la búsqueda
      const commonTLDs = ['com', 'net', 'org', 'io', 'co', 'app', 'dev', 'tech', 'ai', 'shop', 'store'];
      
      // Generar consultas adicionales basadas en el término original
      const queryBase = query.trim().replace(/\s+/g, '');
      const additionalQueries = [...commonTLDs.map(tld => `${queryBase}.${tld}`), queryBase];
      
      // Ejecutar búsquedas en paralelo para cada variante
      const searchPromises = additionalQueries.map(q => 
        axios.get(`http://localhost:5000/api/search?query=${encodeURIComponent(q)}`)
      );
      
      const searchResults = await Promise.all(searchPromises);
      
      // Extraer dominios únicos de todas las búsquedas para evitar duplicados
      const allDomains = new Set();
      const combinedResults = [];
      
      searchResults.forEach(response => {
        if (response.data.results && response.data.results.length > 0) {
          response.data.results.forEach(result => {
            if (!allDomains.has(result.domain)) {
              allDomains.add(result.domain);
              combinedResults.push(result);
            }
          });
        }
      });
      
      // Verificar el estado de disponibilidad de cada dominio
      if (combinedResults.length > 0) {
        const domains = combinedResults.map(result => result.domain);
        
        // Crear solicitudes de estado en paralelo para optimizar el rendimiento
        const statusPromises = domains.map(domain => 
          axios.get(`http://localhost:5000/api/status?domain=${encodeURIComponent(domain)}`)
        );
        
        const statusResponses = await Promise.all(statusPromises);
        
        // Combinar la información de dominio con su estado
        const newResults = combinedResults.map((result, index) => {
          const statusData = statusResponses[index].data.status[0] || {};
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
      setError('Failed to expand domain search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
