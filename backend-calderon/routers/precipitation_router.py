from fastapi import APIRouter, HTTPException
from services.precipitation_service import (
    extract_precipitation_csv,
    extract_precipitation_xlsx,
    extract_data3_csv
)

router = APIRouter(prefix="/precipitation", tags=["Precipitation"])


@router.get("/csv/{directory}/{filename}")
def get_precipitation_csv(directory: str, filename: str):
    """
    Endpoint para extraer datos de precipitación desde un archivo CSV.
    """
    result = extract_precipitation_csv(directory, filename)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/xlsx/{directory}/{filename}")
def get_precipitation_xlsx(directory: str, filename: str):
    """
    Endpoint para extraer datos de precipitación desde un archivo XLSX (tabla mensual-multianual).
    """
    result = extract_precipitation_xlsx(directory, filename)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/data3/{filename}")
def get_data3_file(filename: str):
    """
    Endpoint para extraer datos de archivos en data3 (precipitación, radiación solar, etc.)
    """
    result = extract_data3_csv(filename)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
