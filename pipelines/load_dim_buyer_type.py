import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_buyer_type


def load_dim_buyer_type(spark):
    print("=" * 80)
    print("Loading Buyer Type Dimension (dim_buyer_type)")
    print("=" * 80)

    master_common_df = read_mysql_table(spark, "dms_master_common")
    lead_df = read_mysql_table(spark, "dms_lead")
    lsr_df = read_mysql_table(spark, "dms_lead_stage_ref")
    db_df = read_mysql_table(spark, "dms_branch")

    delivery_leads = (
        lsr_df
        .join(db_df, lsr_df["branch_id"] == db_df["branch_id"], "inner")
        .filter(
            (lsr_df["stage_id"] == 7) &
            lsr_df["drop_status_id"].isNull() &
            lsr_df["org_id"].isin(1, 16, 21, 22, 376) &
            (db_df["service_type_id"] == 458)
        )
        .select(lsr_df["lead_id"])
        .distinct()
    )

    dim_df = build_dim_buyer_type(master_common_df, delivery_leads, lead_df)

    dim_df.cache()

    print(f"Buyer Type Count : {dim_df.count()}")
    dim_df.show(20, truncate=False)

    write_table(
        dim_df,
        table_name="dim_buyer_type",
        mode="overwrite"
    )

    dim_df.unpersist()

    print("=" * 80)
    print("Buyer Type Dimension Loaded Successfully into MySQL (dim_buyer_type)")
    print("=" * 80)


def main():
    spark = create_spark("LoadDimBuyerType")
    load_dim_buyer_type(spark)
    spark.stop()


if __name__ == "__main__":
    main()
