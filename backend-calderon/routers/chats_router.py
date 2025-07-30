from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from models.chatbot_models import PreguntaInput, ChatbotResponse
from services.chatbot import responder_pregunta

router = APIRouter(prefix="/chat", tags=["Chats"])

@router.post("/chatbot", response_model=ChatbotResponse)
def chat_endpoint(input: PreguntaInput):
    """
    Endpoint para interactuar con el chatbot.
    """
    try:
        respuesta = responder_pregunta(input.pregunta, input.modelo.value)
        return ChatbotResponse(
            modelo=input.modelo,
            respuesta=respuesta,
            timestamp=datetime.now(timezone.utc)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en chatbot: {e}")
