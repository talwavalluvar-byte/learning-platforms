from pyspark.sql.functions import (
    col,
    when,
    lit,
    row_number,
    broadcast,
    lower,
    trim
)
from pyspark.sql.window import Window
from config.constants import VALID_ORGS


def build_stg_make(
    lead_product_df,
    lead_stage_df,
    branch_df
):
    """
    Build Staging Make Dimension
    """

    # ------------------------------------------------------------------
    # Join & Apply Filters
    # ------------------------------------------------------------------
    df = (
        lead_product_df.alias("lp")
        .join(
            lead_stage_df.alias("lsr"),
            col("lp.lead_id") == col("lsr.lead_id"),
            "inner"
        )
        .join(
            broadcast(branch_df.alias("db")),
            col("lsr.branch_id") == col("db.branch_id"),
            "inner"
        )
        .filter(col("lsr.stage_id") == 7)
        .filter(col("lsr.drop_status_id").isNull())
        .filter(col("lsr.org_id").isin(VALID_ORGS))
        .filter(col("db.service_type_id") == 458)
        .select(
            col("lp.make_id"),
            col("lp.make")
        )
    )

    # ------------------------------------------------------------------
    # Removed Duplicates
    # ------------------------------------------------------------------
    df = df.dropDuplicates()

    # ------------------------------------------------------------------
    # Sorted Rows
    # ------------------------------------------------------------------
    df = df.orderBy(col("make_id").asc())

    # ------------------------------------------------------------------
    # Added Index
    # ------------------------------------------------------------------
    index_window = Window.orderBy("make_id")

    df = df.withColumn(
        "Index",
        row_number().over(index_window)
    )

    # ------------------------------------------------------------------
    # Custom1 (make_id_v2)
    # ------------------------------------------------------------------
    df = df.withColumn(
        "make_id_v2",
        when(
            col("make").isNull() & col("make_id").isNull(),
            lit(-1)
        ).when(
            col("make").isNotNull() &
            (col("make_id").isNull() | (col("make_id") == 0)),
            lit(100000) + col("Index")
        ).otherwise(col("make_id"))
    )

    # ------------------------------------------------------------------
    # Removed Duplicates1 (Equivalent to Table.Distinct(Custom1, {"make"}) - Case Insensitive)
    # ------------------------------------------------------------------
    make_window = Window.partitionBy(lower(trim(col("make")))).orderBy("make_id")

    df = (
        df.withColumn("rn", row_number().over(make_window))
          .filter(col("rn") == 1)
          .drop("rn")
    )

    # ------------------------------------------------------------------
    # Final Output
    # ------------------------------------------------------------------
    return (
        df.select(
            "make_id_v2",
            "make_id",
            "make"
        )
        .orderBy("make_id_v2")
    )