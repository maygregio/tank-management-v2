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

# =============================================================================
# EIA API v2 Petroleum Endpoints - Complete Reference
# =============================================================================
# API Base: https://api.eia.gov/v2/petroleum
# Documentation: https://www.eia.gov/opendata/documentation.php
# =============================================================================

# Main Petroleum API Categories (routes under /petroleum/)
EIA_API_CATEGORIES = {
    "crd": "Crude Oil Reserves & Production",
    "sum": "Summary Statistics",
    "pnp": "Refining & Processing",
    "move": "Imports/Exports & Movements",
    "stoc": "Stocks",
    "cons": "Consumption & Sales",
    "pri": "Prices",
}

# Comprehensive EIA API v2 Petroleum Endpoints
EIA_API_ENDPOINTS = {
    # =========================================================================
    # SUMMARY (sum) - Supply & Disposition
    # =========================================================================
    "supply_disposition": "/petroleum/sum/snd/data",           # U.S. Supply and Disposition
    "supply_weekly": "/petroleum/sum/sndw/data",               # Weekly Supply Estimates
    "crude_supply_disposition": "/petroleum/sum/crdsnd/data",  # Crude Oil Supply & Disposition

    # =========================================================================
    # STOCKS (stoc) - Inventories
    # =========================================================================
    "stocks_weekly": "/petroleum/stoc/wstk/data",              # Weekly Stocks by Product
    "stocks_monthly": "/petroleum/stoc/st/data",               # Monthly Stocks
    "stocks_type": "/petroleum/stoc/typ/data",                 # Stocks by Type
    "stocks_refinery": "/petroleum/stoc/ref/data",             # Refinery Stocks
    "stocks_tank_farm": "/petroleum/stoc/cu/data",             # Tank Farm & Pipeline Stocks (incl. Cushing)
    "stocks_bulk_terminal": "/petroleum/stoc/tb/data",         # Bulk Terminal Stocks
    "stocks_ng_plant": "/petroleum/stoc/pn/data",              # Natural Gas Plant Stocks

    # =========================================================================
    # REFINING & PROCESSING (pnp) - Production
    # =========================================================================
    "refinery_input": "/petroleum/pnp/inpt/data",              # Refinery Net Input
    "refinery_utilization": "/petroleum/pnp/unc/data",         # Refinery Utilization & Capacity
    "refinery_yield": "/petroleum/pnp/pct/data",               # Refinery Yield Percent
    "crude_input_quality": "/petroleum/pnp/crq/data",          # Crude Input Qualities (API/Sulfur)
    "net_production": "/petroleum/pnp/gp/data",                # Net Production
    "weekly_production": "/petroleum/pnp/wprodrb/data",        # Weekly Refiner/Blender Production
    "downstream_processing": "/petroleum/pnp/dc/data",         # Downstream Processing
    "ethanol_production": "/petroleum/pnp/ept/data",           # Ethanol Plant Production
    "biodiesel_production": "/petroleum/pnp/bpp/data",         # Biodiesel Production
    "ng_plant_production": "/petroleum/pnp/gpl/data",          # Natural Gas Plant Field Production

    # =========================================================================
    # IMPORTS/EXPORTS & MOVEMENTS (move)
    # =========================================================================
    "imports_weekly": "/petroleum/move/wkly/data",             # Weekly Imports
    "imports_area_entry": "/petroleum/move/imp/data",          # Imports by Area of Entry
    "imports_country": "/petroleum/move/impc/data",            # Imports by Country of Origin
    "imports_processing": "/petroleum/move/imppa/data",        # Imports by Processing Area
    "exports": "/petroleum/move/exp/data",                     # Exports
    "exports_destination": "/petroleum/move/expc/data",        # Exports by Destination
    "net_imports": "/petroleum/move/neti/data",                # Net Imports
    "movements_pipeline": "/petroleum/move/pipe/data",         # Pipeline Movements
    "movements_tanker": "/petroleum/move/tb/data",             # Tanker & Barge Movements
    "movements_rail": "/petroleum/move/rail/data",             # Rail Movements

    # =========================================================================
    # CONSUMPTION & SALES (cons)
    # =========================================================================
    "product_supplied": "/petroleum/cons/psup/data",           # Product Supplied (Consumption Proxy)
    "weekly_product_supplied": "/petroleum/cons/wpsup/data",   # Weekly Product Supplied
    "prime_supplier_sales": "/petroleum/cons/prim/data",       # Prime Supplier Sales Volumes
    "refiner_sales": "/petroleum/cons/refmg/data",             # Refiner Motor Gasoline Sales
    "fuel_oil_sales": "/petroleum/cons/821/data",              # Fuel Oil & Kerosene Sales

    # =========================================================================
    # PRICES (pri)
    # =========================================================================
    "spot_prices": "/petroleum/pri/spt/data",                  # Spot Prices
    "futures_prices": "/petroleum/pri/fut/data",               # NYMEX Futures Prices
    "retail_prices": "/petroleum/pri/gnd/data",                # Retail Gasoline & Diesel Prices
    "heating_oil_propane": "/petroleum/pri/wfr/data",          # Weekly Heating Oil & Propane
    "crude_acquisition_cost": "/petroleum/pri/rac2/data",      # Refiner Acquisition Cost
    "domestic_first_purchase": "/petroleum/pri/dfp/data",      # Domestic Crude First Purchase Price
    "landed_costs": "/petroleum/pri/land/data",                # Landed Costs of Imported Crude

    # =========================================================================
    # CRUDE OIL RESERVES & PRODUCTION (crd)
    # =========================================================================
    "crude_production": "/petroleum/crd/crpdn/data",           # Crude Production by State
    "crude_api_gravity": "/petroleum/crd/api/data",            # Crude by API Gravity
    "proved_reserves": "/petroleum/crd/pres/data",             # Proved Reserves
}

# Facet codes for filtering API queries
EIA_PRODUCT_FACETS = {
    "crude_oil": "EPC0",
    "motor_gasoline": "EPM0",
    "distillate_fuel": "EPD0",
    "residual_fuel": "EPPR",
    "jet_fuel": "EPJK",
    "propane": "EPLLPA",
    "hgl": "EPL0",          # Hydrocarbon Gas Liquids
    "unfinished_oils": "EP00",
    "other_oils": "EPPO",
}

EIA_AREA_FACETS = {
    "us": "NUS",            # United States
    "padd1": "R10",         # East Coast
    "padd2": "R20",         # Midwest
    "padd3": "R30",         # Gulf Coast
    "padd4": "R40",         # Rocky Mountain
    "padd5": "R50",         # West Coast
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

# =============================================================================
# PSM (Petroleum Supply Monthly) Tables - Complete List
# =============================================================================
# Note: CSV files have been discontinued. Data accessed via API or PDF.
# PDF URL pattern: https://www.eia.gov/petroleum/supply/monthly/pdf/tableN.pdf
# =============================================================================

PSM_TABLES = {
    # =========================================================================
    # NATIONAL SUPPLY & DISPOSITION (Tables 1-4)
    # =========================================================================
    "table1": "U.S. Supply, Disposition, and Ending Stocks of Crude Oil and Petroleum Products",
    "table2": "U.S. Year-to-Date Supply, Disposition, and Ending Stocks",
    "table3": "U.S. Daily Average Supply and Disposition",
    "table4": "U.S. Year-to-Date Daily Average Supply and Disposition",

    # =========================================================================
    # PAD DISTRICT SUPPLY & DISPOSITION (Tables 5-24)
    # =========================================================================
    # PADD 1 - East Coast
    "table5": "PAD District 1 - Supply, Disposition, and Ending Stocks",
    "table6": "PAD District 1 - Year-to-Date Supply, Disposition, and Ending Stocks",
    "table7": "PAD District 1 - Daily Average Supply and Disposition",
    "table8": "PAD District 1 - Year-to-Date Daily Average Supply and Disposition",

    # PADD 2 - Midwest
    "table9": "PAD District 2 - Supply, Disposition, and Ending Stocks",
    "table10": "PAD District 2 - Year-to-Date Supply, Disposition, and Ending Stocks",
    "table11": "PAD District 2 - Daily Average Supply and Disposition",
    "table12": "PAD District 2 - Year-to-Date Daily Average Supply and Disposition",

    # PADD 3 - Gulf Coast
    "table13": "PAD District 3 - Supply, Disposition, and Ending Stocks",
    "table14": "PAD District 3 - Year-to-Date Supply, Disposition, and Ending Stocks",
    "table15": "PAD District 3 - Daily Average Supply and Disposition",
    "table16": "PAD District 3 - Year-to-Date Daily Average Supply and Disposition",

    # PADD 4 - Rocky Mountain
    "table17": "PAD District 4 - Supply, Disposition, and Ending Stocks",
    "table18": "PAD District 4 - Year-to-Date Supply, Disposition, and Ending Stocks",
    "table19": "PAD District 4 - Daily Average Supply and Disposition",
    "table20": "PAD District 4 - Year-to-Date Daily Average Supply and Disposition",

    # PADD 5 - West Coast
    "table21": "PAD District 5 - Supply, Disposition, and Ending Stocks",
    "table22": "PAD District 5 - Year-to-Date Supply, Disposition, and Ending Stocks",
    "table23": "PAD District 5 - Daily Average Supply and Disposition",
    "table24": "PAD District 5 - Year-to-Date Daily Average Supply and Disposition",

    # =========================================================================
    # CRUDE OIL (Tables 25-26)
    # =========================================================================
    "table25": "Crude Oil Supply, Disposition, and Ending Stocks by PAD District",
    "table26": "Production of Crude Oil by PAD District and State",

    # =========================================================================
    # NATURAL GAS PLANT & REFINERY (Tables 27-34)
    # =========================================================================
    "table27": "Natural Gas Plant Net Production and Stocks by PAD District",
    "table28": "Refinery Input of Crude Oil and Petroleum Products by PAD District",
    "table29": "Refinery Net Production of Finished Petroleum Products by PAD District",
    "table30": "Refinery Net Production by PAD and Refining Districts",
    "table31": "Refinery Net Production of Finished Petroleum Products by PAD and Refining Districts",
    "table32": "Refinery Stocks by PAD and Refining Districts",
    "table33": "Percent Refinery Yield by PAD and Refining Districts",
    "table34": "Refinery Utilization and Capacity by PAD and Refining Districts",

    # =========================================================================
    # CRUDE OIL QUALITIES (Tables 35-38)
    # =========================================================================
    "table35": "Refinery Input of Crude Oil by API Gravity",
    "table36": "Refinery Input of Crude Oil by Sulfur Content",
    "table37": "Imported Crude Oil by API Gravity",
    "table38": "Imported Crude Oil by Sulfur Content",

    # =========================================================================
    # IMPORTS BY COUNTRY (Tables 39-48)
    # =========================================================================
    "table39": "Imports of Crude Oil and Petroleum Products by Country of Origin",
    "table40": "Year-to-Date Imports by Country of Origin",
    "table41": "PAD District 1 - Imports by Country of Origin",
    "table42": "PAD District 1 - Year-to-Date Imports by Country of Origin",
    "table43": "PAD District 2 - Imports by Country of Origin",
    "table44": "PAD District 2 - Year-to-Date Imports by Country of Origin",
    "table45": "PAD District 3 - Imports by Country of Origin",
    "table46": "PAD District 3 - Year-to-Date Imports by Country of Origin",
    "table47": "PAD Districts 4 and 5 - Imports by Country of Origin",
    "table48": "PAD Districts 4 and 5 - Year-to-Date Imports by Country of Origin",

    # =========================================================================
    # EXPORTS (Tables 49-52)
    # =========================================================================
    "table49": "Exports of Crude Oil and Petroleum Products by PAD District",
    "table50": "Year-to-Date Exports by PAD District",
    "table51": "Exports of Crude Oil and Petroleum Products by Destination",
    "table52": "Year-to-Date Exports by Destination",

    # =========================================================================
    # NET IMPORTS (Tables 53-54)
    # =========================================================================
    "table53": "Net Imports of Crude Oil and Petroleum Products by Country",
    "table54": "Year-to-Date Net Imports by Country",

    # =========================================================================
    # STOCKS (Tables 55-56)
    # =========================================================================
    "table55": "Stocks of Crude Oil and Petroleum Products by PAD District",
    "table56": "Refinery, Bulk Terminal, and Natural Gas Plant Stocks by PAD District and State",

    # =========================================================================
    # MOVEMENTS (Tables 57-60)
    # =========================================================================
    "table57": "Movements of Crude Oil and Petroleum Products by Pipeline",
    "table58": "Movements of Crude Oil and Petroleum Products by Tanker and Barge",
    "table59": "Net Receipts of Crude Oil and Petroleum Products by Pipeline, Tanker, Barge, and Rail",
    "table60": "Movements of Crude Oil and Selected Products by Rail Between PAD Districts",
}

# PSM PDF base URL
PSM_PDF_BASE_URL = "https://www.eia.gov/petroleum/supply/monthly/pdf"

# =============================================================================
# EIA DNAV (Data Navigator) XLS Downloads - Monthly Data Series
# =============================================================================
# URL Pattern: https://www.eia.gov/dnav/pet/xls/[SERIES_CODE].xls
# These provide historical time series data in Excel format
# =============================================================================

DNAV_BASE_URL = "https://www.eia.gov/dnav/pet/xls"

# Monthly data series available for download (XLS format)
DNAV_MONTHLY_SERIES = {
    # =========================================================================
    # SUMMARY - Supply & Disposition
    # =========================================================================
    "supply_disposition": {
        "file": "PET_SUM_SND_D_NUS_MBBL_M.xls",
        "description": "U.S. Supply and Disposition of Crude Oil and Petroleum Products",
    },
    "supply_disposition_daily": {
        "file": "PET_SUM_SND_D_NUS_MBBLPD_M.xls",
        "description": "U.S. Supply and Disposition (Thousand Barrels per Day)",
    },
    "crude_supply_disposition": {
        "file": "PET_SUM_CRDSND_K_M.xls",
        "description": "U.S. Crude Oil Supply and Disposition",
    },

    # =========================================================================
    # CRUDE OIL PRODUCTION
    # =========================================================================
    "crude_production": {
        "file": "PET_CRD_CRPDN_ADC_MBBL_M.xls",
        "description": "U.S. Crude Oil Production by PAD District and State",
    },
    "crude_api_gravity": {
        "file": "PET_CRD_API_ADC_MBBLPD_M.xls",
        "description": "U.S. Crude Oil Production by API Gravity",
    },

    # =========================================================================
    # REFINING & PROCESSING
    # =========================================================================
    "refinery_utilization": {
        "file": "PET_PNP_UNC_DCU_NUS_M.xls",
        "description": "U.S. Refinery Utilization and Capacity",
    },
    "refinery_yield": {
        "file": "PET_PNP_PCT_DC_NUS_PCT_M.xls",
        "description": "U.S. Refinery Yield of Petroleum Products",
    },
    "refinery_input": {
        "file": "PET_PNP_INPT_DC_NUS_MBBL_M.xls",
        "description": "U.S. Refinery and Blender Net Input",
    },
    "refinery_production": {
        "file": "PET_PNP_REFP_DC_NUS_MBBL_M.xls",
        "description": "U.S. Refinery and Blender Net Production",
    },

    # =========================================================================
    # IMPORTS & EXPORTS
    # =========================================================================
    "imports_country": {
        "file": "PET_MOVE_IMPCUS_A2_NUS_EP00_IM0_MBBL_M.xls",
        "description": "U.S. Imports of Crude Oil and Petroleum Products by Country",
    },
    "exports": {
        "file": "PET_MOVE_EXP_DC_NUS-Z00_MBBL_M.xls",
        "description": "U.S. Exports of Crude Oil and Petroleum Products",
    },
    "net_imports": {
        "file": "PET_MOVE_NETI_DC_NUS-Z00_MBBL_M.xls",
        "description": "U.S. Net Imports of Crude Oil and Petroleum Products",
    },

    # =========================================================================
    # STOCKS
    # =========================================================================
    "stocks_type": {
        "file": "PET_STOC_TYP_D_NUS_SAE_MBBL_M.xls",
        "description": "U.S. Stocks of Crude Oil and Petroleum Products by Type",
    },
    "stocks_refinery": {
        "file": "PET_STOC_REF_DC_NUS_MBBL_M.xls",
        "description": "U.S. Refinery Stocks of Crude Oil and Petroleum Products",
    },
    "stocks_tank_farm": {
        "file": "PET_STOC_CU_S1_M.xls",
        "description": "U.S. Crude Oil Stocks at Tank Farms and Pipelines",
    },

    # =========================================================================
    # CONSUMPTION / PRODUCT SUPPLIED
    # =========================================================================
    "product_supplied": {
        "file": "PET_CONS_PSUP_DC_NUS_MBBL_M.xls",
        "description": "U.S. Product Supplied (Consumption) of Petroleum Products",
    },
    "product_supplied_daily": {
        "file": "PET_CONS_PSUP_DC_NUS_MBBLPD_M.xls",
        "description": "U.S. Product Supplied (Thousand Barrels per Day)",
    },

    # =========================================================================
    # PRICES
    # =========================================================================
    "spot_prices": {
        "file": "PET_PRI_SPT_S1_M.xls",
        "description": "Spot Prices for Crude Oil and Petroleum Products",
    },
    "futures_prices": {
        "file": "PET_PRI_FUT_S1_M.xls",
        "description": "NYMEX Futures Prices for Crude Oil and Petroleum Products",
    },
    "crude_acquisition_cost": {
        "file": "PET_PRI_RAC2_DCU_NUS_M.xls",
        "description": "Refiner Acquisition Cost of Crude Oil",
    },
    "retail_prices": {
        "file": "PET_PRI_GND_DCUS_NUS_M.xls",
        "description": "U.S. Retail Gasoline and Diesel Prices",
    },
}

# Weekly data series (for WPSR supplement)
DNAV_WEEKLY_SERIES = {
    "weekly_supply": {
        "file": "PET_SUM_SNDW_DCUS_NUS_W.xls",
        "description": "U.S. Weekly Supply Estimates",
    },
    "weekly_stocks": {
        "file": "PET_STOC_WSTK_DCU_NUS_W.xls",
        "description": "U.S. Weekly Stocks of Petroleum Products",
    },
    "weekly_imports": {
        "file": "PET_MOVE_WKLY_DC_NUS-Z00_MBBLPD_W.xls",
        "description": "U.S. Weekly Imports and Exports",
    },
    "weekly_refinery": {
        "file": "PET_PNP_WIUP_DCU_NUS_W.xls",
        "description": "U.S. Weekly Refinery Inputs and Utilization",
    },
    "weekly_production": {
        "file": "PET_PNP_WPRODRB_DCU_NUS_W.xls",
        "description": "U.S. Weekly Refiner and Blender Production",
    },
    "weekly_product_supplied": {
        "file": "PET_CONS_WPSUP_K_W.xls",
        "description": "U.S. Weekly Product Supplied",
    },
}

# PSM data categories for API fetching (maps to EIA_API_ENDPOINTS)
PSM_API_DATA_CATEGORIES = {
    "supply_disposition": {
        "endpoint": "/petroleum/sum/snd/data",
        "frequency": "monthly",
        "description": "Supply and Disposition",
    },
    "crude_supply": {
        "endpoint": "/petroleum/sum/crdsnd/data",
        "frequency": "monthly",
        "description": "Crude Oil Supply and Disposition",
    },
    "stocks": {
        "endpoint": "/petroleum/stoc/st/data",
        "frequency": "monthly",
        "description": "Stocks by Product and Area",
    },
    "refinery_input": {
        "endpoint": "/petroleum/pnp/inpt/data",
        "frequency": "monthly",
        "description": "Refinery Net Input",
    },
    "refinery_production": {
        "endpoint": "/petroleum/pnp/gp/data",
        "frequency": "monthly",
        "description": "Refinery Net Production",
    },
    "refinery_utilization": {
        "endpoint": "/petroleum/pnp/unc/data",
        "frequency": "monthly",
        "description": "Refinery Utilization and Capacity",
    },
    "refinery_yield": {
        "endpoint": "/petroleum/pnp/pct/data",
        "frequency": "monthly",
        "description": "Refinery Yield Percent",
    },
    "crude_qualities": {
        "endpoint": "/petroleum/pnp/crq/data",
        "frequency": "monthly",
        "description": "Crude Input Qualities (API/Sulfur)",
    },
    "imports": {
        "endpoint": "/petroleum/move/imp/data",
        "frequency": "monthly",
        "description": "Imports by Area of Entry",
    },
    "imports_country": {
        "endpoint": "/petroleum/move/impc/data",
        "frequency": "monthly",
        "description": "Imports by Country of Origin",
    },
    "exports": {
        "endpoint": "/petroleum/move/exp/data",
        "frequency": "monthly",
        "description": "Exports",
    },
    "exports_destination": {
        "endpoint": "/petroleum/move/expc/data",
        "frequency": "monthly",
        "description": "Exports by Destination",
    },
    "net_imports": {
        "endpoint": "/petroleum/move/neti/data",
        "frequency": "monthly",
        "description": "Net Imports by Country",
    },
    "movements_pipeline": {
        "endpoint": "/petroleum/move/pipe/data",
        "frequency": "monthly",
        "description": "Pipeline Movements",
    },
    "movements_tanker": {
        "endpoint": "/petroleum/move/tb/data",
        "frequency": "monthly",
        "description": "Tanker and Barge Movements",
    },
    "movements_rail": {
        "endpoint": "/petroleum/move/rail/data",
        "frequency": "monthly",
        "description": "Rail Movements",
    },
    "product_supplied": {
        "endpoint": "/petroleum/cons/psup/data",
        "frequency": "monthly",
        "description": "Product Supplied (Consumption)",
    },
    "crude_production": {
        "endpoint": "/petroleum/crd/crpdn/data",
        "frequency": "monthly",
        "description": "Crude Production by State",
    },
    "ng_plant_production": {
        "endpoint": "/petroleum/pnp/gpl/data",
        "frequency": "monthly",
        "description": "Natural Gas Plant Production",
    },
}


def get_config() -> Config:
    """Get the configuration instance."""
    return Config()
