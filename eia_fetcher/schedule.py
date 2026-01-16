"""
Release schedule management for EIA data.

Handles WPSR (weekly) and PSM (monthly) release schedules,
including holiday exceptions and timezone conversions.
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Tuple

import pytz

from .config import (
    EASTERN_TZ,
    PSM_RELEASE_DAYS,
    WPSR_HOLIDAY_EXCEPTIONS,
    WPSR_NORMAL_RELEASE_DAY,
    WPSR_NORMAL_RELEASE_TIME,
)

logger = logging.getLogger(__name__)


class ReportType(Enum):
    """Types of EIA reports."""
    WPSR = "wpsr"  # Weekly Petroleum Status Report
    PSM = "psm"    # Petroleum Supply Monthly


class ReleaseSchedule:
    """Manages EIA release schedules."""

    def __init__(self):
        self.eastern_tz = pytz.timezone(EASTERN_TZ)
        self._day_map = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }

    def get_next_wpsr_release(
        self,
        from_datetime: Optional[datetime] = None
    ) -> datetime:
        """
        Calculate the next WPSR release datetime.

        Args:
            from_datetime: Starting point for calculation (default: now)

        Returns:
            datetime: Next WPSR release time in Eastern timezone
        """
        if from_datetime is None:
            from_datetime = datetime.now(self.eastern_tz)
        elif from_datetime.tzinfo is None:
            from_datetime = self.eastern_tz.localize(from_datetime)

        # Find the next Wednesday (or current day if it's Wednesday before release)
        current_weekday = from_datetime.weekday()
        normal_release_day = self._day_map[WPSR_NORMAL_RELEASE_DAY]

        # Calculate days until next Wednesday
        days_until_release = (normal_release_day - current_weekday) % 7

        # Parse normal release time
        release_hour, release_minute = map(int, WPSR_NORMAL_RELEASE_TIME.split(":"))

        # Check if today is release day
        if days_until_release == 0:
            release_time_today = from_datetime.replace(
                hour=release_hour,
                minute=release_minute,
                second=0,
                microsecond=0
            )
            # If we haven't passed release time, use today
            if from_datetime < release_time_today:
                candidate_date = from_datetime.date()
            else:
                # Already past release time, go to next week
                days_until_release = 7
                candidate_date = (from_datetime + timedelta(days=days_until_release)).date()
        else:
            candidate_date = (from_datetime + timedelta(days=days_until_release)).date()

        # Check for holiday exceptions
        release_datetime = self._apply_holiday_exceptions(
            candidate_date, release_hour, release_minute
        )

        return release_datetime

    def _apply_holiday_exceptions(
        self,
        candidate_date: datetime.date,
        default_hour: int,
        default_minute: int
    ) -> datetime:
        """
        Apply holiday exceptions to the release schedule.

        Args:
            candidate_date: The candidate release date
            default_hour: Default release hour
            default_minute: Default release minute

        Returns:
            datetime: Adjusted release datetime
        """
        # Check if there's a holiday that affects this week
        week_start = candidate_date - timedelta(days=candidate_date.weekday())
        week_end = week_start + timedelta(days=6)

        for holiday_date_str, (new_day, new_time) in WPSR_HOLIDAY_EXCEPTIONS.items():
            holiday_date = datetime.strptime(holiday_date_str, "%Y-%m-%d").date()

            # Check if holiday falls within the same week
            if week_start <= holiday_date <= week_end:
                # Calculate new release date based on exception
                new_day_num = self._day_map[new_day]
                days_from_week_start = new_day_num
                new_release_date = week_start + timedelta(days=days_from_week_start)

                # Parse new release time
                new_hour, new_minute = map(int, new_time.split(":"))

                release_datetime = self.eastern_tz.localize(
                    datetime(
                        new_release_date.year,
                        new_release_date.month,
                        new_release_date.day,
                        new_hour,
                        new_minute,
                        0
                    )
                )

                logger.info(
                    f"Holiday exception applied: {holiday_date_str} -> "
                    f"Release on {new_day} at {new_time}"
                )
                return release_datetime

        # No holiday exception, use normal schedule
        return self.eastern_tz.localize(
            datetime(
                candidate_date.year,
                candidate_date.month,
                candidate_date.day,
                default_hour,
                default_minute,
                0
            )
        )

    def get_next_psm_release(
        self,
        from_datetime: Optional[datetime] = None
    ) -> datetime:
        """
        Calculate the next PSM release datetime.

        Args:
            from_datetime: Starting point for calculation (default: now)

        Returns:
            datetime: Next PSM release time in Eastern timezone
        """
        if from_datetime is None:
            from_datetime = datetime.now(self.eastern_tz)
        elif from_datetime.tzinfo is None:
            from_datetime = self.eastern_tz.localize(from_datetime)

        current_month_key = from_datetime.strftime("%Y-%m")

        # Check if we have a scheduled release for this month
        if current_month_key in PSM_RELEASE_DAYS:
            release_date_str = PSM_RELEASE_DAYS[current_month_key]
            release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
            # PSM releases during business hours - assume 10:00 AM ET
            release_datetime = self.eastern_tz.localize(
                release_date.replace(hour=10, minute=0, second=0)
            )

            if from_datetime < release_datetime:
                return release_datetime

        # Check next month
        if from_datetime.month == 12:
            next_month = datetime(from_datetime.year + 1, 1, 1)
        else:
            next_month = datetime(from_datetime.year, from_datetime.month + 1, 1)

        next_month_key = next_month.strftime("%Y-%m")

        if next_month_key in PSM_RELEASE_DAYS:
            release_date_str = PSM_RELEASE_DAYS[next_month_key]
            release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
            return self.eastern_tz.localize(
                release_date.replace(hour=10, minute=0, second=0)
            )

        # Default: last business day of next month at 10:00 AM ET
        if next_month.month == 12:
            end_of_month = datetime(next_month.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_of_month = datetime(next_month.year, next_month.month + 1, 1) - timedelta(days=1)

        # Find last business day
        while end_of_month.weekday() >= 5:  # Saturday or Sunday
            end_of_month -= timedelta(days=1)

        return self.eastern_tz.localize(
            end_of_month.replace(hour=10, minute=0, second=0)
        )

    def get_next_release(
        self,
        report_type: ReportType,
        from_datetime: Optional[datetime] = None
    ) -> datetime:
        """
        Get the next release datetime for a given report type.

        Args:
            report_type: Type of report (WPSR or PSM)
            from_datetime: Starting point for calculation

        Returns:
            datetime: Next release time
        """
        if report_type == ReportType.WPSR:
            return self.get_next_wpsr_release(from_datetime)
        elif report_type == ReportType.PSM:
            return self.get_next_psm_release(from_datetime)
        else:
            raise ValueError(f"Unknown report type: {report_type}")

    def get_polling_window(
        self,
        release_datetime: datetime,
        pre_buffer_minutes: int = 5,
        post_timeout_minutes: int = 30
    ) -> Tuple[datetime, datetime]:
        """
        Calculate the polling window for a release.

        Args:
            release_datetime: Scheduled release time
            pre_buffer_minutes: Minutes before release to start polling
            post_timeout_minutes: Minutes after release to stop polling

        Returns:
            Tuple of (start_time, end_time)
        """
        start_time = release_datetime - timedelta(minutes=pre_buffer_minutes)
        end_time = release_datetime + timedelta(minutes=post_timeout_minutes)
        return start_time, end_time

    def seconds_until_release(
        self,
        report_type: ReportType,
        from_datetime: Optional[datetime] = None
    ) -> float:
        """
        Calculate seconds until the next release.

        Args:
            report_type: Type of report
            from_datetime: Starting point

        Returns:
            float: Seconds until release
        """
        if from_datetime is None:
            from_datetime = datetime.now(self.eastern_tz)
        elif from_datetime.tzinfo is None:
            from_datetime = self.eastern_tz.localize(from_datetime)

        next_release = self.get_next_release(report_type, from_datetime)
        delta = next_release - from_datetime
        return delta.total_seconds()

    def is_within_polling_window(
        self,
        report_type: ReportType,
        pre_buffer_minutes: int = 5,
        post_timeout_minutes: int = 30,
        check_time: Optional[datetime] = None
    ) -> bool:
        """
        Check if the current time is within the polling window.

        Args:
            report_type: Type of report
            pre_buffer_minutes: Minutes before release
            post_timeout_minutes: Minutes after release
            check_time: Time to check (default: now)

        Returns:
            bool: True if within polling window
        """
        if check_time is None:
            check_time = datetime.now(self.eastern_tz)
        elif check_time.tzinfo is None:
            check_time = self.eastern_tz.localize(check_time)

        next_release = self.get_next_release(report_type, check_time)
        start_time, end_time = self.get_polling_window(
            next_release, pre_buffer_minutes, post_timeout_minutes
        )

        return start_time <= check_time <= end_time

    def format_release_info(self, report_type: ReportType) -> str:
        """
        Get a human-readable string describing the next release.

        Args:
            report_type: Type of report

        Returns:
            str: Formatted release information
        """
        next_release = self.get_next_release(report_type)
        seconds_until = self.seconds_until_release(report_type)

        hours_until = int(seconds_until // 3600)
        minutes_until = int((seconds_until % 3600) // 60)

        return (
            f"Next {report_type.value.upper()} release: "
            f"{next_release.strftime('%Y-%m-%d %H:%M %Z')} "
            f"({hours_until}h {minutes_until}m from now)"
        )
