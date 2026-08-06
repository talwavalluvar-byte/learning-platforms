import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from extract.table_list import SOURCE_TABLES
from transform.dimensions.dim_dealer import transform_dim_dealer
from load.mysql_writer import write_table


def load_dim_dealer(spark):

    # Read source tables
    branch_df = read_mysql_table(
        spark,
        SOURCE_TABLES["branch"]
    )

    organization_df = read_mysql_table(
        spark,
        SOURCE_TABLES["organization"]
    )

    # Transform
    dealer_df = transform_dim_dealer(
        branch_df,
        organization_df
    )

    dealer_df.cache()

    # Preview transformed data
    print("=" * 80)
    print("DIM DEALER PREVIEW")
    print("=" * 80)

    dealer_df.printSchema()
    dealer_df.show(10, truncate=False)

    # Load into Warehouse
    write_table(
        dealer_df,
        table_name="dim_dealer",
        mode="overwrite"
    )

    dealer_df.unpersist()

    print("=" * 80)
    print("[OK] dim_dealer loaded successfully!")
    print("=" * 80)


def main():

    spark = create_spark()
    load_dim_dealer(spark)
    spark.stop()


if __name__ == "__main__":
    main()