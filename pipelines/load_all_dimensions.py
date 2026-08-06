import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table

from config.constants import VALID_ORGS, VALID_BRANCH_TYPES
from config.filters import apply_global_filters

# Existing dimensions
from pipelines.load_dim_dealer import load_dim_dealer
from pipelines.load_dim_branch import load_dim_branch
from pipelines.load_dim_dealer_code_org import load_dim_dealer_code_org
from pipelines.load_dim_make import load_dim_make
from pipelines.load_dim_model import load_dim_model
from pipelines.load_dim_sales_consultant import load_dim_sales_consultant

# Generic & specialized dimensions
from transform.dimensions.generic_lookup import (
    build_dim_color,
    build_dim_fuel,
    build_dim_fuel_type,
    build_dim_transmission,
    build_dim_buyer_type,
    build_dim_cust_type,
    build_dim_gender,
    build_dim_age_group,
    build_dim_source,
    build_dim_sub_source,
    build_dim_enquiry_segment,
    build_dim_finance_type,
    build_dim_finance_company,
    build_dim_insurance_company,
    build_dim_insurance_type,
    build_dim_insur_ew,
    build_dim_leasing_company,
    build_dim_transaction_type,
    build_dim_last_refreshed
)
from transform.dimensions.dim_manager import transform_dim_manager1, transform_dim_manager2
from transform.dimensions.dim_variant import transform_dim_variant
from transform.staging.stg_employee_hierarchy import build_employee_hierarchy


def load_all_dimensions(spark):

    print("=" * 80)
    print("STARTING ETL FOR ALL 25 DIMENSION TABLES")
    print("=" * 80)

    # 1. Base Core Dimensions
    load_dim_dealer(spark)
    load_dim_branch(spark)
    load_dim_make(spark)
    load_dim_model(spark)
    load_dim_sales_consultant(spark)

    # 2. Product Dimensions
    lsr_df = read_mysql_table(spark, "dms_lead_stage_ref")
    db_df = read_mysql_table(spark, "dms_branch")

    delivery_leads = (
        lsr_df
        .join(db_df, lsr_df["branch_id"] == db_df["branch_id"], "inner")
        .filter(
            (lsr_df["stage_id"] == 7) &
            lsr_df["drop_status_id"].isNull() &
            lsr_df["org_id"].isin(VALID_ORGS) &
            db_df["service_type_id"].isin(VALID_BRANCH_TYPES)
        )
        .select(lsr_df["lead_id"])
        .distinct()
    )

    lead_product_df = read_mysql_table(spark, "dms_lead_product")
    lead_product_df.cache()

    dim_variant = transform_dim_variant(lead_product_df, delivery_leads)
    write_table(dim_variant, "dim_variant")

    dim_color = build_dim_color(lead_product_df, delivery_leads)
    write_table(dim_color, "dim_color")

    dim_fuel = build_dim_fuel(lead_product_df)
    write_table(dim_fuel, "dim_fuel")

    master_org_common_df = read_mysql_table(spark, "dms_master_org_common")
    dim_fuel_type = build_dim_fuel_type(master_org_common_df)
    write_table(dim_fuel_type, "dim_fuel_type")

    dim_transmission = build_dim_transmission(lead_product_df)
    write_table(dim_transmission, "dim_transmission")

    lead_product_df.unpersist()

    # 3. Manager Hierarchy Dimensions
    lead_df = read_mysql_table(spark, "dms_lead")
    employee_df = read_mysql_table(spark, "dms_employee")

    hierarchy_df = build_employee_hierarchy(lead_df, employee_df, delivery_leads)
    hierarchy_df.cache()

    dim_manager1 = transform_dim_manager1(hierarchy_df)
    write_table(dim_manager1, "dim_manager1")

    dim_manager2 = transform_dim_manager2(hierarchy_df)
    write_table(dim_manager2, "dim_manager2")

    hierarchy_df.unpersist()

    # 4. Customer & Demographic Dimensions
    dim_gender = build_dim_gender(spark)
    write_table(dim_gender, "dim_gender")

    dim_age_group = build_dim_age_group(spark)
    write_table(dim_age_group, "dim_age_group")

    master_common_df = read_mysql_table(spark, "dms_master_common")
    dim_buyer_type = build_dim_buyer_type(master_common_df, delivery_leads, lead_df)
    write_table(dim_buyer_type, "dim_buyer_type")

    cust_type_df = read_mysql_table(spark, "dms_customer_type")
    if cust_type_df is not None:
        dim_cust_type = build_dim_cust_type(cust_type_df)
        write_table(dim_cust_type, "dim_cust_type")

    # 5. Finance, Insurance & Leasing Dimensions
    finance_df = read_mysql_table(spark, "dms_finance_details")
    dim_finance_type = build_dim_finance_type(finance_df)
    write_table(dim_finance_type, "dim_finance_type")

    dim_finance_company = build_dim_finance_company(finance_df)
    write_table(dim_finance_company, "dim_finance_company")

    insur_company_df = read_mysql_table(spark, "dms_insurence_company_md")
    dim_insur_company = build_dim_insurance_company(insur_company_df)
    write_table(dim_insur_company, "dim_insurance_company")

    dim_insur_type = build_dim_insurance_type(master_common_df)
    write_table(dim_insur_type, "dim_insurance_type")

    delivery_df = read_mysql_table(spark, "dms_delivery")
    dim_insur_ew = build_dim_insur_ew(delivery_df)
    write_table(dim_insur_ew, "dim_insur_ew")

    invoice_df = read_mysql_table(spark, "dms_invoice")
    dim_leasing = build_dim_leasing_company(invoice_df)
    write_table(dim_leasing, "dim_leasing_company")

    dim_trans_type = build_dim_transaction_type(invoice_df)
    write_table(dim_trans_type, "dim_transaction_type")

    # 6. Marketing & Enquiry Dimensions
    source_df = read_mysql_table(spark, "dms_source_of_enquiries")
    dim_source = build_dim_source(source_df, delivery_leads, lead_df)
    write_table(dim_source, "dim_source")

    sub_table = read_mysql_table(spark, "sub_source")
    dim_sub_source = build_dim_sub_source(lead_df, sub_table, delivery_leads)
    write_table(dim_sub_source, "dim_sub_source")

    dim_enquiry_seg = build_dim_enquiry_segment(lead_df)
    write_table(dim_enquiry_seg, "dim_enquiry_segment")

    # 7. ETL Refresh Status Dimension
    dim_last_refreshed = build_dim_last_refreshed(spark)
    write_table(dim_last_refreshed, "dim_last_refreshed")

    print("=" * 80)
    print("ALL 25 DIMENSIONS ETL COMPLETED SUCCESSFULLY!")
    print("=" * 80)


def main():
    spark = create_spark("Load All Dimensions")
    load_all_dimensions(spark)
    spark.stop()


if __name__ == "__main__":
    main()
