import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from extract.warehouse_reader import read_warehouse_table
from extract.table_list import SOURCE_TABLES

from transform.dimensions.dim_branch import transform_dim_branch
from load.mysql_writer import write_table


def load_dim_branch(spark):

    branch_df = read_mysql_table(
        spark,
        SOURCE_TABLES["branch"]
    )

    location_df = read_mysql_table(
        spark,
        SOURCE_TABLES["location"]
    )

    dim_dealer_df = read_warehouse_table(
        spark,
        "dim_dealer"
    )

    dim_branch_df = transform_dim_branch(
        branch_df,
        dim_dealer_df,
        location_df
    )

    dim_branch_df.cache()

    print("=" * 80)
    print("DIM BRANCH PREVIEW")
    print("=" * 80)

    dim_branch_df.printSchema()
    dim_branch_df.show(20, truncate=False)

    write_table(
        dim_branch_df,
        table_name="dim_branch",
        mode="overwrite"
    )

    dim_branch_df.unpersist()

    print("=" * 80)
    print("[OK] dim_branch loaded successfully!")
    print("=" * 80)


def main():

    spark = create_spark()
    load_dim_branch(spark)
    spark.stop()


if __name__ == "__main__":
    main()