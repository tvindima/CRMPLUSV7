"""
Structured JSON Logging para produção
Facilita parsing de logs em sistemas de monitorização (Railway logs, etc)
"""
import logging
import json
from datetime import datetime
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """
    Formata logs como JSON estruturado
    
    Formato:
    {
        "timestamp": "2024-01-22T10:30:00.000Z",
        "level": "INFO",
        "logger": "app.mobile.routes",
        "message": "Lead criado com sucesso",
        "context": {"lead_id": 123, "agent_id": 5}
    }
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Adicionar contexto extra (se existir)
        if hasattr(record, "context"):
            log_data["context"] = record.context
        
        # Adicionar exception info (se existir)
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Adicionar request_id (se existir - útil para tracing)
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(log_level: str = "INFO"):
    """
    Configura logging estruturado para toda a aplicação
    
    Args:
        log_level: "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"
    """
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remover handlers existentes
    root_logger.handlers.clear()
    
    # Console handler com JSON formatter
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)
    
    # Silenciar logs verbose de libs externas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def log_with_context(logger: logging.Logger, level: str, message: str, context: Dict[str, Any] = None):
    """
    Helper para logar com contexto estruturado
    
    Uso:
        from app.core.logging import log_with_context
        import logging
        
        logger = logging.getLogger(__name__)
        log_with_context(logger, "info", "Lead criado", {"lead_id": 123, "agent_id": 5})
    """
    extra = {"context": context} if context else {}
    
    log_func = getattr(logger, level.lower())
    log_func(message, extra=extra)
