"""
Custom Exceptions para tratamento de erros padronizado
Permite frontend receber mensagens consistentes e user-friendly
"""
from fastapi import HTTPException


class BusinessRuleError(HTTPException):
    """
    Erro de regra de negócio
    Ex: "Não pode deletar lead com visitas agendadas"
    
    Status: 400 Bad Request
    """
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)


class ResourceNotFoundError(HTTPException):
    """
    Recurso não encontrado
    Ex: "Propriedade com ID 123 não encontrada"
    
    Status: 404 Not Found
    """
    def __init__(self, resource: str, resource_id: int = None):
        detail = f"{resource} não encontrada"
        if resource_id:
            detail = f"{resource} com ID {resource_id} não encontrada"
        
        super().__init__(status_code=404, detail=detail)


class UnauthorizedError(HTTPException):
    """
    Falta de autorização
    Ex: "Agente não tem permissão para editar esta propriedade"
    
    Status: 403 Forbidden
    """
    def __init__(self, detail: str = "Não tem permissão para esta ação"):
        super().__init__(status_code=403, detail=detail)


class ConflictError(HTTPException):
    """
    Conflito de dados (ex: duplicados)
    Ex: "Email já está em uso"
    
    Status: 409 Conflict
    """
    def __init__(self, detail: str):
        super().__init__(status_code=409, detail=detail)


class ValidationError(HTTPException):
    """
    Erro de validação de dados
    Ex: "Data de visita não pode ser no passado"
    
    Status: 422 Unprocessable Entity
    """
    def __init__(self, detail: str):
        super().__init__(status_code=422, detail=detail)


class ExternalServiceError(HTTPException):
    """
    Erro de serviço externo (Cloudinary, etc)
    Ex: "Falha no upload para Cloudinary"
    
    Status: 503 Service Unavailable
    """
    def __init__(self, service: str, detail: str = None):
        message = f"Serviço {service} indisponível"
        if detail:
            message = f"{message}: {detail}"
        
        super().__init__(status_code=503, detail=message)
