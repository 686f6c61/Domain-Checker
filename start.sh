#!/bin/bash

################################################################################
# SCRIPT DE INICIO AUTOMATIZADO - DOMAIN CHECKER
################################################################################
#
# DESCRIPCIÓN:
#   Script bash inteligente que automatiza el inicio completo del entorno de
#   desarrollo de Domain Checker. Maneja tanto el servidor backend (Express)
#   como el cliente frontend (React) de manera coordinada.
#
# CARACTERÍSTICAS:
#   - Verificación automática de archivos .env
#   - Instalación de dependencias si no existen
#   - Validación de puertos disponibles (3000 y 5000)
#   - Health check del servidor antes de iniciar cliente
#   - Logs separados (server.log y client.log)
#   - Graceful shutdown con Ctrl+C
#   - Mensajes con colores para mejor UX
#   - Validación de RAPIDAPI_KEY configurada
#
# USO:
#   ./start.sh
#
# REQUISITOS:
#   - Node.js >= 14.0.0
#   - npm >= 6.0.0
#   - lsof (para verificación de puertos)
#   - curl (para health checks)
#
# PUERTOS UTILIZADOS:
#   - 5000: Servidor backend Express
#   - 3000: Cliente frontend React
#
# LOGS:
#   - server.log: Output del servidor backend
#   - client.log: Output del cliente frontend
#
# SEÑALES:
#   - SIGINT (Ctrl+C): Cierra ambos servicios limpiamente
#   - SIGTERM: Cierra ambos servicios limpiamente
#
# AUTOR: 686f6c61 <github.com/686f6c61>
# VERSIÓN: 2.0.0
# FECHA: Noviembre 2025
# LICENCIA: MIT
#
################################################################################

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para limpiar procesos al salir
cleanup() {
    print_info "Cerrando servicios..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        print_success "Servidor backend cerrado"
    fi
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null
        print_success "Cliente frontend cerrado"
    fi
    exit 0
}

# Capturar señales de salida
trap cleanup SIGINT SIGTERM

# Banner
echo ""
echo "======================================"
echo "   DOMAIN CHECKER - INICIANDO"
echo "======================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "server" ] || [ ! -d "client" ]; then
    print_error "No se encontraron las carpetas 'server' y 'client'. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# ============================================
# VERIFICAR ARCHIVOS .env
# ============================================

print_info "Verificando archivos de configuración..."

# Verificar .env del servidor
if [ ! -f "server/.env" ]; then
    print_warning "No se encontró server/.env"
    if [ -f "server/.env.example" ]; then
        print_info "Copiando server/.env.example a server/.env"
        cp server/.env.example server/.env
        print_warning "IMPORTANTE: Edita server/.env y agrega tu RAPIDAPI_KEY"
        print_warning "Obtén tu API key en: https://rapidapi.com/layered-layered-default/api/domains-api"
        echo ""
        read -p "Presiona Enter cuando hayas configurado tu API key en server/.env..."
    else
        print_error "No se encontró server/.env.example"
        exit 1
    fi
fi

# Verificar .env del cliente
if [ ! -f "client/.env" ]; then
    print_warning "No se encontró client/.env"
    if [ -f "client/.env.example" ]; then
        print_info "Copiando client/.env.example a client/.env"
        cp client/.env.example client/.env
        print_success "client/.env creado"
    else
        print_error "No se encontró client/.env.example"
        exit 1
    fi
fi

# Verificar que RAPIDAPI_KEY no esté vacía o sea el valor por defecto
RAPIDAPI_KEY=$(grep -E "^RAPIDAPI_KEY=" server/.env | cut -d '=' -f2)
if [ -z "$RAPIDAPI_KEY" ] || [ "$RAPIDAPI_KEY" = "tu_clave_api_aqui" ]; then
    print_error "RAPIDAPI_KEY no configurada en server/.env"
    print_error "Obtén tu API key en: https://rapidapi.com/layered-layered-default/api/domains-api"
    exit 1
fi

print_success "Archivos de configuración verificados"

# ============================================
# VERIFICAR E INSTALAR DEPENDENCIAS
# ============================================

print_info "Verificando dependencias del servidor..."
if [ ! -d "server/node_modules" ]; then
    print_info "Instalando dependencias del servidor..."
    cd server
    npm install
    if [ $? -ne 0 ]; then
        print_error "Error instalando dependencias del servidor"
        exit 1
    fi
    cd ..
    print_success "Dependencias del servidor instaladas"
else
    print_success "Dependencias del servidor ya instaladas"
fi

print_info "Verificando dependencias del cliente..."
if [ ! -d "client/node_modules" ]; then
    print_info "Instalando dependencias del cliente..."
    cd client
    npm install
    if [ $? -ne 0 ]; then
        print_error "Error instalando dependencias del cliente"
        exit 1
    fi
    cd ..
    print_success "Dependencias del cliente instaladas"
else
    print_success "Dependencias del cliente ya instaladas"
fi

# ============================================
# VERIFICAR PUERTOS DISPONIBLES
# ============================================

print_info "Verificando puertos..."

# Verificar puerto 5000 (servidor)
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_warning "El puerto 5000 ya está en uso"
    read -p "¿Deseas matar el proceso en el puerto 5000? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        lsof -ti:5000 | xargs kill -9
        print_success "Proceso en puerto 5000 terminado"
    else
        print_error "No se puede iniciar el servidor en el puerto 5000"
        exit 1
    fi
fi

# Verificar puerto 3000 (cliente)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_warning "El puerto 3000 ya está en uso"
    read -p "¿Deseas matar el proceso en el puerto 3000? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        lsof -ti:3000 | xargs kill -9
        print_success "Proceso en puerto 3000 terminado"
    else
        print_error "No se puede iniciar el cliente en el puerto 3000"
        exit 1
    fi
fi

# ============================================
# INICIAR SERVICIOS
# ============================================

echo ""
print_info "Iniciando servicios..."
echo ""

# Iniciar servidor backend
print_info "Iniciando servidor backend (Puerto 5000)..."
cd server
npm start > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Esperar a que el servidor esté listo
sleep 3

# Verificar que el servidor esté corriendo
if ! ps -p $SERVER_PID > /dev/null; then
    print_error "El servidor no pudo iniciarse. Revisa server.log para más detalles"
    cat server.log
    exit 1
fi

# Verificar health check
print_info "Verificando health check del servidor..."
for i in {1..10}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        print_success "Servidor backend iniciado correctamente (PID: $SERVER_PID)"
        break
    fi
    if [ $i -eq 10 ]; then
        print_error "El servidor no responde. Revisa server.log para más detalles"
        kill $SERVER_PID 2>/dev/null
        cat server.log
        exit 1
    fi
    sleep 1
done

# Iniciar cliente frontend
print_info "Iniciando cliente frontend (Puerto 3000)..."
cd client
npm start > ../client.log 2>&1 &
CLIENT_PID=$!
cd ..

# Esperar a que el cliente esté listo
sleep 5

# Verificar que el cliente esté corriendo
if ! ps -p $CLIENT_PID > /dev/null; then
    print_error "El cliente no pudo iniciarse. Revisa client.log para más detalles"
    kill $SERVER_PID 2>/dev/null
    cat client.log
    exit 1
fi

print_success "Cliente frontend iniciado correctamente (PID: $CLIENT_PID)"

# ============================================
# INFORMACIÓN FINAL
# ============================================

echo ""
echo "======================================"
echo "   SERVICIOS INICIADOS"
echo "======================================"
echo ""
print_success "Servidor Backend:  http://localhost:5000"
print_success "Cliente Frontend:  http://localhost:3000"
echo ""
print_info "Logs disponibles en:"
echo "  - server.log (Backend)"
echo "  - client.log (Frontend)"
echo ""
print_warning "Presiona Ctrl+C para detener todos los servicios"
echo ""

# Mantener el script corriendo
wait
