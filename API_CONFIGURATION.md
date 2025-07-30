# Configuración de la API - AppPred

Esta documentación explica cómo configurar la URL base y otros parámetros de la API en el frontend de AppPred.

## 🚀 Configuración Rápida

### 1. Variables de Entorno

El frontend utiliza variables de entorno para configurar la URL base de la API. Crea un archivo `.env` en el directorio `frontend-calderon/`:

```env
# URL base de la API
VITE_API_BASE_URL=http://localhost:8000

# Configuración adicional (opcional)
VITE_APP_NAME=AppPred
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

### 2. Entornos de Despliegue

#### Desarrollo Local
```env
VITE_API_BASE_URL=http://localhost:8000
```

#### Producción (Heroku)
```env
VITE_API_BASE_URL=https://tu-backend.herokuapp.com
```

#### Docker Compose
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📁 Estructura de Configuración

### Archivo de Configuración Principal
- **Ubicación**: `src/config/api.js`
- **Función**: Centraliza toda la configuración de la API

### Cliente HTTP
- **Ubicación**: `src/api/water.js`
- **Función**: Maneja todas las peticiones HTTP con configuración centralizada

### Componente de Configuración
- **Ubicación**: `src/components/ApiConfig.jsx`
- **Función**: Muestra y valida la configuración actual

## 🔧 Configuración Detallada

### API_CONFIG Object

```javascript
export const API_CONFIG = {
  // URL base de la API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 
            import.meta.env.REACT_APP_API_URL || 
            "http://localhost:8000",
  
  // Timeout para las peticiones (30 segundos)
  TIMEOUT: 30000,
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },
  
  // Endpoints organizados por categoría
  ENDPOINTS: {
    WATER: { /* endpoints de agua */ },
    REPORTS: { /* endpoints de reportes */ },
    CHATS: { /* endpoints de chatbots */ },
    FILES: { /* endpoints de archivos */ },
    PRECIPITATION: { /* endpoints de precipitación */ },
    INTERPRETATION: { /* endpoints de interpretación */ },
  },
};
```

### Endpoints Disponibles

#### Agua
- `GET /water/data` - Obtener datos de consumo
- `POST /water/predict` - Predicción de consumo
- `POST /water/compare` - Comparar períodos
- `POST /water/forecast` - Pronóstico futuro

#### Reportes
- `POST /reports/generate/csv` - Generar reporte CSV
- `POST /reports/generate/pdf` - Generar reporte PDF
- `POST /reports/generate/pdf-and-email` - Generar PDF y enviar email
- `GET /reports/history` - Historial de reportes
- `GET /reports/download/csv/{filename}` - Descargar CSV
- `GET /reports/download/pdf/{filename}` - Descargar PDF

#### Chatbots
- `POST /chats/openai` - Chat con OpenAI
- `POST /chats/zephyr` - Chat con Zephyr
- `POST /chats/gemini` - Chat con Gemini

#### Archivos
- `POST /files/upload` - Subir archivo
- `GET /files/list` - Listar archivos
- `DELETE /files/delete/{filename}` - Eliminar archivo

#### Precipitación
- `GET /precipitation/data` - Datos de precipitación
- `POST /precipitation/forecast` - Pronóstico de precipitación

#### Interpretación
- `POST /interpretation/analyze` - Análisis de datos

## 🛠️ Funciones de Utilidad

### buildApiUrl(endpoint)
Construye URLs completas combinando la URL base con el endpoint.

```javascript
import { buildApiUrl } from '../config/api.js';

const url = buildApiUrl('/water/data'); // http://localhost:8000/water/data
```

### validateApiConfig()
Valida la configuración actual y retorna problemas encontrados.

```javascript
import { validateApiConfig } from '../config/api.js';

const validation = validateApiConfig();
if (!validation.isValid) {
  console.error('Problemas de configuración:', validation.issues);
}
```

### getApiConfig()
Obtiene la configuración completa con validación.

```javascript
import { getApiConfig } from '../config/api.js';

const config = getApiConfig();
console.log('URL Base:', config.BASE_URL);
console.log('¿Válida?:', config.validation.isValid);
```

## 🔍 Debugging y Validación

### Componente ApiConfig

El componente `ApiConfig` proporciona una interfaz visual para:

1. **Ver la configuración actual**
   - URL base
   - Timeout
   - Estado de validación

2. **Detectar problemas**
   - Variables de entorno faltantes
   - URLs inválidas
   - Configuración incorrecta

3. **Mostrar endpoints disponibles**
   - Lista completa de endpoints
   - Organización por categoría

### Uso del Componente

```jsx
import ApiConfig from '../components/ApiConfig.jsx';

function App() {
  return (
    <div>
      <ApiConfig />
      {/* Resto de la aplicación */}
    </div>
  );
}
```

## 🚨 Solución de Problemas

### Error: "API_BASE_URL no está configurada"

**Causa**: No se ha configurado la variable de entorno `VITE_API_BASE_URL`.

**Solución**:
1. Crear archivo `.env` en `frontend-calderon/`
2. Agregar: `VITE_API_BASE_URL=http://localhost:8000`
3. Reiniciar el servidor de desarrollo

### Error: "API_BASE_URL debe ser una URL válida"

**Causa**: La URL base no comienza con `http://` o `https://`.

**Solución**:
```env
# ❌ Incorrecto
VITE_API_BASE_URL=localhost:8000

# ✅ Correcto
VITE_API_BASE_URL=http://localhost:8000
```

### Error: "Timeout: La petición tardó más de 30000ms"

**Causa**: El servidor backend no responde o está muy lento.

**Solución**:
1. Verificar que el backend esté ejecutándose
2. Verificar la URL base
3. Aumentar el timeout si es necesario:

```javascript
// En src/config/api.js
TIMEOUT: 60000, // 60 segundos
```

### Error: "CORS policy"

**Causa**: El backend no permite peticiones desde el origen del frontend.

**Solución**:
1. Configurar CORS en el backend
2. Verificar que la URL base sea correcta
3. Asegurar que el backend esté configurado para aceptar peticiones del frontend

## 🔄 Migración desde Configuración Anterior

Si tienes una configuración anterior con `API_BASE` hardcodeado:

### Antes
```javascript
const API_BASE = "http://localhost:8000";
```

### Después
```javascript
import { API_CONFIG } from '../config/api.js';

// Usar API_CONFIG.BASE_URL en lugar de API_BASE
const url = `${API_CONFIG.BASE_URL}/water/data`;
```

## 📋 Checklist de Configuración

- [ ] Crear archivo `.env` en `frontend-calderon/`
- [ ] Configurar `VITE_API_BASE_URL`
- [ ] Verificar que la URL base sea válida
- [ ] Probar conexión con el backend
- [ ] Verificar que todos los endpoints funcionen
- [ ] Configurar variables de entorno para producción

## 🔗 Enlaces Útiles

- [Documentación de Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Documentación de FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [Guía de Despliegue](./DEPLOYMENT.md)

---

**Nota**: Esta configuración es compatible con Vite y React. Para otros bundlers, ajusta las variables de entorno según corresponda. 