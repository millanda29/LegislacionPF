import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# Variables de entorno para email (compatibilidad con ambas configuraciones)
EMAIL_HOST = os.getenv("EMAIL_HOST") or os.getenv("SMTP_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT") or os.getenv("SMTP_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER") or os.getenv("SMTP_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")

def enviar_correo_con_adjunto(asunto, cuerpo, ruta_pdf, destinatario):
    try:
        if not EMAIL_USER or not EMAIL_PASSWORD:
            print("Error: Configuración de email incompleta")
            print(f"EMAIL_USER: {EMAIL_USER}")
            print(f"EMAIL_PASSWORD: {'Configurado' if EMAIL_PASSWORD else 'No configurado'}")
            return False
            
        print(f"Enviando email a {destinatario} usando {EMAIL_HOST}:{EMAIL_PORT}")
        
        mensaje = EmailMessage()
        mensaje["From"] = EMAIL_USER
        mensaje["To"] = destinatario
        mensaje["Subject"] = asunto
        mensaje.set_content(cuerpo)

        with open(ruta_pdf, "rb") as f:
            pdf_data = f.read()
        mensaje.add_attachment(pdf_data, maintype="application", subtype="pdf", filename=os.path.basename(ruta_pdf))

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            print("Conectando al servidor SMTP...")
            server.starttls()
            print("TLS iniciado, intentando login...")
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            print("Login exitoso, enviando mensaje...")
            server.send_message(mensaje)
            print("Mensaje enviado exitosamente")
        
        print(f"Email enviado exitosamente a: {destinatario}")
        return True
    except Exception as e:
        print(f"Error al enviar correo: {e}")
        return False
