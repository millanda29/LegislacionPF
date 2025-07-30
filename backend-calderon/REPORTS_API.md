# API de Reportes de Consumo de Agua

Esta API permite generar reportes CSV y PDF basados en las predicciones del modelo de consumo de agua de Calderón.

## Endpoints Disponibles

### 1. Generar Reporte CSV
**POST** `/reports/generate/csv`

Genera un reporte CSV con las predicciones de consumo de agua y lo guarda en la carpeta `data4/`.

**Request Body:**
```json
{
  "months_ahead": 6,
  "start_year": 2025,
  "start_month": 1,
  "poblacion_estimada": 200000,
  "precipitacion_promedio": 50.0
}
```

**Response:**
```json
{
  "message": "Reporte CSV generado exitosamente",
  "data": {
    "success": true,
    "filename": "reporte_consumo_agua_20250115_143022.csv",
    "filepath": "data4/reporte_consumo_agua_20250115_143022.csv",
    "total_records": 6,
    "total_consumo_predicho": 350000.0,
    "promedio_consumo_predicho": 58333.33,
    "periodo": "2025-01 a 2025-06",
    "data": [...]
  }
}
```

### 2. Generar Reporte PDF
**POST** `/reports/generate/pdf`

Genera un reporte PDF con las predicciones de consumo de agua y lo guarda en la carpeta `reports/`.

**Request Body:**
```json
{
  "months_ahead": 6,
  "start_year": 2025,
  "start_month": 1,
  "poblacion_estimada": 200000,
  "precipitacion_promedio": 50.0
}
```

**Response:**
```json
{
  "message": "Reporte PDF generado exitosamente",
  "data": {
    "success": true,
    "filename": "reporte_consumo_agua_20250115_143022.pdf",
    "filepath": "reports/reporte_consumo_agua_20250115_143022.pdf",
    "total_records": 6,
    "total_consumo_predicho": 350000.0,
    "promedio_consumo_predicho": 58333.33,
    "periodo": "2025-01 a 2025-06"
  }
}
```

### 3. Descargar Reporte CSV
**GET** `/reports/download/csv/{filename}`

Descarga un reporte CSV específico.

**Response:** Archivo CSV para descargar

### 4. Descargar Reporte PDF
**GET** `/reports/download/pdf/{filename}`

Descarga un reporte PDF específico.

**Response:** Archivo PDF para descargar

### 5. Generar PDF y Enviar por Email
**POST** `/reports/generate/pdf-and-email`

Genera un reporte PDF y lo envía por email (requiere configuración de email).

**Request Body:**
```json
{
  "forecast_request": {
    "months_ahead": 6,
    "start_year": 2025,
    "start_month": 1,
    "poblacion_estimada": 200000,
    "precipitacion_promedio": 50.0
  },
  "email_request": {
    "email_to": "usuario@ejemplo.com",
    "subject": "Reporte de Predicción de Consumo de Agua",
    "body": "Adjunto encontrará el reporte de predicción de consumo de agua."
  }
}
```

### 6. Obtener Historial de Reportes
**GET** `/reports/history`

Obtiene el historial de todos los reportes generados.

**Response:**
```json
{
  "message": "Historial de reportes obtenido exitosamente",
  "data": [
    {
      "filename": "reporte_consumo_agua_20250115_143022.csv",
      "type": "CSV",
      "path": "data4/reporte_consumo_agua_20250115_143022.csv",
      "size": 1024,
      "created": "2025-01-15 14:30:22"
    }
  ]
}
```

### 7. Obtener Historial de Reportes CSV
**GET** `/reports/history/csv`

Obtiene solo el historial de reportes CSV.

### 8. Obtener Historial de Reportes PDF
**GET** `/reports/history/pdf`

Obtiene solo el historial de reportes PDF.

### 9. Probar Configuración de Email
**POST** `/reports/test-email-config`

Prueba la configuración de email.

**Response:**
```json
{
  "status": "success",
  "message": "Configuración de email válida",
  "details": {
    "EMAIL_USER": "usuario@gmail.com",
    "EMAIL_HOST": "smtp.gmail.com",
    "EMAIL_PORT": "587"
  }
}
```

## Configuración de Email

Para usar la funcionalidad de envío de emails, configura las siguientes variables de entorno:

```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**Nota:** Para Gmail, necesitas usar una contraseña de aplicación, no tu contraseña normal.

## Integración con Chatbot

Los reportes CSV generados se guardan en la carpeta `data4/` y son utilizados automáticamente por el chatbot para enriquecer sus respuestas con información de predicciones recientes.

## Estructura de Archivos

- **CSV Reports:** `data4/reporte_consumo_agua_YYYYMMDD_HHMMSS.csv`
- **PDF Reports:** `reports/reporte_consumo_agua_YYYYMMDD_HHMMSS.pdf`

## Campos del Reporte CSV

Los reportes CSV incluyen los siguientes campos:

- `anio`: Año de la predicción
- `mes`: Mes de la predicción (número)
- `mes_nombre`: Nombre del mes
- `fecha`: Fecha completa (YYYY-MM-DD)
- `consumo_predicho_m3`: Consumo predicho en metros cúbicos

## Funcionalidades del Frontend

El componente `WaterForecast.jsx` incluye las siguientes funcionalidades:

1. **Generar Reportes:** Botones para generar CSV y PDF
2. **Descarga Directa:** Descarga automática del último reporte generado
3. **Envío por Email:** Formulario para enviar PDF por email
4. **Historial:** Visualización y descarga de reportes anteriores
5. **Interfaz Responsiva:** Adaptada para móviles y escritorio

## Ejemplo de Uso

```python
import requests

# Generar reporte CSV
response = requests.post("http://localhost:8000/reports/generate/csv", json={
    "months_ahead": 12,
    "start_year": 2025,
    "start_month": 1,
    "poblacion_estimada": 200000,
    "precipitacion_promedio": 50.0
})

if response.status_code == 200:
    result = response.json()
    filename = result['data']['filename']
    
    # Descargar el reporte
    download_response = requests.get(f"http://localhost:8000/reports/download/csv/{filename}")
    with open(filename, 'wb') as f:
        f.write(download_response.content)
```

## Pruebas

Para ejecutar las pruebas de los endpoints:

```bash
python test_reports.py
```

Esto verificará que todos los endpoints funcionen correctamente. 