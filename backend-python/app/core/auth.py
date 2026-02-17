"""
Clerk Authentication

JWT verification using Clerk SDK's authenticate_request function.
Provides utilities for verifying Clerk JWT tokens and extracting user information.
"""

from typing import Optional
from clerk_backend_api import Clerk
from app.config import settings

# Initialize Clerk SDK (still useful for API calls, but not for auth verification)
clerk = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)

# Manual JWT Verification using PyJWT + Async JWKS fetching
import jwt
import httpx
from functools import lru_cache

# Cache for JWKS responses (1 hour TTL)
_jwks_cache = {}

async def _fetch_jwks_async(jwks_url: str) -> dict:
    """Fetch JWKS from URL asynchronously with caching."""
    import time
    current_time = time.time()
    
    # Check cache (1 hour TTL)
    if jwks_url in _jwks_cache:
        cached_jwks, cached_time = _jwks_cache[jwks_url]
        if current_time - cached_time < 3600:  # 1 hour
            return cached_jwks
    
    # Fetch JWKS
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url, timeout=5.0)
        response.raise_for_status()
        jwks = response.json()
        
    # Cache result
    _jwks_cache[jwks_url] = (jwks, current_time)
    return jwks

async def verify_clerk_token_str(token: str) -> Optional[dict]:
    """
    Verify a raw JWT token string using PyJWT with async JWKS fetching.
    """
    try:
        # Handle "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
            
        print(f"🔍 [auth.py] Verifying token: {token[:15]}...")
        
        # 1. Decode unverified payload to get issuer
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified_payload.get("iss")
        
        if not issuer:
            print("❌ No issuer in token")
            return None

        # 2. Get Signing Key from JWKS (async)
        jwks_url = f"{issuer}/.well-known/jwks.json"
        jwks = await _fetch_jwks_async(jwks_url)
        
        # Find the key matching the token's kid
        token_header = jwt.get_unverified_header(token)
        kid = token_header.get("kid")
        
        signing_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                # Convert JWK to PEM format for PyJWT
                from jwt.algorithms import RSAAlgorithm
                signing_key = RSAAlgorithm.from_jwk(key)
                break
        
        if not signing_key:
            print(f"❌ No matching key found for kid: {kid}")
            return None
        
        # 3. Verify Token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=30  # Allow 30 seconds clock skew
        )
        return payload
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def verify_clerk_jwt(request) -> Optional[dict]:
    """
    Extract token from request and verify.
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ")[1]
        return verify_clerk_token_str(token)
    except Exception:
        return None


def debug_clerk_jwt(request) -> tuple[bool, dict | None, str | None]:
    """
    Debug version of verify_clerk_jwt that returns error details.
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
             return False, None, "No Authorization header found"
        if not auth_header.startswith("Bearer "):
             return False, None, "Authorization header must start with Bearer"
        
        token = auth_header.split(" ")[1]
        
        # 1. Decode unverified headers/payload
        try:
            unverified_header = jwt.get_unverified_header(token)
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
        except Exception as e:
            return False, None, f"Failed to decode token structure: {e}"
            
        issuer = unverified_payload.get("iss")
        if not issuer:
            return False, None, "Token missing 'iss' claim"

        # 2. Fetch JWKS
        try:
            jwks_url = f"{issuer}/.well-known/jwks.json"
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
        except Exception as e:
            return False, None, f"Failed to fetch JWKS or find key: {e}"
            
        # 3. Verify
        try:
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
                leeway=30  # Allow 30 seconds clock skew
            )
            return True, payload, None
        except jwt.ExpiredSignatureError:
            return False, None, "Token has expired"
        except jwt.InvalidSignatureError:
            return False, None, "Invalid signature"
        except Exception as e:
            return False, None, f"Verification failed: {e}"
            
    except Exception as e:
        return False, None, f"Unexpected error: {str(e)}"

# Update get_user_id_from_token to use new verify function logic if needed (it calls verify_clerk_jwt)
def get_user_id_from_token(request) -> Optional[str]:
    payload = verify_clerk_jwt(request)
    if payload:
        return payload.get("sub")
    return None
