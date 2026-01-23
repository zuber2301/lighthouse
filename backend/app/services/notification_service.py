import os
import logging
from uuid import uuid4

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
        return False
