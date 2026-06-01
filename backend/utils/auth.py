from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # In a real app, validate the JWT with Clerk's public key
    # For V1, we'll assume the token is valid and extract claims
    # This is a placeholder for Clerk integration
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    # Mock user extraction
    # Defaulting to user_id=1 (Recruiter from seed) and user_id=2 (Applicant from seed)
    # In production, this would parse a real JWT
    return {"user_id": 1, "role": "recruiter", "company_id": 1}

def role_required(allowed_roles: list):
    async def decorator(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role",
            )
        return user
    return decorator
