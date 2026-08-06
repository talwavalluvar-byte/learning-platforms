from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col,
    when,
    trim,
    initcap,
    lower,
    row_number
)
from pyspark.sql.types import StructType, StructField, IntegerType, StringType
from pyspark.sql.window import Window
from transform.audit import add_audit_columns


def transform_dim_sales_consultant(
    hierarchy_df: DataFrame
) -> DataFrame:
    """
    Transform Sales Consultant Dimension matching employee4.xlsx exactly.
    Output: Sales_Consultant_Key, Sales_Consultant_Id (original), Sales_Consultant_Name, Sales_Consultant_Id_V2 (-1 default), Source_Is_Active, Audit columns.
    """

    # Step 1: Clean name FIRST
    df_clean = hierarchy_df.withColumn(
        "sales_consultant_clean",
        initcap(trim(
            when(lower(trim(col("sales_consultant"))) == "palabindalasrinivas", "Palabindala Srinivas")
            .otherwise(trim(col("sales_consultant")))
        ))
    )

    # Step 2: Table.Distinct on sales_consultant_clean name
    window_dedup = Window.partitionBy(lower(col("sales_consultant_clean"))).orderBy(
        when(col("sales_consultant_id").isNotNull() & (col("sales_consultant_id") != 0), 0).otherwise(1),
        col("sales_consultant_id").asc_nulls_last()
    )

    df_dedup = (
        df_clean
        .filter(col("sales_consultant_clean").isNotNull() & (col("sales_consultant_clean") != ""))
        .withColumn("row_num", row_number().over(window_dedup))
        .filter(col("row_num") == 1)
        .drop("row_num")
    )

    # Step 3: Sort by sales_consultant_id & Add Index
    window_idx = Window.orderBy(col("sales_consultant_id").asc_nulls_last())
    df_idx = df_dedup.withColumn("Index", row_number().over(window_idx))

    # Step 4: Calculate sales_consultant_id_v2
    df_v2 = df_idx.withColumn(
        "sales_consultant_id_v2",
        when(col("sales_consultant_clean").isNull() & (col("sales_consultant_id").isNull() | (col("sales_consultant_id") == 0)), -1)
        .when(col("sales_consultant_clean").isNotNull() & (col("sales_consultant_id").isNull() | (col("sales_consultant_id") == 0)), 100000 + col("Index"))
        .otherwise(col("sales_consultant_id"))
    )

    # Step 5: Add Default (NULL, NULL, -1) Row
    extracted_df = df_v2.select(
        col("sales_consultant_id").cast("integer").alias("Sales_Consultant_Id"),
        col("sales_consultant_clean").alias("Sales_Consultant_Name"),
        col("sales_consultant_id_v2").cast("integer").alias("Sales_Consultant_Id_V2"),
        col("sales_consultant_active").cast("integer").alias("Source_Is_Active")
    )

    spark = hierarchy_df.sparkSession
    schema = StructType([
        StructField("Sales_Consultant_Id", IntegerType(), True),
        StructField("Sales_Consultant_Name", StringType(), True),
        StructField("Sales_Consultant_Id_V2", IntegerType(), True),
        StructField("Source_Is_Active", IntegerType(), True)
    ])
    default_df = spark.createDataFrame([(None, None, -1, None)], schema=schema)

    combined_df = default_df.union(extracted_df)

    # Step 6: Generate dense Surrogate Key
    window_key = Window.orderBy(when(col("Sales_Consultant_Id_V2") == -1, -999999).otherwise(col("Sales_Consultant_Id_V2")))

    result_df = (
        combined_df
        .withColumn("Sales_Consultant_Key", row_number().over(window_key))
        .select(
            col("Sales_Consultant_Key"),
            col("Sales_Consultant_Id"),
            col("Sales_Consultant_Name"),
            col("Sales_Consultant_Id_V2"),
            col("Source_Is_Active")
        )
    )

    return add_audit_columns(result_df)