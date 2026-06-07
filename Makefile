.PHONY: install dev-db dev-api dev-web db-down db-logs

install:
	cd server && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd client && pnpm install

dev-db:
	docker compose up -d

dev-api:
	cd server && .venv/bin/uvicorn app.main:app --reload --port 8000

dev-web:
	cd client && pnpm dev

db-down:
	docker compose down

db-logs:
	docker compose logs -f mysql
