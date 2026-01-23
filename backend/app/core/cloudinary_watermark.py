"""
Cloudinary Watermark Transformation Utilities

Aplica watermarks dinamicamente usando transformações do Cloudinary.
CRÍTICO: Garante isolamento rigoroso por tenant - cada tenant usa
exclusivamente o SEU watermark identificado pelo public_id único.

Transformações Cloudinary:
- l_ (layer): overlay de imagem
- w_ (width): largura relativa (0.15 = 15%)
- g_ (gravity): posição (south_east, south_west, etc.)
- o_ (opacity): transparência (0-100)
- fl_layer_apply: aplica a camada

Exemplo de URL transformada:
https://res.cloudinary.com/cloud/image/upload/l_crm-plus:watermarks:tenant_slug:watermark,w_0.15,g_south_east,o_60,fl_layer_apply/v123/original_image.jpg
"""
import re
from typing import Optional, List, Dict
from urllib.parse import quote


def get_cloudinary_gravity(position: str) -> str:
    """
    Converte posição do watermark para gravity do Cloudinary.
    
    Args:
        position: bottom-right, bottom-left, top-right, top-left, center
        
    Returns:
        Cloudinary gravity: south_east, south_west, north_east, north_west, center
    """
    mapping = {
        "bottom-right": "south_east",
        "bottom-left": "south_west",
        "top-right": "north_east",
        "top-left": "north_west",
        "center": "center",
    }
    return mapping.get(position, "south_east")


def apply_watermark_to_url(
    image_url: str,
    watermark_public_id: str,
    scale: float = 0.15,
    opacity: float = 0.6,
    position: str = "bottom-right",
    padding: int = 20
) -> str:
    """
    Aplica watermark a uma URL do Cloudinary usando transformações.
    
    ISOLAMENTO TENANT: O watermark_public_id DEVE ser único por tenant
    (formato: crm-plus/watermarks/{tenant_slug}/watermark)
    
    Args:
        image_url: URL original do Cloudinary
        watermark_public_id: Public ID do watermark (específico do tenant!)
        scale: Escala relativa (0.15 = 15% da largura)
        opacity: Opacidade (0.0-1.0)
        position: Posição do watermark
        padding: Margem em pixels
        
    Returns:
        URL com transformação de watermark aplicada
    """
    if not image_url or not watermark_public_id:
        return image_url
    
    # Verificar se é URL do Cloudinary
    if "cloudinary.com" not in image_url and "res.cloudinary" not in image_url:
        print(f"[Watermark] URL não é do Cloudinary, ignorando: {image_url[:50]}...")
        return image_url
    
    # Se já tem transformação de watermark/overlay, não aplicar novamente
    if "l_crm-plus" in image_url:
        print(f"[Watermark] URL já tem watermark aplicado, ignorando")
        return image_url
    
    try:
        # Converter public_id para formato de layer (/ -> :)
        # Ex: crm-plus/watermarks/imoveismais/watermark -> crm-plus:watermarks:imoveismais:watermark
        # Ex: crm-plus/crm-settings/watermark -> crm-plus:crm-settings:watermark
        layer_id = watermark_public_id.replace("/", ":")
        
        print(f"[Watermark] Transformando URL com layer_id: {layer_id}")
        
        # Converter para percentagem (Cloudinary usa 0-100 para opacity)
        opacity_percent = int(opacity * 100)
        
        # Converter scale para width relativa (Cloudinary usa 0.0-1.0)
        # Usamos w_ com fl_relative para largura relativa à imagem base
        width_relative = scale
        
        # Obter gravity
        gravity = get_cloudinary_gravity(position)
        
        # Construir transformação de overlay
        # Formato: l_{public_id},w_{scale},g_{gravity},o_{opacity},x_{padding},y_{padding},fl_relative,fl_layer_apply
        overlay_transform = f"l_{layer_id},w_{width_relative},g_{gravity},o_{opacity_percent},x_{padding},y_{padding},fl_relative,fl_layer_apply"
        
        # Inserir transformação na URL
        # URL típica: https://res.cloudinary.com/{cloud}/image/upload/v123/path/image.jpg
        # Queremos:   https://res.cloudinary.com/{cloud}/image/upload/{transform}/v123/path/image.jpg
        
        # Padrão: encontrar /upload/ ou /image/upload/
        match = re.search(r'(https://res\.cloudinary\.com/[^/]+/image/upload/)(v\d+/)?(.+)', image_url)
        
        if match:
            base = match.group(1)
            version = match.group(2) or ""
            path = match.group(3)
            
            # Construir nova URL com transformação
            new_url = f"{base}{overlay_transform}/{version}{path}"
            return new_url
        
        # Fallback: tentar outro padrão (sem /image/)
        match2 = re.search(r'(https://res\.cloudinary\.com/[^/]+/)([^/]+/upload/)(v\d+/)?(.+)', image_url)
        if match2:
            base = match2.group(1) + match2.group(2)
            version = match2.group(3) or ""
            path = match2.group(4)
            new_url = f"{base}{overlay_transform}/{version}{path}"
            return new_url
        
        print(f"[Watermark] Não foi possível parsear URL: {image_url[:80]}...")
        return image_url
        
    except Exception as e:
        print(f"[Watermark] Erro ao aplicar transformação: {e}")
        return image_url


def apply_watermark_to_images(
    images: Optional[List[str]],
    watermark_settings: Optional[Dict]
) -> Optional[List[str]]:
    """
    Aplica watermark a uma lista de URLs de imagens.
    
    ISOLAMENTO TENANT: watermark_settings DEVE conter o public_id específico do tenant.
    
    Args:
        images: Lista de URLs de imagens
        watermark_settings: Dict com:
            - enabled: bool
            - public_id: str (CRÍTICO: deve ser único por tenant!)
            - scale: float (0.0-1.0)
            - opacity: float (0.0-1.0)
            - position: str
            
    Returns:
        Lista de URLs com watermark aplicado (ou original se desativado)
    """
    if not images:
        return images
    
    if not watermark_settings:
        return images
    
    if not watermark_settings.get("enabled"):
        return images
    
    public_id = watermark_settings.get("public_id")
    if not public_id:
        print("[Watermark] Sem public_id configurado, retornando imagens originais")
        return images
    
    # Log para auditoria de segurança
    print(f"[Watermark] Aplicando watermark '{public_id}' a {len(images)} imagens")
    
    result = []
    for img_url in images:
        transformed = apply_watermark_to_url(
            image_url=img_url,
            watermark_public_id=public_id,
            scale=watermark_settings.get("scale", 0.15),
            opacity=watermark_settings.get("opacity", 0.6),
            position=watermark_settings.get("position", "bottom-right")
        )
        result.append(transformed)
    
    return result


def get_watermark_settings_for_response(db_session) -> Optional[Dict]:
    """
    Obtém configurações de watermark do tenant atual para uso em respostas.
    
    IMPORTANTE: Esta função usa a sessão DB que já tem o search_path
    definido para o tenant correto, garantindo isolamento.
    
    Args:
        db_session: Sessão SQLAlchemy (já com search_path do tenant)
        
    Returns:
        Dict com configurações ou None se desativado/não configurado
    """
    try:
        from app.models.crm_settings import CRMSettings
        from app.database import get_tenant_schema, DEFAULT_SCHEMA
        
        settings = db_session.query(CRMSettings).first()
        
        if not settings:
            print("[Watermark] Sem settings na DB")
            return None
        
        if not settings.watermark_enabled:
            print("[Watermark] Watermark desativado")
            return None
        
        if not settings.watermark_image_url:
            print("[Watermark] Sem URL de watermark configurado")
            return None
        
        # Obter public_id - pode estar guardado ou precisamos extrair da URL
        public_id = settings.watermark_public_id
        
        if not public_id:
            # FALLBACK: Tentar extrair public_id da URL existente
            # URL típica: https://res.cloudinary.com/xxx/image/upload/v123/crm-plus/crm-settings/watermark.png
            # Ou com tenant: https://res.cloudinary.com/xxx/image/upload/v123/crm-plus/watermarks/tenant/watermark.png
            url = settings.watermark_image_url
            print(f"[Watermark] Tentando extrair public_id de URL: {url}")
            
            if "cloudinary.com" in url and "crm-plus" in url:
                # Extrair path após "upload/vXXX/" ou "upload/"
                import re
                match = re.search(r'/upload/(?:v\d+/)?(crm-plus/.+?)(?:\.[^.]+)?$', url)
                if match:
                    public_id = match.group(1)
                    print(f"[Watermark] Extraído public_id: {public_id}")
            
            # Se ainda não temos, gerar baseado no tenant atual
            if not public_id:
                schema = get_tenant_schema()
                if schema and schema != DEFAULT_SCHEMA:
                    tenant_slug = schema.replace("tenant_", "") if schema.startswith("tenant_") else schema
                else:
                    tenant_slug = "default"
                
                # Tentar formato antigo (crm-settings)
                public_id = "crm-plus/crm-settings/watermark"
                print(f"[Watermark] Usando public_id fallback: {public_id}")
        
        print(f"[Watermark] Usando public_id final: {public_id}")
        
        return {
            "enabled": bool(settings.watermark_enabled),
            "public_id": public_id,
            "url": settings.watermark_image_url,
            "scale": settings.watermark_scale or 0.15,
            "opacity": settings.watermark_opacity or 0.6,
            "position": settings.watermark_position or "bottom-right"
        }
        
    except Exception as e:
        print(f"[Watermark] Erro ao obter settings: {e}")
        import traceback
        traceback.print_exc()
        return None
