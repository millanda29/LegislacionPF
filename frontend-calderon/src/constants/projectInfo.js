// src/constants/projectInfo.js
export const projectInfo = {
  university: "Universidad Central del Ecuador",
  faculty: "Facultad de Ingeniería y Ciencias Aplicadas",
  career: "Sistemas de Información",
  course: "Legislación Informática",
  teacher: "Docente: ROBERT ARTURO ENRIQUEZ REYES", // <-- completa
  period: "Período académico: 2025 - 2025", // <-- completa
  deliveryDate: "Fecha de entrega: 28 de junio de 2025", // <-- completa

  project: {
    title:
      "Predicción de Precipitación y Disponibilidad de Agua para Calderón usando Series Temporales Multivariantes",
    shortName: "Predicción de Precipitación - Calderón",
    description:
      "El proyecto propone un sistema de predicción de precipitación y disponibilidad de agua para la parroquia Calderón, utilizando modelos de series temporales multivariantes y métricas de evaluación robustas."
  },

  objectives: {
    general:
      "Predecir la precipitación y la disponibilidad de agua en Calderón utilizando modelos de series temporales multivariantes para apoyar la toma de decisiones en la gestión hídrica.",
    specifics: [
      "Realizar el procesamiento, limpieza y análisis exploratorio de los datos climáticos e hídricos.",
      "Construir y comparar modelos de series temporales (VAR, LSTM multivariante, Prophet y/o SARIMAX).",
      "Evaluar el desempeño de los modelos mediante métricas como RMSE, MAE y MAPE.",
      "Desplegar un frontend interactivo para visualizar predicciones y datos históricos.",
      "Documentar los aspectos legales y de licenciamiento de los datos utilizados."
    ]
  },

  dataset: {
    sources: [
      "INAMHI (precipitación histórica)",
      "ERA5 / ECMWF (reanálisis climático)",
      "SENAGUA / ARCA (disponibilidad de agua — si aplica)",
      "Estaciones meteorológicas locales (si las hubiera)"
    ],
    temporalRange: "____-____ (completa el rango temporal)",
    frequency: "Diaria / Horaria (indicar la frecuencia real)",
    variables: [
      "Precipitación (mm)",
      "Temperatura (°C)",
      "Humedad relativa (%)",
      "Caudal / Disponibilidad (m³/s o m³)",
      "Presión atmosférica (hPa)",
      "Velocidad del viento (m/s)"
    ],
    notes:
      "Asegurarse de cumplir con las licencias y términos de uso de las fuentes de datos."
  },

  methodology: {
    steps: [
      "Ingesta y consolidación de fuentes de datos.",
      "Limpieza de datos: outliers, valores perdidos, resampleo y sincronización temporal.",
      "Análisis Exploratorio de Datos (EDA) y selección de variables.",
      "Ingeniería de características (lags, rolling, differencing, normalización).",
      "Partición Train/Validation/Test preservando la estructura temporal.",
      "Entrenamiento y comparación de modelos multivariantes.",
      "Evaluación con RMSE, MAE, MAPE, R² (si aplica) y validación tipo time-series split.",
      "Despliegue del servicio (API) y front de visualización.",
      "Documentación legal (fuentes, licencias, derechos de uso de datos y código)."
    ],
    candidateModels: ["VAR / VARMAX", "SARIMAX", "Prophet (aditivo) - multivariante indirecto", "LSTM/GRU multivariante", "XGBoost/LightGBM con ventanas temporales"],
    metrics: ["RMSE", "MAE", "MAPE", "R² (opcional)", "sMAPE"]
  },

  stack: {
    frontend: ["React + Vite", "React Router DOM", "Recharts / Chart.js / ECharts (visualización)"],
    backend: ["FastAPI / Flask / Node.js (a definir)", "Uvicorn / Gunicorn (deploy)"],
    ml: ["Python", "pandas", "numpy", "scikit-learn", "statsmodels", "prophet", "pytorch / tensorflow (si LSTM)"],
    devops: ["Docker (opcional)", "CI/CD (GitHub Actions/GitLab CI)"]
  },

  architecture: [
    "Frontend React (Vite) para visualización de dashboards de predicción y datos históricos.",
    "API REST para servir predicciones y resultados de los modelos.",
    "Módulo de entrenamiento offline (jobs periódicos) para recalibrar modelos.",
    "Almacenamiento (PostgreSQL/TimescaleDB/InfluxDB/Parquet en S3) para series temporales."
  ],

  routes: [
    { path: "/", label: "Inicio" },
    { path: "/forecast", label: "Predicción" },
    { path: "/data", label: "Datos Históricos" },
    { path: "/about", label: "Acerca" },
    { path: "/team", label: "Equipo" },
    { path: "/contact", label: "Contacto" }
  ],

  team: [
    "Karen Milene Amaguaña Cangás",
    "Carlos Daniel Hernandez Cabeza",
    "Bryan Alejandro Lara Izurieta",
    "Maikol Isaac Llanda Huatatoca"
  ],

  legal: {
    licenseCode: "MIT / Apache-2.0 / GPL-3.0 (definir)",
    dataLicense: "Según cada fuente (INAMHI, ERA5, etc.)",
    notes:
      "Verificar compatibilidad entre la licencia del código y las licencias de los datasets. Incluir avisos y atribuciones requeridas."
  },

  contact: {
    emails: [
      "kmamaguana@uce.edu.ec",
      "cdhernandezc@uce.edu.ec",
      "balarai@uce.edu.ec",
      "millanda@uce.edu.ec"
    ],
    github: "https://github.com/<org>/<repo>", // opcional
    site: ""
  }
};
