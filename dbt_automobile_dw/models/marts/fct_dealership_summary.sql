WITH delivery_base AS (
    SELECT * FROM {{ ref('stg_fact_delivery') }}
)

SELECT
    dealer_code_id,
    dealer_code,
    org_id,
    COUNT(DISTINCT lead_id) AS total_deliveries,
    COUNT(DISTINCT sales_consultant_id) AS active_sales_consultants,
    SUM(total_receipt) AS total_receipt_amount,
    SUM(total_income) AS total_income_amount,
    ROUND(AVG(total_receipt), 2) AS avg_receipt_per_delivery
FROM delivery_base
GROUP BY
    dealer_code_id,
    dealer_code,
    org_id
