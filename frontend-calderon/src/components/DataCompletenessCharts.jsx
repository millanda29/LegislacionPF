import React, { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
  Brush,
} from "recharts";
import html2canvas from "html2canvas";

const monthLabels = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

// Valida si un valor es válido (no nulo, distinto de 0, y no NaN)
const isValidValue = (val) => val !== null && val !== 0 && !Number.isNaN(val);

const DataCompletenessCharts = ({ dataByYear }) => {
  const lineChartRef = useRef(null);

  // Estados para almacenar interpretaciones IA y estados de carga
  const [interpretPieGlobal, setInterpretPieGlobal] = useState("");
  const [loadingPieGlobal, setLoadingPieGlobal] = useState(false);

  const [interpretBarYear, setInterpretBarYear] = useState("");
  const [loadingBarYear, setLoadingBarYear] = useState(false);

  const [interpretBarMonth, setInterpretBarMonth] = useState("");
  const [loadingBarMonth, setLoadingBarMonth] = useState(false);

  const [interpretLineTime, setInterpretLineTime] = useState("");
  const [loadingLineTime, setLoadingLineTime] = useState(false);

  // Aplanar datos para facilitar cálculos
  const allEntries = useMemo(() => Object.values(dataByYear).flat(), [dataByYear]);

  // Completitud global (%) calculada
  const globalCompleteness = useMemo(() => {
    if (allEntries.length === 0) return 0;
    const validCount = allEntries.filter(e => isValidValue(e.valor)).length;
    return Math.round((validCount / allEntries.length) * 100);
  }, [allEntries]);

  // Completitud por año (%)
  const completenessByYear = useMemo(() => {
    return Object.entries(dataByYear).map(([year, entries]) => {
      const total = entries.length;
      const valid = entries.filter(e => isValidValue(e.valor)).length;
      return {
        year,
        completeness: total ? Math.round((valid / total) * 100) : 0,
      };
    }).sort((a, b) => b.year - a.year);
  }, [dataByYear]);

  // Completitud por mes (todos los años, %)
  const completenessByMonth = useMemo(() => {
    const monthData = Array(12).fill(0).map(() => ({ valid: 0, total: 0 }));
    allEntries.forEach(e => {
      if (!e.fecha) return;
      const parts = e.fecha.split("/");
      if (parts.length !== 3) return;
      const month = parseInt(parts[1], 10);
      if (month < 1 || month > 12) return;
      monthData[month - 1].total += 1;
      if (isValidValue(e.valor)) monthData[month - 1].valid += 1;
    });
    return monthData.map((m, i) => ({
      month: i + 1,
      monthLabel: monthLabels[i],
      completeness: m.total === 0 ? 0 : Math.round((m.valid / m.total) * 100),
    }));
  }, [allEntries]);

  // Datos para la serie temporal, ordenados por fecha
  const chartData = useMemo(() => {
    const sorted = [...allEntries].filter(e => e.fecha).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    return sorted.map(e => ({
      fecha: e.fecha,
      valor: e.valor,
      completo_mediciones: e.completo_mediciones,
      completo_umbral: e.completo_umbral,
    }));
  }, [allEntries]);

  // Función para llamar a la API IA para interpretar datos
  const fetchInterpretation = async ({ modelo, titulo, tipo_dato, datos, setInterpret, setLoading }) => {
    try {
      setLoading(true);
      setInterpret("");
      const res = await fetch("http://localhost:8000/ia/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo, titulo, tipo_dato, datos }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();

      // Extraemos la propiedad texto del objeto interpretacion para renderizar correctamente
      setInterpret(json.interpretacion?.texto || "No se pudo obtener interpretación.");
    } catch (error) {
      setInterpret(`Error al interpretar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Descargar gráfico de serie temporal como PNG
  const handleDownloadChart = () => {
    if (!lineChartRef.current) return;
    html2canvas(lineChartRef.current, { backgroundColor: null }).then(canvas => {
      const link = document.createElement("a");
      link.download = "serie_temporal.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* Completitud global */}
      <h3>Completitud global (calculada) del dataset</h3>
      <div className="gauge-wrapper" style={{ display: "flex", alignItems: "center" }}>
        <ResponsiveContainer width={260} height={160}>
          <PieChart>
            <Pie
              data={[
                { name: "Completo", value: globalCompleteness },
                { name: "Faltante", value: 100 - globalCompleteness },
              ]}
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              <Cell key="c" fill="#5aa9e6" />
              <Cell key="f" fill="#e0e0e0" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="gauge-label" style={{ fontSize: 30, fontWeight: "bold", marginLeft: 10 }}>
          {globalCompleteness}%
        </div>
      </div>
      <button
        onClick={() =>
          fetchInterpretation({
            modelo: "gemini",
            titulo: "Completitud global del dataset",
            tipo_dato: "porcentaje",
            datos: [
              { fecha: "global", valor: globalCompleteness },
              { fecha: "global_faltante", valor: 100 - globalCompleteness }
            ],
            setInterpret: setInterpretPieGlobal,
            setLoading: setLoadingPieGlobal
          })
        }
        disabled={loadingPieGlobal}
        style={{ marginBottom: 10 }}
      >
        {loadingPieGlobal ? "Interpretando..." : "Interpretar con IA"}
      </button>
      <p><strong>Interpretación IA:</strong> {interpretPieGlobal || "Aún no interpretado"}</p>

      {/* Completitud por año */}
      <h3 style={{ marginTop: "2rem" }}>% de datos disponibles por año</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={completenessByYear}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip formatter={v => `${v}%`} />
          <Legend />
          <Bar dataKey="completeness" name="% Datos válidos" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
      <button
        onClick={() =>
          fetchInterpretation({
            modelo: "gemini",
            titulo: "Completitud anual de datos",
            tipo_dato: "porcentaje_anual",
            datos: completenessByYear.map(y => ({ fecha: y.year.toString(), valor: y.completeness })),
            setInterpret: setInterpretBarYear,
            setLoading: setLoadingBarYear
          })
        }
        disabled={loadingBarYear}
        style={{ marginBottom: 10 }}
      >
        {loadingBarYear ? "Interpretando..." : "Interpretar con IA"}
      </button>
      <p><strong>Interpretación IA:</strong> {interpretBarYear || "Aún no interpretado"}</p>

      {/* Completitud por mes */}
      <h3 style={{ marginTop: "2rem" }}>% de datos disponibles por mes (todos los años)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={completenessByMonth}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip formatter={v => `${v}%`} />
          <Legend />
          <Bar dataKey="completeness" name="% Datos válidos" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
      <button
        onClick={() =>
          fetchInterpretation({
            modelo: "gemini",
            titulo: "Completitud mensual de datos (todos los años)",
            tipo_dato: "porcentaje_mensual",
            datos: completenessByMonth.map(m => ({
              fecha: `2025-${m.month.toString().padStart(2, "0")}`,
              valor: m.completeness,
            })),
            setInterpret: setInterpretBarMonth,
            setLoading: setLoadingBarMonth
          })
        }
        disabled={loadingBarMonth}
        style={{ marginBottom: 10 }}
      >
        {loadingBarMonth ? "Interpretando..." : "Interpretar con IA"}
      </button>
      <p><strong>Interpretación IA:</strong> {interpretBarMonth || "Aún no interpretado"}</p>

      {/* Serie temporal */}
      <h3 style={{ marginTop: "2rem" }}>Serie temporal (con Zoom)</h3>
      <div ref={lineChartRef}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#5aa9e6"
              activeDot={{ r: 6 }}
              connectNulls={false}
              name="Valor"
            />
            <Line
              type="monotone"
              dataKey="completo_mediciones"
              stroke="#81e6d9"
              name="% Completo Mediciones (backend)"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="completo_umbral"
              stroke="#fbc687"
              name="% Completo Umbral (backend)"
              strokeDasharray="2 2"
            />
            <Brush dataKey="fecha" height={30} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button
        onClick={() =>
          fetchInterpretation({
            modelo: "gemini",
            titulo: "Serie temporal de valores",
            tipo_dato: "serie_temporal ",
            datos: chartData.map(({ fecha, valor }) => ({ fecha, valor })),
            setInterpret: setInterpretLineTime,
            setLoading: setLoadingLineTime
          })
        }
        disabled={loadingLineTime}
        style={{ marginTop: 10 }}
      >
        {loadingLineTime ? "Interpretando..." : "Interpretar con IA"}
      </button>
      <button
        onClick={handleDownloadChart}
        className="download-btn"
        style={{ marginTop: 10 }}
      >
        Descargar gráfico como PNG
      </button>
      <p><strong>Interpretación IA:</strong> {interpretLineTime || "Aún no interpretado"}</p>
    </div>
  );
};

export default DataCompletenessCharts;
