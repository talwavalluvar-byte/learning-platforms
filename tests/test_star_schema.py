import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from pyspark.sql.types import StructType, StructField, IntegerType, StringType
from transform.dimensions.generic_lookup import build_dim_color, build_dim_gender, build_dim_age_group
from transform.dimensions.dim_variant import transform_dim_variant


class TestStarSchemaDimensions(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.spark = create_spark("TestStarSchema")

    @classmethod
    def tearDownClass(cls):
        cls.spark.stop()

    def test_build_dim_color(self):
        schema = StructType([
            StructField("color", StringType(), True)
        ])
        data = [("red",), ("blue",), ("RED",)]
        df = self.spark.createDataFrame(data, schema)
        dim_color = build_dim_color(df)
        results = dim_color.collect()

        # 1 default (-1, None) row + 2 distinct color rows ("Red", "Blue") = 3 rows
        self.assertEqual(len(results), 3)
        self.assertEqual(str(results[0]["Color_Id"]), "-1")
        self.assertIsNone(results[0]["Color_Name"])

    def test_build_dim_gender(self):
        dim_gender = build_dim_gender(self.spark)
        results = dim_gender.collect()

        # 1 default (-1, None) + 3 genders = 4 rows
        self.assertEqual(len(results), 4)
        self.assertEqual(results[0]["Gender_Id"], -1)
        self.assertIsNone(results[0]["Gender_Name"])
        self.assertEqual(results[1]["Gender_Name"], "Male")
        self.assertEqual(results[2]["Gender_Name"], "Female")
        self.assertEqual(results[3]["Gender_Name"], "Other")

    def test_build_dim_age_group(self):
        dim_age = build_dim_age_group(self.spark)
        results = dim_age.collect()

        # 1 default (-1, None) + 3 age groups = 4 rows
        self.assertEqual(len(results), 4)
        self.assertEqual(results[0]["Age_Group_Id"], -1)
        self.assertIsNone(results[0]["Age_Group_Name"])
        self.assertEqual(results[1]["Age_Group_Name"], "Below 25")
        self.assertEqual(results[2]["Age_Group_Name"], "25-45")
        self.assertEqual(results[3]["Age_Group_Name"], "Above 45")

    def test_transform_dim_variant(self):
        schema = StructType([
            StructField("variant_id", IntegerType(), True),
            StructField("variant", StringType(), True)
        ])
        data = [(1, "  vx  "), (2, "zx")]
        df = self.spark.createDataFrame(data, schema)
        dim_variant = transform_dim_variant(df)
        results = dim_variant.collect()

        # 1 default (-1, None) row + 2 variants = 3 rows
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["Variant_Id"], -1)
        self.assertEqual(results[1]["Variant_Name"], "Vx")
        self.assertEqual(results[2]["Variant_Name"], "Zx")


if __name__ == "__main__":
    unittest.main()
