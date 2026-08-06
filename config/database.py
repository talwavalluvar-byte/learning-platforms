import os

SOURCE_DB = {
    "host": os.getenv("SOURCE_DB_HOST", "cyepro-production-3-0.chvrsbdweoe1.ap-south-1.rds.amazonaws.com"),
    "port": int(os.getenv("SOURCE_DB_PORT", "3306")),
    "database": os.getenv("SOURCE_DB_NAME", "salesDataSetup"),
    "user": os.getenv("SOURCE_DB_USER", "pbi_user"),
    "password": os.getenv("SOURCE_DB_PASSWORD", "PbiCyepro@526"),
    "driver": "com.mysql.cj.jdbc.Driver"
}

WAREHOUSE_DB = {
    "host": os.getenv("WAREHOUSE_DB_HOST", "localhost"),
    "port": int(os.getenv("WAREHOUSE_DB_PORT", "3306")),
    "database": os.getenv("WAREHOUSE_DB_NAME", "automobile_dw"),
    "user": os.getenv("WAREHOUSE_DB_USER", "root"),
    "password": os.getenv("WAREHOUSE_DB_PASSWORD", "Dhanshika@12"),
    "driver": "com.mysql.cj.jdbc.Driver"
}

def get_jdbc_url(config):
    return (
        f"jdbc:mysql://{config['host']}:"
        f"{config['port']}/"
        f"{config['database']}"
    )