import psycopg2

# Connection details
HOST = "access-hub.c74wqiwgswvy.ap-south-1.rds.amazonaws.com"
PORT = 5432
DBNAME = "postgres"
USER = "postgres"
PASSWORD = "Y9mn5Vx4wO8e9Vcc9CXO"

print(f"Connecting to {HOST}:{PORT}/{DBNAME} as {USER} ...")

try:
    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DBNAME,
        user=USER,
        password=PASSWORD,
        connect_timeout=10
    )
    cursor = conn.cursor()

    # Check PostgreSQL version
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"\n✅ Connection successful!")
    print(f"   PostgreSQL version: {version[0]}")

    # List existing databases
    cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
    databases = cursor.fetchall()
    print(f"\n📦 Databases on this instance:")
    for db in databases:
        print(f"   - {db[0]}")

    cursor.close()
    conn.close()

except psycopg2.OperationalError as e:
    print(f"\n❌ Connection failed!")
    print(f"   Error: {e}")
    print("\n🔍 Possible causes:")
    print("   1. RDS Security Group not allowing your IP on port 5432")
    print("   2. RDS is not publicly accessible (check 'Publicly accessible' setting)")
    print("   3. Wrong credentials or host")
