import { useState } from "react";
import "./PageStyles.css";
import MensualesView from "./views/MensualesView";
import MultianualesView from "./views/MultianualesView";
import ComparativosView from "./views/ComparativosView";

export default function DataPage() {
  const [activeTab, setActiveTab] = useState("mensuales");

  return (
    <div className="page">
      <div className="card">
        <h1>Datos Históricos</h1>

        {/* Tabs */}
        <div className="tabs">
          <button
            onClick={() => setActiveTab("mensuales")}
            className={activeTab === "mensuales" ? "active" : ""}
          >
            Datos Mensuales
          </button>
          <button
            onClick={() => setActiveTab("multianuales")}
            className={activeTab === "multianuales" ? "active" : ""}
          >
            Datos Multianuales
          </button>
          <button
            onClick={() => setActiveTab("comparativos")}
            className={activeTab === "comparativos" ? "active" : ""}
          >
            Comparación de Datos
          </button>
        </div>

        {/* Contenido dinámico */}
        <div style={{ marginTop: "2rem" }}>
          {activeTab === "mensuales" && <MensualesView />}
          {activeTab === "multianuales" && <MultianualesView />}
          {activeTab === "comparativos" && <ComparativosView />}
        </div>
      </div>
    </div>
  );
}
