import { useState } from "react";
import WaterDataExplorer from "../components/WaterDataExplorer";
import WaterPredictor from "../components/WaterPredictor";
import WaterForecast from "../components/WaterForecast";
import WaterCompare from "../components/WaterCompare";

export default function WaterDashboard() {
  const [activeTab, setActiveTab] = useState("data");

  return (
    <div className="page">
      <h1>Gestión de Consumo de Agua</h1>
      <div className="tabs">
        <button
          className={activeTab === "data" ? "active" : ""}
          onClick={() => setActiveTab("data")}
        >
          Datos
        </button>
        <button
          className={activeTab === "predict" ? "active" : ""}
          onClick={() => setActiveTab("predict")}
        >
          Predecir
        </button>
        <button
          className={activeTab === "forecast" ? "active" : ""}
          onClick={() => setActiveTab("forecast")}
        >
          Pronóstico
        </button>
        <button
          className={activeTab === "compare" ? "active" : ""}
          onClick={() => setActiveTab("compare")}
        >
          Comparar
        </button>
      </div>

      <div className="tab-content">
        <div className="card">
          {activeTab === "data" && <WaterDataExplorer />}
          {activeTab === "predict" && <WaterPredictor />}
          {activeTab === "forecast" && <WaterForecast />}
          {activeTab === "compare" && <WaterCompare />}
        </div>
      </div>
    </div>
  );
}
