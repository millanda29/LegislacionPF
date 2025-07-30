#!/usr/bin/env python3
"""
Script de prueba para verificar la integración del chatbot con el modelo de predicción
"""

import sys
import os
from pathlib import Path

# Agregar el directorio actual al path para importar módulos
sys.path.append(str(Path(__file__).parent))

def test_data_loading():
    """Prueba la carga de datos de consumo"""
    print("=== Probando carga de datos ===")
    try:
        from services.chatbot import _load_consumption_data, _get_consumption_context
        
        monthly_data, daily_data = _load_consumption_data()
        
        if monthly_data is not None and daily_data is not None:
            print(f"✅ Datos mensuales cargados: {len(monthly_data)} registros")
            print(f"✅ Datos diarios cargados: {len(daily_data)} registros")
            print(f"   Rango de años: {monthly_data['Anio'].min()} - {monthly_data['Anio'].max()}")
        else:
            print("❌ Error cargando datos")
            return False
            
        # Probar contexto
        context = _get_consumption_context()
        print(f"✅ Contexto generado: {len(context)} caracteres")
        print(f"   Contexto: {context[:200]}...")
        
        return True
    except Exception as e:
        print(f"❌ Error en prueba de datos: {e}")
        return False

def test_prediction_integration():
    """Prueba la integración con el modelo de predicción"""
    print("\n=== Probando integración con modelo ===")
    try:
        from services.chatbot import _get_consumption_prediction
        
        prediction = _get_consumption_prediction(3)  # 3 meses
        print(f"✅ Predicción generada: {len(prediction)} caracteres")
        print(f"   Predicción: {prediction[:200]}...")
        
        return True
    except Exception as e:
        print(f"❌ Error en prueba de predicción: {e}")
        return False

def test_historical_analysis():
    """Prueba el análisis histórico"""
    print("\n=== Probando análisis histórico ===")
    try:
        from services.chatbot import _get_historical_analysis
        
        analysis = _get_historical_analysis()
        print(f"✅ Análisis histórico generado: {len(analysis)} caracteres")
        print(f"   Análisis: {analysis[:200]}...")
        
        return True
    except Exception as e:
        print(f"❌ Error en análisis histórico: {e}")
        return False

def test_prompt_enrichment():
    """Prueba el enriquecimiento de prompts"""
    print("\n=== Probando enriquecimiento de prompts ===")
    try:
        from services.chatbot import _enrich_prompt_with_context
        
        test_prompt = "¿Cuál es el consumo de agua actual en Calderón?"
        enriched = _enrich_prompt_with_context(test_prompt)
        
        print(f"✅ Prompt enriquecido: {len(enriched)} caracteres")
        print(f"   Prompt original: {test_prompt}")
        print(f"   Prompt enriquecido: {enriched[:300]}...")
        
        return True
    except Exception as e:
        print(f"❌ Error en enriquecimiento: {e}")
        return False

def test_chatbot_response():
    """Prueba una respuesta del chatbot"""
    print("\n=== Probando respuesta del chatbot ===")
    try:
        from services.chatbot import responder_pregunta
        
        # Solo probar si hay variables de entorno configuradas
        if not os.getenv("OPENAI_API_KEY") and not os.getenv("HF_API_KEY") and not os.getenv("GEMINI_API_KEY"):
            print("⚠️  No hay APIs configuradas, saltando prueba de respuesta")
            return True
        
        test_question = "¿Cuál es el consumo promedio de agua en Calderón?"
        response = responder_pregunta(test_question, modelo="openai")
        
        print(f"✅ Respuesta generada: {len(response)} caracteres")
        print(f"   Pregunta: {test_question}")
        print(f"   Respuesta: {response[:300]}...")
        
        return True
    except Exception as e:
        print(f"❌ Error en respuesta del chatbot: {e}")
        return False

def main():
    """Ejecuta todas las pruebas"""
    print("🧪 Iniciando pruebas de integración del chatbot con modelo de predicción\n")
    
    tests = [
        test_data_loading,
        test_prediction_integration,
        test_historical_analysis,
        test_prompt_enrichment,
        test_chatbot_response
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Error ejecutando {test.__name__}: {e}")
    
    print(f"\n📊 Resultados: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas pasaron! La integración está funcionando correctamente.")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa los errores arriba.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 