import os
import sys
from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col, when, lit, coalesce, round as spark_round, datediff,
    current_date, date_format, to_date, trim, initcap, upper, lower,
    months_between, floor, count, sum as spark_sum, max as spark_max, get_json_object, broadcast, concat
)
from transform.audit import add_audit_columns
from config.constants import VALID_ORGS, VALID_BRANCH_TYPES


def get_table(tables: dict, name: str) -> DataFrame:
    if name in tables and tables[name] is not None:
        return tables[name]
    alias_map = {
        "dms_delivery": "delivery",
        "dms_lead": "lead",
        "dms_lead_stage_ref": "lead_stage",
        "dms_lead_product": "product",
        "dms_invoice": "invoice",
        "vehicles_inventory": "inventory",
        "dms_finance_details": "finance",
        "dms_lead_insurance": "insurance",
        "dms_branch": "branch",
        "dms_employee": "employee",
        "dms_organization": "organization",
        "dms_accessories": "accessories",
        "location_node_data": "location"
    }
    alt_key = alias_map.get(name)
    if alt_key and alt_key in tables and tables[alt_key] is not None:
        return tables[alt_key]
    try:
        from extract.mysql_reader import read_mysql_table
        spark = list(tables.values())[0].sparkSession
        return read_mysql_table(spark, name)
    except Exception as e:
        print(f"Warning: Failed to load table '{name}': {e}")
        return None


def load_dim_table(tables: dict, spark, name: str) -> DataFrame:
    if name in tables and tables[name] is not None:
        return tables[name]
    try:
        from config.database import WAREHOUSE_DB, get_jdbc_url
        return (
            spark.read
            .format("jdbc")
            .option("url", get_jdbc_url(WAREHOUSE_DB))
            .option("dbtable", name)
            .option("user", WAREHOUSE_DB["user"])
            .option("password", WAREHOUSE_DB["password"])
            .option("driver", WAREHOUSE_DB["driver"])
            .load()
        )
    except Exception as exc:
        print(f"Warning: Optional warehouse dimension '{name}' could not be loaded ({exc}). Falling back to null dimension keys.")
        return None


def build_fact_sales(tables: dict) -> DataFrame:
    dl_df = get_table(tables, "dms_delivery")
    if dl_df is not None:
        dl_df = dl_df.dropDuplicates(["lead_id"])
    lsr_df = get_table(tables, "dms_lead_stage_ref")
    dll_df = get_table(tables, "dms_lead")
    if dll_df is not None:
        dll_df = dll_df.dropDuplicates(["id"])
    lp_df = get_table(tables, "dms_lead_product")
    db_df = get_table(tables, "dms_branch")
    og_df = get_table(tables, "dms_organization")
    de_df = get_table(tables, "dms_employee")
    op_df = get_table(tables, "dms_onroad_price")
    fd_df = get_table(tables, "dms_finance_details")
    i_df = get_table(tables, "dms_invoice")
    vi_df = get_table(tables, "vehicles_inventory")
    li_df = get_table(tables, "dms_lead_insurance")
    dic_df = get_table(tables, "dms_insurence_company_md")
    mc_df = get_table(tables, "dms_master_common")
    moc_df = get_table(tables, "dms_master_org_common")
    dac_df = get_table(tables, "dms_account")
    dc_df = get_table(tables, "dms_contact")
    cust_type_raw_df = get_table(tables, "dms_customer_type")
    dse_df = get_table(tables, "dms_source_of_enquiries")
    lnd_df = get_table(tables, "location_node_data")
    acc_df = get_table(tables, "dms_accessories")
    oc_raw_df = get_table(tables, "dms_vehicle_offer_prices")
    if oc_raw_df is None:
        oc_raw_df = get_table(tables, "dms_offer_calculations")

    spark = dl_df.sparkSession

    # Load All Dimension Tables for Dynamic Joins
    dim_make_df = load_dim_table(tables, spark, "dim_make")
    dim_model_df = load_dim_table(tables, spark, "dim_model")
    dim_variant_df = load_dim_table(tables, spark, "dim_variant")
    dim_color_df = load_dim_table(tables, spark, "dim_color")
    dim_fuel_df = load_dim_table(tables, spark, "dim_fuel_type")
    dim_trans_df = load_dim_table(tables, spark, "dim_transmission")
    dim_branch_df = load_dim_table(tables, spark, "dim_branch")
    dim_sc_df = load_dim_table(tables, spark, "dim_sales_consultant")
    dim_mgr1_df = load_dim_table(tables, spark, "dim_manager1")
    dim_mgr2_df = load_dim_table(tables, spark, "dim_manager2")
    dim_src_df = load_dim_table(tables, spark, "dim_source")
    dim_subsrc_df = load_dim_table(tables, spark, "dim_sub_source")
    dim_bt_df = load_dim_table(tables, spark, "dim_buyer_type")
    dim_es_df = load_dim_table(tables, spark, "dim_enquiry_segment")
    dim_gen_df = load_dim_table(tables, spark, "dim_gender")
    dim_ag_df = load_dim_table(tables, spark, "dim_age_group")
    dim_ct_df = load_dim_table(tables, spark, "dim_cust_type")
    dim_it_df = load_dim_table(tables, spark, "dim_insurance_type")
    dim_ic_df = load_dim_table(tables, spark, "dim_insurance_company")
    dim_ft_df = load_dim_table(tables, spark, "dim_finance_type")
    dim_fc_df = load_dim_table(tables, spark, "dim_finance_company")
    dim_lc_df = load_dim_table(tables, spark, "dim_leasing_company")

    # -------------------------------------------------------------------------
    # 1. CTE Computations
    # -------------------------------------------------------------------------

    # AccessoriesMRP
    if acc_df is not None:
        acc_filtered = acc_df.filter(
            (col("stage_id") == 7) &
            col("dms_accessories_type").isin("ACCESSORIES-MRP", "ESSENTIAL ACCESSORIES-MRP")
        )
        acc_grp = (
            acc_filtered
            .groupBy("kit_id", "lead_id")
            .agg(spark_max("final_kit_cost").alias("final_kit_cost"))
        )
        amrp = (
            acc_grp
            .groupBy("lead_id")
            .agg(coalesce(spark_sum("final_kit_cost"), lit(0)).alias("Total_accessories_MRP"))
        )
    else:
        amrp = spark.createDataFrame([], "lead_id INT, Total_accessories_MRP DOUBLE")

    # Offer Calculations CTE helper
    def get_offer_cte(offer_type_val, prefix):
        if oc_raw_df is not None:
            required_columns = {"lead_id", "offer_type"}
            missing_columns = required_columns.difference(oc_raw_df.columns)
            if missing_columns:
                raise ValueError(
                    "Offer calculation data is missing required columns: "
                    f"{', '.join(sorted(missing_columns))}"
                )
            if "type" in oc_raw_df.columns:
                filtered = oc_raw_df.filter(col("offer_type") == offer_type_val)
                return (
                    filtered
                    .groupBy("lead_id")
                    .agg(
                        coalesce(spark_max(when(col("type") == "EX-GST DISCOUNT", col("amount"))), lit(0)).alias(f"{prefix}_ex"),
                        coalesce(spark_max(when(col("type") == "OEM Share", col("amount"))), lit(0)).alias(f"{prefix}_oem"),
                        coalesce(spark_max(when(col("type") == "Dealer Share", col("amount"))), lit(0)).alias(f"{prefix}_dlr")
                    )
                )
            elif "before_gst" in oc_raw_df.columns:
                filtered = oc_raw_df.filter(col("offer_type") == offer_type_val)
                return (
                    filtered
                    .groupBy("lead_id")
                    .agg(
                        coalesce(spark_max("before_gst"), lit(0)).alias(f"{prefix}_ex"),
                        coalesce(spark_max("oem_share"), lit(0)).alias(f"{prefix}_oem"),
                        coalesce(spark_max("dealer_share"), lit(0)).alias(f"{prefix}_dlr")
                    )
                )
        return spark.createDataFrame([], f"lead_id INT, {prefix}_ex DOUBLE, {prefix}_oem DOUBLE, {prefix}_dlr DOUBLE")

    cte1 = get_offer_cte("Corporate Discount", "cte1")
    cte2 = get_offer_cte("Special Scheme (Consumer Scheme)", "cte2")
    cte3 = get_offer_cte("Exchange Bonus", "cte3")
    cte4 = get_offer_cte("Accessories", "cte4")
    cte5 = get_offer_cte("Additional Offer 1", "cte5")
    cte6 = get_offer_cte("Additional Offer 2", "cte6")
    cte7 = get_offer_cte("Cash Discount", "cte7")
    cte8 = get_offer_cte("Foc Accessories", "cte8")
    cte9 = get_offer_cte("Insurance Discount", "cte9")
    cte10 = get_offer_cte("Promotional Offers", "cte10")

    # AdditionalDiscount
    if oc_raw_df is not None:
        if "type" in oc_raw_df.columns:
            add_disc = (
                oc_raw_df
                .filter(col("offer_type").isin("Additional Offer 1", "Additional Offer 2") & (col("type") == "EX-GST DISCOUNT"))
                .groupBy("lead_id")
                .agg(coalesce(spark_sum("amount"), lit(0)).alias("Additional_Discount_Excl_GST"))
            )
        elif "before_gst" in oc_raw_df.columns:
            add_disc = (
                oc_raw_df
                .filter(col("offer_type").isin("Additional Offer 1", "Additional Offer 2"))
                .groupBy("lead_id")
                .agg(coalesce(spark_sum("before_gst"), lit(0)).alias("Additional_Discount_Excl_GST"))
            )
        else:
            add_disc = spark.createDataFrame([], "lead_id INT, Additional_Discount_Excl_GST DOUBLE")
    else:
        add_disc = spark.createDataFrame([], "lead_id INT, Additional_Discount_Excl_GST DOUBLE")

    # OfferCalculations
    if oc_raw_df is not None:
        if "type" in oc_raw_df.columns:
            oc_summary = (
                oc_raw_df
                .groupBy("lead_id")
                .agg(
                    coalesce(spark_sum(when(col("type") == "DISCOUNT INCL GST", col("amount"))), lit(0)).alias("Total_Discount_Amount"),
                    coalesce(spark_sum(when(col("type") == "Dealer Share", col("amount"))), lit(0)).alias("Dealer_Offers_V2"),
                    coalesce(spark_sum(when(col("type") == "OEM Share", col("amount"))), lit(0)).alias("OEM_Offers_V2")
                )
            )
        elif "before_gst" in oc_raw_df.columns:
            oc_summary = (
                oc_raw_df
                .groupBy("lead_id")
                .agg(
                    coalesce(spark_sum("before_gst"), lit(0)).alias("Total_Discount_Amount"),
                    coalesce(spark_sum("dealer_share"), lit(0)).alias("Dealer_Offers_V2"),
                    coalesce(spark_sum("oem_share"), lit(0)).alias("OEM_Offers_V2")
                )
            )
        else:
            oc_summary = spark.createDataFrame([], "lead_id INT, Total_Discount_Amount DOUBLE, Dealer_Offers_V2 DOUBLE, OEM_Offers_V2 DOUBLE")
    else:
        oc_summary = spark.createDataFrame([], "lead_id INT, Total_Discount_Amount DOUBLE, Dealer_Offers_V2 DOUBLE, OEM_Offers_V2 DOUBLE")

    # Total accessories kit cost
    if acc_df is not None:
        acc_total_filtered = acc_df.filter(
            (col("stage_id") == 7) &
            col("dms_accessories_type").isin("ESSENTIAL KIT-MRP", "KIT-MRP", "ESSENTIAL KIT-FOC", "KIT-FOC")
        )
        acc_total_grp = (
            acc_total_filtered
            .groupBy("kit_id", "lead_id")
            .agg(spark_max("final_kit_cost").alias("final_kit_cost"))
        )
        acc_total_sum = (
            acc_total_grp
            .groupBy("lead_id")
            .agg(coalesce(spark_sum("final_kit_cost"), lit(0)).alias("acc_kit_cost"))
        )
    else:
        acc_total_sum = spark.createDataFrame([], "lead_id INT, acc_kit_cost DOUBLE")

    # Fuel / Transmission ID lookup table from dms_master_org_common
    if moc_df is not None:
        fuel_id_df = (
            moc_df.filter(col("attribute") == "FUEL_TYPE")
            .groupBy("value")
            .agg(spark_max("id").alias("fuel_type_id"))
        )
        trans_id_df = (
            moc_df.filter(col("attribute") == "TRANSMISSION_TYPE")
            .groupBy("value")
            .agg(spark_max("id").alias("transmission_id"))
        )
    else:
        fuel_id_df = spark.createDataFrame([], "value STRING, fuel_type_id INT")
        trans_id_df = spark.createDataFrame([], "value STRING, transmission_id INT")

    # Employee Mgr hierarchy
    if de_df is not None:
        de_mgr1 = de_df.select(col("emp_id").alias("mgr1_emp_id"), col("emp_name").alias("manager1_name"), col("active").alias("manager1_active"), col("reporting_to").alias("mgr1_reporting_to"))
        de_mgr2 = de_df.select(col("emp_id").alias("mgr2_emp_id"), col("emp_name").alias("manager2_name"), col("active").alias("manager2_active"))
    else:
        de_mgr1 = spark.createDataFrame([], "mgr1_emp_id INT, manager1_name STRING, manager1_active INT, mgr1_reporting_to INT")
        de_mgr2 = spark.createDataFrame([], "mgr2_emp_id INT, manager2_name STRING, manager2_active INT")

    # Customer types
    if cust_type_raw_df is not None:
        customer_type_df1 = cust_type_raw_df.select(col("id").alias("dc1_id"), col("customer_type").alias("dc1_cust_type"))
        customer_type_df2 = cust_type_raw_df.select(col("id").alias("dc2_id"), col("customer_type").alias("dc2_cust_type"))
    else:
        customer_type_df1 = spark.createDataFrame([], "dc1_id INT, dc1_cust_type STRING")
        customer_type_df2 = spark.createDataFrame([], "dc2_id INT, dc2_cust_type STRING")

    # Location nodes
    if lnd_df is not None:
        lnd_parent = lnd_df.select(col("id").alias("lnd_id"), col("parent_id").alias("lnd_parent_id"))
        loc_node = lnd_df.select(col("id").alias("loc_id"), col("code").alias("branch_location"))
    else:
        lnd_parent = spark.createDataFrame([], "lnd_id INT, lnd_parent_id INT")
        loc_node = spark.createDataFrame([], "loc_id INT, branch_location STRING")

    # Buyer type & Insurance type common lookup
    if mc_df is not None:
        bmc_df = mc_df.select(col("id").alias("bmc_id"), col("value").alias("buyer_type"))
        mc_ins_df = mc_df.select(col("id").alias("mc_id"), col("value").alias("insur_type"))
    else:
        bmc_df = spark.createDataFrame([], "bmc_id INT, buyer_type STRING")
        mc_ins_df = spark.createDataFrame([], "mc_id INT, insur_type STRING")

    # -------------------------------------------------------------------------
    # 2. Main Join Core Execution
    # -------------------------------------------------------------------------
    
    filtered_lsr = (
        lsr_df
        .filter(
            (col("stage_id") == 7) &
            col("drop_status_id").isNull() &
            col("org_id").isin(VALID_ORGS)
        )
        .dropDuplicates(["lead_id"])
    )

    fact = (
        dl_df.alias("dl")
        .join(filtered_lsr.alias("lsr"), col("dl.lead_id") == col("lsr.lead_id"), "inner")
        .join(db_df.alias("db"), (col("lsr.branch_id") == col("db.branch_id")) & col("db.service_type_id").isin(VALID_BRANCH_TYPES), "inner")
        .join(dll_df.alias("dll"), (col("lsr.lead_id") == col("dll.id")) & (col("dll.org_id") == col("lsr.org_id")), "inner")
        .join(amrp.alias("amrp"), col("dl.lead_id") == col("amrp.lead_id"), "left")
        .join(cte1.alias("cte1"), col("dl.lead_id") == col("cte1.lead_id"), "left")
        .join(cte2.alias("cte2"), col("dl.lead_id") == col("cte2.lead_id"), "left")
        .join(cte3.alias("cte3"), col("dl.lead_id") == col("cte3.lead_id"), "left")
        .join(cte4.alias("cte4"), col("dl.lead_id") == col("cte4.lead_id"), "left")
        .join(cte5.alias("cte5"), col("dl.lead_id") == col("cte5.lead_id"), "left")
        .join(cte6.alias("cte6"), col("dl.lead_id") == col("cte6.lead_id"), "left")
        .join(cte7.alias("cte7"), col("dl.lead_id") == col("cte7.lead_id"), "left")
        .join(cte8.alias("cte8"), col("dl.lead_id") == col("cte8.lead_id"), "left")
        .join(cte9.alias("cte9"), col("dl.lead_id") == col("cte9.lead_id"), "left")
        .join(cte10.alias("cte10"), col("dl.lead_id") == col("cte10.lead_id"), "left")
        .join(add_disc.alias("ad"), col("dl.lead_id") == col("ad.lead_id"), "left")
    )

    if op_df is not None:
        fact = fact.join(op_df.alias("op"), col("dl.lead_id") == col("op.lead_id"), "left")
    if oc_summary is not None:
        fact = fact.join(oc_summary.alias("oc"), col("dl.lead_id") == col("oc.lead_id"), "left")
    if lp_df is not None:
        lp_dedup = lp_df.dropDuplicates(["lead_id"])
        fact = fact.join(lp_dedup.alias("lp"), col("dl.lead_id") == col("lp.lead_id"), "left")
    if fd_df is not None:
        fd_dedup = fd_df.dropDuplicates(["lead_id"])
        fact = fact.join(fd_dedup.alias("fd"), col("dl.lead_id") == col("fd.lead_id"), "left")
    if i_df is not None:
        i_dedup = i_df.dropDuplicates(["lead_id"])
        fact = fact.join(i_dedup.alias("i"), col("dl.lead_id") == col("i.lead_id"), "left")
    if vi_df is not None:
        vi_dedup = vi_df.dropDuplicates(["lead_id"])
        fact = fact.join(vi_dedup.alias("vi"), col("dl.lead_id") == col("vi.lead_id"), "left")
    if li_df is not None:
        li_dedup = li_df.dropDuplicates(["lead_id"])
        fact = fact.join(li_dedup.alias("li"), col("dl.lead_id") == col("li.lead_id"), "left")
    if dic_df is not None:
        fact = fact.join(dic_df.alias("dic"), col("dl.insurance_company_id") == col("dic.id"), "left")
    if mc_ins_df is not None:
        fact = fact.join(mc_ins_df.alias("mc"), col("dl.insurance_taken_id") == col("mc.mc_id"), "left")
    if bmc_df is not None:
        fact = fact.join(bmc_df.alias("bmc"), col("dll.buyer_type_id") == col("bmc.bmc_id"), "left")
    if dac_df is not None:
        fact = fact.join(dac_df.alias("dac"), col("dll.dms_account_id") == col("dac.id"), "left")
    if dc_df is not None:
        fact = fact.join(dc_df.alias("dc"), col("dll.dms_contact_id") == col("dc.id"), "left")
    if cust_type_raw_df is not None:
        fact = fact.join(customer_type_df1.alias("dc1"), col("dc.customer_type_id") == col("dc1.dc1_id"), "left")
        fact = fact.join(customer_type_df2.alias("dc2"), col("dac.customer_type_id") == col("dc2.dc2_id"), "left")
    if de_df is not None:
        fact = fact.join(de_df.alias("de"), col("dll.sales_consultant_id") == col("de.emp_id"), "left")
        fact = fact.join(de_mgr1.alias("de_mgr1"), col("de.reporting_to") == col("de_mgr1.mgr1_emp_id"), "left")
        fact = fact.join(de_mgr2.alias("de_mgr2"), col("de_mgr1.mgr1_reporting_to") == col("de_mgr2.mgr2_emp_id"), "left")
    if og_df is not None:
        fact = fact.join(og_df.alias("og"), col("lsr.org_id") == col("og.org_id"), "left")
    if dse_df is not None:
        fact = fact.join(dse_df.alias("dse"), col("dll.source_of_enquiry") == col("dse.id"), "left")
    if lnd_df is not None:
        fact = fact.join(lnd_parent.alias("lnd"), col("db.org_map_id") == col("lnd.lnd_id"), "left")
        fact = fact.join(loc_node.alias("loc"), col("lnd.lnd_parent_id") == col("loc.loc_id"), "left")

    fact = (
        fact
        .join(acc_total_sum.alias("acc_tot"), col("dl.lead_id") == col("acc_tot.lead_id"), "left")
        .join(fuel_id_df.alias("fuel_id_tb"), trim(col("lp.fuel")) == col("fuel_id_tb.value"), "left")
        .join(trans_id_df.alias("trans_id_tb"), trim(col("lp.transimmision_type")) == col("trans_id_tb.value"), "left")
    )

    # Pre-computations for demographic join keys
    if dac_df is not None and dc_df is not None:
        dob_col = coalesce(col("dac.date_of_birth"), col("dc.date_of_birth"))
        gender_id_val = coalesce(col("dac.gender_id"), col("dc.gender_id"))
    elif dac_df is not None:
        dob_col = col("dac.date_of_birth")
        gender_id_val = col("dac.gender_id")
    elif dc_df is not None:
        dob_col = col("dc.date_of_birth")
        gender_id_val = col("dc.gender_id")
    else:
        dob_col = lit(None)
        gender_id_val = lit(None)

    age_expr = floor(months_between(current_date(), dob_col) / 12) if dob_col is not None else lit(None)

    age_group_id_expr = when((age_expr >= 10) & (age_expr <= 24), lit(1)) \
                       .when((age_expr >= 25) & (age_expr <= 45), lit(2)) \
                       .when(age_expr > 45, lit(3)) \
                       .otherwise(lit(None))

    gender_id_expr = when(gender_id_val.isin(1, 386), lit(386)) \
                    .when(gender_id_val.isin(2, 387), lit(387)) \
                    .when(gender_id_val == 388, lit(388)) \
                    .otherwise(lit(None))

    cust_type_id_col = coalesce(col("dc1.dc1_id"), col("dc2.dc2_id")) if cust_type_raw_df is not None else lit(None)

    # Dynamic LEFT JOINs with all Star Schema Dimension Tables
    if dim_make_df is not None:
        fact = fact.join(dim_make_df.alias("dm_mk"), upper(trim(col("lp.make"))) == upper(trim(col("dm_mk.Make_Name"))), "left")
    if dim_model_df is not None:
        fact = fact.join(dim_model_df.alias("dm_md"), upper(trim(col("lp.model"))) == upper(trim(col("dm_md.Model_Name"))), "left")
    if dim_variant_df is not None:
        fact = fact.join(dim_variant_df.alias("dm_vr"), upper(trim(col("lp.variant"))) == upper(trim(col("dm_vr.Variant_Name"))), "left")
    if dim_color_df is not None:
        fact = fact.join(dim_color_df.alias("dm_cl"), upper(trim(col("lp.color"))) == upper(trim(col("dm_cl.Color_Name"))), "left")
    if dim_fuel_df is not None:
        fact = fact.join(dim_fuel_df.alias("dm_fl"), upper(trim(col("lp.fuel"))) == upper(trim(col("dm_fl.Fuel_Type"))), "left")
    if dim_trans_df is not None:
        fact = fact.join(dim_trans_df.alias("dm_tr"), upper(trim(col("lp.transimmision_type"))) == upper(trim(col("dm_tr.Transmission"))), "left")
    if dim_branch_df is not None:
        fact = fact.join(dim_branch_df.alias("dm_br"), col("lsr.branch_id") == col("dm_br.Branch_Id"), "left")
    if dim_sc_df is not None:
        fact = fact.join(dim_sc_df.alias("dm_sc"), col("dll.sales_consultant_id") == col("dm_sc.Sales_Consultant_Id"), "left")
    if dim_mgr1_df is not None:
        fact = fact.join(dim_mgr1_df.alias("dm_m1"), col("de.reporting_to") == col("dm_m1.Manager1_Id"), "left")
    if dim_mgr2_df is not None:
        fact = fact.join(dim_mgr2_df.alias("dm_m2"), col("de_mgr1.mgr1_reporting_to") == col("dm_m2.Manager2_Id"), "left")
    if dim_src_df is not None:
        fact = fact.join(dim_src_df.alias("dm_src"), col("dll.source_of_enquiry") == col("dm_src.Source_Id"), "left")
    if dim_subsrc_df is not None:
        fact = fact.join(dim_subsrc_df.alias("dm_subsrc"), col("dll.sub_source_id") == col("dm_subsrc.Sub_Source_Id"), "left")
    if dim_bt_df is not None:
        fact = fact.join(dim_bt_df.alias("dm_bt"), col("dll.buyer_type_id") == col("dm_bt.Buyer_Type_Id"), "left")
    if dim_es_df is not None:
        fact = fact.join(dim_es_df.alias("dm_es"), col("dll.enquiry_segment_id") == col("dm_es.Enquiry_Segment_Id"), "left")
    if dim_gen_df is not None:
        fact = fact.join(dim_gen_df.alias("dm_gn"), gender_id_expr == col("dm_gn.Gender_Id"), "left")
    if dim_ag_df is not None:
        fact = fact.join(dim_ag_df.alias("dm_ag"), age_group_id_expr.cast("integer") == col("dm_ag.Age_Group_Id"), "left")
    if dim_ct_df is not None:
        fact = fact.join(dim_ct_df.alias("dm_ct"), cust_type_id_col == col("dm_ct.Cust_Type_Id"), "left")
    if dim_it_df is not None:
        fact = fact.join(dim_it_df.alias("dm_it"), col("dl.insurance_taken_id") == col("dm_it.Insur_Type_Id"), "left")
    if dim_ic_df is not None:
        fact = fact.join(dim_ic_df.alias("dm_ic"), col("dl.insurance_company_id") == col("dm_ic.Insur_Company_Id"), "left")
    if dim_ft_df is not None:
        fact = fact.join(dim_ft_df.alias("dm_ft"), col("fd.finance_type_id") == col("dm_ft.Finance_Type_Id"), "left")
    if dim_fc_df is not None:
        fact = fact.join(dim_fc_df.alias("dm_fc"), upper(trim(col("fd.finance_company"))) == upper(trim(col("dm_fc.Finance_Company"))), "left")
    if dim_lc_df is not None:
        fact = fact.join(dim_lc_df.alias("dm_lc"), upper(trim(col("i.leasing_name"))) == upper(trim(col("dm_lc.Leasing_Company_Name"))), "left")

    # -------------------------------------------------------------------------
    # 3. Calculation Expressions & Column Mapping (All 223 Columns)
    # -------------------------------------------------------------------------

    age_group_expr = when((age_expr >= 10) & (age_expr <= 24), "Below 25") \
                     .when((age_expr >= 25) & (age_expr <= 45), "25-45") \
                     .when(age_expr > 45, "Above 45") \
                     .otherwise(lit(None))

    gender_expr = when(gender_id_val.isin(1, 386), "Male") \
                  .when(gender_id_val.isin(2, 387), "Female") \
                  .when(gender_id_val == 388, "Other") \
                  .otherwise(lit(None))

    tot_disc_excl_gst_expr = (
        coalesce(col("cte7.cte7_ex"), lit(0)) +
        coalesce(col("cte2.cte2_ex"), lit(0)) +
        coalesce(col("cte4.cte4_ex"), lit(0)) +
        coalesce(col("cte9.cte9_ex"), lit(0)) +
        coalesce(col("cte5.cte5_ex"), lit(0)) +
        coalesce(col("cte6.cte6_ex"), lit(0)) +
        coalesce(col("cte3.cte3_ex"), lit(0)) +
        coalesce(col("cte8.cte8_ex"), lit(0)) +
        coalesce(col("cte10.cte10_ex"), lit(0)) +
        coalesce(col("cte1.cte1_ex"), lit(0))
    )

    tot_acc_amount_expr = coalesce(col("acc_tot.acc_kit_cost"), lit(0)) + coalesce(col("amrp.Total_accessories_MRP"), lit(0))

    month_yy_expr = date_format(to_date(col("lsr.start_date")), "MMM''yy")

    cust_type_col = coalesce(col("dc1.dc1_cust_type"), col("dc2.dc2_cust_type")) if cust_type_raw_df is not None else lit(None)

    sales_consultant_active_col = col("de.active") if de_df is not None else lit(None)
    mgr1_id_col = col("de.reporting_to") if de_df is not None else lit(None)
    mgr1_active_col = col("de_mgr1.manager1_active") if de_df is not None else lit(None)
    mgr2_id_col = col("de_mgr1.mgr1_reporting_to") if de_df is not None else lit(None)
    mgr2_active_col = col("de_mgr2.manager2_active") if de_df is not None else lit(None)
    mgr1_name_col = col("de_mgr1.manager1_name") if de_df is not None else lit(None)
    mgr2_name_col = col("de_mgr2.manager2_name") if de_df is not None else lit(None)

    source_id_col = col("dse.id") if dse_df is not None else lit(None)
    source_name_col = col("dse.name") if dse_df is not None else lit(None)
    buyer_type_col = col("bmc.buyer_type") if bmc_df is not None else lit(None)
    insur_type_col = col("mc.insur_type") if mc_ins_df is not None else lit(None)
    insur_comp_id_col = col("dic.id") if dic_df is not None else lit(None)
    insur_comp_name_col = col("dic.company_name") if dic_df is not None else lit(None)
    loc_id_col = col("loc.loc_id") if lnd_df is not None else lit(None)
    loc_name_col = col("loc.branch_location") if lnd_df is not None else lit(None)
    org_name_col = col("og.name") if og_df is not None else lit(None)
    org_brand_col = col("og.brand") if og_df is not None else lit(None)

    op_ex_showroom = col("op.ex_showroom_price") if op_df is not None else lit(0)
    op_tcs = col("op.tcs_amount") if op_df is not None else lit(0)
    op_life_tax = col("op.life_tax") if op_df is not None else lit(0)
    op_corp_offer = col("op.corporate_offer") if op_df is not None else lit(0)
    op_handling = col("op.handling_charges") if op_df is not None else lit(0)
    op_add1 = col("op.additional_offer1") if op_df is not None else lit(0)
    op_add2 = col("op.additional_offer2") if op_df is not None else lit(0)
    op_ins_disc = col("op.insurance_discount") if op_df is not None else lit(0)
    op_spec_scheme = col("op.special_scheme") if op_df is not None else lit(0)
    op_exch_offers = col("op.exchange_offers") if op_df is not None else lit(0)
    op_foc_acc = col("op.foc_accessories") if op_df is not None else lit(0)
    op_promo_offers = col("op.promotional_offers") if op_df is not None else lit(0)
    op_acc_disc = col("op.accessories_discount") if op_df is not None else lit(0)
    op_cash_disc = col("op.cash_discount") if op_df is not None else lit(0)

    vi_inv_price = col("vi.invoice_price") if vi_df is not None else lit(0)
    vi_gst = col("vi.gst_rate") if vi_df is not None else lit(0)
    vi_cess = col("vi.cess") if vi_df is not None else lit(0)

    # Dynamic Column Expressions resolved from dimension tables
    make_id_v2_expr = coalesce(col("dm_mk.Make_Id_V2"), col("lp.make_id")) if dim_make_df is not None else (col("lp.make_id") if lp_df is not None else lit(None))
    make_name_expr = coalesce(col("dm_mk.Make_Name"), col("lp.make")) if dim_make_df is not None else (col("lp.make") if lp_df is not None else lit(None))

    model_id_v2_expr = coalesce(col("dm_md.Model_Id_V2"), col("lp.model_id")) if dim_model_df is not None else (col("lp.model_id") if lp_df is not None else lit(None))
    model_name_expr = coalesce(col("dm_md.Model_Name"), col("lp.model")) if dim_model_df is not None else (col("lp.model") if lp_df is not None else lit(None))

    variant_id_v2_expr = coalesce(col("dm_vr.Variant_Id_V2"), col("lp.variant_id")) if dim_variant_df is not None else (col("lp.variant_id") if lp_df is not None else lit(None))
    variant_name_expr = coalesce(col("dm_vr.Variant_Name"), col("lp.variant")) if dim_variant_df is not None else (col("lp.variant") if lp_df is not None else lit(None))

    color_id_v2_expr = col("dm_cl.Color_Id_V2") if dim_color_df is not None else lit(None).cast("integer")
    color_name_expr = coalesce(col("dm_cl.Color_Name"), col("lp.color")) if dim_color_df is not None else (col("lp.color") if lp_df is not None else lit(None))

    fuel_type_id_v2_expr = coalesce(col("dm_fl.Fuel_Type_Id_V2"), col("fuel_id_tb.fuel_type_id")) if dim_fuel_df is not None else col("fuel_id_tb.fuel_type_id")
    fuel_type_name_expr = coalesce(col("dm_fl.Fuel_Type"), col("lp.fuel")) if dim_fuel_df is not None else (col("lp.fuel") if lp_df is not None else lit(None))

    transmission_id_v2_expr = coalesce(col("dm_tr.Transmission_Id_V2"), col("trans_id_tb.transmission_id")) if dim_trans_df is not None else col("trans_id_tb.transmission_id")
    transmission_name_expr = coalesce(col("dm_tr.Transmission"), col("lp.transimmision_type")) if dim_trans_df is not None else (col("lp.transimmision_type") if lp_df is not None else lit(None))

    sales_consultant_id_v2_expr = coalesce(col("dm_sc.Sales_Consultant_Id_V2"), col("dll.sales_consultant_id")) if dim_sc_df is not None else col("dll.sales_consultant_id")
    sales_consultant_name_expr = coalesce(col("dm_sc.Sales_Consultant_Name"), col("dll.sales_consultant")) if dim_sc_df is not None else col("dll.sales_consultant")

    manager1_id_v2_expr = coalesce(col("dm_m1.Manager1_Id_V2"), mgr1_id_col) if dim_mgr1_df is not None else mgr1_id_col
    manager1_name_expr = coalesce(col("dm_m1.Manager1_Name"), mgr1_name_col) if dim_mgr1_df is not None else mgr1_name_col

    manager2_id_v2_expr = coalesce(col("dm_m2.Manager2_Id_V2"), mgr2_id_col) if dim_mgr2_df is not None else mgr2_id_col
    manager2_name_expr = coalesce(col("dm_m2.Manager2_Name"), mgr2_name_col) if dim_mgr2_df is not None else mgr2_name_col

    source_id_v2_expr = coalesce(col("dm_src.Source_Id_V2"), source_id_col) if dim_src_df is not None else source_id_col
    source_name_expr = coalesce(col("dm_src.Source"), source_name_col) if dim_src_df is not None else source_name_col

    sub_source_id_v2_expr = coalesce(col("dm_subsrc.Sub_Source_Id_V2"), col("dll.sub_source_id")) if dim_subsrc_df is not None else col("dll.sub_source_id")
    sub_source_name_expr = col("dm_subsrc.Sub_Source") if dim_subsrc_df is not None else lit(None).cast("string")

    buyer_type_id_v2_expr = coalesce(col("dm_bt.Buyer_Type_Id_V2"), col("dll.buyer_type_id")) if dim_bt_df is not None else col("dll.buyer_type_id")
    buyer_type_name_expr = coalesce(col("dm_bt.Buyer_Type_Name"), buyer_type_col) if dim_bt_df is not None else buyer_type_col

    enquiry_segment_id_v2_expr = coalesce(col("dm_es.Enquiry_Segment_Id_V2"), col("dll.enquiry_segment_id")) if dim_es_df is not None else col("dll.enquiry_segment_id")
    enquiry_segment_name_expr = coalesce(col("dm_es.Enquiry_Segment_Name"), col("dll.enquiry_segment")) if dim_es_df is not None else col("dll.enquiry_segment")

    gender_id_v2_expr = coalesce(col("dm_gn.Gender_Id_V2"), gender_id_expr) if dim_gen_df is not None else gender_id_expr
    gender_name_expr = coalesce(col("dm_gn.Gender_Name"), gender_expr) if dim_gen_df is not None else gender_expr

    age_group_id_v2_expr = coalesce(col("dm_ag.Age_Group_Id_V2"), when(age_group_id_expr.isNull(), lit(-1)).otherwise(age_group_id_expr.cast("integer"))) if dim_ag_df is not None else when(age_group_id_expr.isNull(), lit(-1)).otherwise(age_group_id_expr.cast("integer"))
    age_group_name_expr = coalesce(col("dm_ag.Age_Group_Name"), age_group_expr) if dim_ag_df is not None else age_group_expr

    customer_type_id_v2_expr = coalesce(col("dm_ct.Cust_Type_Id_V2"), cust_type_id_col) if dim_ct_df is not None else cust_type_id_col
    customer_type_name_expr = coalesce(col("dm_ct.Cust_Type_Name"), cust_type_col) if dim_ct_df is not None else cust_type_col

    insur_type_id_v2_expr = coalesce(col("dm_it.Insur_Type_Id_V2"), col("mc.mc_id")) if dim_it_df is not None else (col("mc.mc_id") if mc_ins_df is not None else lit(None))
    insur_type_name_expr = coalesce(col("dm_it.Insur_Type"), insur_type_col) if dim_it_df is not None else insur_type_col

    insur_company_name_id_v2_expr = coalesce(col("dm_ic.Insur_Company_Id_V2"), insur_comp_id_col) if dim_ic_df is not None else insur_comp_id_col
    insur_company_name_expr = coalesce(col("dm_ic.Insur_Company"), insur_comp_name_col) if dim_ic_df is not None else insur_comp_name_col

    finance_type_id_v2_expr = coalesce(col("dm_ft.Finance_Type_Id_V2"), col("fd.finance_type_id")) if dim_ft_df is not None else (col("fd.finance_type_id") if fd_df is not None else lit(None))
    finance_type_name_expr = coalesce(col("dm_ft.Finance_Type"), col("fd.finance_type")) if dim_ft_df is not None else (col("fd.finance_type") if fd_df is not None else lit(None))

    finance_company_id_v2_expr = col("dm_fc.Finance_Company_Id_V2") if dim_fc_df is not None else lit(None).cast("integer")
    finance_company_name_expr = coalesce(col("dm_fc.Finance_Company"), col("fd.finance_company")) if dim_fc_df is not None else (col("fd.finance_company") if fd_df is not None else lit(None))

    leasing_company_id_expr = col("dm_lc.Leasing_Company_Id") if dim_lc_df is not None else lit(None).cast("integer")
    leasing_company_name_expr = coalesce(col("dm_lc.Leasing_Company_Name"), col("i.leasing_name")) if dim_lc_df is not None else (col("i.leasing_name") if i_df is not None else lit(None))

    select_cols = [
        col("dl.lead_id").alias("lead_id"),
        to_date(col("lsr.start_date")).alias("date_of_actual_delivery"),
        to_date(col("dl.created_datetime")).alias("date_of_delivery_rta_tally"),
        to_date(col("vi.purchase_date")).alias("date_of_purchase") if vi_df is not None else lit(None).alias("date_of_purchase"),
        datediff(current_date(), to_date(col("vi.purchase_date"))).alias("date_of_purchase_ageing_days") if vi_df is not None else lit(None).alias("date_of_purchase_ageing_days"),
        col("dll.sales_consultant_id").alias("sales_consultant_id"),
        sales_consultant_active_col.alias("sales_consutant_active"),
        mgr1_id_col.alias("manager1_id"),
        mgr1_active_col.alias("manager1_active"),
        mgr2_id_col.alias("manager2_id"),
        mgr2_active_col.alias("manager2_active"),
        col("mc.mc_id").alias("insur_type_id") if mc_ins_df is not None else lit(None).alias("insur_type_id"),
        insur_comp_id_col.alias("insur_company_name_id"),
        col("li.gross_premium").alias("insur_gross_premium_incl_gst") if li_df is not None else lit(None).alias("insur_gross_premium_incl_gst"),
        spark_round(col("li.gross_premium") / 1.18, 2).alias("insur_gross_premium_excl_gst") if li_df is not None else lit(None).alias("insur_gross_premium_excl_gst"),
        col("li.net_od_premium").alias("insur_od_premium_incl_gst") if li_df is not None else lit(None).alias("insur_od_premium_incl_gst"),
        spark_round(col("li.net_od_premium") / 1.18, 2).alias("insur_od_premium_excl_gst") if li_df is not None else lit(None).alias("insur_od_premium_excl_gst"),
        col("li.od_discount_percentage").alias("insur_od_discount_percentage") if li_df is not None else lit(None).alias("insur_od_discount_percentage"),
        col("li.od_discount_amount").alias("insur_od_discount_incl_gst") if li_df is not None else lit(None).alias("insur_od_discount_incl_gst"),
        spark_round(col("li.od_discount_amount") / 1.18, 2).alias("insur_od_discount_excl_gst") if li_df is not None else lit(None).alias("insur_od_discount_excl_gst"),
        col("li.add_on_insurance_premium").alias("insur_addon_premium_incl_gst") if li_df is not None else lit(None).alias("insur_addon_premium_incl_gst"),
        spark_round(col("li.add_on_insurance_premium") / 1.18, 2).alias("insur_addon_premium_excl_gst") if li_df is not None else lit(None).alias("insur_addon_premium_excl_gst"),
        spark_round((col("li.other_payout_amount") / when(col("li.other_payout_percentage") == 0, lit(None)).otherwise(col("li.other_payout_percentage") / 100)) * (coalesce(col("li.irda_payout_percentage"), lit(0)) / 100), 2).alias("insur_irda_incl_gst") if li_df is not None else lit(None).alias("insur_irda_incl_gst"),
        spark_round(((col("li.other_payout_amount") / when(col("li.other_payout_percentage") == 0, lit(None)).otherwise(col("li.other_payout_percentage") / 100)) * (coalesce(col("li.irda_payout_percentage"), lit(0)) / 100)) / 1.18, 2).alias("insur_irda_excl_gst") if li_df is not None else lit(None).alias("insur_irda_excl_gst"),
        spark_round(col("li.total_premium") - col("li.insurance_paid"), 2).alias("insur_margin") if li_df is not None else lit(None).alias("insur_margin"),
        col("li.irda_payout_percentage").alias("isur_irda_percentage") if li_df is not None else lit(None).alias("isur_irda_percentage"),
        col("li.other_payout_percentage").alias("insur_other_payout_percentage") if li_df is not None else lit(None).alias("insur_other_payout_percentage"),
        col("li.other_payout_amount").alias("insur_other_payout_incl_gst") if li_df is not None else lit(None).alias("insur_other_payout_incl_gst"),
        spark_round(col("li.other_payout_amount") / 1.18, 2).alias("insur_other_payout_excl_gst") if li_df is not None else lit(None).alias("insur_other_payout_excl_gst"),
        col("li.total_payout").alias("insur_total_insurance_payout_incl_gst") if li_df is not None else lit(None).alias("insur_total_insurance_payout_incl_gst"),
        spark_round(coalesce(col("li.total_payout") / 1.18, lit(0)), 2).alias("insur_total_insurance_payout_excl_gst") if li_df is not None else lit(0).alias("insur_total_insurance_payout_excl_gst"),
        col("fd.finance_type_id").alias("finance_type_id") if fd_df is not None else lit(None).alias("finance_type_id"),
        finance_company_id_v2_expr.alias("finance_company_id"),
        col("fd.lone_disburse_amount").alias("finance_do_ammount") if fd_df is not None else lit(None).alias("finance_do_ammount"),
        col("fd.loan_amount").alias("finance_do_receivable") if fd_df is not None else lit(None).alias("finance_do_receivable"),
        col("fd.payout").alias("finance_payout_percentage") if fd_df is not None else lit(None).alias("finance_payout_percentage"),
        col("fd.total_Finance_Pay_out").alias("finance_total_payout_incl_gst") if fd_df is not None else lit(None).alias("finance_total_payout_incl_gst"),
        spark_round(coalesce(col("fd.total_Finance_Pay_out") / 1.18, lit(0)), 2).alias("finance_total_payout_excl_gst") if fd_df is not None else lit(0).alias("finance_total_payout_excl_gst"),
        col("dl.life_tax_collected").alias("life_tax_collected_from_customer"),
        col("dl.tr_charges_collected").alias("tr_charges_collected_from_customer"),
        col("dl.total_tax_collected").alias("total_tax_collected_from_customer"),
        col("dl.second_vehicle_tax").alias("second_vehicle_tax"),
        col("dl.tr_charges_paid").alias("tr_charges_paid"),
        col("dl.hsrp_amount").alias("hsrp_charges_paid"),
        col("dl.total_tax_paid").alias("total_taxes_paid"),
        col("dl.amc_premium_excl_gst").alias("amc_premium_excl_gst"),
        col("dl.Additional_Coverage_Premium").alias("sot"),
        col("dl.ETD_Warranty_Premium").alias("ex_warranty_incl_gst"),
        col("dl.etd_warranty_premium_excl_gst").alias("ex_warranty_excl_gst"),
        col("dl.etd_warranty_payout").alias("commission_on_ex_wart"),
        col("dl.cost_of_teflon_coating_excl_gst").alias("teflon_excl_gst"),
        col("dl.ceramic_coating_amount_excl_gst").alias("ceramic_coating_excl_gst"),
        col("dl.Fastag_Amount").alias("fastag_collected"),
        col("dl.cost_of_fasttag").alias("coat_on_fastag"),
        col("dl.Additional_Coverage_Payout").alias("amc_payout_excl_gst"),
        col("dl.total_receipt").alias("total_receipt"),
        col("dl.total_income").alias("total_income"),
        spark_round(op_ex_showroom - vi_inv_price, 2).alias("dealer_margin_allowed"),
        spark_round(op_ex_showroom - col("oc.Total_Discount_Amount"), 2).alias("s_net_ex_showroom_price_incl_gst"),
        spark_round(op_ex_showroom, 2).alias("s_ex_showroom_price_on_road_price"),
        spark_round((op_ex_showroom - col("oc.Total_Discount_Amount")) / (lit(1) + (coalesce(col("i.gst_rate"), lit(0)) / 100.0)), 2).alias("s_net_ex_showroom_price_excl_gst") if i_df is not None else lit(0).alias("s_net_ex_showroom_price_excl_gst"),
        spark_round((op_ex_showroom - col("oc.Total_Discount_Amount")) / (lit(1) + ((coalesce(vi_gst, lit(0)) + coalesce(vi_cess, lit(0))) / 100.0)), 2).alias("net_ex_showroom_excl_gst_cess"),
        vi_inv_price.cast("decimal(10,2)").alias("vi_purchase_price_incl_gst"),
        spark_round(when(vi_inv_price.isNull() | (vi_inv_price == 0), lit(None)).otherwise(vi_inv_price / (lit(1) + (coalesce(vi_gst, lit(0)) / 100))), 2).alias("vi_purchase_price_gst_excl_gst"),
        spark_round(when(vi_inv_price.isNull() | (vi_inv_price == 0), lit(None)).otherwise(vi_inv_price / (lit(1) + ((coalesce(vi_gst, lit(0)) + coalesce(vi_cess, lit(0))) / 100))), 2).alias("vi_purchase_price_gst_cess_excl_gst"),
        op_tcs.alias("tcs"),
        spark_round((op_ex_showroom - col("oc.Total_Discount_Amount")) - coalesce(vi_inv_price, lit(0)), 2).alias("vi_purchase_dealer_margin_incl_gst"),
        col("oc.Dealer_Offers_V2").alias("Dealer_Offers_V2"),
        col("oc.OEM_Offers_V2").alias("OEM_Offers_V2"),
        op_life_tax.alias("life_tax_as_par_rta_records"),
        col("dl.paid_accessories_cost").alias("cost_of_accessories_sold"),
        spark_round(col("dl.paid_accessories_cost") - col("dl.free_accessories_cost"), 2).alias("margin_on_accessries"),
        op_corp_offer.alias("total_corporate_discount"),
        op_handling.alias("handling_charges"),
        lit(None).cast("double").alias("other_prices_v2"),
        spark_round(op_add1 + op_add2, 2).alias("additional_discount"),
        col("i.gst_rate").alias("i_gst") if i_df is not None else lit(None).alias("i_gst"),
        vi_gst.alias("vi_gst"),
        col("i.cess_percentage").alias("i_cess_percentage") if i_df is not None else lit(None).alias("i_cess_percentage"),
        col("i.transaction_type").alias("i_transaction_type") if i_df is not None else lit(None).alias("i_transaction_type"),
        col("i.cess_amount").alias("i_cess_amount") if i_df is not None else lit(None).alias("i_cess_amount"),
        col("i.total_tax").alias("i_total_tax") if i_df is not None else lit(None).alias("i_total_tax"),
        col("vi.inventory_cost").alias("vi_inventory_holding_cost") if vi_df is not None else lit(None).alias("vi_inventory_holding_cost"),
        vi_cess.alias("vi_cess_percentage"),
        op_ins_disc.alias("disc_offer2_insurance_incl_gst"),
        op_add1.alias("discoffer3_offer1_incl_gst"),
        op_add2.alias("discoffer4_offer2_incl_gst"),
        op_spec_scheme.alias("discOffer10_consumer_incl_gst"),
        op_exch_offers.alias("discoffer6_exchange_incl_gst"),
        op_foc_acc.alias("discoffer7_foc_accessories_incl_gst"),
        op_promo_offers.alias("discoffer8_promotional_incl_gst"),
        op_corp_offer.alias("discoffer9_corporate_incl_gst"),
        op_acc_disc.alias("discoffer11_accessories_incl_gst"),
        col("oc.Total_Discount_Amount").alias("total_discount_incl_gst"),
        col("cte1.cte1_ex").alias("discoffer9_corporate_excl_gst"),
        col("cte1.cte1_dlr").alias("corporate_dealer_share"),
        col("cte2.cte2_ex").alias("discoffer10_consumer_excl_gst"),
        col("cte2.cte2_dlr").alias("consumer_dealer_share"),
        col("cte3.cte3_ex").alias("discoffer6_exchange_excl_gst"),
        col("cte3.cte3_dlr").alias("exchange_dealer_share"),
        col("cte4.cte4_ex").alias("discoffer11_accessories_excl_gst"),
        col("cte5.cte5_ex").alias("discoffer3_offer1_excl_gst"),
        col("cte5.cte5_dlr").alias("offer1_dealer_share"),
        col("cte6.cte6_ex").alias("discoffer4_offer2_excl_gst"),
        col("cte6.cte6_dlr").alias("offer2_dealer_share"),
        col("cte7.cte7_ex").alias("discoffer1_cash_excl_gst"),
        col("cte9.cte9_ex").alias("discoffer2_insurance_excl_gst"),
        col("cte10.cte10_ex").alias("discoffer8_promotional_excl_gst"),
        col("cte10.cte10_dlr").alias("promotional_dealer_share"),
        col("ad.Additional_Discount_Excl_GST").alias("additional_discount_exch_gst"),
        spark_round(tot_acc_amount_expr, 2).alias("total_accessories_amount"),
        col("dl.free_accessories_cost").alias("foc_accessories"),
        spark_round(coalesce(col("dl.free_accessories_cost") / 1.18, lit(0)), 2).alias("foc_accessories_excl_gst"),
        col("dl.paid_accessories_cost").alias("paid_accessories"),
        col("db.branch_id").alias("dealer_code_id"),
        loc_id_col.alias("branch_location_id"),
        col("lsr.org_id").alias("org_id"),
        col("db.service_type_id").alias("service_type_id"),
        sales_consultant_id_v2_expr.alias("sales_consultant_id_v2"),
        manager1_id_v2_expr.alias("manager1_id_v2"),
        manager2_id_v2_expr.alias("manager2_id_v2"),
        make_id_v2_expr.alias("make_id_v2"),
        model_id_v2_expr.alias("model_id_v2"),
        variant_id_v2_expr.alias("variant_id_v2"),
        color_id_v2_expr.alias("color_id_v2"),
        fuel_type_id_v2_expr.alias("fuel_type_id_v2"),
        transmission_id_v2_expr.alias("transmission_id_v2"),
        source_id_v2_expr.alias("source_id_v2"),
        sub_source_id_v2_expr.alias("sub_source_id_v2"),
        buyer_type_id_v2_expr.alias("buyer_type_id_v2"),
        enquiry_segment_id_v2_expr.alias("enquiry_segment_id_v2"),
        gender_id_v2_expr.alias("gender_id_v2"),
        age_group_id_v2_expr.alias("age_group_id_v2"),
        customer_type_id_v2_expr.alias("customer_type_id_v2"),
        insur_type_id_v2_expr.alias("insur_type_id_v2"),
        insur_company_name_id_v2_expr.alias("insur_company_name_id_v2"),
        finance_type_id_v2_expr.alias("finance_type_id_v2"),
        finance_company_id_v2_expr.alias("finance_company_id_v2"),
        lit(None).cast("integer").alias("Transaction id"),
        leasing_company_id_expr.alias("Leasing Company id"),
        month_yy_expr.alias("mmm'yy"),
        col("cte7.cte7_dlr").alias("discoffer1_cash_dealer"),
        col("cte8.cte8_dlr").alias("discoffer8_foc_accessories_Dealer_Share"),
        col("vi.stock_holding_days").alias("vi_inventory_holding_days") if vi_df is not None else lit(None).alias("vi_inventory_holding_days"),
        col("vi.inventory_cost_percentage").alias("vi_inventory_cost_percentage") if vi_df is not None else lit(None).alias("vi_inventory_cost_percentage"),
        col("fd.Commission_paid").alias("Commission_paid_Leasing_Company") if fd_df is not None else lit(None).alias("Commission_paid_Leasing_Company"),
        spark_round((((op_ex_showroom - col("oc.Total_Discount_Amount")) / (lit(1) + ((coalesce(vi_gst, lit(0)) + coalesce(vi_cess, lit(0))) / 100.0))) - (coalesce(vi_inv_price, lit(0)) / (lit(1) + ((coalesce(vi_gst, lit(0)) + coalesce(vi_cess, lit(0))) / 100.0)))), 2).alias("vi_purchase_dealer_margin_cess_excl_gst"),
        op_cash_disc.alias("discoffer1_cash_incl_gst"),
        col("cte1.cte1_oem").alias("corporate_oem_share_excl_gst"),
        spark_round(coalesce(col("cte1.cte1_oem") * (lit(1) + coalesce(col("i.total_tax") if i_df is not None else lit(0), lit(0)) / 100), lit(0)), 2).alias("corporate_oem_share_incl_gst"),
        col("cte2.cte2_oem").alias("consumer_oem_share_excl_gst"),
        spark_round(coalesce(col("cte2.cte2_oem") * (lit(1) + coalesce(col("i.total_tax") if i_df is not None else lit(0), lit(0)) / 100), lit(0)), 2).alias("consumer_oem_share_incl_gst"),
        col("cte3.cte3_oem").alias("exchage_oem_share_excl_gst"),
        spark_round(coalesce(col("cte3.cte3_oem") * (lit(1) + coalesce(col("i.total_tax") if i_df is not None else lit(0), lit(0)) / 100), lit(0)), 2).alias("exchange_oem_share_incl_gst"),
        col("cte5.cte5_oem").alias("offer1_oem_share_excl_gst"),
        spark_round(coalesce(col("cte5.cte5_oem") * (lit(1) + coalesce(col("i.total_tax") if i_df is not None else lit(0), lit(0)) / 100), lit(0)), 2).alias("offer1_oem_share_incl_gst"),
        col("cte6.cte6_oem").alias("offer2_oem_share_excl_gst"),
        spark_round(coalesce(col("cte6.cte6_oem") * (lit(1) + coalesce(col("i.total_tax") if i_df is not None else lit(0), lit(0)) / 100), lit(0)), 2).alias("offer2_oem_share_incl_gst"),
        col("cte10.cte10_oem").alias("promotional_oem_share_excl_gst"),
        spark_round(coalesce(col("cte10.cte10_oem") * (lit(1) + coalesce(col("i.total_tax") if i_df is not None else lit(0), lit(0)) / 100), lit(0)), 2).alias("promotional_oem_share_incl_gst"),
        col("db.active").alias("dealer_code_active"),
        col("dl.ceramic_coating_amount_excl_gst").alias("ceramic_coating_amount_excl_gst"),
        col("dl.accessories_payout").alias("mis_income_v1_accessories_payout_excl_gst"),
        col("dl.etd_warranty_payout").alias("mis_income_v1_ex_warranty_payout_excl_gst"),
        col("dl.difference_in_life_tax").alias("mis_income_v1_margin_on_life_tax_excl_gst"),
        col("dl.profit_on_ceramic_coating").alias("mis_income_v1_margin_on_ceramic_coating_excl_gst"),
        col("dl.Margin_on_fastag").alias("mis_income_v1_margin_on_fastag"),
        col("dl.profit_on_teflon_coating").alias("mis_income_v1_margin_on_teflon_coating_excl_gst"),
        spark_round(coalesce(col("dl.accessories_payout") * lit(1.18), lit(0)), 2).alias("mis_income_v2_accessories_payout_incl_gst"),
        spark_round(coalesce(col("dl.etd_warranty_payout") * lit(1.18), lit(0)), 2).alias("mis_income_v2_ex_warranty_payout_incl_gst"),
        spark_round(coalesce(col("dl.difference_in_life_tax") * lit(1.18), lit(0)), 2).alias("mis_income_v2_margin_on_life_tax_incl_gst"),
        spark_round(coalesce(col("dl.Margin_on_fastag") * lit(1.18), lit(0)), 2).alias("mis_income_v2_margin_on_fastag_incl_gst"),
        spark_round(coalesce(col("dl.vas_ceramic_coating_amount"), lit(0)) - coalesce(col("dl.cost_of_ceramic_coating_incl_gst"), lit(0)), 2).alias("mis_income_v2_margin_on_ceramic_coating_incl_gst"),
        spark_round(coalesce(col("dl.vas_teflon_amount"), lit(0)) - coalesce(col("dl.cost_of_teflon_coating_incl_gst"), lit(0)), 2).alias("mis_income_v2_margin_on_teflon_coating_incl_gst"),
        lit("Unknown").alias("vi_inventory_holding_days_group"),
        lit(0).alias("vi_inventory_holding_days_group_Sort_id"),
        col("fd.No_of_days_for_receiving_DO").alias("no_of_days_receiving_do") if fd_df is not None else lit(None).alias("no_of_days_receiving_do"),
        col("dl.lead_id").cast("string").alias("Lead ID (Text)"),
        col("oc.Total_Discount_Amount").alias("total_Discount_incl_gst 2"),
        col("cte8.cte8_ex").alias("discoffer7_foc_accessories_excl_gst"),
        spark_round(tot_disc_excl_gst_expr, 2).alias("total_discount_excl_gst"),
        sales_consultant_name_expr.alias("sales_consultant"),
        manager1_name_expr.alias("manager1_name"),
        manager2_name_expr.alias("manager2_name"),
        make_name_expr.alias("make"),
        model_name_expr.alias("model"),
        variant_name_expr.alias("variant"),
        color_name_expr.alias("color"),
        fuel_type_name_expr.alias("fuel_type"),
        transmission_name_expr.alias("transmission"),
        source_name_expr.alias("source"),
        sub_source_name_expr.alias("sub_source"),
        buyer_type_name_expr.alias("buyer_type"),
        enquiry_segment_name_expr.alias("enquiry_segment"),
        gender_name_expr.alias("gender"),
        age_group_name_expr.alias("age_group"),
        customer_type_name_expr.alias("customer_type"),
        col("dl.warranty_taken").alias("insur_ew"),
        insur_type_name_expr.alias("insur_type"),
        insur_company_name_expr.alias("insure_company_name"),
        finance_type_name_expr.alias("finance_type"),
        finance_company_name_expr.alias("finance_company"),
        leasing_company_name_expr.alias("i_leasing_name"),
        col("db.dealer_code").alias("dealer_code"),
        loc_name_col.alias("branch_location"),
        org_name_col.alias("org_name"),
        org_brand_col.alias("org_brand"),
        lit(None).cast("double").alias("InventoryCost/days")
    ]

    res_df = fact.select(*select_cols)
    res_df = res_df.dropDuplicates(["lead_id"])

    res_df = add_audit_columns(res_df)

    return res_df
