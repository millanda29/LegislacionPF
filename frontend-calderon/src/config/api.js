// src/config/api.js
// Configuración centralizada para la API

// Configuración de la API
export const API_CONFIG = {
  // URL base de la API - se puede configurar por variables de entorno
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 
            import.meta.env.REACT_APP_API_URL || 
            "http://localhost:8000",
  
  // Timeout para las peticiones (en milisegundos)
  TIMEOUT: 30000,
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },
  
  // Endpoints específicos
  ENDPOINTS: {
    WATER: {
      DATA: "/water/data",
      PREDICT: "/water/predict",
      COMPARE: "/water/compare",
      FORECAST: "/water/forecast",
    },
    REPORTS: {
      GENERATE_CSV: "/reports/generate/csv",
      GENERATE_PDF: "/reports/generate/pdf",
      GENERATE_PDF_EMAIL: "/reports/generate/pdf-and-email",
      HISTORY: "/reports/history",
      HISTORY_CSV: "/reports/history/csv",
      HISTORY_PDF: "/reports/history/pdf",
      TEST_EMAIL: "/reports/test-email-config",
      DOWNLOAD_CSV: "/reports/download/csv",
      DOWNLOAD_PDF: "/reports/download/pdf",
    },
    CHATS: {
      OPENAI: "/chats/openai",
      ZEPHYR: "/chats/zephyr",
      GEMINI: "/chats/gemini",
    },
    FILES: {
      UPLOAD: "/files/upload",
      LIST: "/files/list",
      DELETE: "/files/delete",
    },
    PRECIPITATION: {
      DATA: "/precipitation/data",
      FORECAST: "/precipitation/forecast",
    },
    INTERPRETATION: {
      ANALYZE: "/interpretation/analyze",
    },
  },
};

// Función para construir URLs completas
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Función para validar la configuración
export const validateApiConfig = () => {
  const issues = [];
  
  if (!API_CONFIG.BASE_URL) {
    issues.push("API_BASE_URL no está configurada");
  }
  
  if (!API_CONFIG.BASE_URL.startsWith('http')) {
    issues.push("API_BASE_URL debe ser una URL válida (comenzar con http:// o https://)");
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};

// Función para obtener la configuración actual
export const getApiConfig = () => {
  return {
    ...API_CONFIG,
    validation: validateApiConfig(),
  };
}; 