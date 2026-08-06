from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col,
    current_timestamp,
    lit,
    monotonically_increasing_id
)


def transform_dim_branch(
    branch_df: DataFrame,
    dim_dealer_df: DataFrame,
    location_df: DataFrame
) -> DataFrame:
    """
    Transform Branch Dimension
    """

    # ---------------------------------------------
    # Dealer Lookup
    # ---------------------------------------------
    dealer_df = dim_dealer_df.select(
        col("Dealer_Key"),
        col("Dealer_Id")
    )

    # ---------------------------------------------
    # Location Lookup
    # ---------------------------------------------
    location_lookup = location_df.select(
        col("id").alias("Location_Id"),
        col("parent_id"),
        col("name").alias("Location_Name")
    )

    # Parent Location Lookup
    parent_location = location_df.select(
        col("id").alias("Parent_Id"),
        col("name").alias("Parent_Location")
    )

    # ---------------------------------------------
    # Join Branch -> Dealer
    # ---------------------------------------------
    df = (
        branch_df.alias("b")
        .join(
            dealer_df.alias("d"),
            col("b.org_id") == col("d.Dealer_Id"),
            "left"
        )
    )

    # ---------------------------------------------
    # Join Branch -> Location
    # ---------------------------------------------
    df = (
        df.join(
            location_lookup.alias("l"),
            col("b.org_map_id") == col("l.Location_Id"),
            "left"
        )
    )

    # ---------------------------------------------
    # Join Parent Location
    # ---------------------------------------------
    df = (
        df.join(
            parent_location.alias("p"),
            col("l.parent_id") == col("p.Parent_Id"),
            "left"
        )
    )

    # ---------------------------------------------
    # Select Final Columns
    # ---------------------------------------------
    df = (
        df.select(
            (monotonically_increasing_id() + 1).alias("Branch_Key"),

            col("b.branch_id").alias("Branch_Id"),

            col("d.Dealer_Key"),

            col("b.name").alias("Branch_Name"),

            col("b.dealer_code").alias("Dealer_Code"),

            col("b.branch_type").alias("Branch_Type"),

            col("l.Location_Name"),

            col("p.Parent_Location"),

            col("b.service_type_id").alias("Service_Type_Id"),

            col("b.active").alias("Source_Is_Active"),

            current_timestamp().alias("etl_created_date"),

            current_timestamp().alias("etl_updated_date"),

            lit(True).alias("is_active")
        )
    )

    return df