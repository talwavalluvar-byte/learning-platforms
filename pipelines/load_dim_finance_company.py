import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_finance_company

def load_dim_finance_company(spark):
    print("=" * 80)
    print("Loading Finance Company Dimension (dim_finance_company)")
    print("=" * 80)

    finance_df = read_mysql_table(spark, "dms_finance_details")
    dim_finance_company = build_dim_finance_company(finance_df)

    print(f"Finance Company Count : {dim_finance_company.count()}")
    dim_finance_company.orderBy("Finance_Company_Key").show(200, truncate=False)

    write_table(dim_finance_company, "dim_finance_company", mode="overwrite")

    print("=" * 80)
    print("Finance Company Dimension Loaded Successfully into MySQL (dim_finance_company)")
    print("=" * 80)

def main():
    spark = create_spark("LoadDimFinanceCompany")
    load_dim_finance_company(spark)
    spark.stop()

if __name__ == "__main__":
    main()
