import { useState } from "react";
import { waterApi } from "../api/water";

export default function WaterDataExplorer() {
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [monthsStr, setMonthsStr] = useState(""); // Ej: "1,2,3"
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [queried, setQueried] = useState(false); // Para saber si ya se hizo una consulta

  // Consultar datos
  const handleFetch = async () => {
    setLoading(true);
    setErr("");
    setQueried(true);
    try {
      const months = monthsStr
        ? monthsStr.split(",").map((m) => parseInt(m.trim(), 10)).filter(Boolean)
        : undefined;

      const data = await waterApi.getData({
        year_from: yearFrom ? Number(yearFrom) : undefined,
        year_to: yearTo ? Number(yearTo) : undefined,
        months,
      });
      setRows(data.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros y tabla
  const handleClear = () => {
    setYearFrom("");
    setYearTo("");
    setMonthsStr("");
    setRows([]);
    setQueried(false);
    setErr("");
  };

  return (
    <>
      <h2>Datos crudos / filtrados</h2>
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

        <div className="actions">
          <button onClick={handleFetch} disabled={loading}>
            {loading ? "Cargando..." : "Consultar"}
          </button>
          <button className="danger" onClick={handleClear} disabled={loading}>
            Limpiar
          </button>
        </div>
      </div>

      {err && <p className="error">{err}</p>}

      {!!rows.length && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Año</th>
                <th>Mes</th>
                <th>Consumo (m³)</th>
                <th>Precipitación (mm)</th>
                <th>Población</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.anio}</td>
                  <td>{r.mes}</td>
                  <td>{r.consumo_m3}</td>
                  <td>{r.precipitacion_mm}</td>
                  <td>{r.poblacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !rows.length && queried && (
        <p>No hay datos para mostrar.</p>
      )}
    </>
  );
}
