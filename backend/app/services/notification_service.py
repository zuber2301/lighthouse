import os
import logging
from uuid import uuid4
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


def send_recognition_email(tenant_id: str, to_email: str, subject: str, html_body: str):
    """Best-effort email sender. If SMTP_* environment variables are configured it will
    attempt to send via SMTP, otherwise it will write a notification file under uploads/.
    """
    try:
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587')) if os.environ.get('SMTP_PORT') else None
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        from_email = os.environ.get('FROM_EMAIL') or f"no-reply@{os.environ.get('HOSTNAME','example.com')}"

        if smtp_host and smtp_port and smtp_user and smtp_pass:
            # send real email
            import smtplib
            from email.message import EmailMessage

            msg = EmailMessage()
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = to_email
            msg.set_content("This is a multipart message in MIME format.")
            msg.add_alternative(html_body, subtype='html')

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as s:
                s.starttls()
                s.login(smtp_user, smtp_pass)
                s.send_message(msg)
            logger.info('Sent recognition email to %s', to_email)
            return True
        else:
            # fallback: write to uploads/ for inspection
            upload_dir = os.path.join(os.getcwd(), 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            fname = f"notification-{uuid4().hex}.html"
            path = os.path.join(upload_dir, fname)
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(f"<h3>{subject}</h3>\n")
                fh.write(html_body)
                fh.write(f"\n<p>To: {to_email}</p>")
            logger.info('Wrote notification to %s', path)
            return True
    except Exception as exc:
        logger.exception('Failed to send recognition email: %s', exc)


class NotificationService:
    """Service for sending notifications related to approvals and events"""

    @staticmethod
    async def notify_approval(
        db: AsyncSession,
        approval_request,
    ):
        """
        Send notification when approval request is approved.
        Includes QR code for the user to save/print.
        """
        try:
            user = approval_request.user
            event = approval_request.event
            option = approval_request.option

            subject = f"Approved! {event.name} - {option.option_name}"
            html_body = f"""
            <h2>Your Approval Request is Approved!</h2>
            <p>Hi {user.display_name},</p>
            <p>Your request to join <strong>{event.name}</strong> for the <strong>{option.option_name}</strong> has been approved!</p>
            
            <h3>Event Details</h3>
            <ul>
                <li><strong>Event:</strong> {event.name}</li>
                <li><strong>Track/Option:</strong> {option.option_name}</li>
                <li><strong>Time Commitment:</strong> {approval_request.impact_hours_per_week}h/week for {approval_request.impact_duration_weeks} weeks</li>
                <li><strong>Total Hours:</strong> {approval_request.total_impact_hours}h</li>
            </ul>
            
            <h3>Your QR Code (Save/Print This)</h3>
            <p>Use this code at the event for verification:</p>
            <img src="{approval_request.qr_code_url}" alt="QR Code" style="width: 200px; height: 200px;" />
            <p><code>{approval_request.qr_token}</code></p>
            
            <p>See you at the event!</p>
            """

            send_recognition_email(
                tenant_id=approval_request.tenant_id,
                to_email=user.email,
                subject=subject,
                html_body=html_body,
            )

            logger.info(f"Sent approval notification to {user.email}")

        except Exception as e:
            logger.exception(f"Failed to send approval notification: {e}")

    @staticmethod
    async def notify_decline(
        db: AsyncSession,
        approval_request,
        alternatives: Optional[List] = None,
    ):
        """
        Send notification when approval request is declined.
        Includes alternative event options the user can join instead.
        """
        try:
            user = approval_request.user
            event = approval_request.event
            option = approval_request.option

            subject = f"Your {event.name} Request - Let's Find Another Option"

            alternatives_html = ""
            if alternatives:
                alternatives_html = "<h3>Alternative Options</h3><ul>"
                for alt in alternatives:
                    alternatives_html += f"""
                    <li>
                        <strong>{alt.option_name}</strong>
                        <br/>{alt.description or 'No description'}
                        <br/>Available slots: {alt.available_slots}
                    </li>
                    """
                alternatives_html += "</ul>"

            decline_reason = approval_request.decline_reason or "To balance your workload"

            html_body = f"""
            <h2>Let's Find Another Option</h2>
            <p>Hi {user.display_name},</p>
            <p>Unfortunately, your request to join <strong>{event.name}</strong> for the <strong>{option.option_name}</strong> has been declined.</p>
            
            <p><strong>Reason:</strong> {decline_reason}</p>
            
            <p>We want to make sure your work-life balance stays healthy. Here are some alternative options you might be interested in:</p>
            
            {alternatives_html}
            
            <p>Visit the Event Studio to explore other opportunities!</p>
            """

            send_recognition_email(
                tenant_id=approval_request.tenant_id,
                to_email=user.email,
                subject=subject,
                html_body=html_body,
            )

            logger.info(f"Sent decline notification to {user.email}")

        except Exception as e:
            logger.exception(f"Failed to send decline notification: {e}")

        return False
