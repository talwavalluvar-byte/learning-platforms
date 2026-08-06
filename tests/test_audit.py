from config.spark_session import create_spark
from transform.audit import add_audit_columns

spark = create_spark()

data = [
    (1, "Hyundai"),
    (2, "Honda")
]

df = spark.createDataFrame(data, ["id", "brand"])

df = add_audit_columns(df)

df.show(truncate=False)

spark.stop()