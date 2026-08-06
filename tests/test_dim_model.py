import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pyspark.sql.types import StructType, StructField, IntegerType, StringType
from config.spark_session import create_spark
from transform.dimensions.dim_model import transform_dim_model


class TestDimModel(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.spark = create_spark("TestDimModel")

    @classmethod
    def tearDownClass(cls):
        cls.spark.stop()

    def test_transform_dim_model(self):
        schema = StructType([
            StructField("model_id", IntegerType(), True),
            StructField("model", StringType(), True)
        ])

        data = [
            (101, "  swift  "),
            (102, "baleno"),
            (103, "CRETA")
        ]

        stg_df = self.spark.createDataFrame(data, schema)
        dim_df = transform_dim_model(stg_df)

        results = dim_df.collect()

        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["Model_Key"], 1)
        self.assertEqual(results[0]["Model_Id"], 101)
        self.assertEqual(results[0]["Model_Name"], "Swift")

        self.assertEqual(results[1]["Model_Key"], 2)
        self.assertEqual(results[1]["Model_Id"], 102)
        self.assertEqual(results[1]["Model_Name"], "Baleno")

        self.assertEqual(results[2]["Model_Key"], 3)
        self.assertEqual(results[2]["Model_Id"], 103)
        self.assertEqual(results[2]["Model_Name"], "Creta")

        self.assertIn("etl_created_date", dim_df.columns)
        self.assertIn("is_active", dim_df.columns)


if __name__ == "__main__":
    unittest.main()
