import os

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.routes.simulation import router as simulation_router
from racesim.data.loaders import CatalogLookupError

app = FastAPI(
    title="Orya One RaceSim API",
    description="Hybrid motorsport simulation API for scenario configuration and Monte Carlo race simulation.",
    version="0.1.0",
)


def _cors_origins() -> list[str]:
    value = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [item.strip() for item in value.split(",") if item.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(CatalogLookupError)
async def handle_lookup_error(_, exc: CatalogLookupError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


app.include_router(simulation_router, prefix="/api")
