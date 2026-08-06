import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_fuel_type

def load_dim_fuel_type(spark):
    print("=" * 80)
    print("Loading Fuel Type Dimension (dim_fuel_type)")
    print("=" * 80)

    master_common_df = read_mysql_table(spark, "dms_master_org_common")
    dim_fuel_type = build_dim_fuel_type(master_common_df)

    print(f"Fuel Type Count : {dim_fuel_type.count()}")
    dim_fuel_type.orderBy("Fuel_Type_Key").show(50, truncate=False)

    write_table(dim_fuel_type, "dim_fuel_type", mode="overwrite")

    print("=" * 80)
    print("Fuel Type Dimension Loaded Successfully into MySQL (dim_fuel_type)")
    print("=" * 80)

def main():
    spark = create_spark("LoadDimFuelType")
    load_dim_fuel_type(spark)
    spark.stop()

if __name__ == "__main__":
    main()
