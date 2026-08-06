from pyspark.sql import DataFrame
from pyspark.sql.functions import col
from config.constants import VALID_ORGS, VALID_BRANCH_TYPES

def apply_global_filters(df: DataFrame) -> DataFrame:
    """
    Applies global organization and branch/service type filters dynamically.
    Checks if columns 'org_id' or 'branch_type_id' exist in the input DataFrame.
    """
    if df is None:
        return df

    filtered_df = df

    # Dynamic filter for org_id
    if "org_id" in filtered_df.columns:
        filtered_df = filtered_df.filter(col("org_id").cast("integer").isin(VALID_ORGS))

    # Dynamic filter for branch_type_id / service_type
    if "branch_type_id" in filtered_df.columns:
        filtered_df = filtered_df.filter(col("branch_type_id").cast("integer").isin(VALID_BRANCH_TYPES))

    return filtered_df
