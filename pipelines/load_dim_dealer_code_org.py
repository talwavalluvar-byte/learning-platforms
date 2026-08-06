import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.dim_dealer_code_org import transform_dim_dealer_code_org


def load_dim_dealer_code_org(spark):
    print("=" * 80)
    print("Loading Dealer Code Org Dimension (dim_dealer_code_org)")
    print("=" * 80)

    lsr_df = read_mysql_table(spark, "dms_lead_stage_ref")
    db_df = read_mysql_table(spark, "dms_branch")
    og_df = read_mysql_table(spark, "dms_organization")
    lnd_df = read_mysql_table(spark, "location_node_data")

    dim_df = transform_dim_dealer_code_org(lsr_df, db_df, og_df, lnd_df)

    print(f"Dealer Code Org Record Count : {dim_df.count()}")
    dim_df.show(50, truncate=False)

    write_table(
        dim_df,
        table_name="dim_dealer_code_org",
        mode="overwrite"
    )

    print("=" * 80)
    print("Dealer Code Org Dimension Loaded Successfully into MySQL (dim_dealer_code_org)")
    print("=" * 80)


def main():
    spark = create_spark("LoadDimDealerCodeOrg")
    load_dim_dealer_code_org(spark)
    spark.stop()


if __name__ == "__main__":
    main()
