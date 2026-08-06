from config.spark_session import create_spark

spark = create_spark()

data = [
    (1, "Hyundai"),
    (2, "Honda"),
    (3, "Renault")
]

df = spark.createDataFrame(data, ["id", "name"])

df.show()

spark.stop()