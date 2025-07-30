from pydantic import BaseModel
from enum import Enum
from datetime import datetime

class ModeloLLM(str, Enum):
    openai = "openai"
    zephyr = "zephyr"
    gemini = "gemini"

class PreguntaInput(BaseModel):
    pregunta: str
    modelo: ModeloLLM = ModeloLLM.openai

class ChatbotResponse(BaseModel):
    modelo: ModeloLLM
    respuesta: str
    timestamp: datetime
