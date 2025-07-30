from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from models.water_models import (
    TrainRequest, TrainResponse,
    PredictRequest, PredictResponse,
    CompareRequest, CompareResponse, CompareRow,
    DataResponse,
    ForecastRequest, ForecastResponse, ForecastRow
)
from services import consumption_service as svc

router = APIRouter(prefix="/water", tags=["Water-Consumption"])

# --------------------
# Leer datos crudos / filtrados
# --------------------
@router.get("/data", response_model=DataResponse)
def read_data(
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    months: Optional[List[int]] = Query(default=None)
):
    try:
        df = svc.get_data(year_from, year_to, months)
        return DataResponse(rows=df.to_dict(orient="records"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------
# Entrenar modelo
# --------------------
@router.post("/train", response_model=TrainResponse)
def train(req: TrainRequest):
    try:
        out = svc.train_model(
            test_size=req.test_size,
            random_state=req.random_state,
            n_estimators=req.n_estimators,
            max_depth=req.max_depth,
            year_from=req.year_from,
            year_to=req.year_to,
            months=req.months,
        )
        return TrainResponse(
            model_path=out["model_path"],
            metrics=out["metrics"],
            features_used=out["features_used"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------
# Predecir con nuevos datos
# --------------------
@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        items = [i.dict() for i in req.items]
        preds = svc.predict(items)
        return PredictResponse(predictions=preds)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------
# Comparar real vs predicción
# --------------------
@router.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest):
    try:
        comp, metrics = svc.compare(
            year_from=req.year_from,
            year_to=req.year_to,
            months=req.months
        )
        rows = [
            CompareRow(
                anio=int(r["anio"]),
                mes=int(r["mes"]),
                real=float(r["real"]),
                pred=float(r["pred"]),
                abs_error=float(r["abs_error"]),
                ape=(float(r["ape"]) if r["ape"] == r["ape"] else None)  # NaN -> None
            )
            for _, r in comp.iterrows()
        ]
        return CompareResponse(rows=rows, metrics=metrics)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------
# Pronóstico futuro para n meses
# --------------------
@router.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    """
    Realiza pronóstico de consumo para los próximos meses indicados.
    """
    try:
        results = svc.forecast_future(
            months_ahead=req.months_ahead,
            start_year=req.start_year,
            start_month=req.start_month,
            poblacion_estimada=req.poblacion_estimada,
            precipitacion_promedio=req.precipitacion_promedio
        )
        rows = [
            ForecastRow(
                anio=r["anio"],
                mes=r["mes"],
                consumo_predicho=r["consumo_predicho"]
            ) for r in results
        ]
        return ForecastResponse(rows=rows)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
