import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_transmission

def load_dim_transmission(spark):
    print("=" * 80)
    print("Loading Transmission Dimension (dim_transmission)")
    print("=" * 80)

    master_common_df = read_mysql_table(spark, "dms_master_org_common")
    dim_transmission = build_dim_transmission(master_common_df)

    print(f"Transmission Count : {dim_transmission.count()}")
    dim_transmission.orderBy("Transmission_Key").show(50, truncate=False)

    write_table(dim_transmission, "dim_transmission", mode="overwrite")

    print("=" * 80)
    print("Transmission Dimension Loaded Successfully into MySQL (dim_transmission)")
    print("=" * 80)

def main():
    spark = create_spark("LoadDimTransmission")
    load_dim_transmission(spark)
    spark.stop()

if __name__ == "__main__":
    main()
