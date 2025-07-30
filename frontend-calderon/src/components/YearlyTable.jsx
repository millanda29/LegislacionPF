import React, { useState, useMemo, memo } from "react";

// Fila memoizada para evitar re-renders si props no cambian
const TableRow = memo(({ row }) => (
  <tr>
    <td>{row.fecha}</td>
    <td>{row.valor !== null ? row.valor : "—"}</td>
    <td>{row.completo_mediciones}</td>
    <td>{row.completo_umbral}</td>
  </tr>
));

const YearlyTable = ({ year, entries }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // Calcular páginas
  const totalPages = useMemo(() => Math.ceil(entries.length / rowsPerPage), [entries.length]);

  // Datos paginados para mostrar solo los del page actual
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return entries.slice(start, start + rowsPerPage);
  }, [entries, page]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="table-wrapper">
      <h4>Año: {year}</h4>

      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Valor</th>
            <th>% Completo Mediciones</th>
            <th>% Completo Umbral</th>
          </tr>
        </thead>
        <tbody>
          {paginatedEntries.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>
                No hay datos para mostrar.
              </td>
            </tr>
          ) : (
            paginatedEntries.map((row) => (
              <TableRow key={row.fecha} row={row} />
            ))
          )}
        </tbody>
      </table>

      {/* Controles de paginación */}
      {totalPages > 1 && (
      <div className="pagination-controls">
        <button onClick={handlePrev} disabled={page === 1}>
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button onClick={handleNext} disabled={page === totalPages}>
          Siguiente
        </button>
      </div>
    )}
  </div>
  );
};

export default YearlyTable;
