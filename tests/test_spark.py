from config.spark_session import create_spark

spark = create_spark()

print("Spark Version:", spark.version)

df = spark.range(5)

df.show()

spark.stop()