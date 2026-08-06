import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_sub_source


def main():
    spark = create_spark("LoadDimSubSource")

    lsr_df = read_mysql_table(spark, "dms_lead_stage_ref")
    db_df = read_mysql_table(spark, "dms_branch")
    lead_df = read_mysql_table(spark, "dms_lead")
    sub_table = read_mysql_table(spark, "sub_source")

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

    dim_sub_source = build_dim_sub_source(lead_df, sub_table, delivery_leads)

    print(f"Sub-Source Count : {dim_sub_source.count()}")
    dim_sub_source.orderBy("Sub_Source_Key").show(50, truncate=False)

    write_table(dim_sub_source, "dim_sub_source", mode="overwrite")
    spark.stop()


if __name__ == "__main__":
    main()
