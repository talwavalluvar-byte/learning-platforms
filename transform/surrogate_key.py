from pyspark.sql import DataFrame
from pyspark.sql.window import Window
from pyspark.sql.functions import col, row_number, when


def generate_surrogate_key(
    df: DataFrame,
    source_key: str,
    business_key: str,
    output_key: str,
    start_number: int = 100000
) -> DataFrame:
    """
    Generate surrogate keys.

    Rules:
    1. business_key NULL and source_key NULL -> -1 (Unknown)
    2. business_key exists but source_key NULL or 0 -> Generate new surrogate key
    3. source_key exists -> Reuse source key
    """

    window = Window.orderBy(source_key)

    df = df.withColumn(
        "_index",
        row_number().over(window)
    )

    unknown_condition = (
        col(business_key).isNull() &
        col(source_key).isNull()
    )

    new_key_condition = (
        col(business_key).isNotNull() &
        (
            col(source_key).isNull() |
            (col(source_key) == 0)
        )
    )

    df = df.withColumn(
        output_key,
        when(
            unknown_condition,
            -1
        ).when(
            new_key_condition,
            start_number + col("_index")
        ).otherwise(
            col(source_key)
        )
    )

    return df.drop("_index")