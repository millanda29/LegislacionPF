// src/api/water.js
// Cliente muy simple para centralizar llamadas HTTP a los endpoints de /water

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Función para descargar archivos
async function downloadFile(path, filename) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const waterApi = {
  getData: ({ year_from, year_to, months } = {}) => {
    const params = new URLSearchParams();
    if (year_from) params.append("year_from", year_from);
    if (year_to) params.append("year_to", year_to);
    if (months && months.length) months.forEach((m) => params.append("months", m));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return http(`/water/data${qs}`);
  },

  predict: (items) =>
    http("/water/predict", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  compare: ({ year_from, year_to, months } = {}) =>
    http("/water/compare", {
      method: "POST",
      body: JSON.stringify({ year_from, year_to, months }),
    }),

  forecast: (payload) =>
    http("/water/forecast", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const reportsApi = {
  // Generar reporte CSV
  generateCsv: (payload) =>
    http("/reports/generate/csv", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Generar reporte PDF
  generatePdf: (payload) =>
    http("/reports/generate/pdf", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Generar PDF y enviar por email
  generatePdfAndEmail: (forecastRequest, emailRequest) =>
    http("/reports/generate/pdf-and-email", {
      method: "POST",
      body: JSON.stringify({
        forecast_request: forecastRequest,
        email_request: emailRequest,
      }),
    }),

  // Obtener historial de reportes
  getHistory: () => http("/reports/history"),

  // Obtener historial de reportes CSV
  getCsvHistory: () => http("/reports/history/csv"),

  // Obtener historial de reportes PDF
  getPdfHistory: () => http("/reports/history/pdf"),

  // Probar configuración de email
  testEmailConfig: () =>
    http("/reports/test-email-config", {
      method: "POST",
    }),

  // Descargar reporte CSV
  downloadCsv: (filename) =>
    downloadFile(`/reports/download/csv/${encodeURIComponent(filename)}`, filename),

  // Descargar reporte PDF
  downloadPdf: (filename) =>
    downloadFile(`/reports/download/pdf/${encodeURIComponent(filename)}`, filename),
};
