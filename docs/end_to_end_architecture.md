# End-to-End Automobile Data Engineering & Analytics Architecture (with dbt Core)

This document details the complete end-to-end architecture incorporating **PySpark ETL**, **MySQL Data Warehouse**, **dbt Core (Data Marts & Testing)**, and **Power BI Analytics**.

---

## 📐 Modern Data Stack Architecture Diagram

```mermaid
flowchart TD
    subgraph Layer1 ["1. Source System (Production MySQL)"]
        A1[AWS RDS MySQL: salesDataSetup]
        A2[Raw Operational DMS Tables]
    end

    subgraph Layer2 ["2. Heavy ETL & Ingestion (PySpark Engine)"]
        B1[PySpark JDBC Extractor]
        B2[Heavy Joins, Data Cleansing, Surrogate Key Generation]
        B3[Dimensions & Facts Ingestion Engine]
        B4[Automated Scheduler: run_etl.ps1 Daily @ 2:00 AM]
    end

    subgraph Layer3 ["3. Data Warehouse Storage (automobile_dw)"]
        C1[MySQL Data Warehouse: automobile_dw]
        C2[Clean Staging & Dimensional Tables: dim_*]
        C3[Central Fact Table: fact_delivery 26,415 Records]
    end

    subgraph Layer4 ["4. Analytics Engineering Layer (dbt Core)"]
        D1[dbt Core Models & Business Marts]
        D2[Aggregated Financial & Discount Marts]
        D3[Automated Data Testing: unique, not_null, relationships]
        D4[Auto-Generated Lineage & Data Catalog: dbt docs]
    end

    subgraph Layer5 ["5. Visualization & BI Layer (Power BI)"]
        E1[Power BI Desktop / Power BI Service]
        E2[Direct Connections to dbt Analytics Marts]
        E3[Simple DAX & Row-Level Security RLS]
        E4[Executive & Managerial Dashboards]
    end

    Layer1 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> Layer3
    B4 --> B3
    Layer3 --> Layer4
    Layer4 --> Layer5
```

---

## ⚖️ Division of Responsibilities

### 1. PySpark → Ingestion, Heavy Computing & Cleansing
- **Extracts** high-volume operational logs from AWS RDS MySQL.
- **Handles** distributed joins, whitespace sanitization, case-insensitive deduplication, and surrogate key indexing.
- **Loads** raw sanitized dimensions (`dim_*`) and core fact tables (`fact_delivery`) into `automobile_dw`.

### 2. dbt Core → Business Modeling, Data Marts & Data Testing
- **Transforms** core warehouse tables into refined, business-ready analytical data marts (e.g. `marts/fct_sales_summary`, `marts/dim_dealership_performance`).
- **Tests** data quality with automated assertions (`not_null`, `unique`, `accepted_values`, foreign key `relationships`).
- **Documents** data lineage and maintains an interactive web Data Catalog (`dbt docs generate`).
- **Rolls up** complex financial measures (OEM vs. Dealer discount shares, delivery ageing buckets, profit margins).

### 3. Power BI → Visualization, Security & Interaction
- **Connects** directly to clean, curated dbt business marts in `automobile_dw`.
- **Renders** executive dashboards, interactive visual filters, and drill-through reports.
- **Enforces** Row-Level Security (RLS) for dealership managers and sales teams.

---

## 🚀 How to Add dbt Core to This Project

We can initialize a dbt project in `dbt_automobile_dw/` with the following structure:

```text
dbt_automobile_dw/
├── dbt_project.yml
├── profiles.yml
├── models/
│   ├── staging/
│   │   ├── stg_fact_delivery.sql
│   │   └── stg_dim_dealer.sql
│   └── marts/
│       ├── fct_sales_performance.sql
│       ├── fct_discount_analysis.sql
│       └── dim_executive_summary.sql
└── tests/
    └── assert_positive_margin.sql
```
