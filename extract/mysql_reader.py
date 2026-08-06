from config.database import SOURCE_DB, get_jdbc_url
from extract.table_list import SOURCE_TABLES


def read_mysql_table(spark, table_name, apply_filter=False):
    """
    Read a table from the source MySQL database.
    """
    df = (
        spark.read
        .format("jdbc")
        .option("url", get_jdbc_url(SOURCE_DB))
        .option("dbtable", table_name)
        .option("user", SOURCE_DB["user"])
        .option("password", SOURCE_DB["password"])
        .option("driver", SOURCE_DB["driver"])
        .load()
    )
    if apply_filter:
        from config.filters import apply_global_filters
        return apply_global_filters(df)
    return df



def read_mysql_query(spark, query):
    """
    Read data from MySQL using a custom SQL query.
    """

    return (
        spark.read
        .format("jdbc")
        .option("url", get_jdbc_url(SOURCE_DB))
        .option("dbtable", f"({query}) AS src")
        .option("user", SOURCE_DB["user"])
        .option("password", SOURCE_DB["password"])
        .option("driver", SOURCE_DB["driver"])
        .load()
    )


def load_all_tables(spark):
    """
    Load all source tables into a dictionary.
    """

    tables = {}

    print("=" * 80)
    print("Loading Source Tables")
    print("=" * 80)

    for alias, table_name in SOURCE_TABLES.items():

        print(f"Loading {table_name}")

        tables[alias] = read_mysql_table(
            spark,
            table_name
        )

    print("=" * 80)
    print(f"Successfully Loaded {len(tables)} Tables")
    print("=" * 80)

    return tables