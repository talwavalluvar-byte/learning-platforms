import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table

from transform.staging.stg_make import build_stg_make
from transform.dimensions.dim_make import transform_dim_make


def load_dim_make(spark):

    print("=" * 80)
    print("Loading Dimension : dim_make")
    print("=" * 80)

    # ------------------------------------------------------------------
    # Read Source Tables
    # ------------------------------------------------------------------
    lead_product_df = read_mysql_table(
        spark,
        "dms_lead_product"
    )

    lead_stage_df = read_mysql_table(
        spark,
        "dms_lead_stage_ref"
    )

    branch_df = read_mysql_table(
        spark,
        "dms_branch"
    )

    # ------------------------------------------------------------------
    # Build Staging
    # ------------------------------------------------------------------
    stg_make_df = build_stg_make(
        lead_product_df,
        lead_stage_df,
        branch_df
    )

    stg_make_df.cache()

    print("\nStaging Data")
    print("-" * 80)
    stg_make_df.show(truncate=False)

    print(f"Total Staging Records : {stg_make_df.count()}")

    print("\nDuplicate Make Validation")
    print("-" * 80)
    stg_make_df.groupBy("make").count().show()

    # ------------------------------------------------------------------
    # Transform Dimension
    # ------------------------------------------------------------------
    dim_make_df = transform_dim_make(
        stg_make_df
    )

    dim_make_df.cache()

    print("\nDimension Data")
    print("-" * 80)
    dim_make_df.show(truncate=False)

    print(f"Total Dimension Records : {dim_make_df.count()}")

    # ------------------------------------------------------------------
    # Load to Warehouse
    # ------------------------------------------------------------------
    write_table(
        dim_make_df,
        "dim_make"
    )

    stg_make_df.unpersist()
    dim_make_df.unpersist()

    print("=" * 80)
    print("dim_make Loaded Successfully")
    print("=" * 80)


def main():
    spark = create_spark()
    load_dim_make(spark)
    spark.stop()


if __name__ == "__main__":
    main()