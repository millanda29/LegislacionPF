#!/usr/bin/env python3
"""
Script simple para probar la configuración de email
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def test_config():
    """Prueba la configuración de email"""
    print("=== CONFIGURACIÓN DE EMAIL ===")
    
    # Verificar variables de entorno
    email_host = os.getenv("EMAIL_HOST") or os.getenv("SMTP_HOST", "smtp.gmail.com")
    email_port = int(os.getenv("EMAIL_PORT") or os.getenv("SMTP_PORT", 587))
    email_user = os.getenv("EMAIL_USER") or os.getenv("SMTP_USER")
    email_password = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")
    
    print(f"EMAIL_HOST: {email_host}")
    print(f"EMAIL_PORT: {email_port}")
    print(f"EMAIL_USER: {email_user}")
    print(f"EMAIL_PASSWORD: {'Configurado' if email_password else 'NO CONFIGURADO'}")
    
    if not email_user or not email_password:
        print("\n❌ ERROR: Configuración de email incompleta")
        return False
    
    print("\n✅ Configuración de email encontrada")
    return True

def test_smtp_connection():
    """Prueba la conexión SMTP"""
    print("\n=== PRUEBA DE CONEXIÓN SMTP ===")
    
    import smtplib
    
    email_host = os.getenv("EMAIL_HOST") or os.getenv("SMTP_HOST", "smtp.gmail.com")
    email_port = int(os.getenv("EMAIL_PORT") or os.getenv("SMTP_PORT", 587))
    email_user = os.getenv("EMAIL_USER") or os.getenv("SMTP_USER")
    email_password = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")
    
    try:
        print(f"Conectando a {email_host}:{email_port}...")
        server = smtplib.SMTP(email_host, email_port)
        server.starttls()
        print("✅ Conexión TLS establecida")
        
        print("Intentando login...")
        server.login(email_user, email_password)
        print("✅ Login exitoso")
        
        server.quit()
        print("✅ Conexión SMTP funcionando correctamente")
        return True
        
    except Exception as e:
        print(f"❌ Error en conexión SMTP: {e}")
        return False

if __name__ == "__main__":
    print("Iniciando pruebas de email...\n")
    
    # Probar configuración
    config_ok = test_config()
    
    if config_ok:
        # Probar conexión SMTP
        test_smtp_connection()
    
    print("\n=== FIN DE PRUEBAS ===") 