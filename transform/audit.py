from pyspark.sql import DataFrame
from pyspark.sql.functions import current_timestamp, lit


def add_audit_columns(df: DataFrame) -> DataFrame:
    """
    Add standard audit columns to a DataFrame.
    """

    return (
        df
        .withColumn("etl_created_date", current_timestamp())
        .withColumn("etl_updated_date", current_timestamp())
        .withColumn("is_active", lit(1))
    )