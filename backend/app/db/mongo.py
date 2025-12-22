import os
try:
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    MongoClient = None

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

MONGODB_URI = os.getenv("MONGODB_URI")

class MongoSingleton:
    _client = None

    @classmethod
    def get_client(cls):
        if not PYMONGO_AVAILABLE:
            raise RuntimeError("pymongo not installed")
        if cls._client is None:
            if not MONGODB_URI:
                raise RuntimeError("MONGODB_URI not set")
            cls._client = MongoClient(MONGODB_URI)
        return cls._client

    @classmethod
    def get_db(cls, db_name="angariacoes_dev"):
        return cls.get_client()[db_name]
