import pandas as pd
import numpy as np
from fastapi.encoders import jsonable_encoder
from urllib.parse import unquote
from core.config import DATA_DIRS
from pathlib import Path

# Mapeo de columnas a nombres completos
STATION_MAP = {
    "C05": "C05-Bellavista",
    "C13": "C13-Salve Faccha",
    "C20": "C20-Calderón",
    "P34": "P34-Papallacta",
    "P37": "P37-Salve Faccha",
    "P53": "P53-Paluguillo",
    "P68": "P68-Salve Faccha alto",
    "M5023": "M5023-Papallacta",
    "M5179": "M5179-Paluguillo",
}

def extract_precipitation_csv(directory: str, filename: str):
    """
    Lee un CSV con datos en filas desde un directorio específico,
    limpia NaN, infinitos y valores inválidos,
    agrupa por año y devuelve un JSON compatible para FastAPI.
    """
    filename = unquote(filename)
    data_dir: Path = DATA_DIRS.get(directory)

    if data_dir is None:
        return {"error": f"Directorio '{directory}' no configurado."}

    file_path = data_dir / filename
    if not file_path.exists():
        return {"error": f"Archivo {filename} no encontrado en '{directory}'."}

    try:
        df = pd.read_csv(file_path, na_values=["", " ", "NaN", "nan", "--"])

        expected_cols = ["fecha", "valor", "completo_mediciones", "completo_umbral"]
        if not all(col in df.columns for col in expected_cols):
            return {"error": f"El archivo {filename} no tiene las columnas requeridas: {expected_cols}"}

        df = df[expected_cols]

        # Convertir 'fecha' a datetime
        df['fecha'] = pd.to_datetime(df['fecha'], format='%Y/%m/%d', errors='coerce')
        if df['fecha'].isnull().all():
            return {"error": "Las fechas no tienen el formato esperado (YYYY/MM/DD)."}

        # Extraer el año
        df['anio'] = df['fecha'].dt.year

        # Función para limpiar cada valor
        def clean_value(val):
            if pd.isna(val) or val in [np.inf, -np.inf]:
                return None
            return float(val) if isinstance(val, (int, float, np.number)) else val

        # Convertir a lista de dicts, limpiando valores
        records = []
        for _, row in df.iterrows():
            record = {
                "fecha": row["fecha"].strftime("%Y/%m/%d"),
                "valor": clean_value(row["valor"]),
                "completo_mediciones": clean_value(row["completo_mediciones"]),
                "completo_umbral": clean_value(row["completo_umbral"]),
            }
            anio = row["anio"]
            records.append((anio, record))

        # Agrupar por año
        data_by_year = {}
        for anio, record in records:
            data_by_year.setdefault(anio, []).append(record)

        return {"filename": filename, "directory": directory, "data": data_by_year}

    except Exception as e:
        return {"error": f"No se pudo leer el archivo: {str(e)}"}


def extract_data3_csv(filename: str):
    """
    Lee un archivo CSV dentro de data3 (ej. Precipitación_Mensual__C05_...)
    y mapea automáticamente los nombres de columnas usando STATION_MAP.
    """
    filename = unquote(filename)
    data_dir: Path = DATA_DIRS.get("data3")

    if data_dir is None:
        return {"error": "Directorio 'data3' no configurado."}

    file_path = data_dir / filename
    if not file_path.exists():
        return {"error": f"Archivo {filename} no encontrado en data3."}

    try:
        df = pd.read_csv(file_path, na_values=["", " ", "NaN", "nan", "--"])
        df.replace([np.inf, -np.inf], np.nan, inplace=True)

        # Renombrar estaciones usando STATION_MAP si existe el mapeo
        renamed_cols = {
            col: STATION_MAP[col] if col in STATION_MAP else col
            for col in df.columns
        }
        df.rename(columns=renamed_cols, inplace=True)

        # Convertir NaN a None
        df = df.where(pd.notnull(df), None)

        data_dict = df.to_dict(orient="list")

        def clean_value(val):
            if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
                return None
            return val

        for key in data_dict:
            data_dict[key] = [clean_value(v) for v in data_dict[key]]

        return {"filename": filename, "directory": "data3", "data": jsonable_encoder(data_dict)}

    except Exception as e:
        return {"error": f"No se pudo leer el archivo CSV de data3: {str(e)}"}


def extract_precipitation_xlsx(directory: str, filename: str):
    """
    Lee un XLSX con datos mensuales, detecta la fila de encabezados 
    (AÑO, ENE, FEB, ..., DIC), limpia filas no numéricas (como PROM, MAX, MIN)
    y devuelve el contenido en formato JSON.
    """
    filename = unquote(filename)
    file_path = DATA_DIRS.get(directory) / filename

    if not file_path.exists():
        return {"error": f"Archivo {filename} no encontrado en {directory}."}

    try:
        df_raw = pd.read_excel(file_path, header=None)

        header_row = None
        for i, row in df_raw.iterrows():
            if "AÑO" in row.values:
                header_row = i
                break

        if header_row is None:
            return {"error": "No se encontró la fila con los encabezados (AÑO, ENE, ... DIC)"}

        df = pd.read_excel(file_path, header=header_row)

        expected_cols = ["AÑO", "ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
        missing = [col for col in expected_cols if col not in df.columns]
        if missing:
            return {"error": f"Faltan columnas en el archivo: {missing}"}

        df = df[expected_cols]
        df = df.replace({',': '.'}, regex=True)
        df = df[df["AÑO"].apply(lambda x: str(x).isdigit())]
        df["AÑO"] = df["AÑO"].astype(int)
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df = df.where(pd.notnull(df), None)

        data_dict = df.to_dict(orient='list')

        def clean_value(val):
            if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
                return None
            return val

        for key in data_dict:
            data_dict[key] = [clean_value(v) for v in data_dict[key]]

        return {"filename": filename, "data": jsonable_encoder(data_dict)}

    except Exception as e:
        return {"error": f"No se pudo leer el archivo XLSX: {str(e)}"}
