/**
 * @fileoverview Punto de entrada principal de la aplicación React
 *
 * Este archivo es el entry point de toda la aplicación frontend. Se encarga de:
 * - Montar el componente raíz App en el DOM
 * - Habilitar React.StrictMode para detección de problemas en desarrollo
 * - Inicializar reportWebVitals para métricas de rendimiento
 *
 * REACT.STRICTMODE:
 * Activa verificaciones y advertencias adicionales en desarrollo:
 * - Detecta side effects no deseados
 * - Advierte sobre APIs deprecadas
 * - Detecta uso incorrecto de refs
 * - No afecta el build de producción
 *
 * WEB VITALS:
 * Métricas de rendimiento del navegador (Core Web Vitals):
 * - LCP (Largest Contentful Paint): Velocidad de carga
 * - FID (First Input Delay): Interactividad
 * - CLS (Cumulative Layout Shift): Estabilidad visual
 *
 * @module client/index
 * @requires react - Biblioteca UI v19.x
 * @requires react-dom/client - Renderizado en el navegador
 * @requires ./App - Componente principal de la aplicación
 * @requires ./reportWebVitals - Medición de métricas de rendimiento
 *
 * @author 686f6c61 <github.com/686f6c61>
 * @version 2.0.0
 * @date Noviembre 2025
 * @license MIT
 *
 * @see {@link https://create-react-app.dev/docs/measuring-performance} Measuring Performance
 * @see {@link https://web.dev/vitals/} Web Vitals
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Crear root de React 18+ (Concurrent Mode)
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar aplicación con StrictMode para detección de problemas
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Iniciar medición de Web Vitals
// Para enviar métricas a analytics: reportWebVitals(console.log)
// Para producción: reportWebVitals(sendToAnalytics)
reportWebVitals();
