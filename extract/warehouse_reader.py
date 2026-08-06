from pyspark.sql import SparkSession
from config.database import WAREHOUSE_DB, get_jdbc_url


def read_warehouse_table(
    spark: SparkSession,
    table_name: str
):
    """
    Read a table from the Data Warehouse.
    """

    return (
        spark.read
        .format("jdbc")
        .option("url", get_jdbc_url(WAREHOUSE_DB))
        .option("dbtable", table_name)
        .option("user", WAREHOUSE_DB["user"])
        .option("password", WAREHOUSE_DB["password"])
        .option("driver", "com.mysql.cj.jdbc.Driver")
        .load()
    )