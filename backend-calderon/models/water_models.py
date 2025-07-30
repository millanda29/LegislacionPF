from pydantic import BaseModel, Field, conint, confloat
from typing import List, Optional, Dict

# ==== ENTRENAMIENTO ====

class TrainRequest(BaseModel):
    test_size: confloat(ge=0.07, le=0.3) = 0.2
    random_state: int = 42
    n_estimators: int = 400
    max_depth: Optional[int] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    months: Optional[List[conint(ge=1, le=12)]] = None

class TrainResponse(BaseModel):
    model_path: str
    metrics: Dict[str, float]
    features_used: List[str]

# ==== PREDICCIÓN ====

class PredictItem(BaseModel):
    anio: int
    mes: conint(ge=1, le=12)
    precipitacion_mm: float
    poblacion: float

class PredictRequest(BaseModel):
    items: List[PredictItem]

class PredictResponse(BaseModel):
    predictions: List[float]

# ==== COMPARACIÓN ====

class CompareRequest(BaseModel):
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    months: Optional[List[conint(ge=1, le=12)]] = None

class CompareRow(BaseModel):
    anio: int
    mes: int
    real: float
    pred: float
    abs_error: float
    ape: Optional[float]

class CompareResponse(BaseModel):
    rows: List[CompareRow]
    metrics: Dict[str, float]

# ==== DATOS BRUTOS ====

class DataResponse(BaseModel):
    rows: List[dict]

# ==== FORECAST MENSUAL ====

class ForecastRequest(BaseModel):
    months_ahead: conint(ge=1) = Field(..., description="Cantidad de meses a pronosticar")
    start_year: Optional[int] = Field(None, description="Año inicial del pronóstico")
    start_month: Optional[conint(ge=1, le=12)] = Field(None, description="Mes inicial del pronóstico")
    poblacion_estimada: Optional[float] = Field(None, description="Valor estimado constante de población futura")
    precipitacion_promedio: Optional[float] = Field(None, description="Valor estimado constante de precipitación futura")

class ForecastRow(BaseModel):
    anio: int
    mes: int
    consumo_predicho: float

class ForecastResponse(BaseModel):
    rows: List[ForecastRow]

# ==== OPCIONAL: MODELOS DIARIOS (para uso futuro) ====

class PredictItemDia(BaseModel):
    anio: int
    mes: conint(ge=1, le=12)
    dia: conint(ge=1, le=31)
    precipitacion_mm: float
    poblacion: float

class CompareRowDia(BaseModel):
    anio: int
    mes: int
    dia: int
    real: float
    pred: float
    abs_error: float
