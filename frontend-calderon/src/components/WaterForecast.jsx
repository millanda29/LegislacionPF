// src/components/WaterForecast.jsx
import { useState } from "react";
import { waterApi, reportsApi } from "../api/water";

export default function WaterForecast() {
  const [monthsAhead, setMonthsAhead] = useState(12);
  const [startYear, setStartYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [poblacion, setPoblacion] = useState("");
  const [precipitacion, setPrecipitacion] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Estados para reportes
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("Reporte de Predicción de Consumo de Agua");
  const [emailBody, setEmailBody] = useState("Adjunto encontrará el reporte de predicción de consumo de agua generado por nuestro modelo.");
  const [reportsHistory, setReportsHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastGeneratedReport, setLastGeneratedReport] = useState(null);

  const handleForecast = async () => {
    setLoading(true);
    setErr("");
    try {
      const payload = {
        months_ahead: Number(monthsAhead),
        start_year: startYear ? Number(startYear) : undefined,
        start_month: startMonth ? Number(startMonth) : undefined,
        poblacion_estimada: poblacion ? Number(poblacion) : undefined,
        precipitacion_promedio: precipitacion ? Number(precipitacion) : undefined,
      };
      const res = await waterApi.forecast(payload);
      setRows(res.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getReportPayload = () => ({
    months_ahead: Number(monthsAhead),
    start_year: startYear ? Number(startYear) : undefined,
    start_month: startMonth ? Number(startMonth) : undefined,
    poblacion_estimada: poblacion ? Number(poblacion) : undefined,
    precipitacion_promedio: precipitacion ? Number(precipitacion) : undefined,
  });

  const handleGenerateCsv = async () => {
    if (!rows.length) {
      setErr("Primero debes generar un pronóstico");
      return;
    }

    setReportLoading(true);
    setReportMessage("");
    try {
      const payload = getReportPayload();
      const result = await reportsApi.generateCsv(payload);
      setReportMessage(`✅ Reporte CSV generado: ${result.data.filename}`);
      setLastGeneratedReport({ type: 'CSV', filename: result.data.filename });
    } catch (e) {
      setReportMessage(`❌ Error: ${e.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!rows.length) {
      setErr("Primero debes generar un pronóstico");
      return;
    }

    setReportLoading(true);
    setReportMessage("");
    try {
      const payload = getReportPayload();
      const result = await reportsApi.generatePdf(payload);
      setReportMessage(`✅ Reporte PDF generado: ${result.data.filename}`);
      setLastGeneratedReport({ type: 'PDF', filename: result.data.filename });
    } catch (e) {
      setReportMessage(`❌ Error: ${e.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadLastReport = async () => {
    if (!lastGeneratedReport) {
      setReportMessage("❌ No hay reporte reciente para descargar");
      return;
    }

    setReportLoading(true);
    setReportMessage("");
    try {
      if (lastGeneratedReport.type === 'CSV') {
        await reportsApi.downloadCsv(lastGeneratedReport.filename);
        setReportMessage(`✅ Descargando: ${lastGeneratedReport.filename}`);
      } else {
        await reportsApi.downloadPdf(lastGeneratedReport.filename);
        setReportMessage(`✅ Descargando: ${lastGeneratedReport.filename}`);
      }
    } catch (e) {
      setReportMessage(`❌ Error descargando: ${e.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReport = async (report) => {
    setReportLoading(true);
    setReportMessage("");
    try {
      if (report.type === 'CSV') {
        await reportsApi.downloadCsv(report.filename);
        setReportMessage(`✅ Descargando: ${report.filename}`);
      } else {
        await reportsApi.downloadPdf(report.filename);
        setReportMessage(`✅ Descargando: ${report.filename}`);
      }
    } catch (e) {
      setReportMessage(`❌ Error descargando: ${e.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGeneratePdfAndEmail = async () => {
    if (!rows.length) {
      setErr("Primero debes generar un pronóstico");
      return;
    }

    if (!emailTo) {
      setErr("Debes ingresar un email");
      return;
    }

    setReportLoading(true);
    setReportMessage("");
    try {
      const forecastRequest = getReportPayload();
      const emailRequest = {
        email_to: emailTo,
        subject: emailSubject,
        body: emailBody,
      };
      const result = await reportsApi.generatePdfAndEmail(forecastRequest, emailRequest);
      setReportMessage(`✅ Reporte PDF generado y enviado a: ${result.data.email_sent_to}`);
      setShowEmailForm(false);
    } catch (e) {
      setReportMessage(`❌ Error: ${e.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGetHistory = async () => {
    setReportLoading(true);
    try {
      const result = await reportsApi.getHistory();
      setReportsHistory(result.data || []);
      setShowHistory(true);
    } catch (e) {
      setReportMessage(`❌ Error obteniendo historial: ${e.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleTestEmailConfig = async () => {
    setReportLoading(true);
    setReportMessage("");
    try {
      const result = await reportsApi.testEmailConfig();
      if (result.status === "success") {
        setReportMessage(`✅ ${result.message}`);
      } else {
        setReportMessage(`❌ ${result.message}`);
      }
    } catch (e) {
      setReportMessage(`❌ Error probando configuración: ${e.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <h2>Pronóstico Futuro</h2>

      <div className="form-grid">
        <label>
          Meses a pronosticar:
          <input
            type="number"
            min={1}
            value={monthsAhead}
            onChange={(e) => setMonthsAhead(e.target.value)}
          />
        </label>

        <label>
          Año inicial (opcional):
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
          />
        </label>

        <label>
          Mes inicial (1-12) (opcional):
          <input
            type="number"
            min={1}
            max={12}
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
          />
        </label>

        <label>
          Población estimada (opcional):
          <input
            type="number"
            value={poblacion}
            onChange={(e) => setPoblacion(e.target.value)}
          />
        </label>

        <label>
          Precipitación promedio (mm) (opcional):
          <input
            type="number"
            value={precipitacion}
            onChange={(e) => setPrecipitacion(e.target.value)}
          />
        </label>

        <button onClick={handleForecast} disabled={loading}>
          {loading ? "Calculando..." : "Pronosticar"}
        </button>
      </div>

      {err && <p className="error">{err}</p>}

      {!!rows.length && (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Año</th>
                  <th>Mes</th>
                  <th>Consumo predicho (m³)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.anio}</td>
                    <td>{r.mes}</td>
                    <td>{r.consumo_predicho.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sección de Reportes */}
          <div className="reports-section">
            <h3>Generar Reportes</h3>
            
            <div className="reports-buttons">
              <button 
                onClick={handleGenerateCsv} 
                disabled={reportLoading}
                className="btn-csv"
              >
                {reportLoading ? "Generando..." : "📊 Generar CSV"}
              </button>
              
              <button 
                onClick={handleGeneratePdf} 
                disabled={reportLoading}
                className="btn-pdf"
              >
                {reportLoading ? "Generando..." : "📄 Generar PDF"}
              </button>
              
              <button 
                onClick={() => setShowEmailForm(!showEmailForm)} 
                disabled={reportLoading}
                className="btn-email"
              >
                📧 Enviar por Email
              </button>
              
              <button 
                onClick={handleGetHistory} 
                disabled={reportLoading}
                className="btn-history"
              >
                📋 Ver Historial
              </button>
            </div>

            {/* Botón de descarga del último reporte generado */}
            {lastGeneratedReport && (
              <div className="last-report-section">
                <button 
                  onClick={handleDownloadLastReport} 
                  disabled={reportLoading}
                  className="btn-download"
                >
                  {reportLoading ? "Descargando..." : `⬇️ Descargar ${lastGeneratedReport.type} reciente`}
                </button>
                <span className="last-report-info">
                  Último reporte: {lastGeneratedReport.filename}
                </span>
              </div>
            )}

            {reportMessage && (
              <div className={`report-message ${reportMessage.includes('✅') ? 'success' : 'error'}`}>
                {reportMessage}
              </div>
            )}

            {/* Formulario de Email */}
            {showEmailForm && (
              <div className="email-form">
                <h4>Enviar Reporte por Email</h4>
                <div className="form-grid">
                  <label>
                    Email destino:
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="usuario@ejemplo.com"
                    />
                  </label>
                  
                  <label>
                    Asunto:
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </label>
                  
                  <label>
                    Mensaje:
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={3}
                    />
                  </label>
                  
                  <div className="email-buttons">
                    <button 
                      onClick={handleTestEmailConfig} 
                      disabled={reportLoading}
                      className="btn-test-email"
                    >
                      {reportLoading ? "Probando..." : "🔧 Probar Configuración"}
                    </button>
                    
                    <button 
                      onClick={handleGeneratePdfAndEmail} 
                      disabled={reportLoading}
                      className="btn-send-email"
                    >
                      {reportLoading ? "Enviando..." : "📧 Generar y Enviar PDF"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Historial de Reportes */}
            {showHistory && (
              <div className="reports-history">
                <h4>Historial de Reportes</h4>
                {reportsHistory.length > 0 ? (
                  <div className="history-list">
                    {reportsHistory.map((report, index) => (
                      <div key={index} className="history-item">
                        <div className="report-info">
                          <span className={`report-type ${report.type.toLowerCase()}`}>
                            {report.type === 'CSV' ? '📊' : '📄'} {report.type}
                          </span>
                          <span className="report-name">{report.filename}</span>
                          <span className="report-date">{report.created}</span>
                          <span className="report-size">{(report.size / 1024).toFixed(1)} KB</span>
                          <button 
                            onClick={() => handleDownloadReport(report)}
                            disabled={reportLoading}
                            className="btn-download-small"
                            title={`Descargar ${report.filename}`}
                          >
                            ⬇️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No hay reportes generados aún.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !rows.length && <p>No hay pronósticos para mostrar.</p>}
    </>
  );
}
