import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table

from transform.staging.stg_model import build_stg_model
from transform.dimensions.dim_model import transform_dim_model


def load_dim_model(spark):

    print("=" * 80)
    print("Loading Dimension : dim_model")
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
    stg_model_df = build_stg_model(
        lead_product_df,
        lead_stage_df,
        branch_df
    )

    stg_model_df.cache()

    print("\nStaging Data")
    print("-" * 80)
    stg_model_df.show(truncate=False)

    print(f"Total Staging Records : {stg_model_df.count()}")

    print("\nDuplicate Model Validation")
    print("-" * 80)
    stg_model_df.groupBy("model").count().show()

    # ------------------------------------------------------------------
    # Transform Dimension
    # ------------------------------------------------------------------
    dim_model_df = transform_dim_model(
        stg_model_df
    )

    dim_model_df.cache()

    print("\nDimension Data")
    print("-" * 80)
    dim_model_df.show(truncate=False)

    print(f"Total Dimension Records : {dim_model_df.count()}")

    print("\nDuplicate Model_Id Validation")
    print("-" * 80)

    (
        dim_model_df
        .groupBy("Model_Id")
        .count()
        .filter("count > 1")
        .show()
    )

    # ------------------------------------------------------------------
    # Load to Warehouse
    # ------------------------------------------------------------------
    write_table(
        dim_model_df,
        "dim_model"
    )

    stg_model_df.unpersist()
    dim_model_df.unpersist()

    print("=" * 80)
    print("dim_model Loaded Successfully")
    print("=" * 80)


def main():
    spark = create_spark()
    load_dim_model(spark)
    spark.stop()


if __name__ == "__main__":
    main()