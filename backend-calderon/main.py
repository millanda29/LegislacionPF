from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import files_router, precipitation_router, chats_router, interpretacion_router, water_router, reports_router
from core.config import CORS_ORIGINS

app = FastAPI(title="Asistente predictor", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(files_router.router)
app.include_router(precipitation_router.router)
app.include_router(chats_router.router)
app.include_router(interpretacion_router.router)
app.include_router(water_router.router)
app.include_router(reports_router.router)

@app.get("/")
def root():
    return {"message": "API funcionando correctamente"}
