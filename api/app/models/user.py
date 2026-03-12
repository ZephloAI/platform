"""
User model.

Represents a registered user who can create chatbots.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime, default=func.now())

    # A user can own many chatbots
    chatbots = relationship(
        "Chatbot", back_populates="user", cascade="all, delete-orphan"
    )
    memberships = relationship("OrganizationMember", back_populates="user")
