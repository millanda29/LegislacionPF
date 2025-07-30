from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Directorios de datos
DATA_DIRS = {
    "data": BASE_DIR / "data",
    "data2": BASE_DIR / "data2",
    "data3": BASE_DIR / "data3",
    "data4": BASE_DIR / "data4",
}

MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

# Lista de orígenes permitidos para CORS
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Se puede usar * solo en desarrollo
]
