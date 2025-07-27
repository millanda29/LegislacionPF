// src/pages/views/MultianualesView.jsx
import { useEffect, useMemo, useState } from "react";
import { 
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function MultianualesView() {
  // --- Estado para archivos y selección ---
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");

  // --- Estado para datos crudos + UI ---
  const [rawData, setRawData] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Meses ---
  const MONTH_KEYS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // ---------------------------------------------------------
  // 1) Traer lista de archivos XLSX del directorio data2
  // ---------------------------------------------------------
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://127.0.0.1:8000/files/data2");
        if (!res.ok) throw new Error("No se pudo obtener la lista de archivos .xlsx");
        const data = await res.json();
        const list = data.files ?? [];
        setFiles(list);
        if (list.length) setSelectedFile(list[0]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, []);

  // ---------------------------------------------------------
  // 2) Descargar archivo seleccionado
  // ---------------------------------------------------------
  const handleDownload = () => {
    if (!selectedFile) return;
    const url = `http://127.0.0.1:8000/files/download/data2/${selectedFile}`;
    window.open(url, "_blank");
  };

  // ---------------------------------------------------------
  // 3) Traer datos del archivo seleccionado
  // ---------------------------------------------------------
  useEffect(() => {
    if (!selectedFile) return;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://127.0.0.1:8000/precipitation/xlsx/data2/${selectedFile}`);
        if (!res.ok) throw new Error("No se pudieron obtener los datos del archivo seleccionado");
        const json = await res.json();
        setRawData(json.data);

        const years = (json.data?.["AÑO"] ?? []).filter((y) => y != null);
        if (years.length) setSelectedYear(String(years[years.length - 1]));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedFile]);

  // ---------------------------------------------------------
  // 4) Transformaciones para gráficos
  // ---------------------------------------------------------
  const years = useMemo(() => rawData?.["AÑO"]?.filter((y) => y != null) || [], [rawData]);

  const climatologyByMonth = useMemo(() => {
    if (!rawData) return [];
    return MONTH_KEYS.map((key, idx) => {
      const values = (rawData[key] ?? []).filter((v) => v != null && !isNaN(v));
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
      return { monthKey: key, monthLabel: MONTH_LABELS[idx], avg };
    });
  }, [rawData]);

  const selectedYearSeries = useMemo(() => {
    if (!rawData || !selectedYear) return [];
    const yearIndex = rawData["AÑO"]?.findIndex((y) => String(y) === String(selectedYear));
    if (yearIndex === -1) return [];
    return MONTH_KEYS.map((key, idx) => ({
      monthKey: key,
      monthLabel: MONTH_LABELS[idx],
      value: rawData[key]?.[yearIndex] ?? null
    }));
  }, [rawData, selectedYear]);

  const composedChartData = useMemo(() => (
    MONTH_KEYS.map((key, idx) => ({
      monthLabel: MONTH_LABELS[idx],
      promedio: climatologyByMonth[idx]?.avg ?? null,
      actual: selectedYearSeries[idx]?.value ?? null
    }))
  ), [climatologyByMonth, selectedYearSeries]);

  // --- Porcentaje de datos disponibles por AÑO ---
  const dataCompletenessByYear = useMemo(() => {
    if (!rawData) return [];
    const yearsArr = rawData["AÑO"] ?? [];
    return yearsArr.map((year, idx) => {
      if (!year) return null;
      const values = MONTH_KEYS.map((k) => rawData[k]?.[idx] ?? null);
      const validValues = values.filter((v) => v != null && !isNaN(v));
      const completeness = (validValues.length / MONTH_KEYS.length) * 100;
      return { year, completeness: completeness.toFixed(1) };
    }).filter(Boolean);
  }, [rawData]);

  // --- Promedio anual ---
  const annualTrend = useMemo(() => {
    if (!rawData) return [];
    const yearsArr = rawData["AÑO"] ?? [];
    return yearsArr.map((year, idx) => {
      if (!year) return null;
      const values = MONTH_KEYS.map((k) => rawData[k]?.[idx] ?? null).filter((v) => v != null && !isNaN(v));
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
      return { year, avg };
    }).filter(Boolean);
  }, [rawData]);

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  if (loading) return <p>Cargando datos multianuales...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="tab-content">
      <p>
        Visualiza archivos históricos de precipitación, radiación solar o temperatura ambiente.
      </p>

      {/* Selector de archivo */}
      {files.length > 0 && (
        <div className="file-selector">
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="file-dropdown"
          >
            {files.map((file, i) => (
              <option key={i} value={file}>
                {file}
              </option>
            ))}
          </select>
          <button onClick={handleDownload} className="download-btn">
            Descargar
          </button>
        </div>
      )}

      {/* Selector de año */}
      {years.length > 0 && (
        <div className="filters">
          <label>Año:</label>
          <select
            className="filter-dropdown"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Gráficos */}
      <h3>Climatología mensual vs. {selectedYear || "Año"}</h3>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={composedChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="promedio" name="Promedio histórico" fill="#cfe4f7" />
          <Line dataKey="actual" name={selectedYear} stroke="#5aa9e6" />
        </ComposedChart>
      </ResponsiveContainer>

      <h3>Porcentaje de datos disponibles por año</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dataCompletenessByYear}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend />
          <Bar dataKey="completeness" name="% Datos" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Tendencia anual (promedio por año)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={annualTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="avg" name="Promedio anual" stroke="#ff7300" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
