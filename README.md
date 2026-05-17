# ResumeHelper

Веб-приложение для составления резюме студентов с AI-помощником.

Стек: FastAPI, React + TypeScript, PostgreSQL, MinIO, Docker.

## Запуск локально

Нужен установленный Docker Desktop.

```
cp .env.production.example .env
docker compose up -d --build
```

Фронтенд откроется на http://localhost:5173, бекенд (Swagger) — на http://localhost:8000/docs.

Остановить: `docker compose down`.

## Структура

- `backend/` — FastAPI, миграции Alembic
- `frontend/` — React + Vite
- `deploy/` — конфиг nginx для прод-сервера
- `docker-compose.yml` — для разработки
- `docker-compose.prod.yml` — для деплоя