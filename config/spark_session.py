from pyspark.sql import SparkSession
import os
import sys


def create_spark(app_name: str = "Automobile ETL") -> SparkSession:
    """
    Create and return a configured Spark Session.
    """

    # Project Root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    # JDBC Driver
    jdbc_driver = os.path.join(
        project_root,
        "jars",
        "mysql-connector-j-9.7.0.jar"
    )

    # Force Spark to use current Python (.venv)
    os.environ["PYSPARK_PYTHON"] = sys.executable
    os.environ["PYSPARK_DRIVER_PYTHON"] = sys.executable

    spark = (
        SparkSession.builder
        .appName(app_name)
        .master("local[*]")

        # JDBC Driver
        .config("spark.driver.extraClassPath", jdbc_driver)

        # Performance
        .config("spark.sql.shuffle.partitions", "8")
        .config("spark.driver.memory", "2g")

        # Timezone
        .config("spark.sql.session.timeZone", "Asia/Kolkata")

        # Arrow (Enable later if required)
        .config("spark.sql.execution.arrow.pyspark.enabled", "false")

        .getOrCreate()
    )

    spark.sparkContext.setLogLevel("WARN")

    print("=" * 70)
    print("Spark Session Created Successfully")
    print("=" * 70)
    print(f"Application  : {spark.sparkContext.appName}")
    print(f"Spark Version: {spark.version}")
    print(f"Python       : {sys.executable}")
    print(f"JDBC Driver  : {jdbc_driver}")
    print("=" * 70)

    return spark