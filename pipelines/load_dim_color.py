import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from load.mysql_writer import write_table
from transform.dimensions.generic_lookup import build_dim_color


def load_dim_color(spark):
    print("=" * 80)
    print("Loading Color Dimension (dim_color)")
    print("=" * 80)

    lead_product_df = read_mysql_table(spark, "dms_lead_product")
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

    dim_df = build_dim_color(lead_product_df, delivery_leads)

    dim_df.cache()

    print(f"Color Count : {dim_df.count()}")
    dim_df.show(10, truncate=False)

    write_table(
        dim_df,
        table_name="dim_color",
        mode="overwrite"
    )

    dim_df.unpersist()

    print("=" * 80)
    print("Color Dimension Loaded Successfully into MySQL (dim_color)")
    print("=" * 80)


def main():
    spark = create_spark("LoadDimColor")
    load_dim_color(spark)
    spark.stop()


if __name__ == "__main__":
    main()
