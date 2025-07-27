from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Directorios de datos
DATA_DIRS = {
    "data": BASE_DIR / "data",
    "data2": BASE_DIR / "data2",
    "data3": BASE_DIR / "data3",
    "data4": BASE_DIR / "data4",
}

# Lista de orígenes permitidos para CORS
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Se puede usar * solo en desarrollo
]
