# EIA Real-Time Data Fetcher

A Python daemon service for fetching EIA (U.S. Energy Information Administration) petroleum data as soon as it's published.

## Overview

This tool monitors and downloads:
- **WPSR** (Weekly Petroleum Status Report) - Released weekly
- **PSM** (Petroleum Supply Monthly) - Released monthly

## Data Sources & Release Schedule

### Weekly Petroleum Status Report (WPSR)

| Release Type | Day | Time (ET) | Content |
|-------------|-----|-----------|---------|
| Normal | Wednesday | 10:30 AM | Summary + Tables 1-14 (CSV/XLS) |
| Full | Wednesday | 1:00 PM | All PDFs and HTML |
| Holiday | Thursday | 12:00 PM | When Monday is a federal holiday |
| Christmas Week | Monday | 5:00 PM | Special exception |

**Official Release Site:** https://ir.eia.gov/wpsr/

### WPSR Tables Available

| Table | Description |
|-------|-------------|
| Table 1 | U.S. Petroleum Balance Sheet |
| Table 2 | U.S. Crude Oil Supply and Disposition |
| Table 3 | U.S. Refiner and Blender Net Input |
| Table 4 | U.S. Refinery Utilization |
| Table 5 | U.S. Imports of Crude Oil |
| Table 6 | U.S. Product Supplied |
| Table 7 | Motor Gasoline |
| Table 8 | Distillate Fuel Oil |
| Table 9 | Residual Fuel Oil |
| Table 10 | Jet Fuel |
| Table 11 | Propane/Propylene |
| Table 12 | Other Oils |
| Table 13 | Stocks |
| Table 14 | Days of Supply |

### Petroleum Supply Monthly (PSM)

- **Release:** End of month (typically last business day)
- **Time:** During business hours (no fixed time published)
- **Source:** https://www.eia.gov/petroleum/supply/monthly/

## Access Methods Comparison

| Method | Latency | Reliability | Data Format |
|--------|---------|-------------|-------------|
| ir.eia.gov polling | Instant (seconds) | High | CSV, XLS, PDF |
| EIA API v2 | ~30-45 min delay | High | JSON |
| Bulk downloads | Twice daily (5am/3pm) | High | Various |
| RSS/Email | Minutes to hours | Medium | Notification only |

**This tool uses ir.eia.gov polling** for instant detection of new releases.

## Holiday Schedule (2025-2026)

The WPSR release is delayed when a federal holiday falls on Monday (or affects the release week):

### 2025
| Holiday | Date | WPSR Release |
|---------|------|--------------|
| New Year's Day | Jan 1 | Thursday 12:00 PM |
| MLK Day | Jan 20 | Thursday 12:00 PM |
| Presidents Day | Feb 17 | Thursday 12:00 PM |
| Memorial Day | May 26 | Thursday 12:00 PM |
| Juneteenth | Jun 19 | Thursday 12:00 PM |
| Independence Day | Jul 4 | Thursday 12:00 PM |
| Labor Day | Sep 1 | Thursday 12:00 PM |
| Columbus Day | Oct 13 | Thursday 12:00 PM |
| Veterans Day | Nov 11 | Thursday 12:00 PM |
| Thanksgiving | Nov 27 | Friday 12:00 PM |
| Christmas | Dec 25 | Monday 5:00 PM (week before) |

### 2026
| Holiday | Date | WPSR Release |
|---------|------|--------------|
| New Year's Day | Jan 1 | Thursday 12:00 PM |
| MLK Day | Jan 19 | Thursday 12:00 PM |
| Presidents Day | Feb 16 | Thursday 12:00 PM |
| Memorial Day | May 25 | Thursday 12:00 PM |
| Juneteenth | Jun 19 | Thursday 12:00 PM |
| Independence Day | Jul 3 (observed) | Thursday 12:00 PM |
| Labor Day | Sep 7 | Thursday 12:00 PM |
| Columbus Day | Oct 12 | Thursday 12:00 PM |
| Veterans Day | Nov 11 | Thursday 12:00 PM |
| Thanksgiving | Nov 26 | Friday 12:00 PM |
| Christmas | Dec 25 | Monday 5:00 PM (week before) |

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set required environment variables
export EIA_API_KEY="your-eia-api-key"
```

### Optional Environment Variables

```bash
# Data storage location (default: ./eia_data)
export EIA_DATA_DIR="/path/to/data"

# User-Agent for requests (EIA recommends identifying your application)
export EIA_USER_AGENT="MyApp/1.0 (contact@example.com)"

# Logging
export EIA_LOG_LEVEL="INFO"  # DEBUG, INFO, WARNING, ERROR
export EIA_LOG_FILE="/path/to/logfile.log"

# Notifications (optional)
export EIA_SLACK_WEBHOOK="https://hooks.slack.com/services/..."
export EIA_NOTIFY_WEBHOOK="https://your-webhook-url.com/endpoint"
export EIA_NOTIFY_EMAIL="alerts@example.com"

# Email SMTP settings (if using email notifications)
export EIA_SMTP_HOST="smtp.gmail.com"
export EIA_SMTP_PORT="587"
export EIA_SMTP_USER="your-email@gmail.com"
export EIA_SMTP_PASSWORD="your-app-password"
export EIA_SMTP_FROM="your-email@gmail.com"
```

## Usage

### Run as Daemon (Continuous Monitoring)

```bash
# Monitor both WPSR and PSM
python -m eia_fetcher.main

# Monitor WPSR only
python -m eia_fetcher.main --wpsr

# Monitor PSM only
python -m eia_fetcher.main --psm

# Verbose logging
python -m eia_fetcher.main --verbose
```

### Run Once

```bash
# Fetch data once and exit (waits for release window)
python -m eia_fetcher.main --once

# Force fetch immediately (don't wait for new data)
python -m eia_fetcher.main --once --force

# Fetch only WPSR immediately
python -m eia_fetcher.main --once --wpsr --force
```

## How It Works

### Detection Strategy

1. **Schedule Awareness**: Calculates next expected release time based on day of week and holiday exceptions
2. **Pre-release Polling**: Starts polling 5 minutes before scheduled release
3. **Header Checking**: Uses HTTP HEAD requests to check `Last-Modified`, `ETag`, and `Content-Length` headers
4. **Hash Comparison**: Falls back to downloading and hashing files if headers are inconclusive
5. **Polling Interval**: Checks every 5 seconds during the release window
6. **Timeout**: Stops polling after 30 minutes if no new data detected

### Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Schedule       │────▶│  Detector    │────▶│  Fetcher    │
│  (next release) │     │  (polling)   │     │  (download) │
└─────────────────┘     └──────────────┘     └─────────────┘
                                                    │
                                                    ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Notifier       │◀────│  Storage     │◀────│  Parser     │
│  (alerts)       │     │  (CSV/SQLite)│     │  (pandas)   │
└─────────────────┘     └──────────────┘     └─────────────┘
```

## Output Structure

```
eia_data/
├── wpsr/
│   └── 20260116_103500/      # Timestamped directories
│       ├── table1.csv
│       ├── table2.csv
│       ├── ...
│       └── wpsrsummary.pdf
├── psm/
│   └── 20260130_100000/
│       └── psm_summary.csv
├── api/
│   └── psm_api_data_20260130_100500.csv
├── raw/
│   └── (backup raw files)
├── eia_data.db               # SQLite database for history
├── .eia_metadata_cache.json  # File change detection cache
└── .eia_api_period_cache.json # API period tracking
```

## EIA API v2 Reference

The tool also supports fetching data via the EIA API v2 as a backup/supplement.

### API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `/petroleum/stoc/wstk/data` | Weekly petroleum stocks |
| `/petroleum/sum/snd/data` | Supply and disposition |
| `/petroleum/pnp/wiup/data` | Refinery input |
| `/petroleum/pnp/unc/data` | Refinery utilization |
| `/petroleum/move/wkly/data` | Weekly imports/exports |

### API Query Example

```python
from eia_fetcher.api_client import EIAAPIClient

client = EIAAPIClient()

# Get latest crude oil stocks
response = client.get_weekly_crude_stocks(limit=10)
if response.success:
    print(response.dataframe)
```

### API Request Format

```
GET https://api.eia.gov/v2/petroleum/stoc/wstk/data
    ?api_key=YOUR_KEY
    &frequency=weekly
    &data[0]=value
    &sort[0][column]=period
    &sort[0][direction]=desc
    &length=10
```

## User-Agent Requirements

EIA explicitly supports automated access. Use a descriptive User-Agent:

```
User-Agent: EIADataFetcher/1.0 (contact@example.com)
```

## Dependencies

- `requests` - HTTP client
- `pandas` - Data parsing (CSV/Excel)
- `openpyxl` - Excel .xlsx file support
- `xlrd` - Excel .xls file support
- `pytz` - Timezone handling
- `python-dotenv` - Environment variables

## License

MIT License
