import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from pyspark.sql.types import StructType, StructField, IntegerType, StringType
from transform.dimensions.generic_lookup import build_dim_transmission


class TestDimTransmission(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.spark = create_spark("TestDimTransmissionUnit")

    @classmethod
    def tearDownClass(cls):
        cls.spark.stop()

    def test_build_dim_transmission(self):
        schema = StructType([
            StructField("id", IntegerType(), True),
            StructField("org_id", IntegerType(), True),
            StructField("attribute", StringType(), True),
            StructField("value", StringType(), True)
        ])
        data = [
            (945, 1, "TRANSMISSION_TYPE", "Manual"),
            (946, 1, "TRANSMISSION_TYPE", "Automatic"),
            (1246, 16, "TRANSMISSION_TYPE", "CVT")
        ]
        moc_df = self.spark.createDataFrame(data, schema)
        dim_trans = build_dim_transmission(moc_df)
        results = dim_trans.collect()

        # Exactly 3 transmission types = 3 rows (no default NULL row)
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["Transmission_Key"], 1)
        self.assertEqual(results[0]["Transmission_Id"], 945)
        self.assertEqual(results[0]["Transmission"], "Manual")

        names = [r["Transmission"] for r in results]
        self.assertEqual(names, ["Manual", "Automatic", "CVT"])


if __name__ == "__main__":
    unittest.main()
