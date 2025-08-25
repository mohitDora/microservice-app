from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from dotenv import load_dotenv
import os

from database import create_db_and_tables
from api.order_api import orders
from utils.logger import setup_logging

load_dotenv()

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Context manager for application lifespan events.
    Used to create database tables on startup and close database connection on shutdown.
    """
    print("Application startup: Creating database tables...")
    create_db_and_tables()
    print("Database tables created. Application ready.")
    yield
    print("Application shutdown: Closing database connection...")


app = FastAPI(
    title="Order Service",
    description="A microservice for managing customer orders.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])


@app.get("/health")
def read_root():
    """
    Root endpoint for the Order Service.
    """
    return {"message": "Order Service is healthy."}
