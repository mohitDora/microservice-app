from typing import Generator
from sqlmodel import create_engine, Session, SQLModel
from config import DATABASE_URL
import logging

logger = logging.getLogger(__name__)

engine = create_engine(DATABASE_URL, echo=True)


def create_db_and_tables():
    """
    Creates all database tables defined in SQLModel models.
    This should be called at application startup.
    """
    logger.info("Attempting to create database tables...")
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables creation process completed.")


def get_session() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to provide a database session.
    It creates a new session for each request and closes it afterwards.
    """
    with Session(engine) as session:
        yield session
