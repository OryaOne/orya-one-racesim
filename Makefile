PYTHON ?= python3
PIP ?= $(PYTHON) -m pip

.PHONY: setup install-api install-web train-model dev-api dev-web test lint-web build-web check

setup: install-api install-web

install-api:
	$(PIP) install -r apps/api/requirements.txt
	$(PIP) install -e packages/sim-core

install-web:
	npm install

train-model:
	$(PYTHON) -m racesim.model.train

dev-api:
	cd apps/api && uvicorn app.main:app --reload --port 8000

dev-web:
	npm run dev:web

test:
	pytest

lint-web:
	cd apps/web && npm run lint

build-web:
	cd apps/web && npm run build

check: test lint-web build-web
