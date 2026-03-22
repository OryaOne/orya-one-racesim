# Contributing

Thanks for contributing to Orya One RaceSim.

The current project is a 2026 Formula 1 Grand Prix simulator with real season entities and modeled priors on top of them. Changes should keep that framing clear.

## Principles

- Keep the product grounded and technically honest.
- Do not add copyrighted logos, team marks, or official race graphics.
- Prefer readable simulation logic over hidden complexity.
- Keep the UI dense, calm, and easy to scan.
- Document meaningful modeling assumptions when you change them.

## Good contribution areas

- better strategy and event logic
- circuit or season data improvements
- qualifying and Sprint-weekend extensions
- UI clarity improvements
- tests, validation, and developer-experience work
- documentation that makes the model easier to understand

## Local setup

### Python

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
pip install -e packages/sim-core
```

### Web

```bash
npm install
```

### Helper command

```bash
make setup
```

## Development commands

```bash
make dev-api
make dev-web
make train-model
make test
make lint-web
make build-web
make check
```

## Checks before opening a PR

```bash
pytest
cd apps/web && npm run lint
cd apps/web && npm run build
```

## API test note

`apps/api/tests/test_api.py` skips if `fastapi` is not installed in the active interpreter. If you install dependencies from `apps/api/requirements.txt`, the API tests should run normally.

## Pull request guidance

Keep pull requests focused.

Please include:

- what changed
- why it improves the project
- any new modeling assumptions
- validation performed
- screenshots for visible UI changes

## Documentation expectations

If you change any of the following, update docs in the same PR when it makes sense:

- season data
- simulation assumptions
- setup instructions
- public-facing copy
- roadmap direction

## Scope discipline

Avoid broad rewrites unless they solve a real structural problem. The project improves best through clear, well-argued increments.
