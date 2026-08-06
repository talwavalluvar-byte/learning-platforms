import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import load_all_tables
from transform.facts.fact_sales import build_fact_sales
from load.mysql_writer import write_table


def load_fact_sales(spark):
    print("=" * 80)
    print("LOADING FACT TABLE : fact_sales")
    print("=" * 80)

    tables = load_all_tables(spark)

    fact_df = build_fact_sales(tables)
    fact_df.cache()

    print(f"\nFact Sales Record Count: {fact_df.count()}")
    print(f"Fact Sales Total Columns: {len(fact_df.columns)}")

    fact_df.select("lead_id", "date_of_actual_delivery", "make", "model", "variant", "dealer_code", "total_receipt").show(10, truncate=False)

    write_table(fact_df, "fact_sales", mode="overwrite")

    fact_df.unpersist()

    print("=" * 80)
    print("fact_sales LOADED SUCCESSFULLY INTO MYSQL!")
    print("=" * 80)


def main():
    spark = create_spark("Load Fact Sales")
    load_fact_sales(spark)
    spark.stop()


if __name__ == "__main__":
    main()
