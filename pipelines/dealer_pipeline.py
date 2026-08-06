from config.spark_session import create_spark
from extract.mysql_reader import load_all_tables
from transform.dimensions.dim_dealer import transform_dim_dealer
from load.mysql_writer import write_table


def run_dealer_pipeline():

    print("=" * 70)
    print("Running Dealer Pipeline")
    print("=" * 70)

    spark = create_spark()

    try:

        # Extract
        tables = load_all_tables(spark)

        # Transform
        dealer_df = transform_dim_dealer(
            branch_df=tables["branch"],
            organization_df=tables["organization"]
        )

        dealer_df.cache()

        print("\nDealer Preview")
        dealer_df.show(20, truncate=False)

        # Load
        write_table(
            dealer_df,
            table_name="dim_dealer",
            mode="overwrite"
        )

        dealer_df.unpersist()

        print("\nDealer Pipeline Completed Successfully")

    except Exception as e:

        print(f"\nDealer Pipeline Failed\n{e}")

        raise

    finally:

        spark.stop()