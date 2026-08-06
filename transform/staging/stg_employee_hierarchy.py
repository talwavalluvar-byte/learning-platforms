from pyspark.sql import DataFrame
from pyspark.sql.functions import col


def build_employee_hierarchy(
    lead_df: DataFrame,
    employee_df: DataFrame,
    delivery_lead_ids: DataFrame = None
) -> DataFrame:
    """
    Build Sales Consultant -> Manager1 -> Manager2 hierarchy for valid delivery leads.
    """
    if delivery_lead_ids is not None:
        lead_filtered = lead_df.join(delivery_lead_ids, col("id") == col("lead_id"), "inner")
    else:
        lead_filtered = lead_df

    sales = employee_df.alias("de")
    manager1 = employee_df.alias("de_mgr1")
    manager2 = employee_df.alias("de_mgr2")

    hierarchy_df = (
        lead_filtered.alias("dll")

        # Sales Consultant
        .join(
            sales,
            col("dll.sales_consultant_id") == col("de.emp_id"),
            "left"
        )

        # Manager 1
        .join(
            manager1,
            col("de.reporting_to") == col("de_mgr1.emp_id"),
            "left"
        )

        # Manager 2
        .join(
            manager2,
            col("de_mgr1.reporting_to") == col("de_mgr2.emp_id"),
            "left"
        )

        .select(

            # Sales Consultant
            col("dll.sales_consultant_id"),
            col("dll.sales_consultant"),
            col("de.active").alias("sales_consultant_active"),

            # Manager 1
            col("de.reporting_to").alias("manager1_id"),
            col("de_mgr1.emp_name").alias("manager1_name"),
            col("de_mgr1.active").alias("manager1_active"),

            # Manager 2
            col("de_mgr2.emp_id").alias("manager2_id"),
            col("de_mgr2.emp_name").alias("manager2_name"),
            col("de_mgr2.active").alias("manager2_active")

        )
        .dropDuplicates()
    )

    return hierarchy_df