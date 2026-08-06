import os
import sys
import unittest
import openpyxl
from pyspark.sql import SparkSession

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.spark_session import create_spark
from extract.mysql_reader import load_all_tables
from transform.facts.fact_sales import build_fact_sales


class TestFactSales(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.spark = create_spark("TestFactSalesUnit")

    @classmethod
    def tearDownClass(cls):
        cls.spark.stop()

    def test_fact_sales_schema_and_counts(self):
        tables = load_all_tables(self.spark)
        fact_df = build_fact_sales(tables)

        excel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "pipelines", "FileCrosscheck", "powerbi_fact_sales_table.xlsx"))
        wb = openpyxl.load_workbook(excel_path)
        ws = wb["Sheet1"]
        excel_cols = [cell.value for cell in ws[1]]

        spark_cols = [c for c in fact_df.columns if c not in ("etl_created_date", "etl_updated_date", "is_active")]

        self.assertEqual(len(spark_cols), len(excel_cols))
        self.assertEqual(spark_cols, excel_cols)


if __name__ == "__main__":
    unittest.main()
