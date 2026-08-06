# dbt Core Setup & Execution Guide for Automobile DW

This guide details how to install and execute your newly created **dbt Core** project (`dbt_automobile_dw/`) against your local Data Warehouse (`automobile_dw`).

---

## 🛠️ Step 1: Install `dbt-mysql`

To connect dbt Core directly to your MySQL Data Warehouse database, install `dbt-mysql`:

```bash
.venv\Scripts\pip.exe install dbt-mysql
```

---

## 🚀 Step 2: Running dbt Core Commands

Navigate to the `dbt_automobile_dw` directory:

```bash
cd c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\automobile-etl\dbt_automobile_dw
```

### 1. Test Database Connection
```bash
dbt debug --profiles-dir .
```

### 2. Build Staging Views & Business Marts
```bash
dbt run --profiles-dir .
```
- Compiles `stg_fact_delivery.sql` into views inside `automobile_dw`.
- Materializes `fct_sales_performance.sql` and `fct_dealership_summary.sql` as tables inside `automobile_dw`.

### 3. Run Automated Data Quality Tests
```bash
dbt test --profiles-dir .
```
- Executes automated test assertions for `unique` and `not_null` key constraints.

### 4. Generate Interactive Data Lineage & Documentation
```bash
dbt docs generate --profiles-dir .
dbt docs serve --profiles-dir .
```
- Launches an interactive web Data Catalog showing the exact visual DAG lineage from `automobile_dw` to Power BI marts!

---

## 📊 Business Data Marts Created

| Mart Model | Materialized Type | Purpose | Primary Consumer |
|---|---|---|---|
| `stg_fact_delivery` | View | Cleaned staging layer over `fact_delivery` | dbt Marts Layer |
| `fct_sales_performance` | Table | Monthly aggregated sales by Make, Model, Fuel & Dealer | Power BI Executive Dashboards |
| `fct_dealership_summary` | Table | Dealership Branch summary with delivery totals & active consultants | Power BI Dealership Managers |
