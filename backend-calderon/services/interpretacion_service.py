import statistics
from services.chatbot import interpretar_datos_gemini

# --- Lógica de análisis estadístico de datos climáticos ---
def analizar_datos_climaticos(datos: list):
    """
    Analiza datos climáticos generales (precipitación, temperatura, radiación, etc.):
    - Promedio
    - Máximo
    - Mínimo
    - Tendencia (creciente, decreciente, variable)
    """
    # Extrae valores numéricos válidos
    valores = [
        d['valor'] for d in datos 
        if isinstance(d, dict) and isinstance(d.get('valor'), (int, float))
    ]

    if not valores:
        return {
            "promedio": None,
            "maximo": None,
            "minimo": None,
            "tendencia": "No disponible"
        }

    promedio = round(statistics.mean(valores), 2)
    maximo = max(valores)
    minimo = min(valores)

    # Detecta tendencia simple (orden ascendente o descendente)
    if valores == sorted(valores):
        tendencia = "Creciente"
    elif valores == sorted(valores, reverse=True):
        tendencia = "Decreciente"
    else:
        tendencia = "Variable"

    return {
        "promedio": promedio,
        "maximo": maximo,
        "minimo": minimo,
        "tendencia": tendencia
    }

# --- Preparar el resumen para enviar a Gemini y obtener interpretación ---
def interpretar_datos_climaticos(titulo: str, tipo_dato: str, datos: list):
    """
    Prepara el análisis estadístico y genera la interpretación contextualizada con Gemini.
    """
    analisis_estadistico = analizar_datos_climaticos(datos)

    resumen = (
        f"Título del análisis: {titulo}\n"
        f"Tipo de dato: {tipo_dato}\n"
        f"Datos originales: {datos}\n"
        f"Promedio: {analisis_estadistico['promedio']}\n"
        f"Máximo: {analisis_estadistico['maximo']}\n"
        f"Mínimo: {analisis_estadistico['minimo']}\n"
        f"Tendencia: {analisis_estadistico['tendencia']}\n"
        "Proporciona una interpretación técnica de estos datos considerando su contexto climático."
    )

    # Llamada al servicio Gemini
    interpretacion_resultado = interpretar_datos_gemini(titulo, resumen)

    # Asegurar que la interpretación siempre se devuelve como diccionario
    if isinstance(interpretacion_resultado, str):
        interpretacion_resultado = {"texto": interpretacion_resultado}
    elif not isinstance(interpretacion_resultado, dict):
        interpretacion_resultado = {"error": "Respuesta no reconocida de Gemini"}

    return interpretacion_resultado, analisis_estadistico
