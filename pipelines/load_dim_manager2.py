import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.staging.stg_employee_hierarchy import build_employee_hierarchy
from transform.dimensions.dim_manager import transform_dim_manager1, transform_dim_manager2


def load_dim_managers(spark):
    print("=" * 80)
    print("Loading Manager Dimensions (dim_manager1 & dim_manager2)")
    print("=" * 80)

    lead_df = read_mysql_table(spark, "dms_lead")
    employee_df = read_mysql_table(spark, "dms_employee")
    lsr_df = read_mysql_table(spark, "dms_lead_stage_ref")
    db_df = read_mysql_table(spark, "dms_branch")

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

    hierarchy_df = build_employee_hierarchy(lead_df, employee_df, delivery_leads)

    # 1. Manager 1
    dim_mgr1_df = transform_dim_manager1(hierarchy_df)
    write_table(dim_mgr1_df, table_name="dim_manager1", mode="overwrite")
    print(f"[OK] dim_manager1 loaded into MySQL ({dim_mgr1_df.count()} records)")

    # 2. Manager 2
    dim_mgr2_df = transform_dim_manager2(hierarchy_df)
    write_table(dim_mgr2_df, table_name="dim_manager2", mode="overwrite")
    print(f"[OK] dim_manager2 loaded into MySQL ({dim_mgr2_df.count()} records)")

    print("=" * 80)
    print("Both dim_manager1 and dim_manager2 Loaded Successfully!")
    print("=" * 80)


def main():
    spark = create_spark("LoadDimManagers")
    load_dim_managers(spark)
    spark.stop()


if __name__ == "__main__":
    main()
