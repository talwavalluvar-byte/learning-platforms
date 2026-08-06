import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table

from transform.staging.stg_employee_hierarchy import build_employee_hierarchy
from transform.dimensions.dim_sales_consultant import transform_dim_sales_consultant


def load_dim_sales_consultant(spark):

    print("=" * 80)
    print("Loading Sales Consultant Dimension")
    print("=" * 80)

    # Read Source Tables
    lead_df = read_mysql_table(spark, "dms_lead")
    employee_df = read_mysql_table(spark, "dms_employee")
    lsr_df = read_mysql_table(spark, "dms_lead_stage_ref")
    db_df = read_mysql_table(spark, "dms_branch")

    # Filter Stage 7 Delivery Leads for orgs (1, 16, 21, 22, 376) & service_type 458
    delivery_leads = (
        lsr_df
        .join(db_df, lsr_df["branch_id"] == db_df["branch_id"], "inner")
        .filter(
            (lsr_df["stage_id"] == 7) &
            lsr_df["drop_status_id"].isNull() &
            lsr_df["org_id"].isin(1, 16, 21, 22, 376) &
            (db_df["service_type_id"] == 458)
        )
        .select(lsr_df["lead_id"])
        .distinct()
    )

    # Build Hierarchy
    hierarchy_df = build_employee_hierarchy(
        lead_df,
        employee_df,
        delivery_leads
    )

    # Transform
    dim_df = transform_dim_sales_consultant(hierarchy_df)

    print(f"Sales Consultant Count : {dim_df.count()}")

    dim_df.show(10, truncate=False)

    # Load
    write_table(
        dim_df,
        "dim_sales_consultant"
    )

    print("=" * 80)
    print("Sales Consultant Loaded Successfully")
    print("=" * 80)


def main():
    spark = create_spark()
    load_dim_sales_consultant(spark)
    spark.stop()


if __name__ == "__main__":
    main()