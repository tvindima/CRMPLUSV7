"""
Admin endpoints for database management and fixes.
Requires staff authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine, get_tenant_schema, DEFAULT_SCHEMA
from app.properties.agent_assignment import (
    fix_all_agent_assignments,
    validate_agent_assignments,
    AGENT_PREFIX_MAP,
    ORPHAN_PREFIXES
)
from app.security import require_staff

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


@router.post("/fix-crm-settings-all-tenants")
def fix_crm_settings_all_tenants(current_user: dict = Depends(require_staff)):
    """
    Adiciona colunas de watermark e branding à tabela crm_settings em TODOS os tenants.
    Corrige erro: column crm_settings.watermark_enabled does not exist
    """
    results = []
    
    # Colunas que devem existir
    columns_to_add = [
        ("watermark_enabled", "INTEGER DEFAULT 1"),
        ("watermark_image_url", "VARCHAR"),
        ("watermark_opacity", "FLOAT DEFAULT 0.6"),
        ("watermark_scale", "FLOAT DEFAULT 0.15"),
        ("watermark_position", "VARCHAR DEFAULT 'bottom-right'"),
        ("agency_name", "VARCHAR DEFAULT 'CRM Plus'"),
        ("agency_logo_url", "VARCHAR"),
        ("agency_slogan", "VARCHAR DEFAULT 'Powered by CRM Plus'"),
        ("primary_color", "VARCHAR DEFAULT '#E10600'"),
        ("secondary_color", "VARCHAR DEFAULT '#C5C5C5'"),
        ("background_color", "VARCHAR DEFAULT '#0B0B0D'"),
        ("background_secondary", "VARCHAR DEFAULT '#1A1A1F'"),
        ("text_color", "VARCHAR DEFAULT '#FFFFFF'"),
        ("text_muted", "VARCHAR DEFAULT '#9CA3AF'"),
        ("border_color", "VARCHAR DEFAULT '#2A2A2E'"),
        ("accent_color", "VARCHAR DEFAULT '#E10600'"),
        ("max_photos_per_property", "INTEGER DEFAULT 30"),
        ("max_video_size_mb", "INTEGER DEFAULT 100"),
        ("max_image_size_mb", "INTEGER DEFAULT 20"),
    ]
    
    with engine.connect() as conn:
        # Listar todos os schemas de tenants
        result = conn.execute(text("""
            SELECT schema_name FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant_%'
            ORDER BY schema_name
        """))
        tenants = [row[0] for row in result]
        results.append(f"Encontrados {len(tenants)} tenants: {tenants}")
        
        for tenant_schema in tenants:
            tenant_results = []
            
            # Verificar se tabela crm_settings existe
            table_check = conn.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = '{tenant_schema}' AND table_name = 'crm_settings'
                )
            """))
            table_exists = table_check.scalar()
            
            if not table_exists:
                conn.execute(text(f"""
                    CREATE TABLE "{tenant_schema}".crm_settings (
                        id SERIAL PRIMARY KEY,
                        watermark_enabled INTEGER DEFAULT 1,
                        watermark_image_url VARCHAR,
                        watermark_opacity FLOAT DEFAULT 0.6,
                        watermark_scale FLOAT DEFAULT 0.15,
                        watermark_position VARCHAR DEFAULT 'bottom-right',
                        agency_name VARCHAR DEFAULT 'CRM Plus',
                        agency_logo_url VARCHAR,
                        agency_slogan VARCHAR DEFAULT 'Powered by CRM Plus',
                        primary_color VARCHAR DEFAULT '#E10600',
                        secondary_color VARCHAR DEFAULT '#C5C5C5',
                        background_color VARCHAR DEFAULT '#0B0B0D',
                        background_secondary VARCHAR DEFAULT '#1A1A1F',
                        text_color VARCHAR DEFAULT '#FFFFFF',
                        text_muted VARCHAR DEFAULT '#9CA3AF',
                        border_color VARCHAR DEFAULT '#2A2A2E',
                        accent_color VARCHAR DEFAULT '#E10600',
                        max_photos_per_property INTEGER DEFAULT 30,
                        max_video_size_mb INTEGER DEFAULT 100,
                        max_image_size_mb INTEGER DEFAULT 20,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE
                    )
                """))
                conn.execute(text(f'INSERT INTO "{tenant_schema}".crm_settings DEFAULT VALUES'))
                conn.commit()
                tenant_results.append("Tabela criada")
            else:
                # Obter colunas existentes
                cols_result = conn.execute(text(f"""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_schema = '{tenant_schema}' AND table_name = 'crm_settings'
                """))
                existing_columns = {row[0] for row in cols_result}
                
                # Adicionar colunas que faltam
                added_cols = []
                for col_name, col_def in columns_to_add:
                    if col_name not in existing_columns:
                        try:
                            conn.execute(text(f"""
                                ALTER TABLE "{tenant_schema}".crm_settings 
                                ADD COLUMN {col_name} {col_def}
                            """))
                            conn.commit()
                            added_cols.append(col_name)
                        except Exception as e:
                            tenant_results.append(f"Erro {col_name}: {str(e)[:50]}")
                            conn.rollback()
                
                if added_cols:
                    tenant_results.append(f"Adicionadas: {added_cols}")
                else:
                    tenant_results.append("Todas as colunas já existem")
            
            # Garantir que existe pelo menos 1 registo
            count_result = conn.execute(text(f'SELECT COUNT(*) FROM "{tenant_schema}".crm_settings'))
            count = count_result.scalar()
            if count == 0:
                conn.execute(text(f'INSERT INTO "{tenant_schema}".crm_settings DEFAULT VALUES'))
                conn.commit()
                tenant_results.append("Registo inicial inserido")
            
            results.append(f"{tenant_schema}: {tenant_results}")
    
    return {"status": "completed", "results": results}


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
# DATABASE MIGRATION - THEME COLORS
# =====================================================

@router.post("/migrate/theme-colors")
def migrate_theme_colors(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Adiciona as colunas de cores do tema à tabela crm_settings.
    Seguro para executar múltiplas vezes (idempotente).
    """
    try:
        # Verificar e adicionar cada coluna se não existir
        columns_to_add = [
            ("secondary_color", "'#C5C5C5'"),
            ("background_color", "'#0B0B0D'"),
            ("background_secondary", "'#1A1A1F'"),
            ("text_color", "'#FFFFFF'"),
            ("text_muted", "'#9CA3AF'"),
            ("border_color", "'#2A2A2E'"),
            ("accent_color", "'#E10600'"),
        ]
        
        added = []
        already_exists = []
        
        for col_name, default_val in columns_to_add:
            # Verificar se coluna existe
            check_sql = text(f"""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'crm_settings' AND column_name = '{col_name}'
            """)
            result = db.execute(check_sql).fetchone()
            
            if not result:
                # Adicionar coluna
                alter_sql = text(f"""
                    ALTER TABLE crm_settings 
                    ADD COLUMN {col_name} VARCHAR DEFAULT {default_val}
                """)
                db.execute(alter_sql)
                added.append(col_name)
            else:
                already_exists.append(col_name)
        
        db.commit()
        
        return {
            "success": True,
            "added_columns": added,
            "existing_columns": already_exists,
            "message": f"Migration concluída. Adicionadas: {len(added)}, Já existiam: {len(already_exists)}"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro na migration: {str(e)}")


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
    watermark_public_id: Optional[str]  # Public ID do Cloudinary para overlay
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
        watermark_public_id=settings.watermark_public_id,
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
        watermark_public_id=settings.watermark_public_id,
        watermark_opacity=settings.watermark_opacity,
        watermark_scale=settings.watermark_scale,
        watermark_position=settings.watermark_position
    )


@router.post("/settings/watermark/upload")
async def upload_watermark_image(
    request: Request,
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
    
    A imagem é carregada para Cloudinary COM IDENTIFICAÇÃO ÚNICA DO TENANT
    para garantir isolamento multi-tenant rigoroso.
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
    
    # CRÍTICO: Obter tenant_slug para isolamento
    tenant_slug = getattr(request.state, 'tenant_slug', None)
    if not tenant_slug:
        # Fallback: extrair do schema atual
        schema = get_tenant_schema()
        if schema and schema != DEFAULT_SCHEMA:
            tenant_slug = schema.replace("tenant_", "") if schema.startswith("tenant_") else schema
        else:
            tenant_slug = "default"
    
    print(f"[Watermark Upload] Tenant: {tenant_slug}")
    
    try:
        from io import BytesIO
        import cloudinary.uploader
        
        # IMPORTANTE: Public ID único por tenant para garantir isolamento
        # Formato: crm-plus/watermarks/{tenant_slug}/watermark
        watermark_public_id = f"crm-plus/watermarks/{tenant_slug}/watermark"
        
        print(f"[Watermark Upload] Uploading to public_id: {watermark_public_id}")
        
        # Upload direto para Cloudinary com public_id específico do tenant
        result = cloudinary.uploader.upload(
            BytesIO(content),
            public_id=watermark_public_id,
            resource_type="image",
            format="png",
            overwrite=True,
            invalidate=True,  # Limpa cache CDN
        )
        
        url = result["secure_url"]
        print(f"[Watermark Upload] Success: {url}")
        
        # Guardar URL E public_id nas configurações
        settings = db.query(CRMSettings).first()
        if not settings:
            settings = CRMSettings()
            db.add(settings)
        
        settings.watermark_image_url = url
        settings.watermark_public_id = watermark_public_id  # Guardar public_id para overlay
        db.commit()
        db.refresh(settings)
        
        # Invalidar cache do watermark para este tenant
        from app.properties.routes import invalidate_watermark_cache
        invalidate_watermark_cache(tenant_slug)
        
        return {
            "success": True,
            "message": "Marca de água carregada com sucesso!",
            "watermark_url": url,
            "watermark_public_id": watermark_public_id,
            "tenant": tenant_slug,
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


# =====================================================
# BRANDING - CONFIGURAÇÕES DE MARCA DO SITE
# =====================================================

class BrandingSettingsUpdate(BaseModel):
    """Schema para atualizar configurações de branding"""
    agency_name: Optional[str] = None
    agency_slogan: Optional[str] = None
    agency_logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    background_color: Optional[str] = None
    background_secondary: Optional[str] = None
    text_color: Optional[str] = None
    text_muted: Optional[str] = None
    border_color: Optional[str] = None
    accent_color: Optional[str] = None
    
    class Config:
        extra = "ignore"  # Ignorar campos extras enviados pelo frontend


class BrandingSettingsOut(BaseModel):
    """Schema de resposta das configurações de branding"""
    agency_name: str
    agency_slogan: str
    agency_logo_url: Optional[str]
    primary_color: str
    secondary_color: str
    background_color: str
    background_secondary: str
    text_color: str
    text_muted: str
    border_color: str
    accent_color: str
    
    class Config:
        from_attributes = True


@router.get("/settings/branding", response_model=BrandingSettingsOut)
def get_branding_settings(
    db: Session = Depends(get_db)
):
    """
    Obter configurações de branding do site.
    
    PÚBLICO - Não requer autenticação para que o frontend possa consultar.
    
    Retorna configurações de branding e tema do site.
    """
    # Defaults
    defaults = {
        "agency_name": "CRM Plus",
        "agency_slogan": "Sistema Imobiliário",
        "primary_color": "#E10600",
        "secondary_color": "#C5C5C5",
        "background_color": "#0B0B0D",
        "background_secondary": "#1A1A1F",
        "text_color": "#FFFFFF",
        "text_muted": "#9CA3AF",
        "border_color": "#2A2A2E",
        "accent_color": "#E10600"
    }
    
    try:
        settings = db.query(CRMSettings).first()
        
        if not settings:
            # Retornar defaults se não existir (não criar automaticamente)
            return BrandingSettingsOut(
                agency_name=defaults["agency_name"],
                agency_slogan=defaults["agency_slogan"],
                agency_logo_url=None,
                primary_color=defaults["primary_color"],
                secondary_color=defaults["secondary_color"],
                background_color=defaults["background_color"],
                background_secondary=defaults["background_secondary"],
                text_color=defaults["text_color"],
                text_muted=defaults["text_muted"],
                border_color=defaults["border_color"],
                accent_color=defaults["accent_color"]
            )
        
        # Helper para obter valor com fallback
        def safe_get(attr, default):
            try:
                val = getattr(settings, attr, None)
                return val if val is not None else default
            except:
                return default
        
        return BrandingSettingsOut(
            agency_name=safe_get('agency_name', defaults["agency_name"]),
            agency_slogan=safe_get('agency_slogan', defaults["agency_slogan"]),
            agency_logo_url=safe_get('agency_logo_url', None),
            primary_color=safe_get('primary_color', defaults["primary_color"]),
            secondary_color=safe_get('secondary_color', defaults["secondary_color"]),
            background_color=safe_get('background_color', defaults["background_color"]),
            background_secondary=safe_get('background_secondary', defaults["background_secondary"]),
            text_color=safe_get('text_color', defaults["text_color"]),
            text_muted=safe_get('text_muted', defaults["text_muted"]),
            border_color=safe_get('border_color', defaults["border_color"]),
            accent_color=safe_get('accent_color', defaults["accent_color"])
        )
    except Exception as e:
        print(f"[ADMIN BRANDING GET] Error: {e}")
        # Retornar defaults em caso de erro
        return BrandingSettingsOut(
            agency_name=defaults["agency_name"],
            agency_slogan=defaults["agency_slogan"],
            agency_logo_url=None,
            primary_color=defaults["primary_color"],
            secondary_color=defaults["secondary_color"],
            background_color=defaults["background_color"],
            background_secondary=defaults["background_secondary"],
            text_color=defaults["text_color"],
            text_muted=defaults["text_muted"],
            border_color=defaults["border_color"],
            accent_color=defaults["accent_color"]
        )


@router.put("/settings/branding", response_model=BrandingSettingsOut)
def update_branding_settings(
    update: BrandingSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Atualizar configurações de branding e tema do site.
    
    Requer autenticação de staff.
    """
    print(f"[BRANDING PUT] User: {getattr(current_user, 'email', 'unknown')}")
    
    # Defaults para resposta
    defaults = {
        "agency_name": "CRM Plus",
        "agency_slogan": "Sistema Imobiliário",
        "primary_color": "#E10600",
        "secondary_color": "#C5C5C5",
        "background_color": "#0B0B0D",
        "background_secondary": "#1A1A1F",
        "text_color": "#FFFFFF",
        "text_muted": "#9CA3AF",
        "border_color": "#2A2A2E",
        "accent_color": "#E10600"
    }
    
    try:
        # Primeiro, garantir que as colunas de tema existem usando ALTER TABLE direto
        print("[BRANDING PUT] Ensuring theme columns exist...")
        theme_columns_sql = """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_settings' AND column_name='secondary_color') THEN
                ALTER TABLE crm_settings ADD COLUMN secondary_color VARCHAR DEFAULT '#C5C5C5';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_settings' AND column_name='background_color') THEN
                ALTER TABLE crm_settings ADD COLUMN background_color VARCHAR DEFAULT '#0B0B0D';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_settings' AND column_name='background_secondary') THEN
                ALTER TABLE crm_settings ADD COLUMN background_secondary VARCHAR DEFAULT '#1A1A1F';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_settings' AND column_name='text_color') THEN
                ALTER TABLE crm_settings ADD COLUMN text_color VARCHAR DEFAULT '#FFFFFF';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_settings' AND column_name='text_muted') THEN
                ALTER TABLE crm_settings ADD COLUMN text_muted VARCHAR DEFAULT '#9CA3AF';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_settings' AND column_name='border_color') THEN
                ALTER TABLE crm_settings ADD COLUMN border_color VARCHAR DEFAULT '#2A2A2E';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_settings' AND column_name='accent_color') THEN
                ALTER TABLE crm_settings ADD COLUMN accent_color VARCHAR DEFAULT '#E10600';
            END IF;
        END $$;
        """
        try:
            db.execute(text(theme_columns_sql))
            db.commit()
            print("[BRANDING PUT] Theme columns ensured")
        except Exception as col_err:
            print(f"[BRANDING PUT] Column creation error (may be OK): {col_err}")
            db.rollback()
        
        # Verificar se existe registo
        result = db.execute(text("SELECT id FROM crm_settings LIMIT 1")).fetchone()
        
        if not result:
            print("[BRANDING PUT] No settings found, creating new...")
            db.execute(text("""
                INSERT INTO crm_settings (agency_name, agency_slogan, primary_color)
                VALUES (:name, :slogan, :primary)
            """), {
                "name": update.agency_name or defaults["agency_name"],
                "slogan": update.agency_slogan or defaults["agency_slogan"],
                "primary": update.primary_color or defaults["primary_color"]
            })
            db.commit()
        
        # Construir UPDATE dinâmico apenas com campos fornecidos
        updates = []
        params = {}
        
        if update.agency_name is not None:
            updates.append("agency_name = :agency_name")
            params["agency_name"] = update.agency_name
        
        if update.agency_slogan is not None:
            updates.append("agency_slogan = :agency_slogan")
            params["agency_slogan"] = update.agency_slogan
        
        if update.agency_logo_url is not None:
            updates.append("agency_logo_url = :agency_logo_url")
            params["agency_logo_url"] = update.agency_logo_url
        
        if update.primary_color is not None:
            updates.append("primary_color = :primary_color")
            params["primary_color"] = update.primary_color
        
        if update.secondary_color is not None:
            updates.append("secondary_color = :secondary_color")
            params["secondary_color"] = update.secondary_color
        
        if update.background_color is not None:
            updates.append("background_color = :background_color")
            params["background_color"] = update.background_color
        
        if update.background_secondary is not None:
            updates.append("background_secondary = :background_secondary")
            params["background_secondary"] = update.background_secondary
        
        if update.text_color is not None:
            updates.append("text_color = :text_color")
            params["text_color"] = update.text_color
        
        if update.text_muted is not None:
            updates.append("text_muted = :text_muted")
            params["text_muted"] = update.text_muted
        
        if update.border_color is not None:
            updates.append("border_color = :border_color")
            params["border_color"] = update.border_color
        
        if update.accent_color is not None:
            updates.append("accent_color = :accent_color")
            params["accent_color"] = update.accent_color
        
        if updates:
            update_sql = f"UPDATE crm_settings SET {', '.join(updates)}"
            print(f"[BRANDING PUT] Executing: {update_sql}")
            db.execute(text(update_sql), params)
            db.commit()
        
        # Obter valores atualizados via SQL direto
        row = db.execute(text("""
            SELECT 
                COALESCE(agency_name, 'CRM Plus') as agency_name,
                COALESCE(agency_slogan, 'Sistema Imobiliário') as agency_slogan,
                agency_logo_url,
                COALESCE(primary_color, '#E10600') as primary_color,
                COALESCE(secondary_color, '#C5C5C5') as secondary_color,
                COALESCE(background_color, '#0B0B0D') as background_color,
                COALESCE(background_secondary, '#1A1A1F') as background_secondary,
                COALESCE(text_color, '#FFFFFF') as text_color,
                COALESCE(text_muted, '#9CA3AF') as text_muted,
                COALESCE(border_color, '#2A2A2E') as border_color,
                COALESCE(accent_color, '#E10600') as accent_color
            FROM crm_settings LIMIT 1
        """)).fetchone()
        
        if row:
            return BrandingSettingsOut(
                agency_name=row.agency_name,
                agency_slogan=row.agency_slogan,
                agency_logo_url=row.agency_logo_url,
                primary_color=row.primary_color,
                secondary_color=row.secondary_color,
                background_color=row.background_color,
                background_secondary=row.background_secondary,
                text_color=row.text_color,
                text_muted=row.text_muted,
                border_color=row.border_color,
                accent_color=row.accent_color
            )
        else:
            return BrandingSettingsOut(**defaults, agency_logo_url=None)
            
    except Exception as e:
        print(f"[ADMIN BRANDING PUT] Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar branding: {str(e)}")


@router.post("/settings/branding/upload-logo")
async def upload_branding_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Upload de logo da agência para branding.
    
    Requisitos:
    - Formato: PNG, JPG, SVG
    - Tamanho máximo: 2MB
    - Recomendado: PNG com fundo transparente
    
    A imagem é carregada para Cloudinary e a URL guardada nas configurações.
    """
    # Validar tipo de arquivo
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]
    if not file.content_type or file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Formato não suportado. Aceites: PNG, JPG, SVG, WebP"
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
        
        # Upload para Cloudinary na pasta de branding
        url = await storage.upload_file(
            file=BytesIO(content),
            folder="crm-branding",
            filename=f"agency-logo.{file.filename.split('.')[-1] if file.filename else 'png'}",
            public=True
        )
        
        # Guardar URL nas configurações
        settings = db.query(CRMSettings).first()
        if not settings:
            settings = CRMSettings()
            db.add(settings)
        
        settings.agency_logo_url = url
        db.commit()
        db.refresh(settings)
        
        return {"success": True, "url": url, "message": "Logo carregado com sucesso"}
        
    except Exception as e:
        print(f"[Branding] Erro no upload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar logo: {str(e)}"
        )


# ============ GESTÃO DE UTILIZADORES ============

@router.get("/users/list")
def list_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Lista todos os utilizadores/agentes do sistema.
    """
    result = db.execute(text("""
        SELECT id, email, name, role, phone, is_active, created_at 
        FROM agents 
        ORDER BY email
    """))
    
    users = []
    for row in result:
        users.append({
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "role": row[3],
            "phone": row[4],
            "is_active": row[5],
            "created_at": str(row[6]) if row[6] else None
        })
    
    return {"total": len(users), "users": users}


@router.post("/users/set-role/{user_id}")
def set_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Alterar role de um utilizador.
    Roles: admin, staff, agent, guest
    """
    valid_roles = ["admin", "staff", "agent", "guest"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role inválida. Use: {valid_roles}")
    
    result = db.execute(
        text("UPDATE agents SET role = :role WHERE id = :id"),
        {"role": role, "id": user_id}
    )
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    return {"success": True, "message": f"Utilizador {user_id} agora tem role: {role}"}


@router.post("/users/bulk-set-admin")
def bulk_set_admin(
    emails: list[str],
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Definir múltiplos utilizadores como admin através dos emails.
    """
    results = []
    for email in emails:
        result = db.execute(
            text("SELECT id, role FROM agents WHERE email = :email"),
            {"email": email}
        )
        row = result.fetchone()
        
        if row:
            if row[1] == "admin":
                results.append({"email": email, "status": "already_admin"})
            else:
                db.execute(
                    text("UPDATE agents SET role = 'admin' WHERE email = :email"),
                    {"email": email}
                )
                results.append({"email": email, "status": "updated_to_admin", "was": row[1]})
        else:
            results.append({"email": email, "status": "not_found"})
    
    db.commit()
    return {"results": results}


@router.post("/users/create")
def create_user(
    email: str,
    name: str,
    role: str = "agent",
    password: str = "Sucesso2025!",
    phone: str = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_staff)
):
    """
    Criar novo utilizador/agente.
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Verificar se email já existe
    existing = db.execute(
        text("SELECT id FROM agents WHERE email = :email"),
        {"email": email}
    ).fetchone()
    
    if existing:
        raise HTTPException(status_code=400, detail="Email já existe")
    
    # Hash password
    hashed_pw = pwd_context.hash(password)
    
    # Criar utilizador
    result = db.execute(
        text("""
            INSERT INTO agents (email, name, role, password, phone, is_active)
            VALUES (:email, :name, :role, :password, :phone, true)
            RETURNING id
        """),
        {"email": email, "name": name, "role": role, "password": hashed_pw, "phone": phone}
    )
    
    new_id = result.fetchone()[0]
    db.commit()
    
    return {
        "success": True,
        "message": f"Utilizador criado com sucesso",
        "user": {"id": new_id, "email": email, "name": name, "role": role}
    }

# ============ BOOTSTRAP (TEMPORÁRIO) ============
# NOTA: Este endpoint deve ser removido após configuração inicial

@router.post("/bootstrap/setup-admins")
def bootstrap_setup_admins(
    secret_key: str,
    db: Session = Depends(get_db)
):
    """
    ⚠️ ENDPOINT TEMPORÁRIO para configuração inicial.
    Requer SECRET_KEY para funcionar.
    """
    import os
    expected_key = os.getenv("SECRET_KEY", "")
    
    if secret_key != expected_key:
        raise HTTPException(status_code=403, detail="Chave inválida")
    
    # Lista de emails para tornar admin
    admin_emails = [
        "tvindima@imoveismais.pt",
        "jcarvalho@imoveismais.pt",
        "msoares@imoveismais.pt",
        "prodrigues@imoveismais.pt",
        "hmota@imoveismais.pt",
        "leiria@imoveismais.pt",
        "faturacao@imoveismais.pt"
    ]
    
    results = []
    
    # Primeiro listar todos os existentes
    all_users = db.execute(text("SELECT id, email, name, role FROM agents")).fetchall()
    existing_emails = {row[1]: row for row in all_users}
    
    for email in admin_emails:
        if email in existing_emails:
            user = existing_emails[email]
            if user[3] != "admin":
                db.execute(
                    text("UPDATE agents SET role = 'admin' WHERE email = :email"),
                    {"email": email}
                )
                results.append({"email": email, "status": "updated_to_admin", "was": user[3]})
            else:
                results.append({"email": email, "status": "already_admin"})
        else:
            results.append({"email": email, "status": "not_found"})
    
    db.commit()
    
    return {
        "all_users": [{"id": u[0], "email": u[1], "name": u[2], "role": u[3]} for u in all_users],
        "admin_updates": results
    }