import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from config.spark_session import create_spark
from pipelines.load_all_dimensions import load_all_dimensions
from pipelines.load_fact_sales import load_fact_sales


def main():
    print("=" * 80)
    print("STARTING FULL AUTOMOBILE STAR SCHEMA ETL PIPELINE")
    print("=" * 80)

    spark = create_spark("Automobile Star Schema ETL")

    try:
        # 1. Load All Dimension Tables
        print("\n--> STEP 1: Loading All Dimension Tables")
        load_all_dimensions(spark)

        # 2. Load Single Fact Sales Table
        print("\n--> STEP 2: Loading Fact Sales Table (fact_sales - 223 columns)")
        load_fact_sales(spark)

        print("\n" + "=" * 80)
        print("FULL STAR SCHEMA ETL COMPLETED SUCCESSFULLY!")
        print("ALL DIMENSIONS AND FACT_SALES LOADED TO MYSQL TARGET DB!")
        print("=" * 80)

    finally:
        spark.stop()


if __name__ == "__main__":
    main()