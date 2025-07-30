import os
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# ReportLab imports
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER

# Importar función de email
from core.config_mail import enviar_correo_con_adjunto

# Importar servicio de consumo
from services.consumption_service import forecast_future

# Configuración de directorios
DATA_DIR = Path("data4")
REPORTS_DIR = Path("reports")

# Crear directorio de reportes si no existe
REPORTS_DIR.mkdir(exist_ok=True)

# Configuración de email desde variables de entorno (compatibilidad con ambas configuraciones)
EMAIL_HOST = os.getenv("EMAIL_HOST") or os.getenv("SMTP_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT") or os.getenv("SMTP_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER") or os.getenv("SMTP_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")

def generate_csv_report(
    months_ahead: int,
    start_year: Optional[int] = None,
    start_month: Optional[int] = None,
    poblacion_estimada: Optional[float] = None,
    precipitacion_promedio: Optional[float] = None
) -> Dict:
    """
    Genera un reporte CSV con las predicciones de consumo de agua
    """
    try:
        # Obtener predicciones
        predictions = forecast_future(
            months_ahead=months_ahead,
            start_year=start_year,
            start_month=start_month,
            poblacion_estimada=poblacion_estimada,
            precipitacion_promedio=precipitacion_promedio
        )
        
        if not predictions:
            return {"error": "No se pudieron generar predicciones"}
        
        # Crear DataFrame
        df = pd.DataFrame(predictions)
        df['fecha'] = pd.to_datetime(df['anio'].astype(str) + '-' + df['mes'].astype(str) + '-01')
        df['mes_nombre'] = df['fecha'].dt.strftime('%B')
        df['consumo_predicho_m3'] = df['consumo_predicho'].round(2)
        
        # Generar nombre de archivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"reporte_consumo_agua_{timestamp}.csv"
        filepath = DATA_DIR / filename
        
        # Guardar CSV
        df[['anio', 'mes', 'mes_nombre', 'fecha', 'consumo_predicho_m3']].to_csv(filepath, index=False)
        
        # Calcular estadísticas
        total_consumo = df['consumo_predicho_m3'].sum()
        promedio_consumo = df['consumo_predicho_m3'].mean()
        
        return {
            "success": True,
            "filename": filename,
            "filepath": str(filepath),
            "total_records": len(df),
            "total_consumo_predicho": round(total_consumo, 2),
            "promedio_consumo_predicho": round(promedio_consumo, 2),
            "periodo": f"{df['anio'].min()}-{df['mes'].min():02d} a {df['anio'].max()}-{df['mes'].max():02d}",
            "data": df.to_dict('records')
        }
        
    except Exception as e:
        return {"error": f"Error generando reporte CSV: {str(e)}"}

def generate_pdf_report(
    months_ahead: int,
    start_year: Optional[int] = None,
    start_month: Optional[int] = None,
    poblacion_estimada: Optional[float] = None,
    precipitacion_promedio: Optional[float] = None
) -> Dict:
    """
    Genera un reporte PDF con las predicciones de consumo de agua
    """
    try:
        # Obtener predicciones
        predictions = forecast_future(
            months_ahead=months_ahead,
            start_year=start_year,
            start_month=start_month,
            poblacion_estimada=poblacion_estimada,
            precipitacion_promedio=precipitacion_promedio
        )
        
        if not predictions:
            return {"error": "No se pudieron generar predicciones"}
        
        # Crear DataFrame
        df = pd.DataFrame(predictions)
        df['fecha'] = pd.to_datetime(df['anio'].astype(str) + '-' + df['mes'].astype(str) + '-01')
        df['mes_nombre'] = df['fecha'].dt.strftime('%B')
        df['consumo_predicho_m3'] = df['consumo_predicho'].round(2)
        
        # Generar nombre de archivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"reporte_consumo_agua_{timestamp}.pdf"
        filepath = REPORTS_DIR / filename
        
        # Crear documento PDF
        doc = SimpleDocTemplate(str(filepath), pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Título
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        title = Paragraph("Reporte de Predicción de Consumo de Agua", title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Información del reporte
        info_style = ParagraphStyle(
            'Info',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=20
        )
        
        total_consumo = df['consumo_predicho_m3'].sum()
        promedio_consumo = df['consumo_predicho_m3'].mean()
        
        info_text = f"""
        <b>Información del Reporte:</b><br/>
        • Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}<br/>
        • Período de predicción: {df['anio'].min()}-{df['mes'].min():02d} a {df['anio'].max()}-{df['mes'].max():02d}<br/>
        • Total de meses predichos: {len(df)}<br/>
        • Consumo total predicho: {total_consumo:,.2f} m³<br/>
        • Consumo promedio mensual: {promedio_consumo:,.2f} m³<br/>
        • Población estimada: {poblacion_estimada or 'No especificada'}<br/>
        • Precipitación promedio: {precipitacion_promedio or 'No especificada'} mm
        """
        
        info_paragraph = Paragraph(info_text, info_style)
        story.append(info_paragraph)
        story.append(Spacer(1, 20))
        
        # Tabla de predicciones
        table_data = [['Año', 'Mes', 'Consumo Predicho (m³)']]
        
        for _, row in df.iterrows():
            table_data.append([
                str(int(row['anio'])),
                row['mes_nombre'],
                f"{row['consumo_predicho_m3']:,.2f}"
            ])
        
        # Crear tabla
        table = Table(table_data, colWidths=[1*inch, 2*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Resumen
        summary_style = ParagraphStyle(
            'Summary',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=20
        )
        
        summary_text = f"""
        <b>Resumen:</b><br/>
        El modelo de predicción ha generado un reporte para los próximos {len(df)} meses, 
        con un consumo total estimado de {total_consumo:,.2f} metros cúbicos de agua. 
        El consumo promedio mensual se estima en {promedio_consumo:,.2f} m³.
        """
        
        summary_paragraph = Paragraph(summary_text, summary_style)
        story.append(summary_paragraph)
        
        # Generar PDF
        doc.build(story)
        
        return {
            "success": True,
            "filename": filename,
            "filepath": str(filepath),
            "total_records": len(df),
            "total_consumo_predicho": round(total_consumo, 2),
            "promedio_consumo_predicho": round(promedio_consumo, 2),
            "periodo": f"{df['anio'].min()}-{df['mes'].min():02d} a {df['anio'].max()}-{df['mes'].max():02d}"
        }
        
    except Exception as e:
        return {"error": f"Error generando reporte PDF: {str(e)}"}

def send_email_with_pdf(
    email_to: str,
    subject: str,
    body: str,
    pdf_filepath: str
) -> Dict:
    """
    Envía un email con el reporte PDF adjunto usando la función de config_mail
    """
    try:
        print(f"Intentando enviar email a: {email_to}")
        print(f"Archivo PDF: {pdf_filepath}")
        print(f"Configuración de email - Host: {EMAIL_HOST}, Port: {EMAIL_PORT}, User: {EMAIL_USER}")
        
        # Verificar que el archivo PDF existe
        if not os.path.exists(pdf_filepath):
            error_msg = f"El archivo PDF no existe: {pdf_filepath}"
            print(error_msg)
            return {"error": error_msg}
        
        # Usar la función de config_mail
        success = enviar_correo_con_adjunto(subject, body, pdf_filepath, email_to)
        
        if success:
            return {
                "success": True,
                "message": f"Email enviado exitosamente a {email_to}",
                "filename": os.path.basename(pdf_filepath)
            }
        else:
            return {"error": "No se pudo enviar el email. Revisa la configuración de SMTP."}
        
    except Exception as e:
        error_msg = f"Error enviando email: {str(e)}"
        print(error_msg)
        return {"error": error_msg}

def get_report_history() -> List[Dict]:
    """
    Obtiene el historial de reportes generados
    """
    try:
        reports = []
        
        # Buscar reportes CSV en data4
        csv_files = list(DATA_DIR.glob("reporte_consumo_agua_*.csv"))
        for file in csv_files:
            stats = file.stat()
            reports.append({
                "filename": file.name,
                "type": "CSV",
                "path": str(file),
                "size": stats.st_size,
                "created": datetime.fromtimestamp(stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Buscar reportes PDF en reports
        pdf_files = list(REPORTS_DIR.glob("reporte_consumo_agua_*.pdf"))
        for file in pdf_files:
            stats = file.stat()
            reports.append({
                "filename": file.name,
                "type": "PDF",
                "path": str(file),
                "size": stats.st_size,
                "created": datetime.fromtimestamp(stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Ordenar por fecha de creación (más reciente primero)
        reports.sort(key=lambda x: x['created'], reverse=True)
        
        return reports
        
    except Exception as e:
        return [{"error": f"Error obteniendo historial: {str(e)}"}] 