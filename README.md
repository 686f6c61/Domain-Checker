# Domain Checker

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

<p align="center">
  <img src="https://img.shields.io/badge/node.js-16.x-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/react-18.x-blue.svg" alt="React">
  <img src="https://img.shields.io/badge/express-4.x-lightgrey.svg" alt="Express">
</p>

> Una aplicación full-stack para verificar la disponibilidad de dominios en tiempo real con una interfaz moderna y minimalista en blanco y negro.

## 📋 Índice de contenidos

- [Características principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Requisitos previos](#-requisitos-previos)
- [Instalación y configuración](#-instalación-y-configuración)
- [Ejecución](#-ejecución)
- [Uso](#-uso)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [APIs y puntos finales](#-apis-y-puntos-finales)
- [Tecnologías utilizadas](#-tecnologías-utilizadas)
- [Configuración de API](#-configuración-de-api)
- [Contribución](#-contribución)
- [Autor](#-autor)
- [Licencia](#-licencia)

## ✨ Características principales

- **Búsqueda inteligente**: Búsqueda de dominios sugeridos basados en palabras clave
- **Verificación en tiempo real**: Comprueba la disponibilidad de dominios instantáneamente
- **Búsqueda ampliada**: Función de "Listar más dominios" que busca variaciones con diferentes TLDs
- **Exportación de datos**: Exporta los resultados en formatos TXT y CSV
- **Enlaces directos**: Búsqueda rápida en Google, Bing, DuckDuckGo y Brave Search
- **Diseño responsivo**: Interfaz limpia y moderna con diseño en blanco y negro
- **Experiencia de usuario mejorada**: Iconos intuitivos y feedback visual claro

## 🏗 Arquitectura

El proyecto sigue una arquitectura cliente-servidor típica:

```
                      ┌─────────────┐
                      │  Cliente    │
                      │   (React)   │
                      └──────┬──────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  Servidor   │
                      │  (Express)  │
                      └──────┬──────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  Domainr    │
                      │    API      │
                      └─────────────┘
```

## 📦 Requisitos previos

- Node.js (versión 14.x o superior)
- npm (normalmente incluido con Node.js)
- Clave API de RapidAPI para la API de Domainr

## 🔧 Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/686f6c61/domain-checker.git
cd domain-checker
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del servidor
cd server
npm install

# Instalar dependencias del cliente
cd ../client
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo `.env.example` a `.env` en la carpeta `server` y añade tu clave API de RapidAPI:

```bash
cp server/.env.example server/.env
```

Luego edita el archivo `server/.env` con tu editor preferido:

```
RAPIDAPI_KEY=tu_clave_api_aqui
```

## 🚀 Ejecución

### Modo desarrollo

1. Iniciar el servidor de desarrollo:

```bash
cd server
npm run dev  # Utiliza nodemon para reinicio automático
```

2. En otra terminal, iniciar el cliente de desarrollo:

```bash
cd client
npm start
```

3. Accede a la aplicación en [http://localhost:3000](http://localhost:3000)

### Modo producción

1. Construir el cliente:

```bash
cd client
npm run build
```

2. Configurar un servidor web como Nginx para servir los archivos estáticos del cliente

3. Iniciar el servidor de backend:

```bash
cd server
npm start
```

## 📝 Uso

1. Ingresa un nombre o palabra clave en el campo de búsqueda
2. Haz clic en "Buscar" para ver los dominios disponibles
3. Los resultados mostrarán si los dominios están disponibles (verde) o no (rojo)
4. Usa el botón "Listar más dominios" para encontrar variantes adicionales
5. Utiliza los botones de exportación para guardar los resultados en formato TXT o CSV
6. Para los dominios disponibles, usa los iconos de búsqueda para explorar opciones de compra

## 📁 Estructura del proyecto

```
domain-checker/
├── client/               # Frontend (React)
│   ├── public/           # Assets públicos y HTML
│   └── src/              # Código fuente React
├── server/               # Backend (Node.js/Express)
│   ├── index.js          # Punto de entrada principal
│   ├── package.json      # Dependencias y scripts
│   └── .env              # Variables de entorno (no se incluye en git)
└── README.md             # Documentación principal
```

## 🔌 APIs y puntos finales

### API del servidor

- `GET /api/search?query={query}`: Busca dominios relacionados con la consulta
- `GET /api/status?domain={domain}`: Verifica el estado de un dominio específico

### API externa (Domainr)

La aplicación utiliza dos endpoints principales de la API de Domainr:

- `/v2/search`: Para buscar dominios sugeridos
- `/v2/status`: Para verificar la disponibilidad de los dominios

## 💻 Tecnologías utilizadas

### Frontend

- **React.js**: Biblioteca de interfaz de usuario
- **Axios**: Cliente HTTP para realizar peticiones a la API
- **React Icons**: Biblioteca de iconos SVG
- **CSS personalizado**: Estilos minimalistas en blanco y negro

### Backend

- **Node.js**: Entorno de ejecución de JavaScript
- **Express**: Framework web para Node.js
- **Axios**: Cliente HTTP para comunicarse con la API de Domainr
- **dotenv**: Para gestionar variables de entorno
- **cors**: Middleware para habilitar CORS

## 🔑 Configuración de API

Para utilizar esta aplicación, necesitas obtener una clave API de RapidAPI:

1. Regístrate en [RapidAPI](https://rapidapi.com)
2. Busca "Domainr API" y suscríbete a un plan (hay opciones gratuitas)
3. Copia tu clave API y colócala en el archivo `.env` como se indicó anteriormente

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Haz un fork del proyecto
2. Crea una rama para tu funcionalidad (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios
4. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
5. Haz push a la rama (`git push origin feature/amazing-feature`)
6. Abre un Pull Request

## 👨‍💻 Autor

- **[686f6c61](https://github.com/686f6c61)** - _Desarrollador principal_ - (Mayo 2025)

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  <i>Desarrollado con ❤️ usando React y Node.js</i>
</p>
