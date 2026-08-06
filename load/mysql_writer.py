from config.database import WAREHOUSE_DB, get_jdbc_url


def write_table(
    df,
    table_name: str,
    mode: str = "overwrite",
    truncate: bool = False
):
    """
    Write a Spark DataFrame to the warehouse MySQL database.

    Parameters
    ----------
    df : DataFrame
        Spark DataFrame to write.

    table_name : str
        Destination warehouse table name.

    mode : str, optional
        Spark write mode ('overwrite', 'append', 'ignore', 'error').

    truncate : bool, optional
        If True and mode is 'overwrite', truncates table data instead of dropping table.
    """

    writer = (
        df.write
        .format("jdbc")
        .option("url", get_jdbc_url(WAREHOUSE_DB))
        .option("dbtable", table_name)
        .option("user", WAREHOUSE_DB["user"])
        .option("password", WAREHOUSE_DB["password"])
        .option("driver", WAREHOUSE_DB["driver"])
    )

    if mode == "overwrite" and truncate:
        writer = writer.option("truncate", "true")

    writer.mode(mode).save()

    print("=" * 80)
    print(f"Successfully loaded table : {table_name}")
    print(f"Write Mode               : {mode}")
    print(f"Total Records            : {df.count()}")
    print("=" * 80)