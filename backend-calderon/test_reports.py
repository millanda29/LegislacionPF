#!/usr/bin/env python3
"""
Script de prueba para verificar los endpoints de reportes
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"

def test_generate_csv_report():
    """Prueba la generación de reporte CSV"""
    print("=== Probando generación de reporte CSV ===")
    
    url = f"{BASE_URL}/reports/generate/csv"
    data = {
        "months_ahead": 6,
        "start_year": 2025,
        "start_month": 1,
        "poblacion_estimada": 200000,
        "precipitacion_promedio": 50.0
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Reporte CSV generado exitosamente")
            print(f"   Archivo: {result['data']['filename']}")
            print(f"   Registros: {result['data']['total_records']}")
            print(f"   Consumo total: {result['data']['total_consumo_predicho']} m³")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la petición: {e}")
        return False

def test_generate_pdf_report():
    """Prueba la generación de reporte PDF"""
    print("\n=== Probando generación de reporte PDF ===")
    
    url = f"{BASE_URL}/reports/generate/pdf"
    data = {
        "months_ahead": 3,
        "start_year": 2025,
        "start_month": 1,
        "poblacion_estimada": 200000,
        "precipitacion_promedio": 50.0
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Reporte PDF generado exitosamente")
            print(f"   Archivo: {result['data']['filename']}")
            print(f"   Registros: {result['data']['total_records']}")
            print(f"   Consumo total: {result['data']['total_consumo_predicho']} m³")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la petición: {e}")
        return False

def test_get_reports_history():
    """Prueba obtener el historial de reportes"""
    print("\n=== Probando historial de reportes ===")
    
    url = f"{BASE_URL}/reports/history"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            reports = result['data']
            print(f"✅ Historial obtenido: {len(reports)} reportes")
            
            for report in reports[:3]:  # Mostrar solo los primeros 3
                print(f"   - {report['filename']} ({report['type']}) - {report['created']}")
            
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la petición: {e}")
        return False

def test_email_config():
    """Prueba la configuración de email"""
    print("\n=== Probando configuración de email ===")
    
    url = f"{BASE_URL}/reports/test-email-config"
    
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Configuración: {result['status']}")
            print(f"   Mensaje: {result['message']}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la petición: {e}")
        return False

def test_water_forecast():
    """Prueba el endpoint de predicción de agua"""
    print("\n=== Probando endpoint de predicción de agua ===")
    
    url = f"{BASE_URL}/water/forecast"
    data = {
        "months_ahead": 3,
        "start_year": 2025,
        "start_month": 1,
        "poblacion_estimada": 200000,
        "precipitacion_promedio": 50.0
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            rows = result['rows']
            print(f"✅ Predicción generada: {len(rows)} registros")
            
            for row in rows[:2]:  # Mostrar solo los primeros 2
                print(f"   - {row['anio']}-{row['mes']:02d}: {row['consumo_predicho']:.0f} m³")
            
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la petición: {e}")
        return False

def main():
    """Ejecuta todas las pruebas"""
    print("🧪 Iniciando pruebas de endpoints de reportes\n")
    
    tests = [
        test_water_forecast,
        test_generate_csv_report,
        test_generate_pdf_report,
        test_get_reports_history,
        test_email_config
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
        print("🎉 ¡Todas las pruebas pasaron! Los endpoints están funcionando correctamente.")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa los errores arriba.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 