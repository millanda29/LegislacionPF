import pandas as pd
import math
import numpy as np
from pathlib import Path
from typing import Optional, List, Tuple, Dict
from joblib import dump, load

from sklearn.pipeline import Pipeline
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Rutas base
DATA_DIR = Path("data4")
MODELS_DIR = Path("models")
CSV_NAME = "Consumo_Lluvia_Poblacion_Diario_2005_2024.csv"
MODEL_PATH = MODELS_DIR / "consumption_hgb.pkl"

# Cargar y transformar datos diarios a agregados mensuales
def _load_raw() -> pd.DataFrame:
    file_path = DATA_DIR / CSV_NAME
    if not file_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo en {file_path}")
    
    df = pd.read_csv(file_path, parse_dates=["Fecha"])
    df.columns = df.columns.str.strip()

    # Crear columnas de año y mes
    df["anio"] = df["Fecha"].dt.year
    df["mes"] = df["Fecha"].dt.month

    # Renombrar columnas para uniformidad
    df.rename(columns={
        "Consumo_m3": "consumo_m3",
        "Precipitacion_mm": "precipitacion_mm",
        "Poblacion": "poblacion"
    }, inplace=True)

    # Agrupar por año y mes para tener datos mensuales
    df_mensual = df.groupby(["anio", "mes"], as_index=False).agg({
        "consumo_m3": "sum",
        "precipitacion_mm": "sum",
        "poblacion": "mean"
    })

    return df_mensual

# Filtro opcional por años y meses
def _apply_filters(
    df: pd.DataFrame,
    year_from: Optional[int],
    year_to: Optional[int],
    months: Optional[List[int]]
) -> pd.DataFrame:
    mask = pd.Series(True, index=df.index)
    if year_from is not None:
        mask &= df["anio"] >= year_from
    if year_to is not None:
        mask &= df["anio"] <= year_to
    if months:
        mask &= df["mes"].isin(months)
    return df.loc[mask].copy()

# API pública para obtener datos filtrados
def get_data(
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    months: Optional[List[int]] = None
) -> pd.DataFrame:
    df = _load_raw()
    return _apply_filters(df, year_from, year_to, months)

# Separar en variables X e Y
def _split_Xy(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    X = df[["anio", "mes", "precipitacion_mm", "poblacion"]].copy()
    y = df["consumo_m3"].copy()
    return X, y

# Construcción del pipeline con HistGradientBoosting
def _build_pipeline_hgb(
    random_state: int = 42,
    n_estimators: int = 100,
    max_depth: Optional[int] = None
) -> Pipeline:
    """
    Construye el pipeline de entrenamiento usando HistGradientBoosting.
    Parámetros opcionales: n_estimators y max_depth.
    """
    model = HistGradientBoostingRegressor(
        random_state=random_state,
        max_iter=n_estimators,  # HistGradientBoosting usa 'max_iter' en lugar de 'n_estimators'
        max_depth=max_depth
    )

    return Pipeline([
        ("regressor", model)
    ])

# Entrenamiento del modelo y guardado en disco
def train_model(
    test_size: float = 0.2,
    random_state: int = 42,
    n_estimators: int = 100,
    max_depth: Optional[int] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    months: Optional[List[int]] = None
) -> Dict:
    from sklearn.model_selection import train_test_split

    df = get_data(year_from, year_to, months)
    if len(df) < 20:
        raise ValueError("Datos insuficientes para entrenar.")

    X, y = _split_Xy(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)

    pipeline = _build_pipeline_hgb(
        random_state=random_state,
        n_estimators=n_estimators,
        max_depth=max_depth
    )
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)

    metrics = {
        "MAE": mean_absolute_error(y_test, y_pred),
        "RMSE": math.sqrt(mean_squared_error(y_test, y_pred)),
        "MAPE": np.mean(np.abs((y_test - y_pred) / y_test)) * 100,
        "R2": r2_score(y_test, y_pred)
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    dump(pipeline, MODEL_PATH)

    return {
        "model_path": str(MODEL_PATH),
        "metrics": metrics,
        "features_used": list(X.columns)
    }


# Cargar modelo desde disco
def _load_model() -> Pipeline:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Modelo no encontrado. Ejecuta primero train_model().")
    return load(MODEL_PATH)

# Realizar predicciones a partir de una lista de diccionarios
def predict(items: List[dict]) -> List[float]:
    model = _load_model()
    df = pd.DataFrame(items)
    return model.predict(df).tolist()

# Comparar predicciones reales vs predichas y calcular métricas
def compare(
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    months: Optional[List[int]] = None
) -> Tuple[pd.DataFrame, Dict[str, float]]:
    df = get_data(year_from, year_to, months)
    model = _load_model()

    X, y = _split_Xy(df)
    y_pred = model.predict(X)

    comp_df = df[["anio", "mes"]].copy()
    comp_df["real"] = y.values
    comp_df["pred"] = y_pred
    comp_df["abs_error"] = (comp_df["real"] - comp_df["pred"]).abs()
    comp_df["ape"] = np.where(comp_df["real"] != 0, comp_df["abs_error"] / comp_df["real"] * 100, np.nan)

    metrics = {
        "MAE": mean_absolute_error(comp_df["real"], comp_df["pred"]),
        "RMSE": math.sqrt(mean_squared_error(comp_df["real"], comp_df["pred"])),
        "MAPE": np.nanmean(comp_df["ape"]),
        "R2": r2_score(comp_df["real"], comp_df["pred"])
    }

    return comp_df, metrics

# Generar características futuras para predicción
def generate_future_features(
    start_year: int,
    start_month: int,
    months_ahead: int,
    poblacion_estimada: Optional[float] = None,
    precipitacion_promedio: Optional[float] = None
) -> pd.DataFrame:
    df_hist = _load_raw()

    if poblacion_estimada is None:
        poblacion_estimada = float(df_hist["poblacion"].iloc[-1])
    if precipitacion_promedio is None:
        precipitacion_promedio = float(df_hist["precipitacion_mm"].mean())

    # Generar una lista de meses futuros
    rows = []
    year, month = start_year, start_month

    for _ in range(months_ahead):
        rows.append({
            "anio": year,
            "mes": month,
            "precipitacion_mm": precipitacion_promedio,
            "poblacion": poblacion_estimada
        })
        month += 1
        if month > 12:
            month = 1
            year += 1

    return pd.DataFrame(rows)

# Generar predicciones para meses futuros
def forecast_future(
    months_ahead: int,
    start_year: Optional[int] = None,
    start_month: Optional[int] = None,
    poblacion_estimada: Optional[float] = None,
    precipitacion_promedio: Optional[float] = None
) -> List[dict]:
    df_hist = _load_raw()
    ultimo_anio = df_hist["anio"].max()
    ultimo_mes = df_hist.loc[df_hist["anio"] == ultimo_anio, "mes"].max()

    # Establecer año y mes de inicio si no se pasan como argumento
    if start_year is None:
        start_year = ultimo_anio
    if start_month is None:
        start_month = ultimo_mes + 1
        if start_month > 12:
            start_month = 1
            start_year += 1

    # Generar los datos y predecir
    df_features = generate_future_features(
        start_year, start_month, months_ahead, poblacion_estimada, precipitacion_promedio
    )

    preds = predict(df_features.to_dict(orient="records"))

    # Combinar con fechas
    return [
        {
            "anio": int(row["anio"]),
            "mes": int(row["mes"]),
            "consumo_predicho": float(preds[i])
        }
        for i, row in df_features.iterrows()
    ]
