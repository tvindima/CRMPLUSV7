import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path: try app/test.db (Docker), then ../test.db (local dev)
DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")
if not os.path.exists(DB_PATH):
    DB_PATH = os.path.join(os.path.dirname(__file__), "..", "test.db")

print(f"[DATABASE] Using DB_PATH: {DB_PATH}")
print(f"[DATABASE] Exists: {os.path.exists(DB_PATH)}")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# SQLite is fine for local/dev; check_same_thread is required for FastAPI with SQLite
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
