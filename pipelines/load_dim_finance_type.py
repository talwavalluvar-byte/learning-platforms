import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_finance_type

def load_dim_finance_type(spark):
    print("=" * 80)
    print("Loading Finance Type Dimension (dim_finance_type)")
    print("=" * 80)

    finance_df = read_mysql_table(spark, "dms_finance_details")
    dim_finance_type = build_dim_finance_type(finance_df)

    print(f"Finance Type Count : {dim_finance_type.count()}")
    dim_finance_type.orderBy("Finance_Type_Key").show(50, truncate=False)

    write_table(dim_finance_type, "dim_finance_type", mode="overwrite")

    print("=" * 80)
    print("Finance Type Dimension Loaded Successfully into MySQL (dim_finance_type)")
    print("=" * 80)

def main():
    spark = create_spark("LoadDimFinanceType")
    load_dim_finance_type(spark)
    spark.stop()

if __name__ == "__main__":
    main()
