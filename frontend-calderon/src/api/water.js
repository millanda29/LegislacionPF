// src/api/water.js
// Cliente centralizado para llamadas HTTP a los endpoints de la API

import { API_CONFIG, buildApiUrl } from '../config/api.js';

// Cliente HTTP mejorado con timeout y mejor manejo de errores
async function http(path, options = {}) {
  const url = buildApiUrl(path);
  
  // Configurar timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const res = await fetch(url, {
      headers: { ...API_CONFIG.DEFAULT_HEADERS },
      signal: controller.signal,
      ...options,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || `HTTP ${res.status}: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Timeout: La petición tardó más de ${API_CONFIG.TIMEOUT}ms`);
    }
    
    throw error;
  }
}

// Función para descargar archivos
async function downloadFile(path, filename) {
  const url = buildApiUrl(path);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error descargando archivo:', error);
    throw error;
  }
}

// API para endpoints de agua
export const waterApi = {
  getData: ({ year_from, year_to, months } = {}) => {
    const params = new URLSearchParams();
    if (year_from) params.append("year_from", year_from);
    if (year_to) params.append("year_to", year_to);
    if (months && months.length) months.forEach((m) => params.append("months", m));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return http(`${API_CONFIG.ENDPOINTS.WATER.DATA}${qs}`);
  },

  predict: (items) =>
    http(API_CONFIG.ENDPOINTS.WATER.PREDICT, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  compare: ({ year_from, year_to, months } = {}) =>
    http(API_CONFIG.ENDPOINTS.WATER.COMPARE, {
      method: "POST",
      body: JSON.stringify({ year_from, year_to, months }),
    }),

  forecast: (payload) =>
    http(API_CONFIG.ENDPOINTS.WATER.FORECAST, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// API para endpoints de reportes
export const reportsApi = {
  // Generar reporte CSV
  generateCsv: (payload) =>
    http(API_CONFIG.ENDPOINTS.REPORTS.GENERATE_CSV, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Generar reporte PDF
  generatePdf: (payload) =>
    http(API_CONFIG.ENDPOINTS.REPORTS.GENERATE_PDF, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Generar PDF y enviar por email
  generatePdfAndEmail: (forecastRequest, emailRequest) =>
    http(API_CONFIG.ENDPOINTS.REPORTS.GENERATE_PDF_EMAIL, {
      method: "POST",
      body: JSON.stringify({
        forecast_request: forecastRequest,
        email_request: emailRequest,
      }),
    }),

  // Obtener historial de reportes
  getHistory: () => http(API_CONFIG.ENDPOINTS.REPORTS.HISTORY),

  // Obtener historial de reportes CSV
  getCsvHistory: () => http(API_CONFIG.ENDPOINTS.REPORTS.HISTORY_CSV),

  // Obtener historial de reportes PDF
  getPdfHistory: () => http(API_CONFIG.ENDPOINTS.REPORTS.HISTORY_PDF),

  // Probar configuración de email
  testEmailConfig: () =>
    http(API_CONFIG.ENDPOINTS.REPORTS.TEST_EMAIL, {
      method: "POST",
    }),

  // Descargar reporte CSV
  downloadCsv: (filename) =>
    downloadFile(`${API_CONFIG.ENDPOINTS.REPORTS.DOWNLOAD_CSV}/${encodeURIComponent(filename)}`, filename),

  // Descargar reporte PDF
  downloadPdf: (filename) =>
    downloadFile(`${API_CONFIG.ENDPOINTS.REPORTS.DOWNLOAD_PDF}/${encodeURIComponent(filename)}`, filename),
};

// API para endpoints de chatbots
export const chatsApi = {
  openai: (message) =>
    http(API_CONFIG.ENDPOINTS.CHATS.OPENAI, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  zephyr: (message) =>
    http(API_CONFIG.ENDPOINTS.CHATS.ZEPHYR, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  gemini: (message) =>
    http(API_CONFIG.ENDPOINTS.CHATS.GEMINI, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};

// API para endpoints de archivos
export const filesApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return http(API_CONFIG.ENDPOINTS.FILES.UPLOAD, {
      method: "POST",
      headers: {}, // No Content-Type para FormData
      body: formData,
    });
  },

  list: () => http(API_CONFIG.ENDPOINTS.FILES.LIST),

  delete: (filename) =>
    http(`${API_CONFIG.ENDPOINTS.FILES.DELETE}/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    }),
};

// API para endpoints de precipitación
export const precipitationApi = {
  getData: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return http(`${API_CONFIG.ENDPOINTS.PRECIPITATION.DATA}${qs}`);
  },

  forecast: (payload) =>
    http(API_CONFIG.ENDPOINTS.PRECIPITATION.FORECAST, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// API para endpoints de interpretación
export const interpretationApi = {
  analyze: (data) =>
    http(API_CONFIG.ENDPOINTS.INTERPRETATION.ANALYZE, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Exportar configuración para debugging
export { API_CONFIG, buildApiUrl };
