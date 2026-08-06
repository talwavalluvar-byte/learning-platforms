import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_insurance_type

def load_dim_insurance_type(spark):
    print("=" * 80)
    print("Loading Insurance Type Dimension (dim_insurance_type)")
    print("=" * 80)

    master_common_df = read_mysql_table(spark, "dms_master_common")
    dim_insurance_type = build_dim_insurance_type(master_common_df)

    print(f"Insurance Type Count : {dim_insurance_type.count()}")
    dim_insurance_type.orderBy("Insur_Type_Key").show(50, truncate=False)

    write_table(dim_insurance_type, "dim_insurance_type", mode="overwrite")

    print("=" * 80)
    print("Insurance Type Dimension Loaded Successfully into MySQL (dim_insurance_type)")
    print("=" * 80)

def main():
    spark = create_spark("LoadDimInsuranceType")
    load_dim_insurance_type(spark)
    spark.stop()

if __name__ == "__main__":
    main()
