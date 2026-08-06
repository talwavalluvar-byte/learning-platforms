from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col,
    when,
    lit,
    row_number,
    initcap,
    trim,
    lower
)
from pyspark.sql.window import Window
from transform.audit import add_audit_columns


def transform_dim_model(stg_model_df: DataFrame) -> DataFrame:
    clean_df = (
        stg_model_df
        .filter(col("model").isNotNull() & (trim(col("model")) != ""))
        .withColumn("_clean_id", col("model_id").cast("integer"))
        .withColumn("_clean_name", initcap(trim(col("model"))))
    )

    step2_df = clean_df.dropDuplicates(["_clean_id", "_clean_name"])
    window_idx = Window.orderBy(col("_clean_id").asc_nulls_last(), col("_clean_name").asc())
    step3_df = step2_df.withColumn("Index", row_number().over(window_idx))

    step4_df = step3_df.withColumn(
        "Model_Id_V2",
        when(col("_clean_name").isNull() & (col("_clean_id").isNull() | (col("_clean_id") == 0)), -1)
        .when(col("_clean_name").isNotNull() & (col("_clean_id").isNull() | (col("_clean_id") == 0)), 100000 + col("Index"))
        .otherwise(col("_clean_id"))
    )

    window_dedup = Window.partitionBy(lower(trim(col("_clean_name")))).orderBy("Index")
    step5_df = (
        step4_df
        .withColumn("rn", row_number().over(window_dedup))
        .filter(col("rn") == 1)
        .drop("rn")
    )

    window_key = Window.orderBy("Model_Id_V2")
    res_df = (
        step5_df
        .withColumn("Model_Key", row_number().over(window_key))
        .select(
            col("Model_Key"),
            col("_clean_id").alias("Model_Id"),
            col("_clean_name").alias("Model_Name"),
            col("Model_Id_V2").cast("integer").alias("Model_Id_V2")
        )
    )

    return add_audit_columns(res_df)