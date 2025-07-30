#!/usr/bin/env python3
"""
Script de prueba para verificar la configuración de email
"""

import os
from dotenv import load_dotenv
from core.config_mail import enviar_correo_con_adjunto

# Cargar variables de entorno
load_dotenv()

def test_email_config():
    """Prueba la configuración de email"""
    print("=== PRUEBA DE CONFIGURACIÓN DE EMAIL ===")
    
    # Verificar variables de entorno
    email_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    email_port = int(os.getenv("EMAIL_PORT", 587))
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    print(f"EMAIL_HOST: {email_host}")
    print(f"EMAIL_PORT: {email_port}")
    print(f"EMAIL_USER: {'Configurado' if email_user else 'NO CONFIGURADO'}")
    print(f"EMAIL_PASSWORD: {'Configurado' if email_password else 'NO CONFIGURADO'}")
    
    if not email_user or not email_password:
        print("\n❌ ERROR: Configuración de email incompleta")
        print("Asegúrate de configurar EMAIL_USER y EMAIL_PASSWORD en el archivo .env")
        return False
    
    print("\n✅ Configuración de email encontrada")
    return True

def test_email_send():
    """Prueba el envío de email"""
    print("\n=== PRUEBA DE ENVÍO DE EMAIL ===")
    
    # Crear un archivo de prueba
    test_file = "test_email.txt"
    with open(test_file, "w") as f:
        f.write("Este es un archivo de prueba para verificar el envío de emails.")
    
    try:
        # Intentar enviar email de prueba
        success = enviar_correo_con_adjunto(
            asunto="Prueba de Email - Sistema de Reportes",
            cuerpo="Este es un email de prueba para verificar que la configuración de email funciona correctamente.",
            ruta_pdf=test_file,
            destinatario="test@example.com"  # Cambiar por un email real para probar
        )
        
        if success:
            print("✅ Email enviado exitosamente")
        else:
            print("❌ Error al enviar email")
            
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
    
    finally:
        # Limpiar archivo de prueba
        if os.path.exists(test_file):
            os.remove(test_file)

def test_smtp_connection():
    """Prueba la conexión SMTP"""
    print("\n=== PRUEBA DE CONEXIÓN SMTP ===")
    
    import smtplib
    
    email_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    email_port = int(os.getenv("EMAIL_PORT", 587))
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
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
    config_ok = test_email_config()
    
    if config_ok:
        # Probar conexión SMTP
        smtp_ok = test_smtp_connection()
        
        if smtp_ok:
            # Probar envío (solo si se proporciona un email real)
            print("\nPara probar el envío real, modifica el email en test_email_send()")
            # test_email_send()
    
    print("\n=== FIN DE PRUEBAS ===") 