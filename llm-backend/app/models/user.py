from sqlalchemy import Column, String, Enum, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import enum
from pydantic import BaseModel, Field


Base = declarative_base()

class SignupPayload(BaseModel):
    email: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

class LoginType(enum.Enum):
    USER = "user"        # traditional login
    GOOGLE = "google"
    GITHUB = "github"

class UserStatus(enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    REVOKE = "revoke"

class GoogleUser(Base):
    __tablename__ = "google_users"

    google_id = Column(String, primary_key=True)
    
    # Required fields
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)

    # Optional fields
    password = Column(String, nullable=True)  # only for 'user' login
    company = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    role = Column(String, nullable=True)
    timezone = Column(String, nullable=True)

    # Enum fields
    status = Column(Enum(UserStatus), default=UserStatus.PENDING)
    login_type = Column(Enum(LoginType), default=LoginType.USER)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    google_token = Column(String, nullable=True)





class UserToken(Base):
    __tablename__ = "user_tokens"

    token = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)  # Can be google_id or internal id
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
