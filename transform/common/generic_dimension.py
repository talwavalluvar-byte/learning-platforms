from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col,
    current_timestamp,
    lit,
    row_number
)
from pyspark.sql.window import Window


def create_dimension(
    df: DataFrame,
    key_name: str,
    id_column: str,
    name_column: str,
    id_alias: str,
    name_alias: str,
    active_column: str = None,
    id_v2_column: str = None
) -> DataFrame:
    """
    Generic Dimension Builder
    """

    window_spec = Window.orderBy(id_column)

    select_columns = [

        row_number().over(window_spec).alias(key_name),

        col(id_column).alias(id_alias),

        col(name_column).alias(name_alias)
    ]

    # Optional ID_V2
    if id_v2_column:
        select_columns.append(
            col(id_v2_column).alias(f"{id_alias}_v2")
        )

    # Optional Active
    if active_column:
        select_columns.append(
            col(active_column).alias("Source_Is_Active")
        )

    # Audit Columns
    select_columns.extend([

        current_timestamp().alias("etl_created_date"),

        current_timestamp().alias("etl_updated_date"),

        lit(True).alias("is_active")

    ])

    return (
        df.select(*select_columns)
          .dropDuplicates([id_column])
    )