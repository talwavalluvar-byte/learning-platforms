from pyspark.sql import DataFrame
from pyspark.sql.functions import col, trim, initcap, lower, row_number, when
from pyspark.sql.types import StructType, StructField, IntegerType, StringType
from pyspark.sql.window import Window
from transform.audit import add_audit_columns


def transform_dim_manager1(hierarchy_df: DataFrame) -> DataFrame:
    """
    Extract Level-1 Manager Dimension with default (-1, NULL) unknown row.
    Output: Manager1_Key, Manager1_Id (original), Manager1_Name, Manager1_Id_V2 (-1 default), Source_Is_Active, Audit columns.
    """
    spark = hierarchy_df.sparkSession

    df_clean = (
        hierarchy_df
        .filter(col("manager1_id").isNotNull() & (col("manager1_id") != 0) & (col("manager1_id") != -1))
        .withColumn("manager1_name_clean", initcap(trim(col("manager1_name"))))
    )

    # Deduplicate on manager1_name_clean
    window_dedup = Window.partitionBy(lower(col("manager1_name_clean"))).orderBy(col("manager1_id").asc())
    df_dedup = (
        df_clean
        .withColumn("rn", row_number().over(window_dedup))
        .filter(col("rn") == 1)
        .drop("rn")
    )

    extracted_df = df_dedup.select(
        col("manager1_id").cast("integer").alias("Manager1_Id"),
        col("manager1_name_clean").alias("Manager1_Name"),
        col("manager1_id").cast("integer").alias("Manager1_Id_V2"),
        col("manager1_active").cast("integer").alias("Source_Is_Active")
    )

    schema = StructType([
        StructField("Manager1_Id", IntegerType(), True),
        StructField("Manager1_Name", StringType(), True),
        StructField("Manager1_Id_V2", IntegerType(), True),
        StructField("Source_Is_Active", IntegerType(), True)
    ])
    default_df = spark.createDataFrame([(None, None, -1, None)], schema=schema)

    combined_df = default_df.union(extracted_df)

    window_spec = Window.orderBy(when(col("Manager1_Id_V2") == -1, -999999).otherwise(col("Manager1_Id_V2")))
    df = combined_df.withColumn("Manager1_Key", row_number().over(window_spec))

    df = add_audit_columns(df)

    return df.select(
        "Manager1_Key",
        "Manager1_Id",
        "Manager1_Name",
        "Manager1_Id_V2",
        "Source_Is_Active",
        "etl_created_date",
        "etl_updated_date",
        "is_active"
    )


def transform_dim_manager2(hierarchy_df: DataFrame) -> DataFrame:
    """
    Extract Level-2 Manager Dimension with default (-1, NULL) unknown row.
    Output: Manager2_Key, Manager2_Id (original), Manager2_Name, Manager2_Id_V2 (-1 default), Source_Is_Active, Audit columns.
    """
    spark = hierarchy_df.sparkSession

    df_clean = (
        hierarchy_df
        .filter(col("manager2_id").isNotNull() & (col("manager2_id") != 0) & (col("manager2_id") != -1))
        .withColumn("manager2_name_clean", initcap(trim(col("manager2_name"))))
    )

    # Deduplicate on manager2_name_clean (keeping smallest manager2_id)
    window_dedup = Window.partitionBy(lower(col("manager2_name_clean"))).orderBy(col("manager2_id").asc())
    df_dedup = (
        df_clean
        .withColumn("rn", row_number().over(window_dedup))
        .filter(col("rn") == 1)
        .drop("rn")
    )

    extracted_df = df_dedup.select(
        col("manager2_id").cast("integer").alias("Manager2_Id"),
        col("manager2_name_clean").alias("Manager2_Name"),
        col("manager2_id").cast("integer").alias("Manager2_Id_V2"),
        col("manager2_active").cast("integer").alias("Source_Is_Active")
    )

    schema = StructType([
        StructField("Manager2_Id", IntegerType(), True),
        StructField("Manager2_Name", StringType(), True),
        StructField("Manager2_Id_V2", IntegerType(), True),
        StructField("Source_Is_Active", IntegerType(), True)
    ])
    default_df = spark.createDataFrame([(None, None, -1, None)], schema=schema)

    combined_df = default_df.union(extracted_df)

    window_spec = Window.orderBy(when(col("Manager2_Id_V2") == -1, -999999).otherwise(col("Manager2_Id_V2")))
    df = combined_df.withColumn("Manager2_Key", row_number().over(window_spec))

    df = add_audit_columns(df)

    return df.select(
        "Manager2_Key",
        "Manager2_Id",
        "Manager2_Name",
        "Manager2_Id_V2",
        "Source_Is_Active",
        "etl_created_date",
        "etl_updated_date",
        "is_active"
    )
