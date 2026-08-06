from config.database import SOURCE_DB, WAREHOUSE_DB, get_jdbc_url

print("========== SOURCE ==========")
print(get_jdbc_url(SOURCE_DB))

print("\n========== WAREHOUSE ==========")
print(get_jdbc_url(WAREHOUSE_DB))