import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_insurance_company

def load_dim_insurance_company(spark):
    print("=" * 80)
    print("Loading Insurance Company Dimension (dim_insurance_company)")
    print("=" * 80)

    insur_company_df = read_mysql_table(spark, "dms_insurence_company_md")
    dim_insurance_company = build_dim_insurance_company(insur_company_df)

    print(f"Insurance Company Count : {dim_insurance_company.count()}")
    dim_insurance_company.orderBy("Insur_Company_Key").show(100, truncate=False)

    write_table(dim_insurance_company, "dim_insurance_company", mode="overwrite")

    print("=" * 80)
    print("Insurance Company Dimension Loaded Successfully into MySQL (dim_insurance_company)")
    print("=" * 80)

def main():
    spark = create_spark("LoadDimInsuranceCompany")
    load_dim_insurance_company(spark)
    spark.stop()

if __name__ == "__main__":
    main()
