from config.spark_session import create_spark
from transform.common import clean_text

spark = create_spark()

data = [
    ("   hyundai   motors  ",),
    ("  HONDA    CARS",),
    ("renault",)
]

df = spark.createDataFrame(data, ["dealer"])

df = df.withColumn(
    "clean_name",
    clean_text("dealer")
)

df.show(truncate=False)

spark.stop()