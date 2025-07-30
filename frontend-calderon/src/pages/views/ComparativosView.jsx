import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
/**
 * ComparativosView
 * - Compara varias columnas (estaciones) de un dataset multi-columna.
 * - Calcula correlaciones, % de completitud por estación, promedios mensuales, etc.
 */
export default function ComparativosView() {
  // -------------------------
  // Estado base
  // -------------------------
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");

  const [raw, setRaw] = useState(null); // JSON crudo: { Fecha: [...], C05: [...], ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selecciones de estaciones
  const [selectedStations, setSelectedStations] = useState([]);
  const [xStation, setXStation] = useState(""); // para scatter
  const [yStation, setYStation] = useState(""); // para scatter

  // -------------------------
  // Utils
  // -------------------------
  const isValid = (v) => v != null && !Number.isNaN(v);

  const parseYearMonth = (isoDate) => {
    // Fecha: "YYYY-MM-01"
    const [y, m] = isoDate.split("-");
    return `${y}-${m}`;
  };

  // -------------------------
  // 1) Obtener lista de archivos data3
  // -------------------------
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/files/data3`);
        if (!res.ok) throw new Error("No se pudo obtener la lista de archivos para comparación (data3)");
        const data = await res.json();
        const list = data.files || [];
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

  // -------------------------
  // 2) Cargar dataset seleccionado
  // -------------------------
  useEffect(() => {
    if (!selectedFile) return;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/precipitation/data3/${selectedFile}`);
        if (!res.ok) throw new Error("No se pudieron obtener los datos del archivo seleccionado");
        const json = await res.json();
        setRaw(json.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedFile]);

  // -------------------------
  // 3) Preparar llaves de estaciones (columnas != Fecha)
  // -------------------------
  const stationKeys = useMemo(() => {
    if (!raw) return [];
    return Object.keys(raw).filter((k) => k !== "Fecha");
  }, [raw]);

  useEffect(() => {
    if (stationKeys.length) {
      setSelectedStations(stationKeys.slice(0, Math.min(4, stationKeys.length)));
      setXStation(stationKeys[0] || "");
      setYStation(stationKeys[1] || "");
    }
  }, [stationKeys]);

  // -------------------------
  // 4) Series transformadas
  // -------------------------
  const timeSeriesWide = useMemo(() => {
    if (!raw) return [];
    const fechas = raw.Fecha || [];
    return fechas.map((f, idx) => {
      const row = { fecha: f, ym: parseYearMonth(f) };
      stationKeys.forEach((key) => {
        const v = raw[key]?.[idx];
        row[key] = isValid(v) ? v : null;
      });
      return row;
    });
  }, [raw, stationKeys]);

  const monthlyMeansByStation = useMemo(() => {
    if (!raw) return [];
    const monthAgg = {};
    (raw.Fecha || []).forEach((f, idx) => {
      const [, m] = (f || "").split("-");
      if (!m) return;
      if (!monthAgg[m]) monthAgg[m] = {};
      stationKeys.forEach((s) => {
        const v = raw[s]?.[idx];
        if (isValid(v)) {
          if (!monthAgg[m][s]) monthAgg[m][s] = [];
          monthAgg[m][s].push(v);
        }
      });
    });

    const monthLabels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return Object.keys(monthAgg)
      .sort()
      .map((m) => {
        const obj = { month: m, monthLabel: monthLabels[parseInt(m, 10) - 1] };
        stationKeys.forEach((s) => {
          const arr = monthAgg[m][s] || [];
          obj[s] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        });
        return obj;
      });
  }, [raw, stationKeys]);

  const completenessPerStation = useMemo(() => {
    if (!raw) return [];
    const total = (raw.Fecha || []).length || 1;
    return stationKeys.map((s) => {
      const valid = (raw[s] || []).filter((v) => isValid(v)).length;
      return { station: s, completeness: +((valid / total) * 100).toFixed(1) };
    });
  }, [raw, stationKeys]);

  const scatterXY = useMemo(() => {
    if (!raw || !xStation || !yStation) return [];
    const arrX = raw[xStation] || [];
    const arrY = raw[yStation] || [];
    const fechas = raw.Fecha || [];
    const out = [];
    for (let i = 0; i < fechas.length; i++) {
      const x = arrX[i];
      const y = arrY[i];
      if (isValid(x) && isValid(y)) {
        out.push({ x, y, fecha: fechas[i], fill: colorFromIndex(i) });
      }
    }
    return out;
  }, [raw, xStation, yStation]);

  const correlationMatrix = useMemo(() => {
    if (!raw || stationKeys.length === 0) return [];
    const valuesByStation = stationKeys.map((s) =>
      (raw[s] || []).map((v) => (isValid(v) ? Number(v) : null))
    );

    const pearson = (a, b) => {
      const pairs = [];
      for (let i = 0; i < a.length; i++) {
        if (isValid(a[i]) && isValid(b[i])) pairs.push([a[i], b[i]]);
      }
      const n = pairs.length;
      if (n < 2) return null;
      const xs = pairs.map((p) => p[0]);
      const ys = pairs.map((p) => p[1]);
      const mean = (arr) => arr.reduce((ac, v) => ac + v, 0) / arr.length;
      const mx = mean(xs);
      const my = mean(ys);
      let num = 0;
      let denx = 0;
      let deny = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx;
        const dy = ys[i] - my;
        num += dx * dy;
        denx += dx * dx;
        deny += dy * dy;
      }
      const den = Math.sqrt(denx * deny);
      return den === 0 ? null : num / den;
    };

    return stationKeys.map((_, i) =>
      stationKeys.map((__, j) => (i === j ? 1 : pearson(valuesByStation[i], valuesByStation[j])))
    );
  }, [raw, stationKeys]);

  // -------------------------
  // Render
  // -------------------------
  if (loading) return <p>Cargando datos comparativos...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!raw) return <p>No hay datos para mostrar.</p>;

  return (
    <div className="tab-content">
      <h2>Comparación entre estaciones/columnas</h2>

      {/* Selector de archivo */}
      {files.length > 0 && (
        <div className="file-selector">
          <select
            className="file-dropdown"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
          >
            {files.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button
            className="download-btn"
            onClick={() =>
              window.open(
                `${API_URL}/files/download/data3/${selectedFile}`,
                "_blank"
              )
            }
          >
            Descargar
          </button>
        </div>
      )}

      {/* Selector de estaciones */}
      <div className="filters" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
        <strong>Estaciones a mostrar:</strong>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {stationKeys.map((s) => {
            const checked = selectedStations.includes(s);
            return (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSelectedStations((prev) =>
                      checked ? prev.filter((x) => x !== s) : [...prev, s]
                    );
                  }}
                />
                {s}
              </label>
            );
          })}
        </div>
      </div>

      {/* Serie temporal */}
      <h3 style={{ marginTop: "1.5rem" }}>Serie temporal (líneas múltiples)</h3>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={timeSeriesWide}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedStations.map((s, idx) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s}
              stroke={colorFromIndex(idx)}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Promedio mensual */}
      <h3 style={{ marginTop: "2rem" }}>Promedio mensual histórico por estación</h3>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={monthlyMeansByStation}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedStations.map((s, idx) => (
            <Bar key={s} dataKey={s} name={s} fill={colorFromIndex(idx)} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* % completitud */}
      <h3 style={{ marginTop: "2rem" }}>% de datos disponibles por estación (null/NaN excluidos)</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={completenessPerStation.filter(c => selectedStations.includes(c.station))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="station" />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend />
          <Bar dataKey="completeness" name="% Datos válidos" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>

      {/* Scatter */}
      <h3 style={{ marginTop: "2rem" }}>Dispersión entre estaciones (X vs Y)</h3>
      <div className="filters">
        <label>X:</label>
        <select className="filter-dropdown" value={xStation} onChange={(e) => setXStation(e.target.value)}>
          {stationKeys.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label>Y:</label>
        <select className="filter-dropdown" value={yStation} onChange={(e) => setYStation(e.target.value)}>
          {stationKeys.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" name={xStation} />
          <YAxis dataKey="y" name={yStation} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name={`${xStation} vs ${yStation}`} data={scatterXY}>
            {scatterXY.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={colorFromIndex(idx)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Correlación */}
      <h3 style={{ marginTop: "2rem" }}>Matriz de correlación (Pearson)</h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: 600,
            textAlign: "center",
          }}
        >
          <thead>
            <tr>
              <th style={thTdStyle}></th>
              {stationKeys.map((s) => (
                <th key={`h-${s}`} style={thTdStyle}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlationMatrix.map((row, i) => (
              <tr key={`r-${stationKeys[i]}`}>
                <th style={thTdStyle}>{stationKeys[i]}</th>
                {row.map((v, j) => (
                  <td key={`c-${i}-${j}`} style={thTdStyle}>
                    {v == null ? "-" : v.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------
   Helpers para colores simples
--------------------------- */
const palette = [
  "#5aa9e6", "#f28b82", "#82ca9d", "#8884d8", "#ff7300",
  "#ffc658", "#a4de6c", "#d0ed57", "#8dd1e1", "#83a6ed",
];
function colorFromIndex(i) {
  return palette[i % palette.length];
}

const thTdStyle = {
  border: "1px solid var(--color-border, #e0e0e0)",
  padding: "4px 6px",
};
