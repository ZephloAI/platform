"""
Base model for all SQLAlchemy ORM models.

Every model class should inherit from this Base.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass
