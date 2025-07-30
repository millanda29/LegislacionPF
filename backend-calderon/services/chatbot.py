import os
import time
from typing import Literal
import re
import pandas as pd
from pathlib import Path
from datetime import datetime

try:
    from openai import OpenAI
    OPENAI_V1 = True
except ImportError:
    import openai
    OPENAI_V1 = False

from huggingface_hub import InferenceClient
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

ZEPHYR_MODEL = "HuggingFaceH4/zephyr-7b-beta"
OPENAI_MODEL = "gpt-4o-mini"
GEMINI_MODEL = "gemini-1.5-flash"

# =========================
# Datos y Modelo de Consumo
# =========================
def _load_consumption_data():
    """Carga los datos de consumo de agua de Calderón"""
    try:
        # Datos mensuales
        monthly_path = Path("data4/Consumo_Lluvia_Poblacion_Calderon_2005_2025.csv")
        monthly_data = pd.read_csv(monthly_path)
        
        # Datos diarios
        daily_path = Path("data4/Consumo_Lluvia_Poblacion_Diario_2005_2024.csv")
        daily_data = pd.read_csv(daily_path, parse_dates=["Fecha"])
        
        return monthly_data, daily_data
    except Exception as e:
        print(f"Error cargando datos de consumo: {e}")
        return None, None

def _load_latest_report():
    """Carga el reporte CSV más reciente generado"""
    try:
        # Buscar reportes CSV en data4
        csv_files = list(Path("data4").glob("reporte_consumo_agua_*.csv"))
        if not csv_files:
            return None
        
        # Obtener el archivo más reciente
        latest_file = max(csv_files, key=lambda x: x.stat().st_mtime)
        report_data = pd.read_csv(latest_file)
        
        return {
            "filename": latest_file.name,
            "data": report_data,
            "created": datetime.fromtimestamp(latest_file.stat().st_ctime).strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        print(f"Error cargando reporte: {e}")
        return None

def _get_consumption_context():
    """Obtiene contexto actual del consumo de agua"""
    try:
        monthly_data, daily_data = _load_consumption_data()
        if monthly_data is None:
            return "No se pudieron cargar los datos de consumo."
        
        # Estadísticas recientes
        latest_year = monthly_data['Anio'].max()
        latest_data = monthly_data[monthly_data['Anio'] == latest_year]
        
        if len(latest_data) == 0:
            return "No hay datos recientes disponibles."
        
        avg_consumption = latest_data['Consumo_m3'].mean()
        total_consumption = latest_data['Consumo_m3'].sum()
        avg_precipitation = latest_data['Precipitacion_mm'].mean()
        population = latest_data['Poblacion'].iloc[0]
        
        # Tendencias
        all_years = monthly_data.groupby('Anio')['Consumo_m3'].sum()
        trend = "creciente" if len(all_years) > 1 and all_years.iloc[-1] > all_years.iloc[-2] else "decreciente"
        
        context = f"""
        Contexto actual del consumo de agua en Calderón:
        - Año más reciente: {latest_year}
        - Consumo promedio mensual: {avg_consumption:.0f} m³
        - Consumo total anual: {total_consumption:.0f} m³
        - Precipitación promedio: {avg_precipitation:.1f} mm
        - Población: {population:,.0f} habitantes
        - Tendencia del consumo: {trend}
        """
        
        # Agregar información del reporte más reciente si existe
        latest_report = _load_latest_report()
        if latest_report:
            report_data = latest_report['data']
            if len(report_data) > 0:
                total_predicted = report_data['consumo_predicho_m3'].sum()
                avg_predicted = report_data['consumo_predicho_m3'].mean()
                context += f"""
        
        Reporte de predicción más reciente ({latest_report['created']}):
        - Consumo total predicho: {total_predicted:.0f} m³
        - Consumo promedio predicho: {avg_predicted:.0f} m³/mes
        - Período de predicción: {len(report_data)} meses
        """
        
        return context
    except Exception as e:
        return f"Error obteniendo contexto: {e}"

def _get_consumption_prediction(months_ahead=6):
    """Obtiene predicciones de consumo futuro"""
    try:
        from services.consumption_service import forecast_future
        
        predictions = forecast_future(months_ahead=months_ahead)
        
        if not predictions:
            return "No se pudieron generar predicciones."
        
        # Resumir predicciones
        total_predicted = sum(p['consumo_predicho'] for p in predictions)
        avg_predicted = total_predicted / len(predictions)
        
        prediction_summary = f"""
        Predicciones de consumo para los próximos {months_ahead} meses:
        - Consumo promedio predicho: {avg_predicted:.0f} m³/mes
        - Consumo total predicho: {total_predicted:.0f} m³
        """
        
        # Agregar detalles por mes
        for pred in predictions[:3]:  # Solo mostrar primeros 3 meses
            prediction_summary += f"\n- {pred['anio']}-{pred['mes']:02d}: {pred['consumo_predicho']:.0f} m³"
        
        if len(predictions) > 3:
            prediction_summary += f"\n- ... y {len(predictions)-3} meses más"
        
        return prediction_summary
    except Exception as e:
        return f"Error generando predicciones: {e}"

def _get_historical_analysis():
    """Obtiene análisis histórico del consumo"""
    try:
        monthly_data, _ = _load_consumption_data()
        if monthly_data is None:
            return "No se pudieron cargar los datos históricos."
        
        # Análisis por décadas
        monthly_data['Decada'] = (monthly_data['Anio'] // 10) * 10
        decade_analysis = monthly_data.groupby('Decada').agg({
            'Consumo_m3': ['mean', 'sum'],
            'Precipitacion_mm': 'mean'
        }).round(0)
        
        # Meses con mayor y menor consumo
        monthly_avg = monthly_data.groupby('Mes').agg({
            'Consumo_m3': 'mean',
            'Precipitacion_mm': 'mean'
        }).round(0)
        
        max_consumption_month = monthly_avg['Consumo_m3'].idxmax()
        min_consumption_month = monthly_avg['Consumo_m3'].idxmin()
        
        analysis = f"""
        Análisis histórico del consumo de agua en Calderón:
        
        Consumo promedio por década:
        """
        
        for decade in decade_analysis.index:
            avg_consumption = decade_analysis.loc[decade, ('Consumo_m3', 'mean')]
            total_consumption = decade_analysis.loc[decade, ('Consumo_m3', 'sum')]
            avg_precip = decade_analysis.loc[decade, ('Precipitacion_mm', 'mean')]
            analysis += f"\n- {decade}s: {avg_consumption:.0f} m³/mes promedio, {total_consumption:.0f} m³ total, {avg_precip:.0f} mm precipitación"
        
        analysis += f"""
        
        Patrones estacionales:
        - Mes con mayor consumo: {max_consumption_month} ({monthly_avg.loc[max_consumption_month, 'Consumo_m3']:.0f} m³)
        - Mes con menor consumo: {min_consumption_month} ({monthly_avg.loc[min_consumption_month, 'Consumo_m3']:.0f} m³)
        """
        
        return analysis
    except Exception as e:
        return f"Error en análisis histórico: {e}"

# =========================
# Utilidades
# =========================
def _ensure_env(var_name: str):
    value = os.getenv(var_name)
    if not value:
        raise RuntimeError(f"Falta la variable de entorno {var_name}. Revísala en tu .env")
    return value

def _log_debug(modelo: str, prompt: str):
    print(f"[DEBUG] Modelo: {modelo} | Pregunta: {prompt[:100]}...")

def _validar_contexto(pregunta: str) -> bool:
    """
    Verifica si la pregunta está dentro del contexto de sequías, recursos hídricos o Calderón.
    """
    keywords = [
        "sequia", "sequía", "precipitacion", "precipitación",
        "lluvia", "hidrico", "hídrico", "agua", "calderon", "calderón",
        "pluviometria", "pluviometría", "radiacion solar", "radiación solar",
        "pronostico", "pronóstico", "clima", "meteorologia", "meteorología",
        "nivel de agua", "consumo", "prediccion", "predicción", "modelo",
        "datos", "estadisticas", "estadísticas", "tendencia", "analisis", "análisis"
    ]
    # Crear regex flexible
    pattern = r"|".join(keywords)
    return bool(re.search(pattern, pregunta.lower()))

def _enrich_prompt_with_context(prompt: str) -> str:
    """Enriquece el prompt con contexto de datos y predicciones"""
    context = _get_consumption_context()
    prediction = _get_consumption_prediction(6)  # 6 meses
    historical = _get_historical_analysis()
    
    enriched_prompt = f"""
    {prompt}

    CONTEXTO DE DATOS ACTUALES:
    {context}

    PREDICCIONES:
    {prediction}

    ANÁLISIS HISTÓRICO:
    {historical}

    Responde basándote en estos datos reales y predicciones del modelo de consumo de agua de Calderón.
    """
    
    return enriched_prompt

# =========================
# OpenAI
# =========================
def generar_respuesta_openai(prompt: str) -> str:
    try:
        if not _validar_contexto(prompt):
            return "Lo siento, no puedo ayudar con esa pregunta porque está fuera del contexto de gestión hídrica en Calderón."

        _ensure_env("OPENAI_API_KEY")
        _log_debug("OpenAI", prompt)
        
        # Enriquecer el prompt con contexto de datos
        enriched_prompt = _enrich_prompt_with_context(prompt)
        
        system_prompt = (
            "Eres un asistente técnico especializado en gestión de sequías y recursos hídricos. "
            "Tienes acceso a datos reales de consumo de agua de Calderón y un modelo de predicción entrenado. "
            "Responde de manera clara, técnica y basada en datos científicos sobre la situación en Calderón. "
            "Siempre responderás en español y usarás los datos proporcionados para dar respuestas precisas."
        )

        if OPENAI_V1:
            client = OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enriched_prompt}
                ],
                temperature=0.3,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
        else:
            openai.api_key = OPENAI_API_KEY
            response = openai.ChatCompletion.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enriched_prompt}
                ],
                temperature=0.3,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error en la API OpenAI: {e}"

# =========================
# Zephyr
# =========================
def generar_respuesta_zephyr(
    prompt: str,
    max_retries: int = 3,
    backoff: float = 2.0,
    max_tokens: int = 500,
    temperature: float = 0.4
) -> str:
    try:
        if not _validar_contexto(prompt):
            return "Lo siento, no puedo ayudar con esa pregunta porque está fuera del contexto de gestión hídrica en Calderón."

        api_key = _ensure_env("HF_API_KEY")
        _log_debug("Zephyr", prompt)
        
        # Enriquecer el prompt con contexto de datos
        enriched_prompt = _enrich_prompt_with_context(prompt)
        
        client = OpenAI(base_url="https://router.huggingface.co/v1", api_key=api_key)

        system_prompt = (
            "Eres un experto asistente técnico en gestión de sequías y recursos hídricos. "
            "Tienes acceso a datos reales de consumo de agua de Calderón y un modelo de predicción entrenado. "
            "Responde con claridad, detalle técnico y base científica, enfocándote en Calderón, Quito, Ecuador. "
            "Siempre responderás en español y usarás los datos proporcionados para dar respuestas precisas."
        )

        for attempt in range(max_retries):
            try:
                completion = client.chat.completions.create(
                    model="HuggingFaceH4/zephyr-7b-beta:featherless-ai",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": enriched_prompt}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return completion.choices[0].message.content.strip()
            except Exception as inner_e:
                msg = str(inner_e).lower()
                if any(err in msg for err in ["503", "rate limit", "timeout"]):
                    if attempt < max_retries - 1:
                        time.sleep(backoff * (attempt + 1))
                        continue
                raise inner_e
        return "No se pudo obtener respuesta de Zephyr tras varios intentos."
    except Exception as e:
        return f"Error en la API Hugging Face: {e}"

# =========================
# Gemini
# =========================
def generar_respuesta_gemini(prompt: str) -> str:
    try:
        if not _validar_contexto(prompt):
            return "Lo siento, no puedo ayudar con esa pregunta porque está fuera del contexto de gestión hídrica en Calderón."

        _ensure_env("GEMINI_API_KEY")
        _log_debug("Gemini", prompt)
        
        # Enriquecer el prompt con contexto de datos
        enriched_prompt = _enrich_prompt_with_context(prompt)
        
        genai.configure(api_key=GEMINI_API_KEY)
        system_prompt = (
            "Eres un experto asistente técnico en gestión de sequías y recursos hídricos. "
            "Tienes acceso a datos reales de consumo de agua de Calderón y un modelo de predicción entrenado. "
            "Responde con claridad, detalle técnico y base científica, enfocado en la situación de Calderón, Quito, Ecuador. "
            "Siempre responderás en español y usarás los datos proporcionados para dar respuestas precisas."
        )
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(
            [
                {"role": "user", "parts": [system_prompt]},
                {"role": "user", "parts": [enriched_prompt]},
            ],
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 500
            }
        )
        return (response.text or "").strip() if hasattr(response, "text") else "Sin respuesta."
    except Exception as e:
        return f"Error en la API Gemini: {e}"


# --- Interpretación de datos con Gemini ---
def interpretar_datos_gemini(titulo: str, resumen: str) -> str:
    try:
        _ensure_env("GEMINI_API_KEY")
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)

        # Obtener contexto adicional para la interpretación
        context = _get_consumption_context()
        prediction = _get_consumption_prediction(3)  # 3 meses para interpretación

        system_prompt = (
            f"Eres un experto en análisis meteorológico y gestión hídrica. "
            f"Tu tarea es interpretar datos climáticos de manera técnica y detallada. "
            f"Responde en español y texto plano, sin formato HTML o Markdown. "
            f"Analiza el siguiente resumen de datos climáticos titulado '{titulo}' "
            "y genera una interpretación técnica en español. "
            "Incluye observaciones clave, tendencias, anomalías y posibles recomendaciones.\n"
            f"CONTEXTO ACTUAL: {context}\n"
            f"PREDICCIONES: {prediction}\n"
            "Resumen:\n" + resumen
        )

        response = model.generate_content(
            [{"role": "user", "parts": [system_prompt]}],
            generation_config={"temperature": 0.3, "max_output_tokens": 500}
        )

        return (response.text or "").strip()

    except Exception as e:
        return f"Error en análisis con Gemini: {e}"


# =========================
# Orquestador
# =========================
def responder_pregunta(pregunta: str, modelo: Literal["openai", "zephyr", "gemini"] = "openai") -> str:
    try:
        modelo = modelo.lower()
        if modelo == "zephyr":
            return generar_respuesta_zephyr(pregunta)
        if modelo == "gemini":
            return generar_respuesta_gemini(pregunta)
        return generar_respuesta_openai(pregunta)
    except Exception as e:
        return f"Error procesando pregunta: {e}"
