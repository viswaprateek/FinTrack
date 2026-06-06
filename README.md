# FinTrack

Personal finance tracking application with React/TypeScript frontend and FastAPI/Python backend.

## Project Structure
```
personal_finance/
├── client/                 # React + TypeScript + Vite frontend
├── server/                 # FastAPI + SQLAlchemy backend
├── docker-compose.yml      # MySQL database
├── README.md
├── .gitignore
└── ...
```

## Why did `.venv` activate in the `client/` directory?

**Root cause**: Virtual environment activation is a *shell session* state, not tied to the current working directory. 

When you (or VS Code) activated the venv at the project root, it modified:
- Your `PS1` prompt (the `(.venv)` prefix)
- Your `PATH` (to use the venv's Python/pip)

The `cd client` command does **not** automatically deactivate it. This is standard behavior in zsh/bash.

**Solution** (what this updated README enforces):
- Create the virtual environment **inside** `server/.venv` (never at root)
- Activate the venv **only** when working in the `server/` directory
- Use separate terminals for frontend and backend work
- Run `deactivate` if the prompt appears in the client directory

## Prerequisites
- **Node.js** + **pnpm** (frontend)
- **Python 3.11+** (backend)
- **Docker** + **docker-compose** (database)
- (Optional) VS Code with Python and Prettier extensions

## Setup

### 1. Database (MySQL)
```bash
docker-compose up -d
```
This starts MySQL 8.4 with database `fintrack` (credentials defined in `server/.env`).

### 2. Backend Setup (Server)
```bash
# Always do this from inside server/ to avoid the client directory issue
cd server

# Create venv *inside* the server directory (critical)
python3 -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Review/edit server/.env (DB credentials must match docker-compose.yml)
```

**Run the backend**:
```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at:
- http://localhost:8000
- Swagger docs: http://localhost:8000/docs

**Deactivate when done**:
```bash
deactivate
```

### 3. Frontend Setup (Client)
```bash
# Open a *separate* terminal
cd client

# No venv needed here — this is pure Node.js/pnpm
pnpm install

# Start dev server
pnpm dev
```

Frontend runs at http://localhost:5173 (Vite default). It is configured to communicate with the backend at `http://localhost:8000`.

### Recommended Development Workflow
1. Terminal 1: `docker-compose up -d`
2. Terminal 2: Backend (`cd server && source .venv/bin/activate && uvicorn ...`)
3. Terminal 3: Frontend (`cd client && pnpm dev`)

**Never** activate the Python venv while inside the `client/` directory.

## VS Code Tips
- Use **Python: Select Interpreter** (Cmd/Ctrl+Shift+P) and choose `server/.venv/bin/python`
- The Python extension will then correctly activate the environment only for backend files/terminals
- Add this to `.vscode/settings.json` (if you create one) for better isolation:
  ```json
  {
    "python.terminal.activateEnvironment": true,
    "python.envFile": "${workspaceFolder}/server/.env"
  }
  ```

## Available Commands Summary
- **Database**: `docker-compose up -d` / `docker-compose down`
- **Backend**: `cd server && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`
- **Frontend**: `cd client && pnpm dev`
- **Deactivate venv**: `deactivate`

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic, MySQL
- **Infrastructure**: Docker, docker-compose

## Next Steps
- Implement authentication and budget features (models already exist in `server/app/models/`)
- Connect frontend to backend APIs
- Add tests and CI/CD

---

**Happy coding!** The venv issue should no longer occur if you follow the setup above. Use separate terminals and keep the venv activation scoped to the `server/` directory.