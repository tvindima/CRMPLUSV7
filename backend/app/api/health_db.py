from fastapi import APIRouter
from app.db.mongo import MongoSingleton

router = APIRouter()

@router.get("/health/db")
def health_db():
    try:
        client = MongoSingleton.get_client()
        # Atlas cluster info (mock: always true if connect ok)
        info = client.server_info()
        atlas = "atlas" in info.get("versionArray", []) or True  # simplificação
        return {"mongodb": "connected", "atlas": atlas}
    except Exception as e:
        return {"mongodb": "error", "error": str(e)}
