from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col,
    when,
    lit,
    row_number
)
from pyspark.sql.window import Window
from transform.audit import add_audit_columns


def transform_dim_dealer_code_org(
    lsr_df: DataFrame,
    db_df: DataFrame,
    og_df: DataFrame,
    lnd_df: DataFrame
) -> DataFrame:
    """
    Build Dealer Code Org Dimension (dim_dealer_code_org) following exact Power Query M-code logic:
    1. Select dealer_code_id, dealer_code, dealer_code_active, branch_location_id, branch_location,
       org_id, org_name, org_brand, org_brand_logo_small, service_type_id.
    2. Table.Distinct on all selected columns.
    3. Add Conditional Column org_brand_v2:
       if org_id == 1 then "Renault"
       else if org_id == 16 then "Hyundai"
       else if org_id == 21 then "Piaggio"
       else if org_id == 22 then "Honda"
       else null.
    4. Generate 1-based dense Surrogate Key (Dealer_Code_Org_Key) and Audit Columns.
    """
    joined_df = (
        lsr_df.alias("lsr")
        .join(db_df.alias("db"), col("lsr.branch_id") == col("db.branch_id"), "inner")
        .join(og_df.alias("og"), col("lsr.org_id") == col("og.org_id"), "left")
        .join(lnd_df.alias("lnd"), col("db.org_map_id") == col("lnd.id"), "left")
        .join(lnd_df.alias("loc"), col("lnd.parent_id") == col("loc.id"), "left")
        .filter(
            (col("lsr.stage_id") == 7) &
            col("lsr.drop_status_id").isNull() &
            col("lsr.org_id").isin(1, 16, 21, 22, 376) &
            (col("db.service_type_id") == 458)
        )
    )

    logo_col = col("og.brand_logo_small").cast("string") if "brand_logo_small" in og_df.columns else lit(None).cast("string")

    selected_df = (
        joined_df
        .select(
            col("db.branch_id").cast("integer").alias("dealer_code_id"),
            col("db.dealer_code").alias("dealer_code"),
            col("db.active").alias("dealer_code_active"),
            col("loc.id").cast("integer").alias("branch_location_id"),
            col("loc.code").alias("branch_location"),
            col("og.org_id").cast("integer").alias("org_id"),
            col("og.name").alias("org_name"),
            col("og.brand").alias("org_brand"),
            logo_col.alias("org_brand_logo_small"),
            col("db.service_type_id").cast("integer").alias("service_type_id")
        )
        .dropDuplicates()
    )

    # Step 3: Add Conditional Column org_brand_v2
    transformed_df = selected_df.withColumn(
        "org_brand_v2",
        when(col("org_id") == 1, "Renault")
        .when(col("org_id") == 16, "Hyundai")
        .when(col("org_id") == 21, "Piaggio")
        .when(col("org_id") == 22, "Honda")
        .otherwise(lit(None))
    )

    # Step 4: Generate 1-based dense Surrogate Key
    window_key = Window.orderBy("dealer_code_id", "org_id")
    res_df = (
        transformed_df
        .withColumn("Dealer_Code_Org_Key", row_number().over(window_key))
        .select(
            col("Dealer_Code_Org_Key"),
            col("dealer_code_id"),
            col("dealer_code"),
            col("dealer_code_active"),
            col("branch_location_id"),
            col("branch_location"),
            col("org_id"),
            col("org_name"),
            col("org_brand"),
            col("org_brand_logo_small"),
            col("service_type_id"),
            col("org_brand_v2")
        )
    )

    return add_audit_columns(res_df)