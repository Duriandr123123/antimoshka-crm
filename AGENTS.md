# AGENTS.md

## Project Goal

Build a simple, fast, reliable MVP CRM for Antimoshka KZ, a mosquito net company. The CRM must help process leads, measurements, production, installation, and basic sales tracking.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy + Pydantic
- Database: SQLite
- UI: modern responsive interface, mandatory mobile support

## Project Plan

1. Create the project structure and keep architecture simple.
2. Build the FastAPI backend with SQLite models and CRUD API.
3. Seed test data: at least 10 clients and 10 deals with different statuses.
4. Build the React frontend: login, clients, deals, kanban, client card, tasks, dashboard.
5. Add README with install, run, structure, and development commands.
6. Run checks after each substantial stage and fix failures before finishing.

## Folder Structure

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

## Run Commands

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Check Commands

All checks must finish by themselves. Do not run `npm run dev`, `uvicorn`, or any other persistent process as a check unless it is wrapped with a timeout and will be stopped automatically. If a command runs longer than 60 seconds, stop it.

### Backend

```bash
cd backend
python -m compileall .
python -m pytest
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

### Functional MVP Checks

After each substantial development stage, verify through automated checks or bounded smoke tests:

- creating a client works;
- creating a deal works;
- status change works and is saved;
- kanban status change path works;
- dashboard shows current data;
- seed data loads.

If any check fails, do not finish the task. Fix the issue and repeat the checks.

## Code Rules

- Do not connect paid services or paid APIs.
- Do not add WhatsApp integrations.
- Do not add Meta integrations.
- Do not use Docker.
- Do not introduce microservices.
- Do not overcomplicate the architecture.
- Prefer a working MVP over abstractions.
- Keep backend modules small and explicit.
- Keep frontend state simple and readable.
- Use meaningful names for variables, functions, components, models, and endpoints.
- Store no secrets in source code.
- Keep all development runnable locally.

## Definition of Done

MVP is ready when:

- backend runs locally without errors;
- frontend runs locally without errors;
- users can log in with demo credentials;
- users can create clients;
- users can create deals;
- deal status changes persist;
- kanban works with drag and drop;
- client card shows client details, deals, comments, and status history;
- tasks include measurement date, installation date, and responsible manager;
- dashboard shows total leads, today leads, active deals, completed orders, sales amount, and conversion;
- test data includes at least 10 clients and 10 deals;
- README explains setup, run commands, structure, and development checks.
