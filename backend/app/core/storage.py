"""
Storage abstraction layer - facilita migração entre provedores.

Suporta:
- Cloudinary (atual)
- AWS S3 (futuro)
- Local filesystem (dev)

Para migrar: trocar STORAGE_PROVIDER em .env e implementar novo adapter.
"""
import os
import re
from abc import ABC, abstractmethod
from typing import Optional, BinaryIO
import tempfile
from pathlib import Path


class StorageProvider(ABC):
    """Interface abstrata para storage providers"""
    
    @abstractmethod
    async def upload_file(
        self, 
        file: BinaryIO, 
        folder: str, 
        filename: str,
        public: bool = True
    ) -> str:
        """
        Upload arquivo e retorna URL pública
        
        Args:
            file: Arquivo binário
            folder: Pasta/namespace (ex: 'properties/123')
            filename: Nome do arquivo
            public: Se deve ser acessível publicamente
            
        Returns:
            URL pública do arquivo
        """
        pass
    
    @abstractmethod
    async def delete_file(self, url: str) -> bool:
        """Deleta arquivo pela URL"""
        pass
    
    @abstractmethod
    def get_public_url(self, path: str) -> str:
        """Converte path interno para URL pública"""
        pass


class CloudinaryStorage(StorageProvider):
    """Implementação Cloudinary - storage persistente com CDN"""
    
    def __init__(self):
        import cloudinary
        import cloudinary.uploader
        
        self.cloudinary = cloudinary
        
        # Configurar Cloudinary via ENV vars
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True
        )
        
        # Log de configuração (sem raise para evitar crash)
        if not all([
            os.getenv("CLOUDINARY_CLOUD_NAME"),
            os.getenv("CLOUDINARY_API_KEY"),
            os.getenv("CLOUDINARY_API_SECRET")
        ]):
            print("[CloudinaryStorage] ⚠️ Configuração incompleta - alguns uploads podem falhar")
    
    async def upload_file(
        self, 
        file: BinaryIO, 
        folder: str, 
        filename: str,
        public: bool = True
    ) -> str:
        """Upload para Cloudinary"""
        import cloudinary.uploader
        
        # Isolamento por tenant para impedir overwrite/cross-tenant de assets
        tenant_namespace = _get_tenant_storage_namespace()
        folder_clean = str(folder or "").strip("/")
        if folder_clean:
            public_id = f"crm-plus/{tenant_namespace}/{folder_clean}/{Path(filename).stem}"
        else:
            public_id = f"crm-plus/{tenant_namespace}/{Path(filename).stem}"
        
        print(f"[Cloudinary] Uploading to public_id: {public_id}")
        
        try:
            result = cloudinary.uploader.upload(
                file,
                public_id=public_id,
                resource_type="auto",  # Detecta tipo automaticamente
                overwrite=True,
                invalidate=True,  # Limpa cache CDN
            )
            
            print(f"[Cloudinary] Upload successful: {result.get('secure_url')}")
            return result["secure_url"]
        except Exception as e:
            print(f"[Cloudinary] Upload failed: {str(e)}")
            raise
    
    async def delete_file(self, url: str) -> bool:
        """Deleta do Cloudinary pela URL"""
        import cloudinary.uploader
        
        try:
            # Extrair public_id da URL
            # Ex: https://res.cloudinary.com/{cloud}/image/upload/v123/crm-plus/properties/123/foto.jpg
            parts = url.split("/")
            
            # Encontrar índice 'crm-plus' e pegar resto do path
            if "crm-plus" in parts:
                idx = parts.index("crm-plus")
                public_id_parts = parts[idx:]
                
                # Remover extensão do último elemento
                public_id_parts[-1] = Path(public_id_parts[-1]).stem
                
                public_id = "/".join(public_id_parts)
                
                cloudinary.uploader.destroy(public_id)
                return True
            
            return False
        except Exception as e:
            print(f"[Cloudinary] Erro ao deletar {url}: {e}")
            return False
    
    def get_public_url(self, path: str) -> str:
        """Cloudinary já retorna URLs públicas no upload"""
        return path


class S3Storage(StorageProvider):
    """Implementação AWS S3 - para migração futura"""
    
    def __init__(self):
        # TODO: Implementar quando migrar
        raise NotImplementedError(
            "S3Storage ainda não implementado. "
            "Ver MIGRATION_GUIDE.md para instruções."
        )
    
    async def upload_file(self, file: BinaryIO, folder: str, filename: str, public: bool = True) -> str:
        raise NotImplementedError()
    
    async def delete_file(self, url: str) -> bool:
        raise NotImplementedError()
    
    def get_public_url(self, path: str) -> str:
        raise NotImplementedError()


class LocalStorage(StorageProvider):
    """Storage local - apenas para desenvolvimento"""
    
    def __init__(self):
        self.base_path = Path("media")
        self.base_path.mkdir(exist_ok=True)
        self.base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    async def upload_file(
        self, 
        file: BinaryIO, 
        folder: str, 
        filename: str,
        public: bool = True
    ) -> str:
        """Salva no filesystem local"""
        tenant_namespace = _get_tenant_storage_namespace()
        folder_path = self.base_path / tenant_namespace / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        file_path = folder_path / filename
        
        with open(file_path, "wb") as f:
            f.write(file.read())
        
        return f"{self.base_url}/media/{folder}/{filename}"
    
    async def delete_file(self, url: str) -> bool:
        """Deleta arquivo local"""
        try:
            # Extrair path da URL
            path = url.replace(f"{self.base_url}/media/", "")
            file_path = self.base_path / path
            
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"[LocalStorage] Erro ao deletar {url}: {e}")
            return False
    
    def get_public_url(self, path: str) -> str:
        return path


# Factory para criar storage provider baseado em ENV
def get_storage_provider() -> StorageProvider:
    """
    Retorna storage provider configurado.
    
    Configuração via ENV:
        STORAGE_PROVIDER=cloudinary (default)
        STORAGE_PROVIDER=s3
        STORAGE_PROVIDER=local (dev only)
    """
    provider = os.getenv("STORAGE_PROVIDER", "cloudinary").lower()
    
    if provider == "cloudinary":
        # Verificar se Cloudinary está configurado antes de instanciar
        if all([
            os.getenv("CLOUDINARY_CLOUD_NAME"),
            os.getenv("CLOUDINARY_API_KEY"),
            os.getenv("CLOUDINARY_API_SECRET")
        ]):
            return CloudinaryStorage()
        else:
            print("[Storage] ⚠️ Cloudinary não configurado, usando LocalStorage como fallback")
            return LocalStorage()
    elif provider == "s3":
        return S3Storage()
    elif provider == "local":
        return LocalStorage()
    else:
        raise ValueError(
            f"Storage provider inválido: {provider}. "
            f"Opções: cloudinary, s3, local"
        )


def _sanitize_path_fragment(value: str) -> str:
    """Normaliza fragmento de path para uso seguro em namespace de storage."""
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", (value or "").strip().lower())
    return cleaned.strip("-") or "tenant"


def _get_tenant_storage_namespace() -> str:
    """
    Retorna namespace de storage por tenant.
    - tenant_<slug> -> <slug>
    - public/None -> platform
    """
    try:
        from app.database import get_tenant_schema

        schema = get_tenant_schema()
        if not schema or schema == "public":
            return "platform"

        if schema.startswith("tenant_"):
            return _sanitize_path_fragment(schema[7:])

        return _sanitize_path_fragment(schema)
    except Exception:
        return "platform"


# Singleton global (importar este objeto)
storage = get_storage_provider()
