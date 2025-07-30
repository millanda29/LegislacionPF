// src/components/WaterPredictor.jsx
import { useState } from "react";
import { waterApi } from "../api/water";

const emptyRow = () => ({
  anio: "",
  mes: "",
  precipitacion_mm: "",
  poblacion: "",
});

export default function WaterPredictor() {
  const [items, setItems] = useState([emptyRow()]);
  const [preds, setPreds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (idx, field, value) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => setItems((prev) => [...prev, emptyRow()]);
  const removeRow = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handlePredict = async () => {
    setErr("");
    setPreds([]);
    setLoading(true);
    try {
      const payload = items.map((r) => ({
        anio: Number(r.anio),
        mes: Number(r.mes),
        precipitacion_mm: Number(r.precipitacion_mm),
        poblacion: Number(r.poblacion),
      }));
      const data = await waterApi.predict(payload);
      setPreds(data.predictions || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Predecir consumo</h2>

      {items.map((row, idx) => (
        <div key={idx} className="form-grid form-row">
          <label>
            Año:
            <input
              type="number"
              value={row.anio}
              onChange={(e) => handleChange(idx, "anio", e.target.value)}
            />
          </label>
          <label>
            Mes:
            <input
              type="number"
              min={1}
              max={12}
              value={row.mes}
              onChange={(e) => handleChange(idx, "mes", e.target.value)}
            />
          </label>
          <label>
            Precipitación (mm):
            <input
              type="number"
              value={row.precipitacion_mm}
              onChange={(e) =>
                handleChange(idx, "precipitacion_mm", e.target.value)
              }
            />
          </label>
          <label>
            Población:
            <input
              type="number"
              value={row.poblacion}
              onChange={(e) => handleChange(idx, "poblacion", e.target.value)}
            />
          </label>

          <button className="danger" onClick={() => removeRow(idx)}>
            Eliminar
          </button>
        </div>
      ))}

      <div className="actions">
        <button onClick={addRow}>+ Agregar fila</button>
        <button onClick={handlePredict} disabled={loading}>
          {loading ? "Calculando..." : "Predecir"}
        </button>
      </div>

      {err && <p className="error">{err}</p>}

      {!!preds.length && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Consumo predicho (m³)</th>
              </tr>
            </thead>
            <tbody>
              {preds.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
