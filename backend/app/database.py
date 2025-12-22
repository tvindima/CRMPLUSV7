"""
PostgreSQL-compatible database configuration.
Auto-detects DATABASE_URL (PostgreSQL) or falls back to SQLite.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Check for PostgreSQL DATABASE_URL (Railway, Heroku, etc.)
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # PostgreSQL mode
    if DATABASE_URL.startswith("postgres://"):
        # Fix old postgres:// URLs (Heroku/Railway old format)
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    print(f"[DATABASE] Using PostgreSQL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'remote'}")
    
    # PostgreSQL-specific configuration to handle TEXT and other types
    from sqlalchemy.dialects import postgresql
    from sqlalchemy import event
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Test connections before using
        echo=False
    )
    
    # Register unknown types
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_conn, connection_record):
        # PostgreSQL type 25 is TEXT - SQLAlchemy should handle automatically
        pass
else:
    # SQLite fallback (local development)
    DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")
    if not os.path.exists(DB_PATH):
        DB_PATH = os.path.join(os.path.dirname(__file__), "..", "test.db")
    
    print(f"[DATABASE] Using SQLite: {DB_PATH}")
    print(f"[DATABASE] Exists: {os.path.exists(DB_PATH)}")
    
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
