"""
Email Sending Functions

Business logic for sending transactional emails via Resend.
"""

from app.services.resend_service import (
    send_approval_email,
    send_trial_reminder,
    send_payment_failed_email,
)


async def send_restaurant_approval_email(
    email: str, restaurant_name: str
) -> dict:
    """
    Send approval notification to restaurant owner.

    Args:
        email: Owner's email address
        restaurant_name: Name of approved restaurant

    Returns:
        dict: Email sending response
    """
    return await send_approval_email(email, restaurant_name)


async def send_restaurant_rejection_email(
    email: str, restaurant_name: str, reason: str | None = None
) -> dict:
    """
    Send rejection notification to restaurant owner.

    Args:
        email: Owner's email address
        restaurant_name: Name of rejected restaurant
        reason: Optional rejection reason

    Returns:
        dict: Email sending response
    """
    import resend
    from app.config import settings

    reason_text = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""

    try:
        response = resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [email],
                "subject": f"Application Update: {restaurant_name}",
                "html": f"""
                <h1>Application Update</h1>
                <p>Thank you for your interest in Foodar.</p>
                <p>Unfortunately, we are unable to approve your application for {restaurant_name} at this time.</p>
                {reason_text}
                <p>If you have questions, please contact our support team.</p>
                """,
            }
        )
        return response
    except Exception as e:
        print(f"Failed to send rejection email: {e}")
        raise


async def send_trial_expiration_reminder(
    email: str, restaurant_name: str, days_left: int
) -> dict:
    """
    Send trial expiration reminder.

    Args:
        email: Owner's email address
        restaurant_name: Restaurant name
        days_left: Days remaining in trial

    Returns:
        dict: Email sending response
    """
    return await send_trial_reminder(email, restaurant_name, days_left)


async def send_payment_failure_warning(
    email: str, restaurant_name: str, grace_days: int
) -> dict:
    """
    Send payment failure warning.

    Args:
        email: Owner's email address
        restaurant_name: Restaurant name
        grace_days: Days remaining in grace period

    Returns:
        dict: Email sending response
    """
    return await send_payment_failed_email(email, restaurant_name, grace_days)
