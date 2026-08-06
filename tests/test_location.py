from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table
from pyspark.sql.functions import col


def main():

    # Create Spark Session
    spark = create_spark()

    print("=" * 80)
    print("READING LOCATION TABLE")
    print("=" * 80)

    # Read MySQL table
    location_df = read_mysql_table(
        spark,
        "location_node_data"
    )

    # Print Schema
    print("\nSchema")
    print("-" * 80)
    location_df.printSchema()

    # Row Count
    print("\nTotal Rows")
    print("-" * 80)
    print(location_df.count())

    # Show first 20 rows
    print("\nFirst 20 Rows")
    print("-" * 80)
    location_df.show(20, truncate=False)

    # Show selected columns
    print("\nSelected Columns")
    print("-" * 80)
    location_df.select(
        "id",
        "parent_id",
        "code",
        "name",
        "type",
        "org_id",
        "service_type_id"
    ).show(20, truncate=False)

    # Check org_map_id values from dms_branch
    print("\nMatching org_map_id Values")
    print("-" * 80)

    location_df.filter(
        col("id").isin([
            259,
            308,
            309,
            310,
            311,
            312,
            313,
            321,
            325,
            331,
            364
        ])
    ).select(
        "id",
        "parent_id",
        "code",
        "name",
        "type",
        "org_id",
        "service_type_id"
    ).show(50, truncate=False)

    spark.stop()


if __name__ == "__main__":
    main()