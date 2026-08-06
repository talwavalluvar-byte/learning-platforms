from transform.staging.common import trim_all_strings

def stage_delivery(df):

    df = trim_all_strings(df)

    df = df.dropDuplicates(["lead_id"])

    return df