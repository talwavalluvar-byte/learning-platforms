from pyspark.sql.functions import (
    col,
    trim,
    initcap,
    regexp_replace
)


def clean_text(column):
    return initcap(
        trim(
            regexp_replace(column, r"\s+", " ")
        )
    )


def stage_dealer_code_org(branch_df, org_df):

    df = (
        branch_df.alias("b")
        .join(
            org_df.alias("o"),
            col("b.org_id") == col("o.org_id"),
            "left"
        )
        .select(
            col("b.branch_id"),
            col("b.org_id"),
            col("b.dealer_code"),
            clean_text(col("b.name")).alias("branch_name"),
            clean_text(col("o.name")).alias("organization_name"),
            clean_text(col("o.brand")).alias("brand"),
            col("b.active").alias("branch_active"),
            col("o.active").alias("organization_active")
        )
        .dropDuplicates(["branch_id"])
    )

    return df