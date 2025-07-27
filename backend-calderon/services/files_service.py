from pathlib import Path
from core.config import DATA_DIRS

def list_files_service(directory: str):
    """
    Lista archivos de un directorio de datos (data, data2, etc.).
    """
    data_dir = DATA_DIRS.get(directory)
    if not data_dir:
        return {"error": f"Directorio '{directory}' no está configurado."}

    if not data_dir.exists():
        return {"error": f"El directorio '{directory}' no existe."}

    files = [file.name for file in data_dir.iterdir() if file.is_file()]
    return {"files": files}


def get_file_path(directory: str, filename: str) -> Path | None:
    """
    Devuelve la ruta completa de un archivo en el directorio indicado.
    """
    data_dir = DATA_DIRS.get(directory)
    if not data_dir:
        return None

    file_path = data_dir / filename
    return file_path if file_path.exists() else None
