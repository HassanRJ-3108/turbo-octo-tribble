# Lemon Squeezy Webhook Payload Schema

**Purpose**: Define Lemon Squeezy webhook event structure for subscription billing
**Feature**: 001-foodar-backend-api
**Provider**: Lemon Squeezy
**Verification**: HMAC-SHA256 signature in X-Signature header

## Webhook Events

### 1. subscription_payment_success
Triggered when subscription payment succeeds.

**Action**: Update subscription status to "active", record payment, set last_billed_at

### 2. subscription_payment_failed  
Triggered when subscription payment fails.

**Action**: Set status to "past_due", set grace_end_at (+3 days), send warning email

### 3. subscription_cancelled
Triggered when user cancels subscription.

**Action**: Set status to "cancelled", cancel Lemon subscription via API

### 4. subscription_updated
Triggered when subscription details change.

**Action**: Update subscription record with new details

## Payload Structure

```json
{
  "meta": {
    "event_name": "subscription_payment_success",
    "custom_data": {
      "restaurant_id": "uuid-here"
    }
  },
  "data": {
    "type": "subscriptions",
    "id": "123456",
    "attributes": {
      "store_id": 12345,
      "customer_id": 67890,
      "status": "active",
      "variant_id": 1295088,
      "renews_at": "2026-03-12T10:00:00Z",
      "created_at": "2026-02-12T10:00:00Z",
      "updated_at": "2026-02-12T10:00:00Z"
    }
  }
}
```

## Field Mappings

- `meta.custom_data.restaurant_id` → Used to find restaurant record
- `data.id` → `lemon_subscription_id`
- `data.attributes.status` → `status`
- `meta.event_name + "_" + data.id` → `lemon_event_id` (for idempotency)

## Signature Verification

Header: `X-Signature`
Method: HMAC-SHA256 of raw request body using webhook secret

```python
import hmac, hashlib

signature = request.headers.get("X-Signature")
computed = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()

if not hmac.compare_digest(signature, computed):
    raise HTTPException(401, "Invalid signature")
```

## Idempotency

Check `webhook_events` table for existing `lemon_event_id` before processing.
Store event with `processed=false`, then update to `processed=true` after successful processing.

See research.md for complete implementation patterns.
