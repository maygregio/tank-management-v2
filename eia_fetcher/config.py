"""
Configuration and constants for EIA Data Fetcher.
"""

import os
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Main configuration for EIA Data Fetcher."""

    # EIA API Configuration
    eia_api_key: str = field(default_factory=lambda: os.getenv("EIA_API_KEY", ""))
    eia_api_base_url: str = "https://api.eia.gov/v2"

    # IR.EIA.GOV URLs (real-time release site)
    ir_eia_base_url: str = "https://ir.eia.gov"
    wpsr_base_url: str = "https://ir.eia.gov/wpsr"

    # PSM URLs
    psm_base_url: str = "https://www.eia.gov/petroleum/supply/monthly"

    # User-Agent (EIA recommended format)
    user_agent: str = field(
        default_factory=lambda: os.getenv(
            "EIA_USER_AGENT",
            "EIADataFetcher/1.0 (tank-management-system)"
        )
    )

    # Polling Configuration
    poll_interval_seconds: int = 5  # Poll every 5 seconds during release window
    pre_release_buffer_minutes: int = 5  # Start polling 5 minutes before scheduled time
    post_release_timeout_minutes: int = 30  # Stop polling after 30 minutes if no data

    # Storage Configuration
    data_dir: str = field(
        default_factory=lambda: os.getenv(
            "EIA_DATA_DIR",
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "eia_data")
        )
    )

    # Notification Configuration (optional)
    notify_email: Optional[str] = field(
        default_factory=lambda: os.getenv("EIA_NOTIFY_EMAIL")
    )
    notify_webhook_url: Optional[str] = field(
        default_factory=lambda: os.getenv("EIA_NOTIFY_WEBHOOK")
    )
    slack_webhook_url: Optional[str] = field(
        default_factory=lambda: os.getenv("EIA_SLACK_WEBHOOK")
    )

    # Logging
    log_level: str = field(
        default_factory=lambda: os.getenv("EIA_LOG_LEVEL", "INFO")
    )
    log_file: Optional[str] = field(
        default_factory=lambda: os.getenv("EIA_LOG_FILE")
    )


# WPSR Files to fetch (Tables 1-14 + summary)
WPSR_FILES = {
    "summary": "wpsrsummary.pdf",
    "overview": "overview.pdf",
    "table1": "table1.csv",
    "table2": "table2.csv",
    "table3": "table3.csv",
    "table4": "table4.csv",
    "table5": "table5.csv",
    "table6": "table6.csv",
    "table7": "table7.csv",
    "table8": "table8.csv",
    "table9": "table9.csv",
    "table10": "table10.csv",
    "table11": "table11.csv",
    "table12": "table12.csv",
    "table13": "table13.csv",
    "table14": "table14.csv",
}

# WPSR Excel files (alternative format)
WPSR_EXCEL_FILES = {
    "psw01": "psw01.xls",  # Table 1 - U.S. Petroleum Balance Sheet
    "psw02": "psw02.xls",  # Table 2 - U.S. Crude Oil Supply and Disposition
    "psw03": "psw03.xls",  # Table 3 - U.S. Refiner and Blender Net Input
    "psw04": "psw04.xls",  # Table 4 - U.S. Refinery Utilization
    "psw05": "psw05.xls",  # Table 5 - U.S. Imports of Crude Oil
    "psw06": "psw06.xls",  # Table 6 - U.S. Product Supplied
    "psw07": "psw07.xls",  # Table 7 - Motor Gasoline
    "psw08": "psw08.xls",  # Table 8 - Distillate Fuel Oil
    "psw09": "psw09.xls",  # Table 9 - Residual Fuel Oil
    "psw10": "psw10.xls",  # Table 10 - Jet Fuel
    "psw11": "psw11.xls",  # Table 11 - Propane/Propylene
    "psw12": "psw12.xls",  # Table 12 - Other Oils
    "psw13": "psw13.xls",  # Table 13 - Stocks
    "psw14": "psw14.xls",  # Table 14 - Days of Supply
}

# EIA API v2 Petroleum endpoints
EIA_API_ENDPOINTS = {
    # Weekly petroleum stocks
    "crude_stocks": "/petroleum/stoc/wstk/data",
    "gasoline_stocks": "/petroleum/stoc/wstk/data",
    "distillate_stocks": "/petroleum/stoc/wstk/data",

    # Weekly supply
    "crude_supply": "/petroleum/sum/snd/data",
    "product_supplied": "/petroleum/cons/psup/data",

    # Refinery operations
    "refinery_input": "/petroleum/pnp/wiup/data",
    "refinery_util": "/petroleum/pnp/unc/data",

    # Imports/Exports
    "crude_imports": "/petroleum/move/wkly/data",

    # Monthly (PSM)
    "monthly_supply": "/petroleum/sum/snd/data",
    "monthly_production": "/petroleum/pnp/gp/data",
}

# Holiday exceptions for WPSR releases (2025-2026)
# Format: {date_string: (release_day, release_time)}
# Normal: Wednesday 10:30 AM ET
# Holiday: Thursday 12:00 PM ET or Monday 5:00 PM ET (Christmas week)
WPSR_HOLIDAY_EXCEPTIONS = {
    # 2025 holidays
    "2025-01-01": ("thursday", "12:00"),  # New Year's Day
    "2025-01-20": ("thursday", "12:00"),  # MLK Day
    "2025-02-17": ("thursday", "12:00"),  # Presidents Day
    "2025-05-26": ("thursday", "12:00"),  # Memorial Day
    "2025-06-19": ("thursday", "12:00"),  # Juneteenth
    "2025-07-04": ("thursday", "12:00"),  # Independence Day
    "2025-09-01": ("thursday", "12:00"),  # Labor Day
    "2025-10-13": ("thursday", "12:00"),  # Columbus Day
    "2025-11-11": ("thursday", "12:00"),  # Veterans Day
    "2025-11-27": ("friday", "12:00"),    # Thanksgiving
    "2025-12-25": ("monday", "17:00"),    # Christmas (released Monday before)

    # 2026 holidays
    "2026-01-01": ("thursday", "12:00"),  # New Year's Day
    "2026-01-19": ("thursday", "12:00"),  # MLK Day
    "2026-02-16": ("thursday", "12:00"),  # Presidents Day
    "2026-05-25": ("thursday", "12:00"),  # Memorial Day
    "2026-06-19": ("thursday", "12:00"),  # Juneteenth
    "2026-07-03": ("thursday", "12:00"),  # Independence Day (observed)
    "2026-09-07": ("thursday", "12:00"),  # Labor Day
    "2026-10-12": ("thursday", "12:00"),  # Columbus Day
    "2026-11-11": ("thursday", "12:00"),  # Veterans Day
    "2026-11-26": ("friday", "12:00"),    # Thanksgiving
    "2026-12-25": ("monday", "17:00"),    # Christmas
}

# PSM release schedule (approximate - end of month)
PSM_RELEASE_DAYS = {
    "2025-12": "2025-12-31",
    "2026-01": "2026-01-30",
    "2026-02": "2026-02-27",
    "2026-03": "2026-03-31",
    "2026-04": "2026-04-30",
    "2026-05": "2026-05-29",
    "2026-06": "2026-06-30",
    "2026-07": "2026-07-31",
    "2026-08": "2026-08-31",
    "2026-09": "2026-09-30",
    "2026-10": "2026-10-30",
    "2026-11": "2026-11-30",
    "2026-12": "2026-12-31",
}

# Timezone
EASTERN_TZ = "America/New_York"

# Normal WPSR release schedule
WPSR_NORMAL_RELEASE_DAY = "wednesday"
WPSR_NORMAL_RELEASE_TIME = "10:30"
WPSR_FULL_RELEASE_TIME = "13:00"  # Full PDFs and HTML at 1:00 PM ET


def get_config() -> Config:
    """Get the configuration instance."""
    return Config()
