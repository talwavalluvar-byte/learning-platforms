from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col,
    when,
    lit,
    trim,
    initcap,
    lower,
    row_number
)
from pyspark.sql.types import StructType, StructField, IntegerType, StringType
from pyspark.sql.window import Window
from transform.audit import add_audit_columns


def transform_dim_variant(
    lead_product_df: DataFrame,
    delivery_leads: DataFrame = None
) -> DataFrame:
    """
    Build Variant Dimension following exact Power Query step-by-step pipeline logic:
    1. Read Source & Apply Variant Name Replacements
    2. Distinct (variant_id, variant)
    3. Sort by variant_id ASC & Add 1-based Index
    4. Generate variant_id_v2 (including -1 rule for nulls and 100000 + Index rule)
    5. Distinct by Business Variant Name (orderBy Index)
    6. Generate dense Surrogate Key (Variant_Key)
    7. Add Audit Columns
    """
    if delivery_leads is not None:
        lp_df = lead_product_df.join(delivery_leads, lead_product_df["lead_id"] == delivery_leads["lead_id"], "inner")
    else:
        lp_df = lead_product_df

    # Step 1: Clean & Replace values
    df_clean = (
        lp_df
        .filter(col("variant").isNotNull() & (trim(col("variant")) != ""))
        .withColumn(
            "variant_replaced",
            when(lower(trim(col("variant"))) == "alcazar 1.5mt executive 7s", lit("Alcazar 1.5 Mt Executive 7S"))
            .when(lower(trim(col("variant"))) == "grand i10 nios 1.2mt kappa sportz e", lit("Grand I10 Nios 1.2Mt Kappa Sportze"))
            .otherwise(trim(col("variant")))
        )
        .withColumn("variant_clean", initcap(col("variant_replaced")))
    )

    # Step 2: Remove Exact Duplicate (variant_id, variant)
    df_step2 = df_clean.dropDuplicates(["variant_id", "variant_clean"])

    # Step 3: Sort by variant_id ASC & Add 1-based Index
    window_idx = Window.orderBy(col("variant_id").asc_nulls_last(), col("variant_clean").asc())
    df_step3 = df_step2.withColumn("Index", row_number().over(window_idx))

    # Step 4: Create Variant_Id_V2
    # Rules:
    # IF Variant = NULL AND Variant_ID = NULL THEN -1
    # ELSE IF Variant IS NOT NULL AND (Variant_ID IS NULL OR Variant_ID = 0) THEN 100000 + Index
    # ELSE Variant_ID
    df_step4 = df_step3.withColumn(
        "variant_id_v2",
        when(col("variant_clean").isNull() & (col("variant_id").isNull() | (col("variant_id") == 0)), -1)
        .when(col("variant_clean").isNotNull() & (col("variant_id").isNull() | (col("variant_id") == 0)), 100000 + col("Index"))
        .otherwise(col("variant_id"))
    )

    # Step 5: Remove Duplicate Business Values by variant (keep earliest by Index)
    window_dedup = Window.partitionBy(lower(trim(col("variant_clean")))).orderBy("Index")
    df_step5 = (
        df_step4
        .withColumn("rn", row_number().over(window_dedup))
        .filter(col("rn") == 1)
        .drop("rn")
    )

    # Step 6: Generate dense Surrogate Key (Variant_Key)
    window_key = Window.orderBy("variant_id_v2")

    res_df = (
        df_step5
        .withColumn("Variant_Key", row_number().over(window_key))
        .select(
            col("Variant_Key"),
            col("variant_id").cast("integer").alias("Variant_Id"),
            col("variant_clean").alias("Variant_Name"),
            col("variant_id_v2").cast("integer").alias("Variant_Id_V2")
        )
    )

    return add_audit_columns(res_df)
