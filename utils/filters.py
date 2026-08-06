from pyspark.sql.functions import col
from config.constants import VALID_ORGS


def filter_valid_orgs(df, org_column="org_id"):
    """
    Filter dataframe to supported organizations.
    """
    return df.filter(col(org_column).isin(VALID_ORGS))