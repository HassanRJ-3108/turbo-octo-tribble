# Clerk Webhook Payload Schema

**Purpose**: Define Clerk webhook event structure for user sync
**Feature**: 001-foodar-backend-api  
**Provider**: Clerk
**Verification**: Svix signature verification

## Webhook Events

### 1. user.created - New user signup
### 2. user.updated - User profile update  
### 3. user.deleted - User account deletion

All webhooks verified using Svix HMAC-SHA256 signatures in headers.

See implementation in research.md for detailed patterns.
