# config/constants.py

# ==========================================================
# Organization Configuration
# ==========================================================

VALID_ORGS = [1, 16, 21, 22, 376]

# Supported branch/service types (branch_type_id)
VALID_BRANCH_TYPES = [458]


# ==========================================================
# Lead Stage Configuration
# ==========================================================

# Delivery Stage
DELIVERY_STAGE_ID = 7


# ==========================================================
# ETL Configuration
# ==========================================================

# Default active flag
ACTIVE_FLAG = 1

# Unknown surrogate key
UNKNOWN_KEY = -1

# Default text for missing values
UNKNOWN_VALUE = "Unknown"


# ==========================================================
# Audit Columns
# ==========================================================

CREATED_BY = "PySpark_ETL"
UPDATED_BY = "PySpark_ETL"