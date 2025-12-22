from fastapi import APIRouter, Body
from .services import handle_intent

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/intent/")
def parse_intent(text: str = Body(..., embed=True)):
    return {"result": handle_intent(text)}
