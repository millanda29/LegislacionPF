import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  AreaChart,
  Area,
  Brush,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from "recharts";
import html2canvas from "html2canvas";

/**
 * MensualesView
 * - Carga CSVs mensuales.
 * - Calcula climatología, anomalías, rolling-3, y COMPLETITUD real (ignorando null/NaN).
 * - Agrega nuevas gráficas de % completitud por año y por mes.
 */
export default function MensualesView() {
  // ---------------------------
  // State principal
  // ---------------------------
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [filter, setFilter] = useState("Todos");

  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [errorChart, setErrorChart] = useState(null);

  const [selectedYear, setSelectedYear] = useState(null);

  const lineChartRef = useRef(null);

  // ---------------------------
  // Helpers & constantes
  // ---------------------------
  const monthNames = useMemo(
    () => ["01","02","03","04","05","06","07","08","09","10","11","12"],
    []
  );
  const monthLabels = useMemo(
    () => ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    []
  );

  const getMonthLabel = useCallback(
    (m) => monthLabels[parseInt(m, 10) - 1],
    [monthLabels]
  );

  const isValid = (v) => v != null && !Number.isNaN(v);

  // ---------------------------
  // 1) Traer lista de archivos
  // ---------------------------
  useEffect(() => {
    fetch("http://127.0.0.1:8000/files/data")
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener los archivos");
        return res.json();
      })
      .then((data) => {
        const filesList = data.files || [];
        setFiles(filesList);
        setFilteredFiles(filesList);
        if (filesList.length > 0) setSelectedFile(filesList[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ---------------------------
  // 2) Traer datos para el archivo seleccionado
  // ---------------------------
  useEffect(() => {
    if (!selectedFile) return;

    setLoadingChart(true);
    setErrorChart(null);
    setChartData([]);

    fetch(`http://127.0.0.1:8000/precipitation/csv/data/${selectedFile}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener datos del archivo");
        return res.json();
      })
      .then((data) => {
        const objData = data.data;
        if (!objData || !objData.fecha || !objData.valor) {
          throw new Error("Formato de datos inválido");
        }
        const formatted = objData.fecha.map((fecha, i) => {
          const [year, month] = fecha.split("/");
          const value = objData.valor[i];
          return {
          fecha,
          year,
          month,
          monthLabel: getMonthLabel(month),
          valor: isNaN(value) ? null : value, // normalizamos NaN -> null
          completo_mediciones: objData.completo_mediciones?.[i] ?? null,
          completo_umbral: objData.completo_umbral?.[i] ?? null
          };
        });

        setChartData(formatted);

        const yearsWithData = [...new Set(formatted.map((d) => d.year))].sort();
        setSelectedYear(yearsWithData[yearsWithData.length - 1] || null);

        setLoadingChart(false);
      })
      .catch((err) => {
        setErrorChart(err.message);
        setLoadingChart(false);
      });
  }, [selectedFile, getMonthLabel]);

  // ---------------------------
  // 3) Filtrar lista por variable (solo UI)
  // ---------------------------
  const handleFilterChange = (value) => {
    setFilter(value);
    if (value === "Todos") {
      setFilteredFiles(files);
      setSelectedFile(files.length > 0 ? files[0] : "");
    } else {
      const filtered = files.filter((file) =>
        file.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredFiles(filtered);
      setSelectedFile(filtered.length > 0 ? filtered[0] : "");
    }
  };

  // ---------------------------
  // 4) Descargar archivo
  // ---------------------------
  const handleDownload = () => {
    if (selectedFile) {
      window.open(
        `http://127.0.0.1:8000/files/download/data/${selectedFile}`,
        "_blank"
      );
    }
  };

  // ---------------------------
  // 5) Descargar gráfico de líneas como imagen
  // ---------------------------
  const handleDownloadChart = () => {
    if (!lineChartRef.current) return;
    html2canvas(lineChartRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = `${selectedFile || "chart"}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  // ---------------------------
  // 6) Transformaciones & Métricas
  // ---------------------------

  // --- Años únicos en la serie ---
  const allYears = useMemo(
    () => [...new Set(chartData.map((d) => d.year))].filter(Boolean).sort(),
    [chartData]
  );

  // --- Climatología mensual (promedio por mes entre todos los años) ---
  const climatologyByMonth = useMemo(() => {
    const map = {};
    monthNames.forEach((m) => (map[m] = []));
    chartData.forEach((d) => {
      if (isValid(d.valor)) map[d.month].push(d.valor);
    });
    return monthNames.map((m, idx) => {
      const arr = map[m];
      const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      return {
        month: m,
        monthLabel: monthLabels[idx],
        avg
      };
    });
  }, [chartData, monthLabels, monthNames]);

  // --- Serie del año seleccionado ---
  const selectedYearSeries = useMemo(() => {
    if (!selectedYear) return [];
    const map = {};
    monthNames.forEach((m) => (map[m] = null));
    chartData
      .filter((d) => d.year === selectedYear)
      .forEach((d) => (map[d.month] = d.valor));
    return monthNames.map((m, idx) => ({
      month: m,
      monthLabel: monthLabels[idx],
      value: map[m]
    }));
  }, [chartData, selectedYear, monthLabels, monthNames]);

  // --- Climatología vs año seleccionado ---
  const climatologyVsYear = useMemo(() => {
    return monthNames.map((m, idx) => ({
      month: m,
      monthLabel: monthLabels[idx],
      promedio: climatologyByMonth[idx]?.avg ?? null,
      actual: selectedYearSeries[idx]?.value ?? null
    }));
  }, [climatologyByMonth, selectedYearSeries, monthLabels, monthNames]);

  // --- Anomalías (valor - climatología mensual) ---
  const anomaliesSeries = useMemo(() => {
    const avgMap = {};
    climatologyByMonth.forEach((c) => (avgMap[c.month] = c.avg));
    return chartData
      .filter((d) => isValid(d.valor))
      .map((d) => ({
        fecha: d.fecha,
        month: d.month,
        year: d.year,
        anomaly: avgMap[d.month] != null ? d.valor - avgMap[d.month] : null
      }));
  }, [chartData, climatologyByMonth]);

  // --- Rolling 3 meses (acumulado) ---
  const rolling3Series = useMemo(() => {
    const withVal = chartData
      .filter((d) => isValid(d.valor))
      .sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
    const res = [];
    for (let i = 0; i < withVal.length; i++) {
      const slice = withVal.slice(Math.max(i - 2, 0), i + 1);
      const sum = slice.reduce((acc, it) => acc + (it.valor || 0), 0);
      res.push({ fecha: withVal[i].fecha, rolling3: sum });
    }
    return res;
  }, [chartData]);

  // --- COMPLETITUD GLOBAL (calculada) ---
  const globalCompleteness = useMemo(() => {
    const total = chartData.length;
    if (total === 0) return 0;
    const valid = chartData.filter((d) => isValid(d.valor)).length;
    return Math.round((valid / total) * 1000) / 10; // 1 decimal
  }, [chartData]);

  // --- COMPLETITUD POR AÑO ---
  const completenessByYear = useMemo(() => {
    const yearMap = {};
    allYears.forEach((y) => (yearMap[y] = { count: 0, valid: 0 }));
    chartData.forEach((d) => {
      if (!d.year) return;
      yearMap[d.year].count += 1;
      if (isValid(d.valor)) yearMap[d.year].valid += 1;
    });
    return allYears.map((y) => ({
      year: y,
      completeness: yearMap[y].count
        ? Math.round((yearMap[y].valid / yearMap[y].count) * 1000) / 10
        : 0
    }));
  }, [allYears, chartData]);

  // --- COMPLETITUD POR MES (respecto a todos los años disponibles) ---
  const completenessByMonth = useMemo(() => {
    const totalYears = allYears.length || 1;
    const map = {};
    monthNames.forEach((m) => (map[m] = 0));

    // contamos cuántos años tienen dato válido en cada mes
    allYears.forEach((y) => {
      const yearData = chartData.filter((d) => d.year === y);
      const byMonth = {};
      monthNames.forEach((m) => (byMonth[m] = null));
      yearData.forEach((d) => (byMonth[d.month] = d.valor));

      monthNames.forEach((m) => {
        if (isValid(byMonth[m])) map[m] += 1;
      });
    });

    return monthNames.map((m, idx) => ({
      month: m,
      monthLabel: monthLabels[idx],
      completeness: Math.round((map[m] / totalYears) * 1000) / 10
    }));
  }, [allYears, chartData, monthLabels, monthNames]);

  // --- Heatmap valor (ya lo tenías) ---
  const heatmapData = useMemo(() => {
    return chartData
      .filter((d) => isValid(d.valor))
      .map((d) => ({
        x: parseInt(d.month, 10),
        y: parseInt(d.year, 10),
        valor: d.valor
      }));
  }, [chartData]);

  // --- Heatmap de faltantes (para visualizar dónde no hay datos) ---
  const heatmapMissing = useMemo(() => {
    const set = [];
    chartData.forEach((d) => {
      if (!isValid(d.valor)) {
        set.push({
          x: parseInt(d.month, 10),
          y: parseInt(d.year, 10),
          missing: 1
        });
      }
    });
    return set;
  }, [chartData]);

  const colorScale = (value, min, max) => {
    if (min === max) return "#5aa9e6";
    const t = (value - min) / (max - min);
    const start = [90, 200, 250]; // rgb pastel ligero
    const end = [0, 90, 170];     // rgb más oscuro
    const r = Math.round(start[0] + t * (end[0] - start[0]));
    const g = Math.round(start[1] + t * (end[1] - start[1]));
    const b = Math.round(start[2] + t * (end[2] - start[2]));
    return `rgb(${r},${g},${b})`;
  };

  const heatmapMinMax = useMemo(() => {
    if (!heatmapData.length) return { min: 0, max: 0 };
    let min = Infinity;
    let max = -Infinity;
    heatmapData.forEach((p) => {
      min = Math.min(min, p.valor);
      max = Math.max(max, p.valor);
    });
    return { min, max };
  }, [heatmapData]);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div>
      <p>
        Filtra, descarga y visualiza archivos históricos de precipitación,
        radiación solar o temperatura ambiente.
      </p>

      {loading && <p>Cargando archivos...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Filtros */}
          <div className="filters">
            <label>Filtrar por variable:</label>
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="filter-dropdown"
            >
              <option value="Todos">Todos</option>
              <option value="Precipitación">Precipitación</option>
              <option value="Radiación_solar">Radiación Solar</option>
              <option value="Temperatura_ambiente">Temperatura Ambiente</option>
            </select>
          </div>

          {/* Lista de archivos */}
          {filteredFiles.length > 0 ? (
            <div className="file-selector">
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="file-dropdown"
              >
                {filteredFiles.map((file, i) => (
                  <option key={i} value={file}>
                    {file}
                  </option>
                ))}
              </select>
              <button onClick={handleDownload} className="download-btn">
                Descargar
              </button>
            </div>
          ) : (
            <p>No hay archivos que coincidan con el filtro.</p>
          )}

          {/* Selección de año */}
          {chartData.length > 0 && (
            <div className="filters">
              <label>Año para comparar con climatología:</label>
              <select
                value={selectedYear || ""}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-dropdown"
              >
                {allYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* -------- Gráficos -------- */}
          <div style={{ marginTop: "2rem" }}>
            {loadingChart && <p>Cargando datos para el gráfico...</p>}
            {errorChart && <p className="error">Error: {errorChart}</p>}

            {!loadingChart && !errorChart && chartData.length > 0 && (
              <>
                {/* 0) % Completitud global (calculado con null/NaN) */}
                <h3>Completitud global (calculada) del dataset</h3>
                <div className="gauge-wrapper">
                  <ResponsiveContainer width={260} height={160}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completo", value: globalCompleteness },
                          { name: "Faltante", value: 100 - globalCompleteness }
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
                  <div className="gauge-label">{globalCompleteness}%</div>
                </div>

                {/* 0.1) % completitud por año */}
                <h3 style={{ marginTop: "2rem" }}>% de datos disponibles por año</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={completenessByYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="completeness" name="% Datos válidos" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>

                {/* 0.2) % completitud por mes */}
                <h3 style={{ marginTop: "2rem" }}>% de datos disponibles por mes (sobre todos los años)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={completenessByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="completeness" name="% Datos válidos" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>

                {/* 1) Serie temporal con Brush */}
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
                      {/* Puedes eliminar estas líneas si ya no quieres mostrar
                          los % que vienen del backend */}
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
                  onClick={handleDownloadChart}
                  className="download-btn"
                  style={{ marginTop: 10 }}
                >
                  Descargar gráfico como PNG
                </button>

                {/* 2) Climatología vs. año */}
                <h3 style={{ marginTop: "2rem" }}>
                  Climatología mensual vs. {selectedYear}
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={climatologyVsYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="promedio" name="Promedio histórico" fill="#cfe4f7" />
                    <Line dataKey="actual" name={selectedYear} stroke="#5aa9e6" />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* 3) Anomalías */}
                <h3 style={{ marginTop: "2rem" }}>
                  Anomalías (valor - climatología mensual)
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={anomaliesSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="anomaly" name="Anomalía">
                      {anomaliesSeries.map((entry, index) => {
                        const c = entry.anomaly >= 0 ? "#5aa9e6" : "#f28b82";
                        return <Cell key={`cell-${index}`} fill={c} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* 4) Rolling 3 meses */}
                <h3 style={{ marginTop: "2rem" }}>Acumulado móvil 3 meses</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={rolling3Series}>
                    <defs>
                      <linearGradient id="colorRolling" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5aa9e6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#5aa9e6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="rolling3"
                      stroke="#5aa9e6"
                      fill="url(#colorRolling)"
                      name="Rolling 3 meses"
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* 5) Heatmap Año-Mes (valores) */}
                <h3 style={{ marginTop: "2rem" }}>
                  Heatmap Año vs Mes (Intensidad por valor)
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 40 }}
                  >
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[1, 12]}
                      tickFormatter={(v) => monthLabels[v - 1]}
                    />
                    <YAxis type="number" dataKey="y" domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value, name) => {
                        if (name === "x") return monthLabels[value - 1];
                        if (name === "y") return value;
                        return value;
                      }}
                      labelFormatter={() => ""}
                    />
                    <Scatter
                      data={heatmapData.map((p) => ({
                        ...p,
                        fill: colorScale(
                          p.valor,
                          heatmapMinMax.min,
                          heatmapMinMax.max
                        ),
                        size: 120
                      }))}
                      shape={(props) => {
                        const size = 24;
                        const { cx, cy, payload } = props;
                        return (
                          <rect
                            x={cx - size / 2}
                            y={cy - size / 2}
                            width={size}
                            height={size}
                            fill={payload.fill}
                            stroke="#fff"
                            strokeWidth={0.5}
                            rx={3}
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>

                {/* 6) Heatmap Año-Mes (faltantes) */}
                <h3 style={{ marginTop: "2rem" }}>
                  Heatmap Año vs Mes (Faltantes)
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 40 }}
                  >
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[1, 12]}
                      tickFormatter={(v) => monthLabels[v - 1]}
                    />
                    <YAxis type="number" dataKey="y" domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value, name) => {
                        if (name === "x") return monthLabels[value - 1];
                        if (name === "y") return value;
                        return value;
                      }}
                      labelFormatter={() => ""}
                    />
                    <Scatter
                      data={heatmapMissing}
                      shape={(props) => {
                        const size = 24;
                        const { cx, cy } = props;
                        return (
                          <rect
                            x={cx - size / 2}
                            y={cy - size / 2}
                            width={size}
                            height={size}
                            fill="#f28b82" // rojo para faltantes
                            stroke="#fff"
                            strokeWidth={0.5}
                            rx={3}
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </>
            )}

            {!loadingChart && !errorChart && chartData.length === 0 && (
              <p>No hay datos disponibles para graficar.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
