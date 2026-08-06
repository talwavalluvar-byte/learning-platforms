
  
    

  create  table
    `automobile_dw`.`fct_sales_performance__dbt_tmp`
    
    
      as
    
    (
      WITH delivery_base AS (
    SELECT * FROM `automobile_dw`.`stg_fact_delivery`
)

SELECT
    DATE_FORMAT(date_of_actual_delivery, '%Y-%m-01') AS delivery_month,
    make,
    model,
    fuel_type,
    transmission,
    dealer_code_id,
    dealer_code,
    COUNT(DISTINCT lead_id) AS total_deliveries,
    SUM(total_receipt) AS total_receipt_amount,
    SUM(total_income) AS total_income_amount,
    CURRENT_TIMESTAMP() AS mart_created_datetime
FROM delivery_base
GROUP BY
    DATE_FORMAT(date_of_actual_delivery, '%Y-%m-01'),
    make,
    model,
    fuel_type,
    transmission,
    dealer_code_id,
    dealer_code
    )

  