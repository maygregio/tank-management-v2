# EIA Real-Time Data Fetcher

A Python daemon service for fetching EIA (U.S. Energy Information Administration) petroleum data as soon as it's published.

## Overview

This tool monitors and downloads all petroleum data from the EIA:
- **WPSR** (Weekly Petroleum Status Report) - Released weekly
- **PSM** (Petroleum Supply Monthly) - Released monthly
- **All Petroleum API Data** - Stocks, production, imports/exports, prices, consumption

## Data Sources

### Primary Sources

| Source | URL | Update Frequency |
|--------|-----|------------------|
| WPSR (Real-time) | https://ir.eia.gov/wpsr/ | Weekly (Wed 10:30 AM ET) |
| PSM | https://www.eia.gov/petroleum/supply/monthly/ | Monthly (end of month) |
| EIA API v2 | https://api.eia.gov/v2/petroleum | Varies by dataset |
| Petroleum Data Hub | https://www.eia.gov/petroleum/data.php | All frequencies |

### Access Methods Comparison

| Method | Latency | Reliability | Data Format |
|--------|---------|-------------|-------------|
| ir.eia.gov polling | Instant (seconds) | High | CSV, XLS, PDF |
| EIA API v2 | ~30-45 min delay | High | JSON |
| Bulk downloads | Twice daily (5am/3pm) | High | Various |

**This tool uses ir.eia.gov polling** for instant detection of new releases.

---

## Weekly Petroleum Status Report (WPSR)

### Release Schedule

| Release Type | Day | Time (ET) | Content |
|-------------|-----|-----------|---------|
| Normal | Wednesday | 10:30 AM | Summary + Tables 1-14 (CSV/XLS) |
| Full | Wednesday | 1:00 PM | All PDFs and HTML |
| Holiday | Thursday | 12:00 PM | When Monday is a federal holiday |
| Christmas Week | Monday | 5:00 PM | Special exception |

### WPSR Tables (Tables 1-14)

| Table | Name | Description |
|-------|------|-------------|
| 1 | U.S. Petroleum Balance Sheet | Overall supply/demand balance |
| 2 | U.S. Crude Oil Supply and Disposition | Crude oil production, imports, stocks |
| 3 | U.S. Refiner and Blender Net Input | Refinery inputs by product |
| 4 | U.S. Refinery Utilization | Capacity utilization rates |
| 5 | U.S. Imports of Crude Oil | Crude imports by country |
| 6 | U.S. Product Supplied | Consumption/demand proxy |
| 7 | Motor Gasoline | Gasoline stocks, production, imports |
| 8 | Distillate Fuel Oil | Diesel/heating oil data |
| 9 | Residual Fuel Oil | Heavy fuel oil data |
| 10 | Jet Fuel | Aviation fuel data |
| 11 | Propane/Propylene | LPG data |
| 12 | Other Oils | Specialty products |
| 13 | Stocks | All product inventories |
| 14 | Days of Supply | Coverage ratios |

### Files Available at ir.eia.gov/wpsr/

**CSV Files:**
- `table1.csv` through `table14.csv`

**Excel Files:**
- `psw01.xls` through `psw14.xls`

**PDF Reports:**
- `wpsrsummary.pdf` - Executive summary
- `overview.pdf` - Market overview

---

## Petroleum Supply Monthly (PSM)

### Release Schedule

- **Release:** End of month (typically last business day)
- **Time:** During business hours (no fixed time published)
- **Data Lag:** ~2 months (e.g., December release contains October data)

**Note:** PSM provides preliminary data. Final data appears in Petroleum Supply Annual.

**Important:** CSV files have been discontinued. Data accessed via PDF or API.

### PSM Tables (60 Tables)

#### National Supply & Disposition (Tables 1-4)
| Table | Description |
|-------|-------------|
| 1 | U.S. Supply, Disposition, and Ending Stocks |
| 2 | U.S. Year-to-Date Supply, Disposition, and Ending Stocks |
| 3 | U.S. Daily Average Supply and Disposition |
| 4 | U.S. Year-to-Date Daily Average Supply and Disposition |

#### PAD District Supply & Disposition (Tables 5-24)
| Tables | PAD District |
|--------|--------------|
| 5-8 | PADD 1 (East Coast) |
| 9-12 | PADD 2 (Midwest) |
| 13-16 | PADD 3 (Gulf Coast) |
| 17-20 | PADD 4 (Rocky Mountain) |
| 21-24 | PADD 5 (West Coast) |

#### Crude Oil (Tables 25-26)
| Table | Description |
|-------|-------------|
| 25 | Crude Oil Supply, Disposition, and Ending Stocks by PAD District |
| 26 | Production of Crude Oil by PAD District and State |

#### Natural Gas Plant & Refinery (Tables 27-34)
| Table | Description |
|-------|-------------|
| 27 | Natural Gas Plant Net Production and Stocks |
| 28 | Refinery Input of Crude Oil and Petroleum Products |
| 29 | Refinery Net Production of Finished Products |
| 30-31 | Refinery Net Production by PAD and Refining Districts |
| 32 | Refinery Stocks by PAD and Refining Districts |
| 33 | Percent Refinery Yield |
| 34 | Refinery Utilization and Capacity |

#### Crude Oil Qualities (Tables 35-38)
| Table | Description |
|-------|-------------|
| 35 | Refinery Input by API Gravity |
| 36 | Refinery Input by Sulfur Content |
| 37 | Imported Crude by API Gravity |
| 38 | Imported Crude by Sulfur Content |

#### Imports by Country (Tables 39-48)
| Table | Description |
|-------|-------------|
| 39-40 | U.S. Imports by Country of Origin |
| 41-42 | PADD 1 Imports by Country |
| 43-44 | PADD 2 Imports by Country |
| 45-46 | PADD 3 Imports by Country |
| 47-48 | PADDs 4 & 5 Imports by Country |

#### Exports (Tables 49-52)
| Table | Description |
|-------|-------------|
| 49-50 | Exports by PAD District |
| 51-52 | Exports by Destination Country |

#### Net Imports (Tables 53-54)
| Table | Description |
|-------|-------------|
| 53 | Net Imports by Country |
| 54 | Year-to-Date Net Imports by Country |

#### Stocks (Tables 55-56)
| Table | Description |
|-------|-------------|
| 55 | Stocks by PAD District |
| 56 | Refinery, Bulk Terminal, and NG Plant Stocks by State |

#### Movements (Tables 57-60)
| Table | Description |
|-------|-------------|
| 57 | Movements by Pipeline |
| 58 | Movements by Tanker and Barge |
| 59 | Net Receipts by Pipeline, Tanker, Barge, and Rail |
| 60 | Movements by Rail Between PAD Districts |

### Product Categories Tracked
- Crude oil
- Hydrocarbon Gas Liquids (ethane, propane, butanes, natural gasoline)
- Motor gasoline (all grades and formulations)
- Jet fuel (kerosene and naphtha types)
- Distillate fuel oil
- Residual fuel oil
- Lubricants, asphalt, petroleum coke
- Other specialty products

---

## Complete EIA Petroleum Data Reference

### API Categories

| Route | Category | Description |
|-------|----------|-------------|
| `/petroleum/sum` | Summary | Supply & disposition data |
| `/petroleum/stoc` | Stocks | Inventory levels |
| `/petroleum/pnp` | Refining | Production & processing |
| `/petroleum/move` | Movements | Imports, exports, transport |
| `/petroleum/cons` | Consumption | Sales & product supplied |
| `/petroleum/pri` | Prices | Spot, futures, retail prices |
| `/petroleum/crd` | Crude | Reserves & production |

### Summary Data (sum)
- **Weekly supply estimates**: Production, refinery inputs, stocks, imports/exports
- **Supply and disposition**: Field production, imports, stock changes, exports by region
- **Crude oil supply & disposition**: Including Strategic Petroleum Reserve data

### Stocks Data (stoc)
- **Weekly stocks**: By product and PAD district
- **Monthly/annual stocks**: By type (crude, gasoline, distillate, residual, propane)
- **Refinery stocks**: By refining district
- **Tank farm stocks**: Including Cushing, Oklahoma data
- **Bulk terminal stocks**: By state
- **Natural gas plant stocks**: By product

### Refining & Processing Data (pnp)
- **Refinery net input**: Crude and products by district
- **Utilization and capacity**: Gross input, capacity, utilization rates
- **Crude input qualities**: Sulfur content and API gravity
- **Downstream processing**: Catalytic cracking, hydrocracking, coking
- **Net production**: Finished products by district
- **Refinery yield**: Percent yield by product
- **Ethanol plant production**: Monthly production data
- **Biodiesel production**: Monthly data
- **Natural gas plant field production**: Net product output

### Imports/Exports & Movements (move)
- **Weekly imports & exports**: Crude and products by region
- **Imports by area of entry**: By port/district
- **Imports by country of origin**: With country breakdown
- **PAD district imports by country**: Crude and unfinished oils
- **Exports by destination**: By country
- **Net imports**: By country and product
- **Pipeline movements**: Inter-district transfers
- **Tanker and barge movements**: Inter-district transfers
- **Rail movements**: Crude and products by rail

### Consumption & Sales (cons)
- **Product supplied**: Weekly and monthly (consumption proxy)
- **Prime supplier sales volumes**: By region/state
- **Refiner sales volumes**: Motor gasoline, residual fuel
- **Fuel oil and kerosene sales**: By end use

### Price Data (pri)
- **Spot prices**: Crude oil and products (daily/weekly/monthly)
- **Futures prices (NYMEX)**: Crude, gasoline, heating oil, propane
- **Retail prices**: Gasoline and diesel by grade and location
- **Heating oil and propane**: Weekly during heating season
- **Crude acquisition costs**: Domestic, imported, composite
- **Domestic crude first purchase prices**: By area, stream, API gravity
- **Landed costs**: F.O.B. and landed costs by area

### Crude Oil Reserves & Production (crd)
- **Production**: By U.S., PAD District, and state
- **By API gravity**: Production by gravity classification
- **Tight oil estimates**: By play from state data
- **Proved reserves**: Annual reserves changes
- **Gulf of Mexico production**: Federal offshore data

---

## Holiday Schedule (2025-2026)

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

---

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set required environment variables
export EIA_API_KEY="your-eia-api-key"
```

### Get an API Key

1. Go to https://www.eia.gov/opendata/
2. Click "Register" and create an account
3. Your API key will be emailed to you

### Optional Environment Variables

```bash
# Data storage location (default: repo-root/eia_data)
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

---

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

---

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

---

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
├── psm/
│   └── psm_api_data_20260130_100500.csv
├── raw/
│   └── (backup raw files)
├── eia_data.db               # SQLite database for history
├── .eia_metadata_cache.json  # File change detection cache
└── .eia_api_period_cache.json # API period tracking
```

---

## EIA API v2 Reference

### Base URL
```
https://api.eia.gov/v2/petroleum
```

### Main Endpoints

| Endpoint | Description |
|----------|-------------|
| `/petroleum/sum/snd/data` | Supply and Disposition |
| `/petroleum/stoc/wstk/data` | Weekly Stocks |
| `/petroleum/stoc/st/data` | Monthly Stocks |
| `/petroleum/pnp/inpt/data` | Refinery Net Input |
| `/petroleum/pnp/unc/data` | Refinery Utilization |
| `/petroleum/move/wkly/data` | Weekly Imports |
| `/petroleum/move/impc/data` | Imports by Country |
| `/petroleum/move/exp/data` | Exports |
| `/petroleum/cons/psup/data` | Product Supplied |
| `/petroleum/pri/spt/data` | Spot Prices |
| `/petroleum/pri/gnd/data` | Retail Prices |
| `/petroleum/crd/crpdn/data` | Crude Production |

### Product Facet Codes

| Product | Code |
|---------|------|
| Crude Oil | EPC0 |
| Motor Gasoline | EPM0 |
| Distillate Fuel Oil | EPD0 |
| Residual Fuel Oil | EPPR |
| Jet Fuel | EPJK |
| Propane | EPLLPA |
| Hydrocarbon Gas Liquids | EPL0 |

### Area Facet Codes

| Area | Code |
|------|------|
| United States | NUS |
| PADD 1 (East Coast) | R10 |
| PADD 2 (Midwest) | R20 |
| PADD 3 (Gulf Coast) | R30 |
| PADD 4 (Rocky Mountain) | R40 |
| PADD 5 (West Coast) | R50 |

### Example API Query

```python
from eia_fetcher.api_client import EIAAPIClient

client = EIAAPIClient()

# Get latest crude oil stocks
response = client.get_weekly_crude_stocks(limit=10)
if response.success:
    print(response.dataframe)
```

### Raw API Request

```
GET https://api.eia.gov/v2/petroleum/stoc/wstk/data
    ?api_key=YOUR_KEY
    &frequency=weekly
    &data[0]=value
    &facets[product][]=EPC0
    &sort[0][column]=period
    &sort[0][direction]=desc
    &length=10
```

---

## Regular EIA Release Schedule

| Day | Time (ET) | Report |
|-----|-----------|--------|
| Monday | 5:00 PM | Gasoline and Diesel Fuel Update |
| Wednesday | 10:30 AM | Weekly Petroleum Status Report (WPSR) |
| Wednesday | 1:00+ PM | This Week in Petroleum |
| Wednesday | (Oct-Mar) | Heating Oil and Propane Update |
| End of Month | Business hours | Petroleum Supply Monthly (PSM) |

---

## Dependencies

- `requests` - HTTP client
- `pandas` - Data parsing (CSV/Excel)
- `openpyxl` - Excel .xlsx file support
- `xlrd` - Excel .xls file support
- `pytz` - Timezone handling
- `python-dotenv` - Environment variables

---

## References

- [EIA Open Data](https://www.eia.gov/opendata/)
- [EIA API Documentation](https://www.eia.gov/opendata/documentation.php)
- [Petroleum Data Hub](https://www.eia.gov/petroleum/data.php)
- [WPSR Release Page](https://www.eia.gov/petroleum/supply/weekly/)
- [PSM Release Page](https://www.eia.gov/petroleum/supply/monthly/)

---

## License

MIT License
