import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from PIL import Image
import io
import requests
from . import services, schemas
from app.database import get_db
from app.properties.models import PropertyStatus, Property
from app.core.storage import storage  # Storage abstraction layer
from app.security import require_staff, get_current_user, get_optional_user
from app.models.user import User, UserRole

router = APIRouter(prefix="/properties", tags=["properties"])

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20MB por imagem
ALLOWED_MIME_PREFIX = "image/"

# Configurações de otimização de imagens
IMAGE_SIZES = {
    "thumbnail": (300, 300),      # Miniaturas para listagens
    "medium": (800, 800),          # Visualização em cards
    "large": (1920, 1920),         # Visualização detalhada
}
IMAGE_QUALITY = 85  # Qualidade JPEG/WebP (0-100)

# Cache para watermark (evita carregar de URL a cada imagem)
_watermark_cache = {
    "image": None,
    "url": None,
    "settings": None
}


def get_watermark_settings(db: Session) -> Optional[dict]:
    """
    Obtém configurações de watermark da base de dados.
    Retorna None se watermark não estiver configurado/ativado.
    """
    try:
        from app.models.crm_settings import CRMSettings
        settings = db.query(CRMSettings).first()
        
        if not settings or not settings.watermark_enabled or not settings.watermark_image_url:
            return None
        
        return {
            "url": settings.watermark_image_url,
            "opacity": settings.watermark_opacity,
            "scale": settings.watermark_scale,
            "position": settings.watermark_position
        }
    except Exception as e:
        print(f"[Watermark] Erro ao obter settings: {e}")
        return None


def load_watermark_from_url(url: str) -> Optional[Image.Image]:
    """
    Carrega imagem de watermark a partir de URL (Cloudinary).
    Usa cache para evitar downloads repetidos.
    """
    global _watermark_cache
    
    # Verificar cache
    if _watermark_cache["url"] == url and _watermark_cache["image"] is not None:
        return _watermark_cache["image"].copy()
    
    try:
        print(f"[Watermark] Carregando de URL: {url}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        watermark = Image.open(io.BytesIO(response.content)).convert("RGBA")
        
        # Atualizar cache
        _watermark_cache["url"] = url
        _watermark_cache["image"] = watermark
        
        return watermark.copy()
        
    except Exception as e:
        print(f"[Watermark] Erro ao carregar de URL: {e}")
        return None


def apply_watermark(img: Image.Image, db: Session = None) -> Image.Image:
    """
    Aplica marca d'água com logo da agência na imagem.
    Usa configurações dinâmicas da base de dados.
    
    Args:
        img: Imagem PIL
        db: Sessão da base de dados (para obter settings)
    
    Returns:
        Imagem com marca d'água aplicada (ou original se watermark desativado)
    """
    try:
        # Obter configurações
        if db is None:
            print("[Watermark] Sem sessão DB, não aplicar watermark")
            return img
        
        settings = get_watermark_settings(db)
        if settings is None:
            print("[Watermark] Watermark desativado ou não configurado")
            return img
        
        # Carregar watermark de URL
        watermark = load_watermark_from_url(settings["url"])
        if watermark is None:
            return img
        
        # Calcular tamanho proporcional do watermark
        img_width, img_height = img.size
        wm_scale = settings["scale"]  # Ex: 0.15 = 15%
        wm_width = int(img_width * wm_scale)
        wm_ratio = watermark.size[0] / watermark.size[1]
        wm_height = int(wm_width / wm_ratio)
        
        # Redimensionar watermark
        watermark = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
        
        # Ajustar opacidade
        opacity = settings["opacity"]  # Ex: 0.6 = 60%
        alpha = watermark.split()[3]
        alpha = Image.eval(alpha, lambda a: int(a * opacity))
        watermark.putalpha(alpha)
        
        # Criar camada para watermark
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        
        # Calcular posição baseado na configuração
        margin = 20
        position_name = settings["position"]
        
        if position_name == "bottom-right":
            position = (img_width - wm_width - margin, img_height - wm_height - margin)
        elif position_name == "bottom-left":
            position = (margin, img_height - wm_height - margin)
        elif position_name == "top-right":
            position = (img_width - wm_width - margin, margin)
        elif position_name == "top-left":
            position = (margin, margin)
        elif position_name == "center":
            position = ((img_width - wm_width) // 2, (img_height - wm_height) // 2)
        else:
            position = (img_width - wm_width - margin, img_height - wm_height - margin)
        
        layer.paste(watermark, position)
        
        # Converter imagem para RGBA e aplicar watermark
        img_rgba = img.convert('RGBA')
        img_with_wm = Image.alpha_composite(img_rgba, layer)
        
        # Converter de volta para RGB
        final = Image.new('RGB', img_with_wm.size, (255, 255, 255))
        final.paste(img_with_wm, mask=img_with_wm.split()[3])
        
        print(f"[Watermark] Aplicado com sucesso (opacity={opacity}, scale={wm_scale}, pos={position_name})")
        return final
        
    except Exception as e:
        # Se houver erro, retornar imagem original sem watermark
        print(f"Aviso: Não foi possível aplicar marca d'água: {e}")
        return img


def optimize_image(image_bytes: bytes, filename: str, size_name: str = "large", db: Session = None) -> tuple[bytes, str]:
    """
    Redimensiona e otimiza imagem para web com marca d'água automática.
    
    Args:
        image_bytes: Bytes da imagem original
        filename: Nome do arquivo original
        size_name: Tamanho desejado (thumbnail, medium, large)
        db: Sessão da base de dados (para obter settings de watermark)
    
    Returns:
        Tuple com (bytes otimizados, extensão do arquivo)
    """
    # Abrir imagem
    img = Image.open(io.BytesIO(image_bytes))
    
    # Converter RGBA para RGB se necessário (para JPEG)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = background
    
    # Obter dimensões máximas
    max_width, max_height = IMAGE_SIZES.get(size_name, IMAGE_SIZES["large"])
    
    # Redimensionar mantendo proporção
    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    
    # Aplicar marca d'água (exceto em thumbnails muito pequenos)
    if size_name in ["medium", "large"]:
        img = apply_watermark(img, db=db)
    
    # Salvar otimizado em memória
    output = io.BytesIO()
    
    # Usar WebP para melhor compressão (suportado por todos browsers modernos)
    img.save(output, format='WebP', quality=IMAGE_QUALITY, method=6)
    
    return output.getvalue(), '.webp'


def optimize_video(input_path: str, output_path: str) -> tuple[bool, str, float]:
    """
    Comprime e otimiza vídeo para web usando FFmpeg.
    
    Configurações de otimização:
    - Codec: H.264 (compatível com todos browsers)
    - Resolução: Máx 1920x1080 (Full HD)
    - Bitrate: 2Mbps (boa qualidade, tamanho reduzido)
    - Audio: AAC 128kbps
    - FPS: Máx 30fps
    
    Args:
        input_path: Caminho do vídeo original
        output_path: Caminho para salvar vídeo otimizado
    
    Returns:
        Tuple (sucesso: bool, mensagem: str, tamanho_mb: float)
    """
    import subprocess
    import shutil
    
    # Verificar se FFmpeg está instalado
    if not shutil.which('ffmpeg'):
        return False, "FFmpeg não instalado no servidor", 0.0
    
    try:
        # Comando FFmpeg para compressão otimizada
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-c:v', 'libx264',              # Codec de vídeo H.264
            '-preset', 'medium',             # Preset de compressão (fast/medium/slow)
            '-crf', '23',                    # Quality (18=alta, 23=boa, 28=média)
            '-maxrate', '2M',                # Bitrate máximo 2Mbps
            '-bufsize', '4M',                # Buffer size
            '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease',  # Max Full HD
            '-r', '30',                      # Limitar a 30 FPS
            '-c:a', 'aac',                   # Codec de áudio AAC
            '-b:a', '128k',                  # Áudio 128kbps
            '-movflags', '+faststart',       # Otimizar para streaming web
            '-y',                            # Sobrescrever sem perguntar
            output_path
        ]
        
        # Executar FFmpeg
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=300  # Timeout 5 minutos
        )
        
        if result.returncode != 0:
            error_msg = result.stderr.decode('utf-8', errors='ignore')
            return False, f"Erro FFmpeg: {error_msg[:200]}", 0.0
        
        # Verificar tamanho do arquivo otimizado
        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            original_size_mb = os.path.getsize(input_path) / (1024 * 1024)
            reduction = ((original_size_mb - size_mb) / original_size_mb) * 100
            
            return True, f"Comprimido {reduction:.1f}% (de {original_size_mb:.1f}MB para {size_mb:.1f}MB)", size_mb
        else:
            return False, "Arquivo otimizado não foi criado", 0.0
            
    except subprocess.TimeoutExpired:
        return False, "Timeout: vídeo muito longo (>5min)", 0.0
    except Exception as e:
        return False, f"Erro ao comprimir: {str(e)}", 0.0


@router.get("/", response_model=list[schemas.PropertyOut])
def list_properties(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: str | None = None,
    is_published: int | None = None,
    agent_id: int | None = None,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Listar propriedades.
    
    Comportamento por tipo de acesso:
    - Sem autenticação (site público): apenas imóveis publicados (is_published=1)
    - Agent autenticado: apenas os seus imóveis
    - Admin/Staff/Leader: todos os imóveis
    """
    # Perfis com permissão total
    privileged_roles = {UserRole.ADMIN.value, "staff", "leader", UserRole.COORDINATOR.value}
    
    if current_user is None:
        # Acesso público - apenas imóveis publicados
        is_published = 1
    elif current_user.role in privileged_roles:
        # Admin/Staff - pode ver todos
        pass
    else:
        # Agente - só vê os seus imóveis
        if not current_user.agent_id:
            raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
        agent_id = current_user.agent_id
    
    return services.get_properties(
        db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        is_published=is_published,
        agent_id=agent_id,
    )


@router.get("/{property_id}", response_model=schemas.PropertyOut)
def get_property(
    property_id: int, 
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de uma propriedade.
    
    Comportamento por tipo de acesso:
    - Sem autenticação: apenas se imóvel estiver publicado
    - Agent autenticado: apenas se for o seu imóvel
    - Admin/Staff/Leader: qualquer imóvel
    """
    property = services.get_property(db, property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    privileged_roles = {UserRole.ADMIN.value, "staff", "leader", UserRole.COORDINATOR.value}
    
    if current_user is None:
        # Acesso público - apenas se publicado
        if property.is_published != 1:
            raise HTTPException(status_code=404, detail="Property not found")
    elif current_user.role in privileged_roles:
        # Admin/Staff - pode ver qualquer imóvel
        pass
    else:
        # Agente - só pode ver os seus
        if property.agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Não tem permissão para ver este imóvel")
    
    return property


@router.post("/", response_model=schemas.PropertyOut, status_code=201)
def create_property(
    property: schemas.PropertyCreate,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    return services.create_property(db, property)


@router.put("/{property_id}", response_model=schemas.PropertyOut)
def update_property(
    property_id: int,
    property_update: schemas.PropertyUpdate,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    property = services.update_property(db, property_id, property_update)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property


@router.delete("/{property_id}", response_model=schemas.PropertyOut)
def delete_property(
    property_id: int,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    property = services.delete_property(db, property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property


@router.post("/{property_id}/upload")
async def upload_property_images(
    property_id: int,
    files: List[UploadFile] = File(...),
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """
    Upload de imagens para propriedade usando storage persistente (Cloudinary).
    
    Suporta múltiplos arquivos. Cria versões otimizadas automaticamente.
    Storage configurável via ENV (ver app/core/storage.py).
    """
    property_obj = services.get_property(db, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    urls = property_obj.images or []
    
    for upload in files:
        if not upload.content_type or not upload.content_type.startswith(ALLOWED_MIME_PREFIX):
            raise HTTPException(status_code=415, detail="Tipo de ficheiro não suportado (apenas imagens)")

        content = await upload.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail=f"Ficheiro excede o limite de {MAX_UPLOAD_BYTES // (1024*1024)}MB")

        try:
            # Otimizar e redimensionar imagem automaticamente
            # Criar 3 versões: thumbnail, medium, large
            base_name = os.path.splitext(upload.filename)[0]
            
            saved_urls = []
            for size_name in ["thumbnail", "medium", "large"]:
                optimized_bytes, ext = optimize_image(content, upload.filename, size_name, db=db)
                
                # Nome do arquivo: original_thumbnail.webp, original_medium.webp, etc.
                filename = f"{base_name}_{size_name}{ext}"
                
                # Upload para storage persistente (Cloudinary/S3/etc)
                from io import BytesIO
                file_obj = BytesIO(optimized_bytes)
                
                print(f"[Upload] Uploading {filename} to folder properties/{property_id}")
                url = await storage.upload_file(
                    file=file_obj,
                    folder=f"properties/{property_id}",
                    filename=filename,
                    public=True
                )
                print(f"[Upload] Success! URL: {url}")
                
                saved_urls.append(url)
            
            # Adicionar apenas a versão 'large' ao array principal (compatibilidade)
            # As outras versões ficam disponíveis com sufixo (_thumbnail, _medium)
            urls.append(saved_urls[2])  # large
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")

    services.update_property(
        db,
        property_id,
        schemas.PropertyUpdate(images=urls),
    )
    return JSONResponse({
        "uploaded": len(files), 
        "urls": urls,
        "message": f"{len(files)} imagem(ns) otimizada(s) e salva(s) em 3 tamanhos (thumbnail, medium, large)"
    })


@router.post("/{property_id}/upload-video")
async def upload_property_video(
    property_id: int,
    file: UploadFile = File(...),
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Upload e compressão automática de vídeo promocional para uma propriedade"""
    property_obj = services.get_property(db, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    # Validar tipo de arquivo
    ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
    if not file.content_type or file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=415, 
            detail=f"Tipo de vídeo não suportado. Use: MP4, WebM ou MOV"
        )

    # Criar pasta para vídeos
    video_root = os.path.join("media", "videos")
    os.makedirs(video_root, exist_ok=True)

    # Gerar nomes únicos
    import time
    timestamp = int(time.time())
    temp_filename = f"temp_property_{property_id}_{timestamp}{os.path.splitext(file.filename)[1] or '.mp4'}"
    optimized_filename = f"property_{property_id}_{timestamp}.mp4"
    
    temp_path = os.path.join(video_root, temp_filename)
    optimized_path = os.path.join(video_root, optimized_filename)

    try:
        # 1. Salvar vídeo original temporariamente (streaming para não estourar memória)
        with open(temp_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB por chunk
                if not chunk:
                    break
                buffer.write(chunk)
        
        original_size_mb = os.path.getsize(temp_path) / (1024 * 1024)
        
        # 2. Tentar comprimir com FFmpeg
        success, message, final_size_mb = optimize_video(temp_path, optimized_path)
        
        if success:
            # Compressão bem-sucedida - usar vídeo otimizado
            os.remove(temp_path)  # Remover temporário
            video_url = f"/media/videos/{optimized_filename}"
            final_message = f"✅ Vídeo otimizado com sucesso! {message}"
        else:
            # FFmpeg falhou - manter original para não bloquear (com aviso)
            os.rename(temp_path, optimized_path)
            video_url = f"/media/videos/{optimized_filename}"
            final_size_mb = original_size_mb
            final_message = f"⚠️ Compressão falhou, vídeo original mantido ({original_size_mb:.1f}MB). Detalhe: {message}"
        
        # 3. Atualizar propriedade com video_url
        services.update_property(
            db,
            property_id,
            schemas.PropertyUpdate(video_url=video_url),
        )
        
        return JSONResponse({
            "video_url": video_url,
            "message": final_message,
            "original_size_mb": round(original_size_mb, 2),
            "final_size_mb": round(final_size_mb, 2),
        })
        
    except HTTPException:
        raise
    except Exception as e:
        # Limpar arquivos temporários em caso de erro
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(optimized_path):
            os.remove(optimized_path)
        raise HTTPException(status_code=500, detail=f"Erro ao processar vídeo: {str(e)}")


@router.get("/utils/next-reference/{agent_id}")
def get_next_reference(agent_id: int, db: Session = Depends(get_db)):
    """Retorna a próxima referência disponível para um agente específico"""
    from app.agents.models import Agent
    from app.properties.models import Property
    import re
    
    # Buscar agente
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    
    # Obter iniciais do agente (primeiras letras de cada nome)
    name_parts = agent.name.strip().split()
    if len(name_parts) >= 2:
        initials = (name_parts[0][0] + name_parts[-1][0]).upper()
    else:
        initials = name_parts[0][:2].upper()
    
    # Buscar todas as propriedades deste agente com esse padrão
    pattern = f"{initials}%"
    properties = db.query(Property).filter(
        Property.agent_id == agent_id,
        Property.reference.like(pattern)
    ).all()
    
    # Extrair números das referências
    max_number = 0
    for prop in properties:
        match = re.search(r'(\d+)$', prop.reference)
        if match:
            num = int(match.group(1))
            if num > max_number:
                max_number = num
    
    next_number = max_number + 1
    next_reference = f"{initials}{next_number}"
    
    return {
        "agent_id": agent_id,
        "agent_name": agent.name,
        "initials": initials,
        "last_number": max_number,
        "next_reference": next_reference
    }
