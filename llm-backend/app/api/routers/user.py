from fastapi import APIRouter, HTTPException, Header, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from app.src.db.db import engine, Base, get_db
from app.models.user import (
    GoogleUser,
    UserToken,
    UserStatus,
    LoginType,
    SignupPayload,
    LoginPayload,
)  # assume you have a SQLAlchemy model
from app.api.utils.jwt_token import create_access_token
from app.api.utils.auth import hash_password, verify_password
from jose import jwt, JWTError
import os
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

from datetime import datetime, timedelta

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

user_router = APIRouter()

# DB setup
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


class TokenPayload(BaseModel):
    idToken: str


# @user_router.on_event("startup")
# async def on_startup():
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)


@user_router.post("/verify-google-token")
async def verify_google_token(
    payload: TokenPayload, db: AsyncSession = Depends(get_db)
):
    token = payload.idToken
    if not token:
        raise HTTPException(status_code=400, detail="Token is missing")

    try:
        id_info = id_token.verify_oauth2_token(token, GoogleRequest(), GOOGLE_CLIENT_ID)
        print("id_info: ", id_info)
        google_id = id_info["sub"]
        email = id_info["email"]
        name = id_info["name"]
        picture = id_info.get("picture")

        # Check if user exists
        result = await db.execute(
            select(GoogleUser).where(GoogleUser.google_id == google_id)
        )
        user = result.scalar_one_or_none()

        if user:
            # Update existing user
            # Update existing user fields
            user.email = email
            user.name = name
            user.profile_image = (
                picture  # previously user.picture = picture (incorrect attr)
            )
            user.google_token = token  # update the token
            db.add(user)  # not strictly necessary with tracked objects but safe
        else:
            # Create new user
            user = GoogleUser(
                google_id=google_id,
                email=email,
                name=name,
                profile_image=picture,
                status=UserStatus.ACTIVE,  # ✅ correct
                login_type=LoginType.GOOGLE,  # ✅ correct
                google_token=token,
            )
            db.add(user)

        await db.commit()
        # Create JWT token
        token_data = {"sub": google_id, "email": email, "login_type": "google"}
        jwt_token, expires_at = create_access_token(token_data, timedelta(days=7))

        # Optional: Store in DB if tracking sessions
        token_record = UserToken(
            token=jwt_token, user_id=google_id, expires_at=expires_at, is_active=True
        )
        # db.add(token_record)
        try:
            db.add(token_record)
            await db.commit()
        except Exception as e:
            await db.rollback()
            print("Failed to save token:", str(e))
        return {
            "isLogin": True,
            "isVerify": True,
            "token": jwt_token,
            "tokenType": "google",
            "expires_at": expires_at.isoformat(),
            "user": {
                "google_id": user.google_id,
                "email": user.email,
                "name": user.name,
                "picture": user.profile_image,
            },
        }

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")


@user_router.post("/signup")
async def signup(payload: SignupPayload, db: AsyncSession = Depends(get_db)):
    try:
        # Check if email already exists
        existing_user = await db.execute(
            select(GoogleUser).where(GoogleUser.email == payload.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Hash password and extract name
        hashed_pw = hash_password(payload.password)
        local_part = payload.email.split("@")[0]
        name_parts = local_part.replace(".", " ").replace("_", " ").split()
        extracted_name = " ".join(part.capitalize() for part in name_parts)

        # Create user
        user = GoogleUser(
            google_id=str(uuid.uuid4()),
            email=payload.email,
            name=extracted_name,
            profile_image=None,
            status=UserStatus.ACTIVE,
            login_type=LoginType.USER,
            password=hashed_pw,
        )
        db.add(user)
        await db.commit()

        return {"message": "Signup successful"}

    except HTTPException as http_ex:
        # Let known errors bubble up
        raise http_ex

    except Exception as e:
        logger.exception("Unexpected error during signup:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during signup.",
        )


@user_router.post("/login")
async def login(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    try:
        # Find user by email
        result = await db.execute(
            select(GoogleUser).where(GoogleUser.email == payload.email)
        )
        user = result.scalar_one_or_none()

        # Validate user and login type
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if user.login_type != LoginType.USER:
            raise HTTPException(
                status_code=401,
                detail="Please use the correct login method (e.g. social login)",
            )

        # Check password
        if not verify_password(payload.password, user.password):
            raise HTTPException(status_code=401, detail="Incorrect password")

        # Generate JWT token
        token_data = {"sub": user.google_id, "email": user.email, "login_type": "user"}
        jwt_token, expires_at = create_access_token(token_data, timedelta(days=7))

        # Store token
        token_record = UserToken(
            token=jwt_token,
            user_id=user.google_id,
            expires_at=expires_at,
            is_active=True,
        )
        db.add(token_record)
        await db.commit()

        # Success response
        return {
            "isLogin": True,
            "message": "Login successful",
            "token": jwt_token,
            "tokenType": "user",
            "expires_at": expires_at.isoformat(),
            "user": {
                "email": user.email,
                "name": user.name,
                "picture": user.profile_image,
            },
        }

    except HTTPException as http_ex:
        raise http_ex

    except Exception as e:
        logger.exception("Unexpected error during login")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login",
        )


@user_router.post("/verify-user-token")
async def verify_user_token(
    token: str = Header(...),
    tokenType: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    print("tokenType", tokenType)
    if tokenType == "user":
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            email = payload.get("email")

            if not email:
                raise HTTPException(status_code=401, detail="Invalid JWT token payload")

            result = await db.execute(
                select(GoogleUser).where(GoogleUser.email == email)
            )
            user = result.scalar_one_or_none()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            return {
                "isLogin": True,
                "isVerify": True,
                "token": token,
                "tokenType": "user",
                "expires_at": payload.get("exp"),  # optional: convert to ISO if needed
                "user": {
                    "email": user.email,
                    "name": user.name,
                    "picture": user.profile_image,
                },
            }

        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid JWT token")

    elif tokenType == "google":
        try:
            # Find user by google_token
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            email = payload.get("email")

            if not email:
                raise HTTPException(status_code=401, detail="Invalid JWT token payload")

            result = await db.execute(
                select(GoogleUser).where(GoogleUser.email == email)
            )
            user = result.scalar_one_or_none()

            id_info = id_token.verify_oauth2_token(
                user.google_token, GoogleRequest(), GOOGLE_CLIENT_ID
            )
            if id_info["sub"] != user.google_id:
                raise HTTPException(status_code=401, detail="Token does not match user")

            # Optional: parse exp from ID token if needed
            expires_at = datetime.fromtimestamp(id_info["exp"])

            return {
                "isLogin": True,
                "isVerify": True,
                "token": token,
                "tokenType": "google",
                "expires_at": expires_at.isoformat(),
                "user": {
                    "google_id": user.google_id,
                    "email": user.email,
                    "name": user.name,
                    "picture": user.profile_image,
                },
            }

        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid Google ID token")

    else:
        raise HTTPException(status_code=400, detail="Unsupported token type")
