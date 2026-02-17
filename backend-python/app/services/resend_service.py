"""
Resend Email Service

Provides utilities for sending transactional emails via Resend API.
Used for trial reminders, approval notifications, and billing alerts.
"""

import resend
from app.config import settings

# Configure Resend API
resend.api_key = settings.RESEND_API_KEY


async def send_trial_reminder(
    email: str, restaurant_name: str, days_left: int
) -> dict:
    """
    Send trial expiration reminder email.

    Args:
        email: Recipient email address
        restaurant_name: Name of the restaurant
        days_left: Days remaining in trial

    Returns:
        dict: Resend API response
    """
    try:
        response = resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [email],
                "subject": f"Your Foodar trial expires in {days_left} days",
                "html": f"""
                <h1>Hi from Foodar!</h1>
                <p>Your trial for {restaurant_name} expires in {days_left} days.</p>
                <p>Subscribe now to continue using Foodar AR menus.</p>
                <a href="https://foodar.pk/subscribe">Subscribe Now</a>
                """,
            }
        )
        return response
    except Exception as e:
        print(f"Failed to send trial reminder email: {e}")
        raise


async def send_approval_email(email: str, restaurant_name: str) -> dict:
    """
    Send restaurant approval notification.

    Args:
        email: Recipient email address
        restaurant_name: Name of the approved restaurant

    Returns:
        dict: Resend API response
    """
    try:
        response = resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [email],
                "subject": f"{restaurant_name} has been approved!",
                "html": f"""
                <h1>Congratulations!</h1>
                <p>Your restaurant {restaurant_name} has been approved.</p>
                <p>Your 7-day trial starts now. Start adding your 3D models and products!</p>
                <a href="https://foodar.pk/dashboard">Go to Dashboard</a>
                """,
            }
        )
        return response
    except Exception as e:
        print(f"Failed to send approval email: {e}")
        raise


async def send_payment_failed_email(
    email: str, restaurant_name: str, grace_days: int
) -> dict:
    """
    Send payment failure warning.

    Args:
        email: Recipient email address
        restaurant_name: Name of the restaurant
        grace_days: Days remaining in grace period

    Returns:
        dict: Resend API response
    """
    try:
        response = resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [email],
                "subject": "Payment Failed - Action Required",
                "html": f"""
                <h1>Payment Failed</h1>
                <p>We couldn't process your payment for {restaurant_name}.</p>
                <p>You have {grace_days} days to update your payment method before access is suspended.</p>
                <a href="https://foodar.pk/billing">Update Payment Method</a>
                """,
            }
        )
        return response
    except Exception as e:
        print(f"Failed to send payment failed email: {e}")
        raise
