import { useState } from "react";
import { waterApi } from "../api/water";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

// Registro de componentes de Chart.js
ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function WaterCompare() {
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [monthsStr, setMonthsStr] = useState("");
  const [rows, setRows] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleCompare = async () => {
    setLoading(true);
    setErr("");
    try {
      const months = monthsStr
        ? monthsStr
            .split(",")
            .map((m) => parseInt(m.trim(), 10))
            .filter(Boolean)
        : undefined;

      const res = await waterApi.compare({
        year_from: yearFrom ? Number(yearFrom) : undefined,
        year_to: yearTo ? Number(yearTo) : undefined,
        months,
      });
      setRows(res.rows || []);
      setMetrics(res.metrics || null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Etiquetas comunes Año-Mes
  const labels = rows.map((r) => `${r.anio}-${String(r.mes).padStart(2, "0")}`);

  // Datos del gráfico Real vs Predicción
  const realVsPredChart = {
    labels,
    datasets: [
      {
        label: "Real",
        data: rows.map((r) => r.real),
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        tension: 0.3,
      },
      {
        label: "Predicción",
        data: rows.map((r) => r.pred),
        borderColor: "#2196F3",
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        tension: 0.3,
      },
    ],
  };

  // Datos del gráfico de error absoluto
  const absErrorChart = {
    labels,
    datasets: [
      {
        label: "Error absoluto (m³)",
        data: rows.map((r) => r.abs_error),
        backgroundColor: "#f44336",
      },
    ],
  };

  // Datos del gráfico APE (%)
  const apeChart = {
    labels,
    datasets: [
      {
        label: "APE (%)",
        data: rows.map((r) => r.ape != null ? r.ape : null),
        borderColor: "#FF9800",
        backgroundColor: "rgba(255, 152, 0, 0.1)",
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  return (
    <>
      <h2>Comparación Real vs Predicción</h2>

      <div className="form-grid">
        <label>
          Año desde:
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
          />
        </label>
        <label>
          Año hasta:
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
          />
        </label>
        <label>
          Meses (coma separados):
          <input
            placeholder="1,2,3"
            value={monthsStr}
            onChange={(e) => setMonthsStr(e.target.value)}
          />
        </label>

        <button onClick={handleCompare} disabled={loading}>
          {loading ? "Calculando..." : "Comparar"}
        </button>
      </div>

      {err && <p className="error">{err}</p>}

      {metrics && (
        <div className="metrics">
          <h3>Métricas</h3>
          <ul>
            <li>MAE: {metrics.MAE.toFixed(4)}</li>
            <li>RMSE: {metrics.RMSE.toFixed(4)}</li>
            <li>MAPE: {metrics.MAPE.toFixed(4)}%</li>
            <li>R2: {metrics.R2.toFixed(4)}</li>
          </ul>

          {/* Gráfico 1: Real vs Predicción */}
          <h4>📈 Real vs Predicción</h4>
          <div style={{ maxWidth: "900px", margin: "1rem auto" }}>
            <Line data={realVsPredChart} />
          </div>

          {/* Gráfico 2: Error absoluto */}
          <h4>📉 Error absoluto</h4>
          <div style={{ maxWidth: "900px", margin: "1rem auto" }}>
            <Bar data={absErrorChart} />
          </div>

          {/* Gráfico 3: APE (%) */}
          <h4>📊 APE (%)</h4>
          <div style={{ maxWidth: "900px", margin: "1rem auto" }}>
            <Line data={apeChart} />
          </div>
        </div>
      )}

      {!!rows.length && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Año</th>
                <th>Mes</th>
                <th>Real (m³)</th>
                <th>Pred (m³)</th>
                <th>Error abs</th>
                <th>APE (%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.anio}</td>
                  <td>{r.mes}</td>
                  <td>{r.real.toFixed(2)}</td>
                  <td>{r.pred.toFixed(2)}</td>
                  <td>{r.abs_error.toFixed(2)}</td>
                  <td>{r.ape != null ? r.ape.toFixed(2) : "NA"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !rows.length && <p>No hay comparaciones para mostrar.</p>}
    </>
  );
}
