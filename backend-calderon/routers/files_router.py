from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from services.files_service import list_files_service, get_file_path

router = APIRouter(prefix="/files", tags=["Files"])

@router.get("/{directory}")
def list_files(directory: str):
    """
    Lista los archivos dentro de un directorio específico (data, data2, etc.).
    """
    result = list_files_service(directory)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/download/{directory}/{filename}")
def download_file(directory: str, filename: str):
    """
    Descarga un archivo específico desde el directorio indicado.
    """
    file_path = get_file_path(directory, filename)
    if not file_path:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)
