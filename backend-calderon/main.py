from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import files_router, precipitation_router
from core.config import CORS_ORIGINS

app = FastAPI(title="File API")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(files_router.router)
app.include_router(precipitation_router.router)

@app.get("/")
def root():
    return {"message": "API de archivos funcionando"}
