"""
Auto-atribuição de agentes baseada no prefixo da referência da propriedade.
Sistema automático que garante que propriedades sejam sempre atribuídas ao agente correto.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text

# Mapeamento completo: Prefixo → Agent ID
AGENT_PREFIX_MAP = {
    "AS": 24,  # António Silva
    "HB": 25,  # Hugo Belo
    "BL": 26,  # Bruno Libânio
    "NN": 27,  # Nélson Neto
    "JP": 28,  # João Paiva (decidido: JP fica com João Paiva, João Pereira usará JPE)
    "MB": 29,  # Marisa Barosa
    "EC": 30,  # Eduardo Coelho
    "JS": 31,  # João Silva
    "HM": 32,  # Hugo Mota
    "JPE": 33,  # João Pereira (novo prefixo para resolver conflito)
    "JC": 34,  # João Carvalho
    "TV": 35,  # Tiago Vindima
    "MS": 36,  # Mickael Soares
    "PR": 37,  # Paulo Rodrigues
    "IL": 38,  # Imóveis Mais Leiria
    "NF": 39,  # Nuno Faria
    "PO": 40,  # Pedro Olaio
    "JO": 41,  # João Olaio
    "FA": 42,  # Fábio Passos (usa FA, não FP)
}

# Prefixos órfãos (sem agente correspondente) - atribuir ao coordenador geral
# FP = agente antigo que saiu, propriedades já redistribuídas manualmente
ORPHAN_PREFIXES = ["CB", "FP", "HA", "JR", "RC", "SC"]
DEFAULT_AGENT_ID = 35  # Tiago Vindima (coordenador) para propriedades órfãs


def get_agent_id_from_reference(reference: str) -> int | None:
    """
    Determina o agent_id correto baseado no prefixo da referência.
    
    Args:
        reference: Referência da propriedade (ex: "PR1234", "TV5678")
    
    Returns:
        Agent ID correspondente ou None se não encontrar
    
    Examples:
        >>> get_agent_id_from_reference("PR1234")
        37  # Paulo Rodrigues
        
        >>> get_agent_id_from_reference("TV5678")
        35  # Tiago Vindima
        
        >>> get_agent_id_from_reference("CB9999")
        35  # Órfão → Tiago Vindima
    """
    if not reference or len(reference) < 2:
        return None
    
    # Extrair prefixo (primeiras 2-3 letras antes dos números)
    prefix = ""
    for char in reference:
        if char.isalpha():
            prefix += char.upper()
        else:
            break
    
    if not prefix:
        return None
    
    # Tentar match com 3 letras primeiro (JPE)
    if len(prefix) >= 3 and prefix[:3] in AGENT_PREFIX_MAP:
        return AGENT_PREFIX_MAP[prefix[:3]]
    
    # Tentar match com 2 letras
    if len(prefix) >= 2 and prefix[:2] in AGENT_PREFIX_MAP:
        return AGENT_PREFIX_MAP[prefix[:2]]
    
    # Propriedade órfã → atribuir ao coordenador
    if prefix[:2] in ORPHAN_PREFIXES:
        return DEFAULT_AGENT_ID
    
    return None


def auto_assign_agent(db: Session, property_id: int, reference: str) -> bool:
    """
    Atribui automaticamente o agente correto a uma propriedade baseado na referência.
    
    Args:
        db: Sessão do banco de dados
        property_id: ID da propriedade
        reference: Referência da propriedade
    
    Returns:
        True se atribuiu com sucesso, False caso contrário
    """
    agent_id = get_agent_id_from_reference(reference)
    
    if agent_id is None:
        return False
    
    # Atualizar agent_id da propriedade
    db.execute(
        text("UPDATE properties SET agent_id = :agent_id WHERE id = :property_id"),
        {"agent_id": agent_id, "property_id": property_id}
    )
    db.commit()
    
    return True


def fix_all_agent_assignments(db: Session) -> dict:
    """
    Corrige TODAS as atribuições de agentes na database baseado nos prefixos.
    Executa em uma única transação para garantir consistência.
    
    Returns:
        Dicionário com estatísticas da correção
    """
    results = {
        "total_properties": 0,
        "updated": 0,
        "orphaned": 0,
        "skipped": 0,
        "errors": [],
        "by_agent": {}
    }
    
    try:
        # Buscar todas as propriedades
        props = db.execute(text("SELECT id, reference, agent_id FROM properties")).fetchall()
        results["total_properties"] = len(props)
        
        for prop in props:
            prop_id, reference, current_agent_id = prop
            
            if not reference:
                results["skipped"] += 1
                continue
            
            # Determinar agent_id correto
            correct_agent_id = get_agent_id_from_reference(reference)
            
            if correct_agent_id is None:
                results["skipped"] += 1
                continue
            
            # Verificar se é órfão
            prefix = reference[:2].upper()
            if prefix in ORPHAN_PREFIXES:
                results["orphaned"] += 1
            
            # Atualizar se diferente
            if current_agent_id != correct_agent_id:
                db.execute(
                    text("UPDATE properties SET agent_id = :agent_id WHERE id = :id"),
                    {"agent_id": correct_agent_id, "id": prop_id}
                )
                results["updated"] += 1
                
                # Contar por agente
                results["by_agent"][correct_agent_id] = results["by_agent"].get(correct_agent_id, 0) + 1
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        results["errors"].append(str(e))
    
    return results


def validate_agent_assignments(db: Session) -> list[dict]:
    """
    Valida se todas as propriedades estão corretamente atribuídas.
    
    Returns:
        Lista de propriedades com atribuição incorreta
    """
    issues = []
    
    props = db.execute(text("SELECT id, reference, agent_id FROM properties WHERE agent_id IS NOT NULL")).fetchall()
    
    for prop_id, reference, agent_id in props:
        if not reference:
            continue
        
        correct_agent_id = get_agent_id_from_reference(reference)
        
        if correct_agent_id and agent_id != correct_agent_id:
            issues.append({
                "property_id": prop_id,
                "reference": reference,
                "current_agent_id": agent_id,
                "correct_agent_id": correct_agent_id,
                "prefix": reference[:2].upper()
            })
    
    return issues
