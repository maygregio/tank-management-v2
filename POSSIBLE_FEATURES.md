# Possible Features for Tank Management System

This document outlines potential features and enhancements for the tank management system, based on industry research and best practices for oil refining, trading, and distribution operations.

---

## Current System Capabilities

The system currently handles:
- **Tank Management**: Create/manage tanks with capacity, location, feedstock type
- **Movements**: Load, discharge, transfer, and adjustment operations
- **Signals**: Refinery signal intake with tank assignment and trade info workflows
- **COA (Certificate of Analysis)**: PDF upload with AI-powered chemical property extraction
- **Adjustments/Calibration**: Physical reading reconciliation with computed levels
- **PDF Import**: Extract movement data from reports

---

## 1. Real-Time Tank Gauging & Monitoring

### Automatic Tank Gauging (ATG) Integration
- **IoT Sensor Integration**: Connect to level sensors, temperature probes, and pressure transmitters
- **Real-Time Level Updates**: Live dashboard showing current tank levels without manual entry
- **Multi-Parameter Monitoring**: Track level, temperature, water interface, and pressure simultaneously
- **Alert System**: Configurable thresholds for high/low levels, temperature deviations, leak detection
- **Mobile Notifications**: Push notifications for critical alerts

### Tank Level Visualization
- **3D Tank Farm View**: Visual representation of all tanks with color-coded fill levels
- **Historical Trend Charts**: Interactive graphs showing level changes over time
- **Predictive Fill Levels**: Estimate when tanks will be full/empty based on current flow rates

**Reference**: [Emerson Tank Gauging System](https://www.emerson.com/en-us/automation/measurement-instrumentation/tank-gauging-system)

---

## 2. Blending & Quality Management

### Blend Optimization
- **Recipe Management**: Define and store blend recipes with target specifications
- **In-Line Blending Control**: Real-time adjustment of component ratios during blending
- **Property Prediction**: Calculate blend properties (BMCI, sulfur, gravity) based on component COAs
- **Cost Optimization**: Minimize cost while meeting quality specifications
- **Blend History & Diagnostics**: Track all blends with actual vs. target comparison

### Quality Control
- **Specification Limits**: Define min/max ranges for each chemical property
- **Out-of-Spec Alerts**: Automatic flagging when COA values exceed limits
- **Quality Trend Analysis**: Track property variations over time by supplier/source
- **Batch Genealogy**: Trace product quality back to source tanks and signals
- **Lab Integration**: Import lab results (LIMS integration) for comprehensive quality data

**Reference**: [Emerson Inventory Control in Blending](https://www.emerson.com/en-us/automation/measurement-instrumentation/common-applications/inventory-control-in-lubricant-production-blending-and-storage)

---

## 3. Mass Balance & Loss Accounting

### Hydrocarbon Accounting
- **Daily Mass Balance**: Automated calculation of inputs vs. outputs
- **Reconciliation Reports**: Compare measured vs. calculated inventory
- **Loss Categories**: Track allocated losses (evaporation, flaring) vs. unallocated losses
- **Variance Analysis**: Identify and investigate discrepancies by tank, product, or period
- **Custody Transfer Accuracy**: Validate meter readings against tank dips

### Loss Reduction Tools
- **Evaporation Modeling**: Estimate vapor losses based on product and temperature
- **Leak Detection**: Flag unexplained inventory losses for investigation
- **Meter Calibration Tracking**: Schedule and record meter calibrations
- **Audit Trail**: Complete history of all inventory adjustments with reasons

**Reference**: [AVEVA Production Accounting](https://www.aveva.com/en/products/production-accounting/)

---

## 4. Trading & Risk Management (ETRM)

### Trade Capture
- **Deal Entry**: Record physical and derivative trades (futures, swaps, options)
- **Contract Management**: Store contract terms, pricing formulas, delivery schedules
- **Position Tracking**: Real-time view of long/short positions by product and period
- **Counterparty Management**: Track counterparty details, credit limits, and exposure

### Hedging & Risk
- **Price Exposure Analysis**: Calculate open price risk by product and period
- **Hedge Recommendations**: Suggest hedging strategies to reduce exposure
- **What-If Analysis**: Model impact of price movements on P&L
- **Value at Risk (VaR)**: Daily VaR calculations for risk reporting
- **Mark-to-Market (MTM)**: Daily P&L valuation of all positions

### Regulatory Compliance
- **Trade Reporting**: Automated reporting for EMIR, Dodd-Frank, MiFID II
- **Audit Logs**: Complete trail of all trade entries and modifications
- **Position Limits**: Monitor and alert when approaching regulatory limits

**Reference**: [Inatech ETRM Guide](https://www.inatech.com/blog/what-is-energy-trading-risk-management-etrm-software/)

---

## 5. Scheduling & Logistics

### Terminal Scheduling
- **Bay Scheduling**: Manage truck, rail, and marine loading/unloading schedules
- **Appointment System**: Allow carriers to book time slots
- **Wait Time Tracking**: Monitor and reduce truck turnaround times
- **Capacity Planning**: View daily/weekly loading capacity vs. scheduled volumes

### Transportation Management
- **Vessel/Truck Tracking**: Monitor incoming and outgoing shipments
- **Demurrage Calculation**: Track vessel delays and calculate demurrage costs
- **Nominations**: Submit and track pipeline nominations
- **Route Optimization**: Plan efficient delivery routes for truck fleets

### Pipeline Integration
- **Nomination Submission**: Electronic submission to pipeline operators
- **Allocation Tracking**: Record actual allocated volumes vs. nominations
- **Imbalance Management**: Monitor and resolve pipeline imbalances

**Reference**: [Emerson Terminal Scheduling](https://www.emerson.com/en-us/automation/advanced-industry-software/oil-and-gas/terminal-scheduling-software-terminalscheduler)

---

## 6. Regulatory Compliance & HSE

### Environmental Compliance
- **Emissions Tracking**: Calculate and report VOC, CO2, and other emissions
- **SPCC Compliance**: Spill Prevention, Control, and Countermeasure documentation
- **Waste Tracking**: Log hazardous waste generation and disposal
- **Environmental Permits**: Track permit requirements and renewal dates

### Safety & Health
- **Incident Logging**: Record and track safety incidents
- **Near-Miss Reporting**: Capture and analyze near-miss events
- **Safety Inspections**: Schedule and document tank inspections
- **PPE Tracking**: Manage personal protective equipment requirements

### Regulatory Reporting
- **API Standards**: Track compliance with API 650, API 653 requirements
- **Inspection Scheduling**: Plan and document tank inspections per API 653
- **Certificate Management**: Track tank certifications and expiration dates
- **Audit Preparation**: Generate documentation packages for regulatory audits

**Reference**: [SafetyCulture Oil Storage Regulations](https://safetyculture.com/topics/oil-storage)

---

## 7. Financial Integration

### Accounting Integration
- **ERP Sync**: Two-way integration with SAP, Oracle, or other ERP systems
- **Invoice Generation**: Automatic invoice creation from completed movements
- **Cost Allocation**: Allocate storage and handling costs to products
- **Accruals Management**: Track and record accrued revenues and expenses

### Pricing & Billing
- **Dynamic Pricing**: Support for index-linked and formula-based pricing
- **Price Curves**: Maintain forward price curves for valuation
- **Billing Automation**: Generate customer invoices based on movements
- **Payment Tracking**: Monitor receivables and flag overdue accounts

### Financial Reporting
- **Inventory Valuation**: FIFO, LIFO, weighted average, and market value methods
- **Period-End Close**: Automated month-end inventory valuation
- **Cost of Goods Sold**: Calculate COGS based on actual product costs
- **Margin Analysis**: Track profitability by product, customer, or trade

**Reference**: [iRely Petroleum Distribution Software](https://irely.com/solutions/petroleum-distribution-software/)

---

## 8. Advanced Analytics & AI

### Predictive Analytics
- **Demand Forecasting**: Predict future product demand using historical patterns
- **Level Prediction**: Forecast tank levels based on scheduled movements
- **Maintenance Prediction**: Predict equipment failures before they occur
- **Supply Chain Optimization**: Optimize inventory levels across locations

### AI-Powered Features
- **Enhanced PDF Extraction**: Expand AI extraction to more document types
- **Anomaly Detection**: Identify unusual patterns in inventory or movements
- **Natural Language Queries**: Ask questions about inventory in plain English
- **Automated Data Entry**: OCR for bills of lading, tickets, and other documents

### Business Intelligence
- **Custom Dashboards**: Build personalized views with drag-and-drop widgets
- **KPI Tracking**: Define and monitor key performance indicators
- **Benchmarking**: Compare performance across locations or time periods
- **Executive Reports**: Automated generation of management summaries

---

## 9. Mobile & Field Operations

### Mobile App
- **Tank Readings**: Enter physical tank readings from the field
- **Photo Documentation**: Capture photos of tanks, meters, or issues
- **Barcode/QR Scanning**: Scan tank IDs for quick data entry
- **Offline Mode**: Work without connectivity, sync when connected

### Field Operations
- **Driver App**: Mobile interface for truck drivers during loading/unloading
- **Digital Tickets**: Electronic bill of lading and delivery tickets
- **Signature Capture**: Digital signatures for proof of delivery
- **GPS Tracking**: Track truck locations in real-time

---

## 10. Multi-Site & Enterprise Features

### Multi-Terminal Support
- **Location Hierarchy**: Organize terminals by region, country, or business unit
- **Inter-Terminal Transfers**: Track product movements between facilities
- **Consolidated Reporting**: Roll-up reports across all locations
- **Role-Based Access**: Control access by location and function

### Third-Party Storage
- **Leased Tank Tracking**: Manage inventory in third-party terminals
- **Storage Agreements**: Track contract terms and rate schedules
- **Throughput Fees**: Calculate and verify storage invoices
- **Inventory Reconciliation**: Reconcile own records with terminal statements

### Partner Integration
- **EDI/API Integration**: Electronic document exchange with partners
- **Customer Portal**: Self-service portal for customers to view inventory
- **Supplier Portal**: Allow suppliers to submit COAs and delivery notices
- **Market Data Feeds**: Integrate real-time price feeds (Platts, Argus, ICE)

---

## 11. Maintenance & Asset Management

### Tank Maintenance
- **Inspection Scheduling**: Plan inspections per API 653 requirements
- **Work Order Management**: Create and track maintenance work orders
- **Defect Tracking**: Log and monitor tank defects and repairs
- **Shutdown Planning**: Coordinate tank outages with inventory needs

### Equipment Tracking
- **Asset Registry**: Catalog all equipment (pumps, valves, meters)
- **Maintenance History**: Complete service history for each asset
- **Spare Parts Inventory**: Track spare parts and reorder points
- **Calibration Records**: Document all instrument calibrations

### Predictive Maintenance
- **Condition Monitoring**: Track equipment health indicators
- **Failure Prediction**: Use AI to predict equipment failures
- **Maintenance Optimization**: Balance preventive vs. reactive maintenance
- **Cost Tracking**: Monitor maintenance costs by asset

**Reference**: [Camcode Oil Refinery Maintenance](https://www.camcode.com/blog/oil-refinery-maintenance-best-practices/)

---

## 12. Document Management

### Document Storage
- **Centralized Repository**: Store all documents (COAs, BOLs, contracts) in one place
- **Version Control**: Track document revisions and changes
- **Full-Text Search**: Search across all document content
- **Document Linking**: Associate documents with tanks, movements, or trades

### Workflow Automation
- **Approval Workflows**: Route documents for review and approval
- **Digital Signatures**: Electronic signature for contracts and certificates
- **Expiration Alerts**: Notify when certificates or permits expire
- **Automated Distribution**: Email documents to stakeholders automatically

---

## 13. Enhanced Reporting

### Operational Reports
- **Daily Operations Summary**: Overview of all movements and inventory changes
- **Movement History**: Detailed log of all product movements
- **Tank Utilization**: Analyze capacity usage over time
- **Throughput Reports**: Volume handled by period, product, or location

### Compliance Reports
- **Emissions Reports**: Environmental reporting (EPA, state agencies)
- **Inventory Reports**: Regulatory inventory declarations
- **Transaction Reports**: Trade reporting for regulatory compliance
- **Audit Reports**: Documentation for financial and regulatory audits

### Management Reports
- **Executive Dashboard**: High-level KPIs and trends
- **Exception Reports**: Highlight items requiring attention
- **Budget vs. Actual**: Compare performance to plan
- **Custom Report Builder**: Create ad-hoc reports without IT support

---

## Implementation Priority Matrix

| Feature Category | Business Impact | Implementation Effort | Priority |
|-----------------|-----------------|----------------------|----------|
| Real-Time Tank Gauging | High | High | Phase 2 |
| Blending & Quality | High | Medium | Phase 2 |
| Mass Balance | High | Medium | Phase 1 |
| Trading & Risk (Basic) | Medium | High | Phase 3 |
| Scheduling & Logistics | Medium | Medium | Phase 2 |
| Regulatory Compliance | High | Medium | Phase 1 |
| Financial Integration | High | High | Phase 2 |
| Advanced Analytics | Medium | Medium | Phase 3 |
| Mobile App | Medium | Medium | Phase 2 |
| Multi-Site Support | Medium | High | Phase 3 |
| Maintenance | Medium | Medium | Phase 2 |
| Document Management | Low | Low | Phase 1 |
| Enhanced Reporting | Medium | Low | Phase 1 |

---

## Quick Wins (Low Effort, High Value)

1. **Mass Balance Dashboard**: Daily summary of inputs vs outputs with variance highlighting
2. **Specification Limits for COA**: Flag out-of-spec properties with color coding
3. **Enhanced Reporting**: Export capabilities and scheduled report delivery
4. **Document Linking**: Associate multiple documents with movements/signals
5. **Audit Log**: Track all user actions for compliance
6. **Dashboard Widgets**: Customizable KPI tiles on the home page
7. **Email Notifications**: Alerts for pending signals, low levels, expiring certificates
8. **Bulk Operations**: More bulk editing capabilities for movements
9. **API Access**: REST API for external system integration
10. **User Roles & Permissions**: Granular access control by function

---

## Research Sources

- [Global OMS - Refinery Oil Movements & Storage](https://www.globaloms.com/oms-project/implementation-of-the-refinery-oil-movements-and-storage-oms-systems/)
- [Digital Refining - Tank Farm Automation](https://www.digitalrefining.com/article/1001311/automation-of-tank-farm-systems)
- [Emerson Tank Gauging](https://www.emerson.com/en-us/automation/measurement-instrumentation/tank-gauging-system)
- [Inatech ETRM Software Guide](https://www.inatech.com/blog/what-is-energy-trading-risk-management-etrm-software/)
- [AVEVA Production Accounting](https://www.aveva.com/en/products/production-accounting/)
- [Verdantis Oil & Gas Inventory Management](https://www.verdantis.com/oil-and-gas-inventory-management/)
- [Effivity Oil & Gas Compliance](https://www.effivity.com/blog/oil-and-gas-compliance)
- [iRely Petroleum Distribution](https://irely.com/solutions/petroleum-distribution-software/)
- [Itransition ERP for Oil & Gas](https://www.itransition.com/erp/oil-and-gas)
