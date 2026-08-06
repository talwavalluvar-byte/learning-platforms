from pyspark.sql import DataFrame
from pyspark.sql.functions import col, trim, regexp_replace, initcap


def trim_all_strings(df: DataFrame) -> DataFrame:
    """
    Trim leading/trailing whitespace and remove extra inner spaces for all string columns.
    """
    for col_name, dtype in df.dtypes:
        if dtype == "string":
            df = df.withColumn(
                col_name,
                trim(regexp_replace(col(col_name), r"\s+", " "))
            )
    return df
