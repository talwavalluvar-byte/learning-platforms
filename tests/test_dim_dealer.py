from config.spark_session import create_spark
from extract.mysql_reader import load_all_tables

spark = create_spark()

tables = load_all_tables(spark)

print("\n===== BRANCH SCHEMA =====")
tables["branch"].printSchema()

print("\n===== ORGANIZATION SCHEMA =====")
tables["organization"].printSchema()

spark.stop()