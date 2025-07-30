#!/bin/bash

# AppPred - Script de Inicio Rápido para Desarrollo Local
# Este script configura y ejecuta tanto el backend como el frontend

echo "🚀 Iniciando AppPred - Sistema de Predicción de Consumo de Agua"
echo "================================================================"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

echo "✅ Docker y Docker Compose encontrados"

# Verificar si existe el archivo .env en el backend
if [ ! -f "backend-calderon/.env" ]; then
    echo "⚠️  Archivo .env no encontrado en backend-calderon/"
    echo "📝 Creando archivo .env de ejemplo..."
    
    cat > backend-calderon/.env << EOF
# API Keys (configura estas variables con tus propias claves)
OPENAI_API_KEY=tu_openai_api_key
GOOGLE_API_KEY=tu_google_api_key
HUGGINGFACE_API_KEY=tu_huggingface_api_key

# Configuración de Email (para reportes)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password

# Configuración del servidor
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
EOF
    
    echo "📋 Archivo .env creado. Por favor, edita backend-calderon/.env con tus credenciales."
    echo "   - Configura tus API keys para los chatbots"
    echo "   - Configura tu email para enviar reportes"
    echo ""
    echo "¿Deseas continuar sin configurar las credenciales? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Configuración cancelada. Edita el archivo .env y ejecuta este script nuevamente."
        exit 1
    fi
else
    echo "✅ Archivo .env encontrado"
fi

# Crear directorios necesarios si no existen
echo "📁 Creando directorios necesarios..."
mkdir -p backend-calderon/data4
mkdir -p backend-calderon/reports

# Construir y ejecutar con Docker Compose
echo "🐳 Construyendo y ejecutando contenedores..."
docker-compose up --build -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar el estado de los servicios
echo "🔍 Verificando estado de los servicios..."

# Verificar backend
if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ Backend funcionando en http://localhost:8000"
else
    echo "❌ Backend no responde. Verificando logs..."
    docker-compose logs backend
fi

# Verificar frontend
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Frontend funcionando en http://localhost:3000"
else
    echo "❌ Frontend no responde. Verificando logs..."
    docker-compose logs frontend
fi

echo ""
echo "🎉 ¡AppPred está listo!"
echo "================================================================"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 Documentación API: http://localhost:8000/docs"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs: docker-compose logs -f"
echo "   Detener servicios: docker-compose down"
echo "   Reiniciar servicios: docker-compose restart"
echo "   Ver estado: docker-compose ps"
echo ""
echo "🔧 Para configurar email:"
echo "   1. Edita backend-calderon/.env"
echo "   2. Configura EMAIL_USER y EMAIL_PASSWORD"
echo "   3. Reinicia: docker-compose restart backend"
echo ""
echo "🚀 ¡Disfruta usando AppPred!" 