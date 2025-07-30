// src/components/FileSelector.jsx

import React, { useState, useEffect } from "react";

// Mapeo de tipo de dato a términos que deben aparecer en el nombre del archivo
const FILE_TYPE_MAP = {
  precipitacion: "precipitación",
  radiacion: "radiación_solar",
  temperatura: "temperatura_ambiente",
};

const FileSelector = ({ files, onSelect, selectedFile }) => {
  const [dataType, setDataType] = useState("");
  const [filteredFiles, setFilteredFiles] = useState([]);

  useEffect(() => {
    if (!dataType) {
      setFilteredFiles([]);
      onSelect(""); // Limpiar selección si no hay tipo
      return;
    }

    const term = FILE_TYPE_MAP[dataType].toLowerCase();
    const filtered = files.filter((f) => f.toLowerCase().includes(term));
    setFilteredFiles(filtered);
    onSelect(""); // Limpiar archivo al cambiar tipo
  }, [dataType, files, onSelect]);

  return (
    <div className="file-selector">
      {/* Selector de tipo de dato */}
      <label className="label">
        Tipo de dato:
        <select
          className="filter-dropdown"
          value={dataType}
          onChange={(e) => setDataType(e.target.value)}
        >
          <option value="">-- Selecciona tipo --</option>
          <option value="precipitacion">Precipitación</option>
          <option value="radiacion">Radiación solar</option>
          <option value="temperatura">Temperatura ambiente</option>
        </select>
      </label>

      {/* Selector de archivo solo si hay tipo seleccionado */}
      {dataType && (
        <label className="label" style={{ marginLeft: "1rem" }}>
          Archivo:
          <select
            className="filter-dropdown"
            onChange={(e) => onSelect(e.target.value)}
            value={selectedFile || ""}
            disabled={filteredFiles.length === 0}
          >
            <option value="" disabled>
              {filteredFiles.length > 0
                ? "-- Selecciona archivo --"
                : "No hay archivos para este tipo"}
            </option>
            {filteredFiles.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
};

export default FileSelector;
