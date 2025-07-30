from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel
from enum import Enum
from services.interpretacion_service import interpretar_datos_climaticos

# --- FastAPI Router para el endpoint de interpretación ---
router = APIRouter(prefix="/ia", tags=["Interpretación"])

class ModeloIA(str, Enum):
    gemini = "gemini"

class AnalisisClimaticoInput(BaseModel):
    modelo: ModeloIA
    titulo: str
    tipo_dato: str  # ej. "precipitación mensual", "radiación solar", "temperatura"
    datos: list     # lista de dicts, ej. [{"fecha": "2025-01", "valor": 12.5}, ...]

@router.post("/interpretar")
def interpretar_endpoint(input: AnalisisClimaticoInput):
    """
    Endpoint que recibe datos climáticos y devuelve análisis estadístico
    e interpretación natural mediante Gemini.
    """
    try:
        if input.modelo == ModeloIA.gemini:
            interpretacion, analisis = interpretar_datos_climaticos(
                input.titulo, input.tipo_dato, input.datos
            )
        else:
            raise HTTPException(status_code=400, detail="Modelo no soportado")
        
        return {
            "modelo": input.modelo,
            "tipo_dato": input.tipo_dato,
            "analisis_estadistico": analisis,
            "interpretacion": interpretacion,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")
