from pyspark.sql.functions import (
    col,
    trim,
    initcap,
    regexp_replace
)


def stage_dealer_code_org(branch_df, location_df, org_df):

    df = (
        branch_df.alias("b")
        .join(
            location_df.alias("l"),
            col("b.location_id") == col("l.id"),
            "left"
        )
        .join(
            org_df.alias("o"),
            col("b.org_id") == col("o.org_id"),
            "left"
        )
        .select(
            col("b.branch_id").alias("dealer_code_id"),
            col("b.dealer_code").alias("dealer_code"),
            col("b.active").alias("dealer_code_active"),
            col("l.id").alias("branch_location_id"),
            col("l.code").alias("branch_location"),
            col("o.org_id").alias("org_id"),
            col("o.name").alias("org_name"),
            col("o.brand").alias("org_brand")
        )
        .dropDuplicates(["dealer_code_id"])
    )

    # Clean all string columns
    for c, dtype in df.dtypes:
        if dtype == "string":
            df = (
                df.withColumn(c, trim(col(c)))
                  .withColumn(c, regexp_replace(col(c), r"\s+", " "))
                  .withColumn(c, initcap(col(c)))
            )

    return df