-- Power BI Delivery & Sales Extraction Script
-- Source: dms_delivery, dms_lead, dms_onroad_price, dms_vehicle_offer_prices, etc.

WITH 
AccessoriesMRP AS (
    SELECT 
        lead_id,
        stage_id,
        SUM(CASE
            WHEN dms_accessories_type IN ('MRP') THEN total_cost
            ELSE 0
        END) AS Total_accessories_MRP
    FROM 
        dms_accessories
    WHERE stage_id = 7
    GROUP BY lead_id
),

cte1_CorporateDiscounts AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 515 THEN before_gst END) AS Corporate_Discount_ExGST,
        MAX(CASE WHEN offer_type = 515 THEN oem_share END) AS Corporate_Discount_OEM_Share,
        MAX(CASE WHEN offer_type = 515 THEN dealer_share END) AS Corporate_Discount_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte2_Consumer AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 513 THEN before_gst END) AS NPS_Before_GST,
        MAX(CASE WHEN offer_type = 513 THEN oem_share END) AS NPS_OEM_Share_Before_GST,
        MAX(CASE WHEN offer_type = 513 THEN dealer_share END) AS NPS_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte3_Exchange AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 514 THEN before_gst END) AS Exchange_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 514 THEN oem_share END) AS Exchange_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 514 THEN dealer_share END) AS Exchange_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte4_Accesssories AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 522 THEN before_gst END) AS Accessories_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 522 THEN oem_share END) AS Accessories_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 522 THEN dealer_share END) AS Accessories_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte5_Offer1 AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 519 THEN before_gst END) AS Offer1_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 519 THEN oem_share END) AS Offer1_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 519 THEN dealer_share END) AS Offer1_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte6_Offer2 AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 520 THEN before_gst END) AS Offer2_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 520 THEN oem_share END) AS Offer2_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 520 THEN dealer_share END) AS Offer2_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte7_Cash AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 517 THEN before_gst END) AS Cash_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 517 THEN oem_share END) AS Cash_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 517 THEN dealer_share END) AS Cash_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte8_FocAccessories AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 518 THEN before_gst END) AS Foc_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 518 THEN oem_share END) AS Foc_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 518 THEN dealer_share END) AS Foc_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte9_Insurance AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 521 THEN before_gst END) AS Insurance_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 521 THEN oem_share END) AS Insurance_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 521 THEN dealer_share END) AS Insurance_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
cte10_Promotional AS (
    SELECT
        lead_id,
        MAX(CASE WHEN offer_type = 516 THEN before_gst END) AS Promotional_Bonus_Before_GST,
        MAX(CASE WHEN offer_type = 516 THEN oem_share END) AS Promotional_Bonus_OEM_Share,
        MAX(CASE WHEN offer_type = 516 THEN dealer_share END) AS Promotional_Bonus_Dealer_Share
    FROM dms_vehicle_offer_prices
    GROUP BY lead_id
),
AdditionalDiscount AS (
    SELECT
        lead_id,
        SUM(before_gst) AS Additional_Discount_Excl_GST
    FROM
        dms_vehicle_offer_prices
    WHERE
        offer_type IN (519, 520)
    GROUP BY
        lead_id
),
OfferCalculations AS (
    SELECT
        lead_id,
        (
            COALESCE(cash_discount, 0) +
            COALESCE(insurance_discount, 0) +
            COALESCE(additional_offer1, 0) +
            COALESCE(additional_offer2, 0) +
            COALESCE(special_scheme, 0) +
            COALESCE(exchange_offers, 0) +
            COALESCE(corporate_offer, 0) +
            COALESCE(foc_accessories, 0) +
            COALESCE(promotional_offers, 0) +
            COALESCE(accessories_discount, 0)
        ) AS Total_Discount_Amount,
        (
            COALESCE(cash_discount, 0) +
            COALESCE(insurance_discount, 0) +
            COALESCE(additional_offer1, 0) +
            COALESCE(additional_offer2, 0) +
            COALESCE(foc_accessories, 0) 
        ) AS Dealer_Offers_V2,
        (
            COALESCE(special_scheme, 0) +
            COALESCE(exchange_offers, 0) +
            COALESCE(corporate_offer, 0) +
            COALESCE(promotional_offers, 0)
        ) AS OEM_Offers_V2
    FROM 
        dms_onroad_price
)

SELECT
    dl.lead_id AS lead_id,
    DATE(lsr.start_date) AS date_of_actual_delivery,
    DATE(dl.created_datetime) AS date_of_delivery_rta_tally,
    DATE(vi.purchase_date) AS date_of_purchase,
    DATEDIFF(CURDATE(), vi.purchase_date) AS date_of_purchase_ageing_days,
    dll.sales_consultant_id AS sales_consultant_id,
    dll.sales_consultant AS sales_consultant,
    de.active AS sales_consutant_active,
    de.reporting_to AS manager1_id,
    de_mgr1.emp_name AS manager1_name,
    de_mgr1.active AS manager1_active,
    de_mgr2.emp_id AS manager2_id,
    de_mgr2.emp_name AS manager2_name,
    de_mgr2.active AS manager2_active,
    lp.make_id AS make_id,
    lp.make AS make,
    lp.model_id AS model_id,
    lp.model AS model,
    lp.variant_id AS variant_id,
    lp.variant AS variant,
    (SELECT id FROM `vehicle-management`.vehicle_varient_colors WHERE color = lp.color LIMIT 1) AS color_id,
    lp.color AS color,
    (SELECT id FROM dms_master_org_common WHERE value = lp.fuel LIMIT 1) AS fuel_type_id,
    lp.fuel AS fuel_type,
    (SELECT id FROM dms_master_org_common WHERE value = lp.transimmision_type LIMIT 1) AS transmission_id,
    lp.transimmision_type AS transmission,
    dse.id AS source_id,
    dse.name AS source,
    dll.sub_source_id AS sub_source_id,
    (SELECT sub_source FROM sub_source WHERE id = dll.sub_source_id) AS sub_source,
    dll.buyer_type_id AS buyer_type_id,
    bmc.value AS buyer_type,
    dll.enquiry_segment_id AS enquiry_segment_id,
    dll.enquiry_segment AS enquiry_segment,
    CASE 
        WHEN COALESCE(dac.gender_id, dc.gender_id) IN (1, 386) THEN 386
        WHEN COALESCE(dac.gender_id, dc.gender_id) IN (2, 387) THEN 387
        WHEN COALESCE(dac.gender_id, dc.gender_id) = 388 THEN 388
        ELSE NULL
    END AS gender_id,
    CASE 
        WHEN COALESCE(dac.gender_id, dc.gender_id) IN (1, 386) THEN 'Male'
        WHEN COALESCE(dac.gender_id, dc.gender_id) IN (2, 387) THEN 'Female'
        WHEN COALESCE(dac.gender_id, dc.gender_id) = 388 THEN 'Other'
        ELSE NULL
    END AS gender,
    TIMESTAMPDIFF(
        YEAR,
        COALESCE(dac.date_of_birth, dc.date_of_birth),
        CURDATE()
    ) AS age,
    CASE
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(dac.date_of_birth, dc.date_of_birth), CURDATE()) BETWEEN 10 AND 24 THEN '1'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(dac.date_of_birth, dc.date_of_birth), CURDATE()) BETWEEN 25 AND 45 THEN '2'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(dac.date_of_birth, dc.date_of_birth), CURDATE()) > 45 THEN '3'
        ELSE NULL
    END AS age_group_id,
    CASE
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(dac.date_of_birth, dc.date_of_birth), CURDATE()) BETWEEN 10 AND 24 THEN 'Below 25'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(dac.date_of_birth, dc.date_of_birth), CURDATE()) BETWEEN 25 AND 45 THEN '25-45'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(dac.date_of_birth, dc.date_of_birth), CURDATE()) > 45 THEN 'Above 45'
        ELSE NULL
    END AS age_group,
    COALESCE(dc1.id, dc2.id) AS customer_type_id,
    COALESCE(dc1.customer_type, dc2.customer_type) AS customer_type,
    dl.warranty_flag AS insur_ew_id,
    dl.warranty_taken AS insur_ew,
    mc.id AS insur_type_id,
    mc.value AS insur_type,
    dic.id AS insur_company_name_id,
    dic.company_name AS insure_company_name,
    li.gross_premium AS insur_gross_premium_incl_gst,
    (li.gross_premium / 1.18) AS insur_gross_premium_excl_gst,
    li.net_od_premium AS insur_od_premium_incl_gst,
    (li.net_od_premium / 1.18) AS insur_od_premium_excl_gst,
    li.od_discount_percentage AS insur_od_discount_percentage,
    li.od_discount_amount AS insur_od_discount_incl_gst,
    (li.od_discount_amount / 1.18) AS insur_od_discount_excl_gst,
    li.add_on_insurance_premium AS insur_addon_premium_incl_gst,
    (li.add_on_insurance_premium / 1.18) AS insur_addon_premium_excl_gst,
    ROUND(
        (li.other_payout_amount / NULLIF(li.other_payout_percentage / 100, 0)) *
        (COALESCE(li.irda_payout_percentage, 0) / 100),
    2) AS insur_irda_incl_gst,
    ROUND(
        (
            (li.other_payout_amount / NULLIF(li.other_payout_percentage / 100, 0))
            * (COALESCE(li.irda_payout_percentage, 0) / 100)
        ) / 1.18,
    2) AS insur_irda_excl_gst,
    (li.total_premium - li.insurance_paid) AS insur_margin,
    li.irda_payout_percentage AS isur_irda_percentage,
    li.other_payout_percentage AS insur_other_payout_percentage,
    li.other_payout_amount AS insur_other_payout_incl_gst,
    (li.other_payout_amount / 1.18) AS insur_other_payout_excl_gst,
    li.total_payout AS insur_total_insurance_payout_incl_gst,
    COALESCE(li.total_payout / 1.18, 0) AS insur_total_insurance_payout_excl_gst,
    fd.finance_type_id AS finance_type_id,
    fd.finance_type AS finance_type,
    (SELECT id FROM dms_bank_finance_services_md WHERE bank_name = fd.finance_company LIMIT 1) AS finance_company_id,
    fd.finance_company AS finance_company,
    fd.lone_disburse_amount AS finance_do_ammount,
    fd.loan_amount AS finance_do_receivable,
    fd.payout AS finance_payout_percentage,
    fd.total_Finance_Pay_out AS finance_total_payout_incl_gst,
    COALESCE(fd.total_Finance_Pay_out / 1.18, 0) AS finance_total_payout_excl_gst,
    fd.Commission_paid AS Commission_paid_Leasing_Company,
    fd.No_of_days_for_receiving_DO AS no_of_days_receiving_do,
    dl.life_tax_collected AS life_tax_collected_from_customer,
    dl.tr_charges_collected AS tr_charges_collected_from_customer,
    dl.total_tax_collected AS total_tax_collected_from_customer,
    dl.second_vehicle_tax AS second_vehicle_tax,
    dl.tr_charges_paid AS tr_charges_paid,
    dl.hsrp_amount AS hsrp_charges_paid,
    dl.total_tax_paid AS total_taxes_paid,
    dl.amc_premium_excl_gst AS amc_premium_excl_gst,
    dl.Additional_Coverage_Premium AS sot,
    dl.ETD_Warranty_Premium AS ex_warranty_incl_gst,
    dl.etd_warranty_premium_excl_gst AS ex_warranty_excl_gst,
    dl.etd_warranty_payout AS commission_on_ex_wart,
    dl.cost_of_teflon_coating_excl_gst AS teflon_excl_gst,
    dl.ceramic_coating_amount_excl_gst AS ceramic_coating_amount_excl_gst,
    dl.Fastag_Amount AS fastag_collected,
    dl.cost_of_fasttag AS coat_on_fastag,
    dl.Additional_Coverage_Payout AS amc_payout_excl_gst,
    dl.accessories_payout AS mis_income_v1_accessories_payout_excl_gst,
    dl.etd_warranty_payout AS mis_income_v1_ex_warranty_payout_excl_gst,
    dl.difference_in_life_tax AS mis_income_v1_margin_on_life_tax_excl_gst,
    dl.profit_on_ceramic_coating AS mis_income_v1_margin_on_ceramic_coating_excl_gst,
    dl.Margin_on_fastag AS mis_income_v1_margin_on_fastag,
    dl.profit_on_teflon_coating AS mis_income_v1_margin_on_teflon_coating_excl_gst,
    COALESCE(dl.accessories_payout * (1 + 18 / 100), 0) AS mis_income_v2_accessories_payout_incl_gst,
    COALESCE(dl.etd_warranty_payout * (1 + 18 / 100), 0) AS mis_income_v2_ex_warranty_payout_incl_gst,
    COALESCE(dl.difference_in_life_tax * (1 + 18 / 100), 0) AS mis_income_v2_margin_on_life_tax_incl_gst,
    COALESCE(dl.Margin_on_fastag * (1 + 18 / 100), 0) AS mis_income_v2_margin_on_fastag_incl_gst,
    COALESCE(dl.vas_ceramic_coating_amount, 0) - COALESCE(dl.cost_of_ceramic_coating_incl_gst, 0) AS mis_income_v2_margin_on_ceramic_coating_incl_gst,
    COALESCE(dl.vas_teflon_amount, 0) - COALESCE(dl.cost_of_teflon_coating_incl_gst, 0) AS mis_income_v2_margin_on_teflon_coating_incl_gst,
    dl.total_receipt AS total_receipt,
    dl.total_income AS total_income,
    (op.ex_showroom_price - vi.invoice_price) AS dealer_margin_allowed,
    oc.Total_Discount_Amount AS total_Discount_incl_gst,
    (op.ex_showroom_price - oc.Total_Discount_Amount) AS s_net_ex_showroom_price_incl_gst,
    op.ex_showroom_price AS s_ex_showroom_price_on_road_price,
    (
        (op.ex_showroom_price - oc.Total_Discount_Amount) 
        / (1 + (COALESCE(i.gst_rate, 0) / 100.0))
    ) AS s_net_ex_showroom_price_excl_gst,
    (
        (op.ex_showroom_price - oc.Total_Discount_Amount) 
        / (1 + ((COALESCE(vi.gst_rate, 0) + COALESCE(vi.cess, 0)) / 100.0))
    ) AS net_ex_showroom_excl_gst_cess,
    CAST(vi.invoice_price AS DECIMAL(10,2)) AS vi_purchase_price_incl_gst,
    ROUND(
        CASE
            WHEN vi.invoice_price IS NULL OR vi.invoice_price = 0 THEN NULL
            ELSE vi.invoice_price / (1 + (COALESCE(vi.gst_rate,0) / 100))
        END,
        2
    ) AS vi_purchase_price_gst_excl_gst,
    ROUND(
        CASE
            WHEN vi.invoice_price IS NULL OR vi.invoice_price = 0 THEN NULL
            ELSE vi.invoice_price / (1 + ((COALESCE(vi.gst_rate,0) + COALESCE(vi.cess,0)) / 100))
        END,
        2
    ) AS vi_purchase_price_gst_cess_excl_gst,
    op.tcs_amount AS tcs,
    (
        (op.ex_showroom_price - oc.Total_Discount_Amount) 
        - COALESCE(vi.invoice_price, 0)
    ) AS vi_purchase_dealer_margin_incl_gst,
    ROUND(
        (
            (
                (op.ex_showroom_price - oc.Total_Discount_Amount) 
                / (1 + ((COALESCE(vi.gst_rate, 0) + COALESCE(vi.cess, 0)) / 100.0))   
            )
            - (COALESCE(vi.invoice_price, 0) / (1 + ((COALESCE(vi.gst_rate, 0) + COALESCE(vi.cess, 0)) / 100.0)))
        ),
        2
    ) AS vi_purchase_dealer_margin_cess_excl_gst,
    oc.Dealer_Offers_V2,
    oc.OEM_Offers_V2,
    op.life_tax AS life_tax_as_par_rta_records,
    dl.paid_accessories_cost AS cost_of_accessories_sold,
    (dl.paid_accessories_cost - dl.free_accessories_cost) AS margin_on_accessries,
    op.corporate_offer AS total_corporate_discount,
    op.handling_charges AS handling_charges,
    NULLIF(other_prices->>'$[0].amount', 'null') AS other_prices_v2,
    (op.additional_offer1 + op.additional_offer2) AS additional_discount,
    i.gst_rate AS i_gst,
    vi.gst_rate AS vi_gst,
    i.cess_percentage AS i_cess_percentage,
    i.transaction_type AS i_transaction_type,
    i.leasing_name AS i_leasing_name,
    i.cess_amount AS i_cess_amount,
    i.total_tax AS i_total_tax,
    vi.inventory_cost AS vi_inventory_holding_cost,
    vi.stock_holding_days AS vi_inventory_holding_days,
    vi.inventory_cost_percentage AS vi_inventory_cost_percentage,
    vi.cess AS vi_cess_percentage,

    -- Discount incl. GST --
    op.cash_discount AS discoffer1_cash_incl_gst, 
    op.insurance_discount AS disc_offer2_insurance_incl_gst,
    op.additional_offer1 AS discoffer3_offer1_incl_gst,
    op.additional_offer2 AS discoffer4_offer2_incl_gst,
    op.special_scheme AS discOffer10_consumer_incl_gst,
    op.exchange_offers AS discoffer6_exchange_incl_gst,
    op.foc_accessories AS discoffer7_foc_accessories_incl_gst,
    op.promotional_offers AS discoffer8_promotional_incl_gst,
    op.corporate_offer AS discoffer9_corporate_incl_gst,
    op.accessories_discount AS discoffer11_accessories_incl_gst,
    oc.Total_Discount_Amount AS total_discount_incl_gst,

    -- OEM share --
    cte1.Corporate_Discount_OEM_Share AS corporate_oem_share_excl_gst,
    cte2.NPS_OEM_Share_Before_GST AS consumer_oem_share_excl_gst,
    cte3.Exchange_Bonus_OEM_Share AS exchage_oem_share_excl_gst,
    cte5.Offer1_Bonus_OEM_Share AS offer1_oem_share_excl_gst,
    cte6.Offer2_Bonus_OEM_Share AS offer2_oem_share_excl_gst,
    cte10.Promotional_Bonus_OEM_Share AS promotional_oem_share_excl_gst,
    
    COALESCE(cte1.Corporate_Discount_OEM_Share * (1 + COALESCE(i.total_tax, 0) / 100), 0) AS corporate_oem_share_incl_gst,
    COALESCE(cte2.NPS_OEM_Share_Before_GST * (1 + COALESCE(i.total_tax, 0) / 100), 0) AS consumer_oem_share_incl_gst,
    COALESCE(cte3.Exchange_Bonus_OEM_Share * (1 + COALESCE(i.total_tax, 0) / 100), 0) AS exchange_oem_share_incl_gst,
    COALESCE(cte5.Offer1_Bonus_OEM_Share * (1 + COALESCE(i.total_tax, 0) / 100), 0) AS offer1_oem_share_incl_gst,
    COALESCE(cte6.Offer2_Bonus_OEM_Share * (1 + COALESCE(i.total_tax, 0) / 100), 0) AS offer2_oem_share_incl_gst,
    COALESCE(cte10.Promotional_Bonus_OEM_Share * (1 + COALESCE(i.total_tax, 0) / 100), 0) AS promotional_oem_share_incl_gst,

    cte1.Corporate_Discount_Dealer_Share AS corporate_dealer_share,
    cte2.NPS_Dealer_share AS consumer_dealer_share,
    cte3.Exchange_Bonus_Dealer_Share AS exchange_dealer_share,
    cte5.Offer1_Bonus_Dealer_Share AS offer1_dealer_share,
    cte6.Offer2_Bonus_Dealer_Share AS offer2_dealer_share,
    cte10.Promotional_Bonus_Dealer_Share AS promotional_dealer_share,
    
    cte7.Cash_Bonus_Dealer_Share AS discoffer1_cash_dealer,
    cte8.Foc_Bonus_Dealer_Share AS discoffer8_foc_accessories_Dealer_Share,
    
    ad.Additional_Discount_Excl_GST AS additional_discount_exch_gst,
    
    -- Discount Excl. GST --
    cte7.Cash_Bonus_Before_GST AS discoffer1_cash_excl_gst,
    cte2.NPS_Before_GST AS discoffer10_consumer_excl_gst,
    cte4.Accessories_Bonus_Before_GST AS discoffer11_accessories_excl_gst,
    cte9.Insurance_Bonus_Before_GST AS discoffer2_insurance_excl_gst,
    cte5.Offer1_Bonus_Before_GST AS discoffer3_offer1_excl_gst,
    cte6.Offer2_Bonus_Before_GST AS discoffer4_offer2_excl_gst,
    cte3.Exchange_Bonus_Before_GST AS discoffer6_exchange_excl_gst,
    cte8.Foc_Bonus_Before_GST AS discoffer7_foc_accessories_excl_gst,
    cte10.Promotional_Bonus_Before_GST AS discoffer8_promotional_excl_gst,
    cte1.Corporate_Discount_ExGST AS discoffer9_corporate_excl_gst,
    (
        COALESCE(cte7.Cash_Bonus_Before_GST, 0) +
        COALESCE(cte2.NPS_Before_GST, 0) +
        COALESCE(cte4.Accessories_Bonus_Before_GST, 0) +
        COALESCE(cte9.Insurance_Bonus_Before_GST, 0) +
        COALESCE(cte5.Offer1_Bonus_Before_GST, 0) +
        COALESCE(cte6.Offer2_Bonus_Before_GST, 0) +
        COALESCE(cte3.Exchange_Bonus_Before_GST, 0) +
        COALESCE(cte8.Foc_Bonus_Before_GST, 0) +
        COALESCE(cte10.Promotional_Bonus_Before_GST, 0) +
        COALESCE(cte1.Corporate_Discount_ExGST, 0)
    ) AS total_discount_excl_gst,
    
    COALESCE(
        (
            (
                SELECT COALESCE(SUM(final_kit_cost), 0)
                FROM (
                    SELECT kit_id, MAX(final_kit_cost) AS final_kit_cost
                    FROM dms_accessories
                    WHERE lead_id = lsr.lead_id
                      AND stage_id = 7
                      AND dms_accessories_type IN 
                          ('ESSENTIAL KIT-MRP', 'KIT-MRP', 'ESSENTIAL KIT-FOC', 'KIT-FOC')
                    GROUP BY kit_id
                ) x
            )
            + COALESCE(amrp.Total_accessories_MRP, 0)
        ), 
        0
    ) AS total_accessories_amount,
    dl.free_accessories_cost AS foc_accessories,
    COALESCE(dl.free_accessories_cost / 1.18, 0) AS foc_accessories_excl_gst,
    dl.paid_accessories_cost AS paid_accessories,
    dl.cost_of_ceramic_coating_excl_gst AS ceramic_coating_excl_gst,
    db.branch_id AS dealer_code_id,
    db.dealer_code AS dealer_code,
    db.active AS dealer_code_active,
    loc.id AS branch_location_id,
    loc.code AS branch_location,
    og.org_id AS org_id,
    og.name AS org_name,
    og.brand AS org_brand,
    db.service_type_id AS service_type_id

FROM 
    dms_delivery dl
    LEFT JOIN AccessoriesMRP amrp ON dl.lead_id = amrp.lead_id
    LEFT JOIN cte1_CorporateDiscounts cte1 ON dl.lead_id = cte1.lead_id
    LEFT JOIN cte2_Consumer cte2 ON dl.lead_id = cte2.lead_id
    LEFT JOIN cte3_Exchange cte3 ON dl.lead_id = cte3.lead_id
    LEFT JOIN cte4_Accesssories cte4 ON dl.lead_id = cte4.lead_id
    LEFT JOIN cte5_Offer1 cte5 ON dl.lead_id = cte5.lead_id
    LEFT JOIN cte6_Offer2 cte6 ON dl.lead_id = cte6.lead_id
    LEFT JOIN cte7_Cash cte7 ON dl.lead_id = cte7.lead_id
    LEFT JOIN cte8_FocAccessories cte8 ON dl.lead_id = cte8.lead_id
    LEFT JOIN cte9_Insurance cte9 ON dl.lead_id = cte9.lead_id
    LEFT JOIN cte10_Promotional cte10 ON dl.lead_id = cte10.lead_id
    LEFT JOIN AdditionalDiscount ad ON dl.lead_id = ad.lead_id
    LEFT JOIN dms_onroad_price op ON dl.lead_id = op.lead_id
    LEFT JOIN OfferCalculations oc ON dl.lead_id = oc.lead_id
    LEFT JOIN dms_lead_product lp ON dl.lead_id = lp.lead_id
    LEFT JOIN dms_finance_details fd ON dl.lead_id = fd.lead_id
    LEFT JOIN dms_invoice i ON dl.lead_id = i.lead_id
    LEFT JOIN vehicles_inventory vi ON dl.lead_id = vi.lead_id
    LEFT JOIN dms_allotment al ON dl.lead_id = al.lead_id 
    LEFT JOIN dms_lead_insurance li ON dl.lead_id = li.lead_id
    LEFT JOIN exchange_vechile_details evd ON dl.lead_id = evd.lead_id
    LEFT JOIN dms_insurence_company_md dic ON dl.insurance_company_id = dic.id
    LEFT JOIN dms_master_common mc ON dl.insurance_taken_id = mc.id
    LEFT JOIN dms_lead_stage_ref lsr ON dl.lead_id = lsr.lead_id
    JOIN dms_lead dll ON lsr.lead_id = dll.id AND dll.org_id = lsr.org_id
    LEFT JOIN dms_master_common bmc ON bmc.id = dll.buyer_type_id
    LEFT JOIN dms_account dac ON dac.id = dll.dms_account_id
    LEFT JOIN dms_contact dc ON dc.id = dll.dms_contact_id
    LEFT JOIN dms_customer_type dc1 ON dc1.id = dc.customer_type_id
    LEFT JOIN dms_customer_type dc2 ON dc2.id = dac.customer_type_id
    LEFT JOIN dms_employee de ON de.emp_id = dll.sales_consultant_id
    LEFT JOIN dms_employee de_mgr1 ON de_mgr1.emp_id = de.reporting_to
    LEFT JOIN dms_employee de_mgr2 ON de_mgr2.emp_id = de_mgr1.reporting_to
    LEFT JOIN dms_organization og ON lsr.org_id = og.org_id
    LEFT JOIN dms_source_of_enquiries dse ON dse.id = dll.source_of_enquiry
    JOIN dms_branch db ON db.branch_id = lsr.branch_id
    LEFT JOIN location_node_data lnd ON db.org_map_id = lnd.id
    LEFT JOIN location_node_data loc ON lnd.parent_id = loc.id

WHERE 
    lsr.stage_id = 7 
    AND lsr.drop_status_id IS NULL    
    AND lsr.org_id IN (1, 16, 22, 21, 376)
    AND db.service_type_id = 458
GROUP BY
    lsr.lead_id;
