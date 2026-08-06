import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_insur_ew

def load_dim_insur_ew(spark):
    print("=" * 80)
    print("Loading Insurance Extended Warranty Dimension (dim_insur_ew)")
    print("=" * 80)

    delivery_df = read_mysql_table(spark, "dms_delivery")
    dim_insur_ew = build_dim_insur_ew(delivery_df)

    print(f"Insurance Extended Warranty Count : {dim_insur_ew.count()}")
    dim_insur_ew.orderBy("Insur_EW_Key").show(50, truncate=False)

    write_table(dim_insur_ew, "dim_insur_ew", mode="overwrite")

    print("=" * 80)
    print("Insurance Extended Warranty Dimension Loaded Successfully into MySQL (dim_insur_ew)")
    print("=" * 80)

def main():
    spark = create_spark("LoadDimInsurEW")
    load_dim_insur_ew(spark)
    spark.stop()

if __name__ == "__main__":
    main()
