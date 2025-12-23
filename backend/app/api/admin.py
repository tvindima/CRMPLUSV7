"""
Admin endpoints for database management and fixes.
Requires staff authentication.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.properties.agent_assignment import (
    fix_all_agent_assignments,
    validate_agent_assignments,
    AGENT_PREFIX_MAP,
    ORPHAN_PREFIXES
)
from app.api.v1.auth import require_staff

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/fix-all-agent-assignments")
def fix_all_agent_assignments_endpoint(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Corrige agent_id de TODAS as propriedades baseado no prefixo da referência.
    
    Utiliza o sistema automático de atribuição que mapeia:
    - Prefixos de 2 letras: PR → Paulo Rodrigues (37), AS → António Silva (24), etc.
    - Prefixos de 3 letras: JPE → João Pereira (33)
    - Prefixos órfãos: CB, FA, HA, JR, RC, SC → Tiago Vindima (35, coordenador)
    
    Retorna estatísticas detalhadas por agente.
    """
    results = fix_all_agent_assignments(db)
    return results


@router.get("/validate-agent-assignments")
def validate_agent_assignments_endpoint(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Valida todas as atribuições de agentes às propriedades.
    
    Retorna lista de propriedades com agent_id incorreto baseado no prefixo da referência.
    Útil para auditoria após executar fix-all-agent-assignments.
    
    Resposta esperada após correção: {"total": 336, "mismatches": []}
    """
    mismatches = validate_agent_assignments(db)
    return {
        "total": db.execute(text("SELECT COUNT(*) FROM properties")).scalar(),
        "mismatches": mismatches,
        "mismatches_count": len(mismatches),
        "status": "✅ All correct" if len(mismatches) == 0 else f"⚠️ {len(mismatches)} mismatches found"
    }


@router.get("/agent-prefix-map")
def get_agent_prefix_map(current_user: dict = Depends(require_staff)):
    """
    Retorna o mapeamento completo de prefixos → agent_id.
    
    Útil para debugging e documentação.
    """
    return {
        "agent_prefix_map": AGENT_PREFIX_MAP,
        "orphan_prefixes": ORPHAN_PREFIXES,
        "total_agents": len(AGENT_PREFIX_MAP),
        "note": "Prefixes CB, FA, HA, JR, RC, SC are orphaned and assigned to coordinator (Tiago, ID 35)"
    }


@router.post("/migrate/leads")
def migrate_leads(current_user: dict = Depends(require_staff)):
    """
    🚨 ENDPOINT TEMPORÁRIO - Roda migração da tabela leads
    Adiciona colunas: source, origin, action_type, property_id
    """
    try:
        with engine.begin() as conn:
            results = []
            
            # Check and add source
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='leads' AND column_name='source'
            """))
            if result.fetchone() is None:
                conn.execute(text("ALTER TABLE leads ADD COLUMN source VARCHAR"))
                results.append("✅ Added source")
            else:
                results.append("✓ source exists")
            
            # Check and add origin
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='leads' AND column_name='origin'
            """))
            if result.fetchone() is None:
                conn.execute(text("ALTER TABLE leads ADD COLUMN origin VARCHAR"))
                results.append("✅ Added origin")
            else:
                results.append("✓ origin exists")
            
            # Check and add action_type
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='leads' AND column_name='action_type'
            """))
            if result.fetchone() is None:
                conn.execute(text("ALTER TABLE leads ADD COLUMN action_type VARCHAR"))
                results.append("✅ Added action_type")
            else:
                results.append("✓ action_type exists")
            
            # Check and add property_id
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='leads' AND column_name='property_id'
            """))
            if result.fetchone() is None:
                conn.execute(text("ALTER TABLE leads ADD COLUMN property_id INTEGER REFERENCES properties(id)"))
                results.append("✅ Added property_id")
            else:
                results.append("✓ property_id exists")
            
        return {
            "status": "success",
            "message": "Leads migration completed",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup-old-media-urls")
def cleanup_old_media_urls(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Remove URLs antigas de /media/ que retornam 404.
    
    ⚠️ Este endpoint é temporário - usado após migração para Cloudinary.
    Remove URLs antigas do Railway filesystem que já não existem.
    Mantém URLs externas (Unsplash, Cloudinary, etc).
    """
    import json
    
    try:
        # Buscar propriedades com URLs antigas
        result = db.execute(text("""
            SELECT id, reference, images 
            FROM properties 
            WHERE images IS NOT NULL 
            AND images::text LIKE '%/media/properties/%'
        """))
        
        properties = result.fetchall()
        
        if not properties:
            return {
                "success": True,
                "message": "✅ Nenhuma URL antiga encontrada!",
                "cleaned": 0,
                "properties": []
            }
        
        cleaned_list = []
        cleaned_count = 0
        
        for prop in properties:
            prop_id, reference, images_json = prop
            
            # Parse JSON array
            try:
                images = json.loads(images_json) if isinstance(images_json, str) else images_json
            except:
                images = images_json if isinstance(images_json, list) else []
            
            if not images:
                continue
            
            # Filtrar apenas URLs válidas (externas)
            old_count = len(images)
            cleaned_images = [
                url for url in images 
                if not url.startswith('/media/') 
                and not 'railway.app/media/' in url
            ]
            
            removed = old_count - len(cleaned_images)
            
            if removed > 0:
                cleaned_list.append({
                    "id": prop_id,
                    "reference": reference,
                    "removed": removed,
                    "kept": len(cleaned_images)
                })
                
                # Update database
                if cleaned_images:
                    db.execute(text("""
                        UPDATE properties 
                        SET images = :images::jsonb
                        WHERE id = :id
                    """), {"images": json.dumps(cleaned_images), "id": prop_id})
                else:
                    # Se não sobrou nenhuma, setar NULL
                    db.execute(text("""
                        UPDATE properties 
                        SET images = NULL
                        WHERE id = :id
                    """), {"id": prop_id})
                
                cleaned_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"✅ Limpeza concluída! {cleaned_count} propriedades atualizadas",
            "cleaned": cleaned_count,
            "total_found": len(properties),
            "properties": cleaned_list
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro na limpeza: {str(e)}")


@router.get("/audit-database")
def audit_database(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Gera relatório completo do estado da database.
    
    Retorna:
    - Estatísticas de propriedades (total, com/sem imagens, com/sem vídeo)
    - Estatísticas de agentes (total, com/sem foto, com/sem vídeo)
    - Breakdown por tipo de propriedade
    - Top agentes por número de propriedades
    - Análise de URLs de imagens (Cloudinary vs Unsplash)
    """
    import json
    
    try:
        # === PROPRIEDADES ===
        total_props = db.execute(text("SELECT COUNT(*) FROM properties")).scalar()
        with_images = db.execute(text("""
            SELECT COUNT(*) FROM properties 
            WHERE images IS NOT NULL AND jsonb_array_length(images) > 0
        """)).scalar()
        without_images = total_props - with_images
        with_video = db.execute(text("""
            SELECT COUNT(*) FROM properties 
            WHERE video_url IS NOT NULL AND video_url != ''
        """)).scalar()
        published = db.execute(text("SELECT COUNT(*) FROM properties WHERE is_published = true")).scalar()
        
        # Breakdown por tipo
        tipos_result = db.execute(text("""
            SELECT property_type, COUNT(*) as count
            FROM properties
            GROUP BY property_type
            ORDER BY count DESC
        """)).fetchall()
        tipos = [{"tipo": t[0] or "Não definido", "count": t[1]} for t in tipos_result]
        
        # Top 10 agentes
        agentes_result = db.execute(text("""
            SELECT a.name, COUNT(p.id) as count
            FROM properties p
            LEFT JOIN agents a ON p.agent_id = a.id
            GROUP BY a.name
            ORDER BY count DESC
            LIMIT 10
        """)).fetchall()
        top_agentes = [{"name": a[0] or "Sem agente", "count": a[1]} for a in agentes_result]
        
        # === AGENTES ===
        total_agents = db.execute(text("SELECT COUNT(*) FROM agents")).scalar()
        agents_with_photo = db.execute(text("""
            SELECT COUNT(*) FROM agents 
            WHERE photo IS NOT NULL AND photo != ''
        """)).scalar()
        agents_without_photo = total_agents - agents_with_photo
        agents_with_video = db.execute(text("""
            SELECT COUNT(*) FROM agents 
            WHERE video_url IS NOT NULL AND video_url != ''
        """)).scalar()
        
        # === ANÁLISE DE IMAGENS ===
        images_result = db.execute(text("""
            SELECT 
                SUM(jsonb_array_length(images)) as total_images,
                COUNT(DISTINCT id) as properties_with_images
            FROM properties
            WHERE images IS NOT NULL
        """)).fetchone()
        
        total_images = images_result[0] or 0
        props_with_images = images_result[1] or 0
        avg_images = total_images / props_with_images if props_with_images > 0 else 0
        
        # URLs Unsplash vs Cloudinary
        unsplash_count = db.execute(text("""
            SELECT COUNT(DISTINCT id)
            FROM properties, jsonb_array_elements_text(images) as url
            WHERE url LIKE '%unsplash%'
        """)).scalar() or 0
        
        cloudinary_count = db.execute(text("""
            SELECT COUNT(DISTINCT id)
            FROM properties, jsonb_array_elements_text(images) as url
            WHERE url LIKE '%cloudinary%'
        """)).scalar() or 0
        
        # === VÍDEOS ===
        youtube_props = db.execute(text("""
            SELECT COUNT(*)
            FROM properties
            WHERE video_url LIKE '%youtube%' OR video_url LIKE '%youtu.be%'
        """)).scalar() or 0
        
        youtube_agents = db.execute(text("""
            SELECT COUNT(*)
            FROM agents
            WHERE video_url LIKE '%youtube%' OR video_url LIKE '%youtu.be%'
        """)).scalar() or 0
        
        return {
            "success": True,
            "properties": {
                "total": total_props,
                "published": published,
                "with_images": with_images,
                "without_images": without_images,
                "with_video": with_video,
                "without_video": total_props - with_video,
                "by_type": tipos,
                "top_agents": top_agentes
            },
            "agents": {
                "total": total_agents,
                "with_photo": agents_with_photo,
                "without_photo": agents_without_photo,
                "with_video": agents_with_video,
                "without_video": total_agents - agents_with_video
            },
            "images": {
                "total_urls": total_images,
                "avg_per_property": round(avg_images, 1),
                "unsplash_count": unsplash_count,
                "cloudinary_count": cloudinary_count
            },
            "videos": {
                "properties_youtube": youtube_props,
                "agents_youtube": youtube_agents
            },
            "priorities": {
                "critical": f"{without_images} propriedades SEM IMAGENS",
                "important": f"{agents_without_photo} agentes SEM FOTO",
                "optional": f"{total_props - with_video} propriedades SEM VÍDEO"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao auditar database: {str(e)}")


# =====================================================
# CRM SETTINGS - WATERMARK & BRANDING
# =====================================================

from app.models.crm_settings import CRMSettings
from app.core.storage import storage
from fastapi import UploadFile, File
from pydantic import BaseModel
from typing import Optional


class WatermarkSettingsUpdate(BaseModel):
    """Schema para atualizar configurações de watermark"""
    watermark_enabled: Optional[bool] = None
    watermark_opacity: Optional[float] = None  # 0.0 a 1.0
    watermark_scale: Optional[float] = None     # 0.05 a 0.5
    watermark_position: Optional[str] = None    # bottom-right, bottom-left, top-right, top-left, center


class WatermarkSettingsOut(BaseModel):
    """Schema de resposta das configurações de watermark"""
    watermark_enabled: bool
    watermark_image_url: Optional[str]
    watermark_opacity: float
    watermark_scale: float
    watermark_position: str
    
    class Config:
        from_attributes = True


@router.get("/settings/watermark", response_model=WatermarkSettingsOut)
def get_watermark_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Obter configurações atuais de watermark/marca de água.
    
    Retorna:
    - watermark_enabled: Se watermark está ativo
    - watermark_image_url: URL do PNG da marca de água
    - watermark_opacity: Opacidade (0.0 a 1.0)
    - watermark_scale: Tamanho relativo (0.05 a 0.5)
    - watermark_position: Posição na imagem
    """
    settings = db.query(CRMSettings).first()
    
    if not settings:
        # Criar settings padrão se não existir
        settings = CRMSettings(
            watermark_enabled=1,
            watermark_opacity=0.6,
            watermark_scale=0.15,
            watermark_position="bottom-right"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return WatermarkSettingsOut(
        watermark_enabled=bool(settings.watermark_enabled),
        watermark_image_url=settings.watermark_image_url,
        watermark_opacity=settings.watermark_opacity,
        watermark_scale=settings.watermark_scale,
        watermark_position=settings.watermark_position
    )


@router.put("/settings/watermark", response_model=WatermarkSettingsOut)
def update_watermark_settings(
    update: WatermarkSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Atualizar configurações de watermark.
    
    Parâmetros:
    - watermark_enabled: Ativar/desativar marca de água
    - watermark_opacity: Opacidade (0.0 = invisível, 1.0 = opaco total)
    - watermark_scale: Tamanho (0.05 = 5% da largura, 0.5 = 50%)
    - watermark_position: Posição (bottom-right, bottom-left, top-right, top-left, center)
    """
    settings = db.query(CRMSettings).first()
    
    if not settings:
        settings = CRMSettings()
        db.add(settings)
    
    # Atualizar campos fornecidos
    if update.watermark_enabled is not None:
        settings.watermark_enabled = 1 if update.watermark_enabled else 0
    
    if update.watermark_opacity is not None:
        # Validar range 0.0 - 1.0
        settings.watermark_opacity = max(0.0, min(1.0, update.watermark_opacity))
    
    if update.watermark_scale is not None:
        # Validar range 0.05 - 0.5
        settings.watermark_scale = max(0.05, min(0.5, update.watermark_scale))
    
    if update.watermark_position is not None:
        valid_positions = ["bottom-right", "bottom-left", "top-right", "top-left", "center"]
        if update.watermark_position in valid_positions:
            settings.watermark_position = update.watermark_position
    
    db.commit()
    db.refresh(settings)
    
    return WatermarkSettingsOut(
        watermark_enabled=bool(settings.watermark_enabled),
        watermark_image_url=settings.watermark_image_url,
        watermark_opacity=settings.watermark_opacity,
        watermark_scale=settings.watermark_scale,
        watermark_position=settings.watermark_position
    )


@router.post("/settings/watermark/upload")
async def upload_watermark_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Upload de imagem PNG para marca de água.
    
    Requisitos:
    - Formato: PNG (com transparência)
    - Tamanho máximo: 2MB
    - Recomendado: Logo branco ou escuro com fundo transparente
    
    A imagem é carregada para Cloudinary e a URL guardada nas configurações.
    """
    # Validar tipo de arquivo
    if not file.content_type or file.content_type != "image/png":
        raise HTTPException(
            status_code=415,
            detail="Apenas ficheiros PNG são aceites. O PNG permite transparência para melhor resultado."
        )
    
    # Validar tamanho (2MB max)
    content = await file.read()
    MAX_SIZE = 2 * 1024 * 1024  # 2MB
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Ficheiro muito grande. Máximo: 2MB. Tamanho recebido: {len(content) / (1024*1024):.1f}MB"
        )
    
    try:
        from io import BytesIO
        
        # Upload para Cloudinary na pasta de settings
        url = await storage.upload_file(
            file=BytesIO(content),
            folder="crm-settings",
            filename="watermark.png",
            public=True
        )
        
        # Guardar URL nas configurações
        settings = db.query(CRMSettings).first()
        if not settings:
            settings = CRMSettings()
            db.add(settings)
        
        settings.watermark_image_url = url
        db.commit()
        db.refresh(settings)
        
        return {
            "success": True,
            "message": "Marca de água carregada com sucesso!",
            "watermark_url": url,
            "settings": {
                "enabled": bool(settings.watermark_enabled),
                "opacity": settings.watermark_opacity,
                "scale": settings.watermark_scale,
                "position": settings.watermark_position
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar imagem: {str(e)}"
        )


@router.delete("/settings/watermark/image")
def delete_watermark_image(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Remover imagem de marca de água.
    Desativa automaticamente o watermark.
    """
    settings = db.query(CRMSettings).first()
    
    if not settings or not settings.watermark_image_url:
        raise HTTPException(status_code=404, detail="Nenhuma marca de água configurada")
    
    # Tentar apagar do Cloudinary
    try:
        import asyncio
        asyncio.get_event_loop().run_until_complete(
            storage.delete_file(settings.watermark_image_url)
        )
    except Exception as e:
        print(f"Aviso: Não foi possível apagar do storage: {e}")
    
    # Limpar configuração
    settings.watermark_image_url = None
    settings.watermark_enabled = 0
    db.commit()
    
    return {"success": True, "message": "Marca de água removida"}


