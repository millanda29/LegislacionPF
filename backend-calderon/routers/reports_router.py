from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from pathlib import Path

from services.report_service import (
    generate_csv_report,
    generate_pdf_report,
    send_email_with_pdf,
    get_report_history
)

router = APIRouter(prefix="/reports", tags=["Reports"])

class ForecastRequest(BaseModel):
    months_ahead: int
    start_year: Optional[int] = None
    start_month: Optional[int] = None
    poblacion_estimada: Optional[float] = None
    precipitacion_promedio: Optional[float] = None

class EmailRequest(BaseModel):
    email_to: EmailStr
    subject: str = "Reporte de Predicción de Consumo de Agua"
    body: str = "Adjunto encontrará el reporte de predicción de consumo de agua generado por nuestro modelo."

@router.post("/generate/csv")
async def generate_csv_report_endpoint(request: ForecastRequest):
    """
    Genera un reporte CSV con las predicciones de consumo de agua
    """
    try:
        result = generate_csv_report(
            months_ahead=request.months_ahead,
            start_year=request.start_year,
            start_month=request.start_month,
            poblacion_estimada=request.poblacion_estimada,
            precipitacion_promedio=request.precipitacion_promedio
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "message": "Reporte CSV generado exitosamente",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte CSV: {str(e)}")

@router.post("/generate/pdf")
async def generate_pdf_report_endpoint(request: ForecastRequest):
    """
    Genera un reporte PDF con las predicciones de consumo de agua
    """
    try:
        result = generate_pdf_report(
            months_ahead=request.months_ahead,
            start_year=request.start_year,
            start_month=request.start_month,
            poblacion_estimada=request.poblacion_estimada,
            precipitacion_promedio=request.precipitacion_promedio
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "message": "Reporte PDF generado exitosamente",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte PDF: {str(e)}")

@router.post("/generate/pdf-and-email")
async def generate_pdf_and_send_email(
    forecast_request: ForecastRequest,
    email_request: EmailRequest,
    background_tasks: BackgroundTasks
):
    """
    Genera un reporte PDF y lo envía por email
    """
    try:
        # Generar PDF
        pdf_result = generate_pdf_report(
            months_ahead=forecast_request.months_ahead,
            start_year=forecast_request.start_year,
            start_month=forecast_request.start_month,
            poblacion_estimada=forecast_request.poblacion_estimada,
            precipitacion_promedio=forecast_request.precipitacion_promedio
        )
        
        if "error" in pdf_result:
            raise HTTPException(status_code=400, detail=pdf_result["error"])
        
        # Enviar email en background
        def send_email_task():
            email_result = send_email_with_pdf(
                email_to=email_request.email_to,
                subject=email_request.subject,
                body=email_request.body,
                pdf_filepath=pdf_result["filepath"]
            )
            return email_result
        
        background_tasks.add_task(send_email_task)
        
        return {
            "message": "Reporte PDF generado y email enviado exitosamente",
            "data": {
                "pdf_report": pdf_result,
                "email_sent_to": email_request.email_to
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el proceso: {str(e)}")

@router.get("/download/csv/{filename}")
async def download_csv_report(filename: str):
    """
    Descarga un reporte CSV específico
    """
    try:
        file_path = Path("data4") / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
        if not filename.startswith("reporte_consumo_agua_"):
            raise HTTPException(status_code=400, detail="Archivo no válido")
        
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="text/csv"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error descargando archivo: {str(e)}")

@router.get("/download/pdf/{filename}")
async def download_pdf_report(filename: str):
    """
    Descarga un reporte PDF específico
    """
    try:
        file_path = Path("reports") / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
        if not filename.startswith("reporte_consumo_agua_"):
            raise HTTPException(status_code=400, detail="Archivo no válido")
        
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error descargando archivo: {str(e)}")

@router.get("/history")
async def get_reports_history():
    """
    Obtiene el historial de reportes generados
    """
    try:
        reports = get_report_history()
        return {
            "message": "Historial de reportes obtenido exitosamente",
            "data": reports
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial: {str(e)}")

@router.get("/history/csv")
async def get_csv_reports_history():
    """
    Obtiene solo el historial de reportes CSV
    """
    try:
        all_reports = get_report_history()
        csv_reports = [report for report in all_reports if report.get("type") == "CSV"]
        
        return {
            "message": "Historial de reportes CSV obtenido exitosamente",
            "data": csv_reports
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial CSV: {str(e)}")

@router.get("/history/pdf")
async def get_pdf_reports_history():
    """
    Obtiene solo el historial de reportes PDF
    """
    try:
        all_reports = get_report_history()
        pdf_reports = [report for report in all_reports if report.get("type") == "PDF"]
        
        return {
            "message": "Historial de reportes PDF obtenido exitosamente",
            "data": pdf_reports
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial PDF: {str(e)}")

@router.post("/test-email-config")
async def test_email_configuration():
    """
    Prueba la configuración de email
    """
    try:
        email_user = os.getenv("EMAIL_USER") or os.getenv("SMTP_USER")
        email_password = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")
        email_host = os.getenv("EMAIL_HOST") or os.getenv("SMTP_HOST", "smtp.gmail.com")
        email_port = int(os.getenv("EMAIL_PORT") or os.getenv("SMTP_PORT", 587))
        
        if not email_user or not email_password:
            return {
                "status": "error",
                "message": "Configuración de email incompleta",
                "details": {
                    "EMAIL_USER": "Configurado" if email_user else "No configurado",
                    "EMAIL_PASSWORD": "Configurado" if email_password else "No configurado",
                    "EMAIL_HOST": email_host,
                    "EMAIL_PORT": email_port
                }
            }
        
        return {
            "status": "success",
            "message": "Configuración de email válida",
            "details": {
                "EMAIL_USER": email_user,
                "EMAIL_HOST": email_host,
                "EMAIL_PORT": email_port
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verificando configuración: {str(e)}") 