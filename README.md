# Антимошка KZ CRM

MVP CRM для компании по москитным сеткам: заявки, клиенты, сделки, задачи, kanban, история статусов и dashboard.

## Стек

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy + Pydantic
- Database: SQLite

## Структура проекта

```text
.
+-- AGENTS.md
+-- README.md
+-- backend/
|   +-- app.py
|   +-- database.py
|   +-- models.py
|   +-- schemas.py
|   +-- seed.py
|   +-- requirements.txt
|   +-- crm.db
+-- frontend/
    +-- index.html
    +-- package.json
    +-- tsconfig.json
    +-- tsconfig.node.json
    +-- vite.config.ts
    +-- src/
        +-- App.tsx
        +-- main.tsx
        +-- styles.css
        +-- types.ts
```

## Backend: установка и запуск

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

API будет доступен на `http://127.0.0.1:8000`.

## Frontend: установка и запуск

```bash
cd frontend
npm install
npm run dev
```

Интерфейс будет доступен на `http://127.0.0.1:5173`.

## Демо-доступ

- admin / admin123
- manager / manager123

## Если вход не работает

Если после нажатия "Войти" ничего не меняется или появляется ошибка backend, проверьте, что backend запущен отдельно:

```bash
cd backend
.venv\Scripts\python.exe seed.py
.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Frontend сам по себе не авторизует пользователя. Он отправляет запросы в API на `http://127.0.0.1:8000`.

## Команды разработки

Backend:

```bash
cd backend
.venv\Scripts\python.exe -m compileall .
.venv\Scripts\python.exe -m pytest
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Проверки должны завершаться сами. Не используйте `npm run dev`, `uvicorn` или другие постоянные процессы как check-команды без timeout.

## Реализованные модули

- Авторизация с ролями admin и manager.
- Клиенты: создание, просмотр, карточка клиента.
- Сделки: создание, просмотр, статусы, сумма, тип сетки.
- Kanban-доска с drag and drop и автоматическим сохранением статуса.
- Задачи: дата замера, дата монтажа, ответственный менеджер.
- История статусов по сделкам.
- Dashboard: всего заявок, заявки сегодня, активные сделки, завершенные заказы, сумма продаж, конверсия.
- Seed-данные: 10 клиентов, 10 сделок, разные статусы.

## Ограничения MVP

- Пароли хранятся в открытом виде только для локального MVP.
- Нет JWT-сессий и разграничения прав на уровне endpoint'ов.
- Нет интеграций WhatsApp, Meta и платных API.
- Нет Docker и микросервисов.
- SQLite используется как локальная база для MVP.
