from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db
from app.core.storage import storage
from PIL import Image
from io import BytesIO
import os

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/", response_model=list[schemas.AgentOut])
def list_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_agents(db, skip=skip, limit=limit)


@router.get("/{agent_id}", response_model=schemas.AgentOut)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = services.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/", response_model=schemas.AgentOut, status_code=201)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    return services.create_agent(db, agent)


@router.put("/{agent_id}", response_model=schemas.AgentOut)
def update_agent(agent_id: int, agent_update: schemas.AgentUpdate, db: Session = Depends(get_db)):
    agent = services.update_agent(db, agent_id, agent_update)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.delete("/{agent_id}", response_model=schemas.AgentOut)
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = services.delete_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/{agent_id}/upload-photo")
async def upload_agent_photo(
    agent_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload de foto de perfil para agente.
    
    ⚠️ TEMPORÁRIO: Sem autenticação para bulk upload inicial.
    TODO: Adicionar Depends(require_staff) após population.
    
    Faz upload para Cloudinary e atualiza campo 'photo' na database.
    Otimiza automaticamente para tamanho ideal (500x500).
    """
    agent = services.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Validar tipo de ficheiro
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=415, detail="Tipo de ficheiro não suportado (apenas imagens)")
    
    # Ler e otimizar imagem
    content = await file.read()
    
    try:
        # Abrir imagem
        img = Image.open(BytesIO(content))
        
        # Converter para RGB se necessário
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        
        # Resize para 500x500 (quadrado)
        img.thumbnail((500, 500), Image.Resampling.LANCZOS)
        
        # Se não for quadrado, fazer crop central
        if img.size[0] != img.size[1]:
            # Crop para quadrado
            min_dim = min(img.size)
            left = (img.size[0] - min_dim) // 2
            top = (img.size[1] - min_dim) // 2
            right = left + min_dim
            bottom = top + min_dim
            img = img.crop((left, top, right, bottom))
        
        # Salvar como WebP otimizado
        output = BytesIO()
        img.save(output, format='WebP', quality=85, method=6)
        optimized_bytes = output.getvalue()
        
        # Upload para Cloudinary
        file_obj = BytesIO(optimized_bytes)
        filename = f"{agent.name.lower().replace(' ', '-')}.webp"
        
        url = await storage.upload_file(
            file=file_obj,
            folder=f"agents/{agent_id}",
            filename=filename,
            public=True
        )
        
        # Atualizar database - APENAS campo photo
        from sqlalchemy import text
        db.execute(
            text("UPDATE agents SET photo = :photo WHERE id = :id"),
            {"photo": url, "id": agent_id}
        )
        db.commit()
        
        # Refresh agent
        db.refresh(agent)
        
        return JSONResponse({
            "success": True,
            "agent_id": agent_id,
            "photo": url,
            "message": f"Foto de {agent.name} uploaded com sucesso!"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")
