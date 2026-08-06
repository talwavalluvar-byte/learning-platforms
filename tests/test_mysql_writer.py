from config.spark_session import create_spark
from load.mysql_writer import write_table

spark = create_spark()

data = [
    (1, "Hyundai"),
    (2, "Honda"),
    (3, "Renault")
]

df = spark.createDataFrame(
    data,
    ["BrandID", "BrandName"]
)

write_table(
    df,
    "dim_brand_test"
)

print("Done")