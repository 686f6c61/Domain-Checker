# Domain Checker - Extensión para Chrome

Esta extensión de Chrome permite verificar la disponibilidad de dominios directamente desde tu navegador, sin tener que visitar múltiples sitios web. Utiliza la API de Domainr para proporcionar resultados precisos en tiempo real.

## Características

- **Búsqueda rápida**: Verifica dominios al instante con una interfaz intuitiva
- **Verificación de disponibilidad**: Determina si un dominio está disponible para registrar
- **Búsqueda expandida**: Función para listar más variaciones con diferentes TLDs populares
- **Exportación de datos**: Exporta resultados en formatos TXT y CSV
- **Enlaces directos**: Busca opciones de compra en Google, Bing, DuckDuckGo y Brave
- **Diseño moderno**: Interfaz en blanco y negro, limpia y minimalista

## Requisitos

Para utilizar esta extensión, necesitarás:
- Google Chrome o cualquier navegador basado en Chromium
- Una cuenta en RapidAPI con acceso a la API de Domainr (hay planes gratuitos disponibles)

## Instalación

### Instalación desde Chrome Web Store
*(Próximamente)*

### Instalación manual en modo desarrollador
1. Descarga o clona este repositorio
2. Abre Chrome y navega a `chrome://extensions/`
3. Activa el "Modo de desarrollador" (esquina superior derecha)
4. Haz clic en "Cargar descomprimida" y selecciona la carpeta de esta extensión
5. La extensión se instalará y estará lista para usar

## Uso

1. Haz clic en el icono de la extensión en la barra de herramientas del navegador
2. Introduce un término de búsqueda o nombre de dominio
3. Haz clic en "Buscar" para verificar la disponibilidad
4. Para los dominios disponibles, puedes:
   - Ver su estado (Disponible/No disponible)
   - Buscar opciones de compra con los botones de búsqueda
   - Usar "Listar más dominios" para ver más variaciones
   - Exportar resultados en formato TXT o CSV

## Configuración de API

La primera vez que uses la extensión, te pedirá tu clave API de RapidAPI para Domainr:
1. Regístrate en [RapidAPI](https://rapidapi.com/)
2. Busca la API de Domainr y suscríbete a un plan (hay opciones gratuitas)
3. Copia tu clave API cuando la extensión te la solicite
4. La clave se guardará localmente para futuras sesiones

## Privacidad

Esta extensión:
- No recopila ni comparte datos personales
- Almacena la clave API localmente en tu navegador
- Solo realiza solicitudes a la API de Domainr para verificar dominios
- No rastrea tu historial de navegación ni otra actividad

## Autor

[686f6c61](https://github.com/686f6c61) - Mayo 2025

## Licencia

MIT License
