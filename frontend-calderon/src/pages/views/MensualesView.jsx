// src/pages/views/MensualesView.jsx

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import FileSelector from "../../components/FileSelector";
import YearlyTable from "../../components/YearlyTable";
import DataCompletenessCharts from "../../components/DataCompletenessCharts";

const ITEMS_PER_PAGE = 20;

const MensualesView = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dataByYear, setDataByYear] = useState({});
  const [loading, setLoading] = useState(false);

  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/files/data")
      .then((res) => setFiles(res.data.files))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedFile) return;

    setLoading(true);
    setFilterYear("");
    setFilterMonth("");
    setFilterDay("");
    setCurrentPage(1);

    axios
      .get(`http://127.0.0.1:8000/precipitation/csv/data/${selectedFile}`)
      .then((res) => setDataByYear(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedFile]);

  const getDownloadUrl = () =>
    `http://127.0.0.1:8000/files/download/data/${selectedFile}`;

  const availableYears = useMemo(() => {
    if (!dataByYear) return [];
    return Object.keys(dataByYear).sort((a, b) => b - a);
  }, [dataByYear]);

  const filteredEntries = useMemo(() => {
    if (!filterYear || !dataByYear[filterYear]) return [];

    const rows = dataByYear[filterYear];
    const filterMonthNum = filterMonth ? parseInt(filterMonth, 10) : null;
    const filterDayNum = filterDay ? parseInt(filterDay, 10) : null;

    return rows.filter((row) => {
      if (!row.fecha) return false;
      const [, mStr, dStr] = row.fecha.split("/");

      const monthNum = parseInt(mStr, 10);
      const dayNum = parseInt(dStr, 10);

      if (filterMonthNum !== null && filterMonthNum !== monthNum) return false;
      if (filterDayNum !== null && filterDayNum !== dayNum) return false;

      return true;
    });
  }, [dataByYear, filterYear, filterMonth, filterDay]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);

  return (
    <div className="page">
      <h2>Visualización de Datos Diarios</h2>

      <div className="file-selector">
        <FileSelector
          files={files}
          onSelect={setSelectedFile}
          selectedFile={selectedFile}
        />
      </div>

      {loading && <p>Cargando datos...</p>}

      {!loading && selectedFile && (
        <>
          <div>
            <br />
            <h3>Archivo: {selectedFile}</h3>
            <br />
            <a href={getDownloadUrl()} download className="download-btn">
              Descargar CSV
            </a>

            <div className="filters">
              <label>
                Año:
                <select
                  className="filter-dropdown"
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    setCurrentPage(1);
                    setFilterMonth("");
                    setFilterDay("");
                  }}
                >
                  <option value="">-- Todos --</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Mes:
                <select
                  className="filter-dropdown"
                  value={filterMonth}
                  onChange={(e) => {
                    setFilterMonth(e.target.value);
                    setCurrentPage(1);
                    setFilterDay("");
                  }}
                  disabled={!filterYear}
                >
                  <option value="">-- Todos --</option>
                  {[...Array(12)].map((_, i) => {
                    const mesNum = (i + 1).toString().padStart(2, "0");
                    return (
                      <option key={mesNum} value={mesNum}>
                        {mesNum}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label>
                Día:
                <select
                  className="filter-dropdown"
                  value={filterDay}
                  onChange={(e) => {
                    setFilterDay(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={!filterYear || !filterMonth}
                >
                  <option value="">-- Todos --</option>
                  {[...Array(31)].map((_, i) => {
                    const diaNum = (i + 1).toString().padStart(2, "0");
                    return (
                      <option key={diaNum} value={diaNum}>
                        {diaNum}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
          </div>

          {filterYear ? (
            <>
              <div className="table-wrapper">
                <YearlyTable year={filterYear} entries={paginatedEntries} />
              </div>

              {totalPages > 1 && (
                <div className="actions">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>Selecciona un año para mostrar datos y filtros.</p>
          )}

          <div>
            <DataCompletenessCharts dataByYear={dataByYear} />
          </div>
        </>
      )}
    </div>
  );
};

export default MensualesView;
