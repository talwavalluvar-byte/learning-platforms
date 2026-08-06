from pyspark.sql import DataFrame
from pyspark.sql.functions import col

from transform.common import clean_text
from transform.audit import add_audit_columns
from transform.surrogate_key import generate_surrogate_key


def transform_dim_dealer(
    branch_df: DataFrame,
    organization_df: DataFrame
) -> DataFrame:

    # Join Branch and Organization
    df = (
        branch_df.alias("b")
        .join(
            organization_df.alias("o"),
            col("b.org_id") == col("o.org_id"),
            "inner"
        )
    )

    # Select only Dealer-level columns
    df = df.select(
        col("o.org_id").alias("Dealer_Id"),
        col("o.name").alias("Dealer_Name"),
        col("o.brand").alias("Brand"),
        col("o.active").alias("Source_Is_Active")
    )

    # Remove duplicate dealers
    df = df.dropDuplicates(["Dealer_Id"])

    # Clean Dealer Name
    df = df.withColumn(
        "Dealer_Name",
        clean_text("Dealer_Name")
    )

    # Generate Surrogate Key
    df = generate_surrogate_key(
        df=df,
        source_key="Dealer_Id",
        business_key="Dealer_Name",
        output_key="Dealer_Key"
    )

    df = df.withColumn("Dealer_Id_V2", col("Dealer_Id"))

    # Add Audit Columns
    df = add_audit_columns(df)

    # Final Output
    return df.select(
        "Dealer_Key",
        "Dealer_Id",
        "Dealer_Name",
        "Dealer_Id_V2",
        "Brand",
        "Source_Is_Active",
        "etl_created_date",
        "etl_updated_date",
        "is_active"
    )