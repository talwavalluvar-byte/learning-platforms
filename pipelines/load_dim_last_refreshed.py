import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_last_refreshed

def main():
    spark = create_spark("LoadDimLastRefreshed")
    dim_refreshed = build_dim_last_refreshed(spark)
    write_table(dim_refreshed, "dim_last_refreshed")
    spark.stop()

if __name__ == "__main__":
    main()
