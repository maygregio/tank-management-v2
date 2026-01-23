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
│ trade_number         │  │ │     Workflow Fields:
│ trade_line_item      │  │ │     ├─ strategy
│ nomination_key ──────┼──┼─┼─┐   ├─ destination
│ pdf_url              │  │ │ │   ├─ equipment
│ strategy             │  │ │ │   ├─ discharge_date
│ destination          │  │ │ │   ├─ base_diff
│ equipment            │  │ │ │   └─ quality_adj_diff
│ discharge_date       │  │ │ │
│ base_diff            │  │ │ │
│ quality_adj_diff     │  │ │ │
└──────────────────────┘  │ │ │
           ▲              │ │ │
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

Records all volume changes in the system. Uses paired fields pattern for system vs. user values.

#### Core Fields
| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `type` | `load`, `discharge`, `transfer`, or `adjustment` |
| `target_tank_id` | Destination tank (transfers only) |
| `actual_volume` | Actual volume (null = pending) |
| `signal_id` | Refinery signal ID (if from signal import) |
| `refinery_tank_name` | Refinery tank name from signal |
| `nomination_key` | Key for COA auto-linking |
| `pdf_url` | Reference to source PDF (adjustments) |

#### Paired Fields (Default + Manual)

These fields use the paired pattern where `*_default` stores system/import values and `*_manual` stores user overrides. The computed property returns `manual ?? default`.

| Computed Field | Default Field | Manual Field | Description |
|----------------|---------------|--------------|-------------|
| `tank_id` | `tank_id_default` | `tank_id_manual` | Assigned tank |
| `expected_volume` | `expected_volume_default` | `expected_volume_manual` | Planned volume |
| `scheduled_date` | `scheduled_date_default` | `scheduled_date_manual` | Load/scheduled date |
| `notes` | `notes_default` | `notes_manual` | Status comments |
| `trade_number` | `trade_number_default` | `trade_number_manual` | Trade reference |
| `trade_line_item` | `trade_line_item_default` | `trade_line_item_manual` | Trade line item |
| `strategy` | `strategy_default` | `strategy_manual` | Strategy number |
| `destination` | `destination_default` | `destination_manual` | Destination |
| `equipment` | `equipment_default` | `equipment_manual` | Equipment used |
| `discharge_date` | `discharge_date_default` | `discharge_date_manual` | Discharge date |
| `base_diff` | `base_diff_default` | `base_diff_manual` | Base differential |
| `quality_adj_diff` | `quality_adj_diff_default` | `quality_adj_diff_manual` | Quality adjustment differential |

### MovementWithCOA

Extended Movement type used by the Overview grid. Includes COA chemical properties joined via `nomination_key` or `signal_id`.

| Field | Description |
|-------|-------------|
| *(all Movement fields)* | |
| `coa_api_gravity` | API gravity from linked COA |
| `coa_sulfur_content` | Sulfur content from linked COA |
| `coa_viscosity` | Viscosity from linked COA |
| `coa_ash_content` | Ash content from linked COA |

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
| `specific_gravity` | Specific gravity |
| `sulfur_content` | Sulfur percentage |
| `viscosity` | Viscosity measurement |
| `viscosity_temp` | Temperature for viscosity reading |
| `flash_point` | Flash point temperature |
| `ash_content` | Ash percentage |
| `moisture_content` | Moisture percentage |
| `toluene_insoluble` | Toluene insoluble percentage |
| `sodium_content` | Sodium content (ppm) |

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
| `adjustment` | Sets level to match physical reading (can be positive or negative) |

## API Update Pattern

When updating Movement fields, send only the `*_manual` variant:

```typescript
// Update expected volume
movementsApi.update(id, { expected_volume_manual: 5000 });

// Update multiple fields
movementsApi.update(id, {
  notes_manual: "Updated status",
  strategy_manual: 2,
  quality_adj_diff_manual: 0.05
});
```

The backend stores the manual value and the computed property returns `manual ?? default`.
