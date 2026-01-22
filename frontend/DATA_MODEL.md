# Data Model

This document describes the data entities and their relationships in the tank management system.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TANK MANAGEMENT SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│        TANK          │
├──────────────────────┤
│ id                   │
│ name                 │
│ location             │◄─────────────────┐
│ feedstock_type       │                  │
│ capacity             │                  │
│ initial_level        │                  │  (grouped by)
│ current_level*       │                  │
│ level_percentage*    │                  │
└──────────┬───────────┘                  │
           │                              │
           │ tank_id                      │
           │ target_tank_id               │
           ▼ (transfers)                  │
┌──────────────────────┐                  │
│      MOVEMENT        │                  │
├──────────────────────┤          ┌───────┴───────┐
│ id                   │          │   LOCATION    │
│ type ────────────────┼──────┐   │  (grouping)   │
│ tank_id ─────────────┼──┐   │   └───────────────┘
│ target_tank_id       │  │   │
│ expected_volume      │  │   │   Types:
│ actual_volume        │  │   │   ├─ load
│ scheduled_date       │  │   └───┼─ discharge
│ notes                │  │       ├─ transfer
│ signal_id ───────────┼──┼─┐     └─ adjustment
│ refinery_tank_name   │  │ │
│ trade_number         │  │ │
│ trade_line_item      │  │ │
│ nomination_key ──────┼──┼─┼─┐
│ pdf_url              │  │ │ │
└──────────────────────┘  │ │ │
           ▲              │ │ │
           │              │ │ │
           │              │ │ │
    ┌──────┴──────────────┘ │ │
    │                       │ │
    │  ┌────────────────────┘ │
    │  │                      │
    │  │   SIGNAL             │
    │  │   (Movement with     │
    │  │    signal_id set,    │
    │  │    tank_id = null    │
    │  │    until assigned)   │
    │  │                      │
    │  └───────┬──────────────┘
    │          │              │
    │          │ signal_id    │ nomination_key
    │          │ (or)         │ (auto-link)
    │          ▼              ▼
    │  ┌──────────────────────┐
    │  │ CERTIFICATE OF       │
    │  │ ANALYSIS (COA)       │
    │  ├──────────────────────┤
    │  │ id                   │
    │  │ signal_id            │
    │  │ nomination_key       │
    │  │ pdf_url              │
    │  │ analysis_date        │
    │  │ ─────────────────────│
    │  │ Chemical Properties: │
    │  │  • bmci              │
    │  │  • api_gravity       │
    │  │  • sulfur_content    │
    │  │  • viscosity         │
    │  │  • flash_point       │
    │  │  • ash_content       │
    │  │  • etc.              │
    │  └──────────────────────┘
    │
    │
    │  WORKFLOW STATES
    ├─────────────────────────────────────────────────────────
    │
    │  SIGNAL LIFECYCLE:
    │  ┌─────────────┐    assign     ┌─────────────┐    add trade    ┌─────────────┐
    │  │ Unassigned  │──────────────►│  Assigned   │───────────────►│  Complete   │
    │  │ (tank_id=∅) │               │ (has tank)  │                │ (has trade) │
    │  └─────────────┘               └─────────────┘                └─────────────┘
    │
    │  MOVEMENT LIFECYCLE:
    │  ┌─────────────┐    complete   ┌─────────────┐
    │  │   Pending   │──────────────►│  Completed  │
    │  │ (actual=∅)  │               │ (has actual)│
    └──┴─────────────┘               └─────────────┘
```

## Entity Descriptions

### Tank

Physical storage container for feedstock (carbon black oil or other).

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `name` | Display name |
| `location` | Physical location (used for grouping in UI) |
| `feedstock_type` | `carbon_black_oil` or `other` |
| `capacity` | Maximum volume |
| `initial_level` | Starting level when tank was created |
| `current_level`* | Calculated from movements |
| `level_percentage`* | Calculated: current_level / capacity |

*Computed fields (TankWithLevel)

### Movement

Records all volume changes in the system.

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `type` | `load`, `discharge`, `transfer`, or `adjustment` |
| `tank_id` | Source tank (null for unassigned signals) |
| `target_tank_id` | Destination tank (transfers only) |
| `expected_volume` | Planned volume |
| `actual_volume` | Actual volume (null = pending) |
| `scheduled_date` | When movement is/was scheduled |
| `signal_id` | Refinery signal ID (if from signal import) |
| `refinery_tank_name` | Refinery tank name from signal |
| `trade_number` | Trade reference number |
| `trade_line_item` | Trade line item |
| `nomination_key` | Key for COA auto-linking |
| `pdf_url` | Reference to source PDF (adjustments) |

### Signal

A **Signal** is not a separate entity - it's a Movement with:
- `signal_id` IS SET (has refinery signal ID)
- `tank_id` IS NULL (until assigned to a tank)

Signals appear on the Signals page until they have both a tank assignment AND trade info.

### Certificate of Analysis (COA)

Chemical analysis document for carbon black oil shipments.

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `signal_id` | Linked signal/movement ID |
| `nomination_key` | Key for auto-linking to signals |
| `pdf_url` | URL to uploaded PDF |
| `analysis_date` | Date of analysis |
| `bmci` | Bureau of Mines Correlation Index |
| `api_gravity` | API gravity measurement |
| `sulfur_content` | Sulfur percentage |
| `viscosity` | Viscosity measurement |
| `flash_point` | Flash point temperature |
| `ash_content` | Ash percentage |
| ... | Other chemical properties |

## Relationships

| From | To | Relationship |
|------|-----|--------------|
| Movement | Tank | Many-to-one via `tank_id` |
| Movement | Tank | Many-to-one via `target_tank_id` (transfers) |
| COA | Movement | One-to-one via `signal_id` or `nomination_key` |
| Tank | Location | Grouped by `location` string |

## Movement Types

| Type | Effect on Tank Level |
|------|---------------------|
| `load` | Increases level |
| `discharge` | Decreases level |
| `transfer` | Decreases source, increases target |
| `adjustment` | Sets level to match physical reading |
