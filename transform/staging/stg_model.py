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


def build_stg_model(
    lead_product_df,
    lead_stage_df,
    branch_df
):

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
            col("lp.model_id"),
            col("lp.model")
        )

        .dropDuplicates()

        .orderBy("model_id")
    )

    # Power Query equivalent of:
    # Sort -> Add Index -> Custom -> Distinct(model) (Case-Insensitive)

    index_window = Window.orderBy("model_id")

    df = df.withColumn(
        "Index",
        row_number().over(index_window)
    )

    df = df.withColumn(
        "model_id_v2",
        when(
            col("model").isNull() & col("model_id").isNull(),
            lit(-1)
        ).when(
            col("model").isNotNull()
            & (col("model_id").isNull() | (col("model_id") == 0)),
            lit(100000) + col("Index")
        ).otherwise(col("model_id"))
    )

    # Case-insensitive distinct by model name (matching PowerQuery Table.Distinct(Custom1, {"model"}))
    model_window = Window.partitionBy(lower(trim(col("model")))).orderBy("model_id")

    df = (
        df.withColumn(
            "rn",
            row_number().over(model_window)
        )
        .filter(col("rn") == 1)
        .drop(
            "Index",
            "rn"
        )
    )

    return df.select(
        "model_id_v2",
        "model_id",
        "model"
    ).orderBy("model_id_v2")