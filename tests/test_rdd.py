from config.spark_session import create_spark

spark = create_spark()

rdd = spark.sparkContext.parallelize([1, 2, 3, 4, 5])

print(rdd.collect())

spark.stop()