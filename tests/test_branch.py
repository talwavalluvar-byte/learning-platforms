from config.spark_session import create_spark
from extract.mysql_reader import read_mysql_table

spark = create_spark()

branch_df = read_mysql_table(
    spark,
    "dms_branch"
)

branch_df.select(
    "branch_id",
    "name",
    "dealer_code",
    "org_map_id",
    "org_id",
    "service_type_id",
    "active"
).show(20, truncate=False)

spark.stop()