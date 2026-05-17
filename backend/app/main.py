# Точка входа FastAPI

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routers import ai, auth, dictionaries, export, portfolio, positions, profile, resumes, skills, templates

app = FastAPI(
    title="ResumeHelper API",
    description="Упрощённая версия для курсовой",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def healthcheck():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.get("/", tags=["meta"])
def root():
    return {
        "name": "ResumeHelper API",
        "version": "1.0.0",
        "docs": "/docs",
    }


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(dictionaries.router)
app.include_router(skills.router)
app.include_router(positions.router)
app.include_router(templates.router)
app.include_router(resumes.router)
app.include_router(portfolio.router)
app.include_router(ai.router)
app.include_router(export.router)
