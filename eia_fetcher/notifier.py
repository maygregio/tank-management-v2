"""
Notification system for EIA data releases.

Supports email, Slack webhooks, and generic webhook notifications.
"""

import json
import logging
import smtplib
from dataclasses import dataclass
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional

import requests

from .config import Config, get_config
from .schedule import ReportType

logger = logging.getLogger(__name__)


@dataclass
class NotificationResult:
    """Result of a notification attempt."""
    success: bool
    channel: str
    error: Optional[str] = None
    timestamp: Optional[datetime] = None


class Notifier:
    """Sends notifications when new EIA data is detected."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self._session = None

    @property
    def session(self) -> requests.Session:
        """Get or create requests session."""
        if self._session is None:
            self._session = requests.Session()
            self._session.headers.update({
                "Content-Type": "application/json",
            })
        return self._session

    def notify_release(
        self,
        report_type: ReportType,
        summary: Dict[str, any],
        files_fetched: Optional[List[str]] = None,
    ) -> List[NotificationResult]:
        """
        Send notifications for a new data release.

        Args:
            report_type: Type of report (WPSR or PSM)
            summary: Summary data to include in notification
            files_fetched: List of files that were fetched

        Returns:
            List of notification results
        """
        results = []

        # Build notification message
        message = self._build_message(report_type, summary, files_fetched)

        # Send to all configured channels
        if self.config.slack_webhook_url:
            results.append(self._send_slack(message))

        if self.config.notify_webhook_url:
            results.append(self._send_webhook(message, report_type, summary))

        if self.config.notify_email:
            results.append(self._send_email(message, report_type))

        successful = sum(1 for r in results if r.success)
        logger.info(f"Sent {successful}/{len(results)} notifications")

        return results

    def _build_message(
        self,
        report_type: ReportType,
        summary: Dict[str, any],
        files_fetched: Optional[List[str]] = None,
    ) -> str:
        """Build the notification message."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        report_name = "Weekly Petroleum Status Report" if report_type == ReportType.WPSR else "Petroleum Supply Monthly"

        lines = [
            f"📊 New EIA {report_name} Data Available",
            f"Time: {timestamp}",
            "",
        ]

        if summary:
            lines.append("Summary:")
            for key, value in summary.items():
                lines.append(f"  • {key}: {value}")
            lines.append("")

        if files_fetched:
            lines.append(f"Files fetched: {len(files_fetched)}")
            for f in files_fetched[:5]:  # Limit to first 5
                lines.append(f"  • {f}")
            if len(files_fetched) > 5:
                lines.append(f"  ... and {len(files_fetched) - 5} more")

        return "\n".join(lines)

    def _send_slack(self, message: str) -> NotificationResult:
        """
        Send notification to Slack.

        Args:
            message: Message to send

        Returns:
            NotificationResult
        """
        if not self.config.slack_webhook_url:
            return NotificationResult(
                success=False,
                channel="slack",
                error="Slack webhook URL not configured",
            )

        try:
            payload = {
                "text": message,
                "unfurl_links": False,
                "unfurl_media": False,
            }

            response = self.session.post(
                self.config.slack_webhook_url,
                json=payload,
                timeout=10,
            )
            response.raise_for_status()

            logger.info("Slack notification sent successfully")
            return NotificationResult(
                success=True,
                channel="slack",
                timestamp=datetime.now(),
            )

        except requests.RequestException as e:
            logger.error(f"Failed to send Slack notification: {e}")
            return NotificationResult(
                success=False,
                channel="slack",
                error=str(e),
            )

    def _send_webhook(
        self,
        message: str,
        report_type: ReportType,
        summary: Dict[str, any],
    ) -> NotificationResult:
        """
        Send notification to a generic webhook.

        Args:
            message: Message to send
            report_type: Type of report
            summary: Summary data

        Returns:
            NotificationResult
        """
        if not self.config.notify_webhook_url:
            return NotificationResult(
                success=False,
                channel="webhook",
                error="Webhook URL not configured",
            )

        try:
            payload = {
                "event": "eia_data_release",
                "report_type": report_type.value,
                "timestamp": datetime.now().isoformat(),
                "message": message,
                "summary": summary,
            }

            response = self.session.post(
                self.config.notify_webhook_url,
                json=payload,
                timeout=10,
            )
            response.raise_for_status()

            logger.info("Webhook notification sent successfully")
            return NotificationResult(
                success=True,
                channel="webhook",
                timestamp=datetime.now(),
            )

        except requests.RequestException as e:
            logger.error(f"Failed to send webhook notification: {e}")
            return NotificationResult(
                success=False,
                channel="webhook",
                error=str(e),
            )

    def _send_email(
        self,
        message: str,
        report_type: ReportType,
    ) -> NotificationResult:
        """
        Send notification via email.

        Note: Requires SMTP configuration via environment variables:
        - EIA_SMTP_HOST
        - EIA_SMTP_PORT
        - EIA_SMTP_USER
        - EIA_SMTP_PASSWORD
        - EIA_SMTP_FROM

        Args:
            message: Message to send
            report_type: Type of report

        Returns:
            NotificationResult
        """
        if not self.config.notify_email:
            return NotificationResult(
                success=False,
                channel="email",
                error="Email address not configured",
            )

        import os
        smtp_host = os.getenv("EIA_SMTP_HOST")
        smtp_port = int(os.getenv("EIA_SMTP_PORT", "587"))
        smtp_user = os.getenv("EIA_SMTP_USER")
        smtp_password = os.getenv("EIA_SMTP_PASSWORD")
        smtp_from = os.getenv("EIA_SMTP_FROM")

        if not all([smtp_host, smtp_user, smtp_password, smtp_from]):
            return NotificationResult(
                success=False,
                channel="email",
                error="SMTP configuration incomplete",
            )

        try:
            report_name = "WPSR" if report_type == ReportType.WPSR else "PSM"
            subject = f"EIA {report_name} Data Release - {datetime.now().strftime('%Y-%m-%d')}"

            msg = MIMEMultipart()
            msg["From"] = smtp_from
            msg["To"] = self.config.notify_email
            msg["Subject"] = subject
            msg.attach(MIMEText(message, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

            logger.info(f"Email notification sent to {self.config.notify_email}")
            return NotificationResult(
                success=True,
                channel="email",
                timestamp=datetime.now(),
            )

        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return NotificationResult(
                success=False,
                channel="email",
                error=str(e),
            )

    def notify_error(
        self,
        error_type: str,
        error_message: str,
        context: Optional[Dict[str, any]] = None,
    ) -> List[NotificationResult]:
        """
        Send error notifications.

        Args:
            error_type: Type of error
            error_message: Error description
            context: Additional context

        Returns:
            List of notification results
        """
        results = []
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        message = f"⚠️ EIA Fetcher Error\n\nType: {error_type}\nTime: {timestamp}\nError: {error_message}"

        if context:
            message += "\n\nContext:"
            for key, value in context.items():
                message += f"\n  • {key}: {value}"

        if self.config.slack_webhook_url:
            results.append(self._send_slack(message))

        if self.config.notify_webhook_url:
            payload_result = self._send_webhook(
                message,
                ReportType.WPSR,  # Default
                {"error_type": error_type, "error_message": error_message},
            )
            results.append(payload_result)

        return results

    def close(self):
        """Close the session."""
        if self._session:
            self._session.close()
            self._session = None
