
  create view `automobile_dw`.`stg_fact_delivery__dbt_tmp`
    
    
  as (
    WITH source AS (
    SELECT * FROM automobile_dw.fact_delivery
)

SELECT
    CAST(lead_id AS UNSIGNED) AS lead_id,
    date_of_actual_delivery,
    date_of_delivery_rta_tally,
    sales_consultant_id,
    sales_consultant,
    make_id,
    make,
    model_id,
    model,
    variant_id,
    variant,
    color,
    fuel_type,
    transmission,
    dealer_code_id,
    dealer_code,
    org_id,
    CAST(total_receipt AS DECIMAL(15,2)) AS total_receipt,
    CAST(total_income AS DECIMAL(15,2)) AS total_income,
    etl_created_date,
    etl_updated_date,
    is_active
FROM source
  );