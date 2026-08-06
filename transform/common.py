from pyspark.sql.functions import (
    trim,
    regexp_replace,
    initcap,
    upper,
    lower,
    col,
    when,
)


def clean_text(column):
    """
    Trim spaces, remove duplicate spaces and convert to Title Case.
    """

    return initcap(
        regexp_replace(
            trim(col(column)),
            r"\s+",
            " "
        )
    )


def to_upper(column):
    return upper(trim(col(column)))


def to_lower(column):
    return lower(trim(col(column)))


def null_if_empty(column):
    return when(
        trim(col(column)) == "",
        None
    ).otherwise(col(column))