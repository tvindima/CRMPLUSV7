"""
Endpoint para corrigir as atribuições de properties aos agentes
baseado no prefixo da referência.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/fix-properties", tags=["Admin"])

# Mapeamento de prefixos para agent_id
# Baseado no site oficial www.imoveismais.pt/leiria
PREFIX_TO_AGENT = {
    # Agentes ativos
    "TV": 16,  # Tiago Vindima
    "JV": 16,  # Ex-agente, atribuído a Tiago Vindima  
    "ES": 16,  # Ex-agente, atribuído a Tiago Vindima
    "HM": 13,  # Hugo Mota
    "MS": 17,  # Mickael Soares
    "BL": 7,   # Bruno Libânio
    "JO": 3,   # João Olaio
    "JS": 12,  # João Silva
    "HB": 6,   # Hugo Belo
    "NN": 8,   # Nélson Neto
    "MB": 10,  # Marisa Barosa
    "JR": 9,   # João Paiva (JR = João Rodrigues? / Paiva)
    "FP": 4,   # Fábio Passos
    "AS": 5,   # António Silva
    "PR": 18,  # Paulo Rodrigues
    "EC": 11,  # Eduardo Coelho
    "PO": 2,   # Pedro Olaio
    "NF": 1,   # Nuno Faria
    "JC": 15,  # João Carvalho
    "JP": 14,  # João Pereira
    # Ex-agentes - atribuídos ao coordenador (Imóveis Mais Leiria)
    "CB": 19,  # Ex-agente → Coordenador
    "HA": 19,  # Ex-agente → Coordenador  
    "RC": 19,  # Ex-agente → Coordenador
    "SC": 19,  # Ex-agente → Coordenador
    "SM": 19,  # Ex-agente → Coordenador
}

# Mapeamento de agent_id para avatar_url
# Avatares locais servidos pelo frontend Vercel
AGENT_AVATARS = {
    1: "/avatars/nuno-faria.png",
    2: "/avatars/pedro-olaio.png",
    3: "/avatars/joao-olaio.png",
    4: "/avatars/fabio-passos.png",
    5: "/avatars/antonio-silva.png",
    6: "/avatars/hugo-belo.png",
    7: "/avatars/bruno-libanio.png",
    8: "/avatars/nelson-neto.png",
    9: "/avatars/joao-paiva.png",
    10: "/avatars/marisa-barosa.png",
    11: "/avatars/eduardo-coelho.png",
    12: "/avatars/joao-silva.png",
    13: "/avatars/hugo-mota.png",
    14: "/avatars/joao-pereira.png",
    15: "/avatars/joao-carvalho.png",
    16: "/avatars/tiago-vindima.png",
    17: "/avatars/mickael-soares.png",
    18: "/avatars/paulo-rodrigues.png",
    19: "/avatars/foto.png",  # Logo da agência
}


@router.get("/preview")
async def preview_changes(db: Session = Depends(get_db)):
    """
    Preview das alterações que serão feitas
    """
    try:
        # Obter todas as properties com seus agent_id atuais
        result = db.execute(text("""
            SELECT id, reference, agent_id,
                   SUBSTRING(reference FROM 1 FOR 2) as prefix
            FROM properties
            ORDER BY reference
        """))
        
        properties = result.fetchall()
        
        changes = []
        correct = []
        unknown_prefixes = set()
        
        for prop in properties:
            prop_id, reference, current_agent_id, prefix = prop
            expected_agent_id = PREFIX_TO_AGENT.get(prefix)
            
            if expected_agent_id is None:
                unknown_prefixes.add(prefix)
                continue
            
            if current_agent_id != expected_agent_id:
                changes.append({
                    "property_id": prop_id,
                    "reference": reference,
                    "prefix": prefix,
                    "current_agent_id": current_agent_id,
                    "new_agent_id": expected_agent_id
                })
            else:
                correct.append({
                    "property_id": prop_id,
                    "reference": reference,
                    "agent_id": current_agent_id
                })
        
        return {
            "summary": {
                "total_properties": len(properties),
                "to_change": len(changes),
                "already_correct": len(correct),
                "unknown_prefixes": list(unknown_prefixes)
            },
            "changes_preview": changes[:50],  # Primeiras 50 alterações
            "prefix_mapping": PREFIX_TO_AGENT
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_fix(db: Session = Depends(get_db)):
    """
    Executa a correção de agent_id em todas as properties
    """
    try:
        # Contador de alterações
        updates = {}
        
        for prefix, agent_id in PREFIX_TO_AGENT.items():
            result = db.execute(text("""
                UPDATE properties 
                SET agent_id = :agent_id
                WHERE SUBSTRING(reference FROM 1 FOR 2) = :prefix
                  AND (agent_id != :agent_id OR agent_id IS NULL)
                RETURNING id, reference
            """), {"prefix": prefix, "agent_id": agent_id})
            
            updated = result.fetchall()
            if updated:
                updates[prefix] = {
                    "agent_id": agent_id,
                    "count": len(updated),
                    "references": [r[1] for r in updated]
                }
        
        db.commit()
        
        # Verificar resultado final
        result = db.execute(text("""
            SELECT agent_id, COUNT(*) as count
            FROM properties
            GROUP BY agent_id
            ORDER BY count DESC
        """))
        final_counts = [{"agent_id": r[0], "count": r[1]} for r in result.fetchall()]
        
        return {
            "success": True,
            "updates_by_prefix": updates,
            "total_updated": sum(u["count"] for u in updates.values()),
            "final_counts_by_agent": final_counts
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_status(db: Session = Depends(get_db)):
    """
    Ver estado atual das properties por agente
    """
    try:
        # Contagem por agente
        result = db.execute(text("""
            SELECT a.id, a.name, COUNT(p.id) as property_count
            FROM agents a
            LEFT JOIN properties p ON a.id = p.agent_id
            WHERE a.id <= 19
            GROUP BY a.id, a.name
            ORDER BY property_count DESC
        """))
        
        by_agent = [{"id": r[0], "name": r[1], "count": r[2]} for r in result.fetchall()]
        
        # Contagem por prefixo
        result2 = db.execute(text("""
            SELECT SUBSTRING(reference FROM 1 FOR 2) as prefix,
                   agent_id,
                   COUNT(*) as count
            FROM properties
            GROUP BY SUBSTRING(reference FROM 1 FOR 2), agent_id
            ORDER BY prefix, agent_id
        """))
        
        by_prefix = [{"prefix": r[0], "agent_id": r[1], "count": r[2]} for r in result2.fetchall()]
        
        return {
            "by_agent": by_agent,
            "by_prefix": by_prefix
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verify-tiago")
async def verify_tiago(db: Session = Depends(get_db)):
    """
    Verificar quantas properties o Tiago (ID 16) tem e quais são
    """
    try:
        result = db.execute(text("""
            SELECT id, reference, title
            FROM properties
            WHERE agent_id = 16
            ORDER BY reference
        """))
        
        properties = [{"id": r[0], "reference": r[1], "title": r[2]} for r in result.fetchall()]
        
        # Agrupar por prefixo
        by_prefix = {}
        for p in properties:
            prefix = p["reference"][:2] if p["reference"] else "??"
            if prefix not in by_prefix:
                by_prefix[prefix] = []
            by_prefix[prefix].append(p["reference"])
        
        return {
            "agent_id": 16,
            "agent_name": "Tiago Vindima",
            "total_count": len(properties),
            "by_prefix": {k: {"count": len(v), "references": v} for k, v in by_prefix.items()},
            "expected_prefixes": ["TV", "JV", "ES"],
            "properties": properties
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ENDPOINTS PARA AVATARES
# =====================================================

@router.get("/avatars/status")
async def avatars_status(db: Session = Depends(get_db)):
    """
    Ver estado atual dos avatares dos agentes
    """
    try:
        result = db.execute(text("""
            SELECT id, name, avatar_url
            FROM agents
            WHERE id <= 19
            ORDER BY id
        """))
        
        agents = []
        missing_avatars = []
        for r in result.fetchall():
            agent_id, name, current_avatar = r
            expected_avatar = AGENT_AVATARS.get(agent_id)
            is_correct = current_avatar == expected_avatar
            
            agents.append({
                "id": agent_id,
                "name": name,
                "current_avatar": current_avatar,
                "expected_avatar": expected_avatar,
                "is_correct": is_correct
            })
            
            if not is_correct:
                missing_avatars.append(agent_id)
        
        return {
            "total_agents": len(agents),
            "with_correct_avatar": len(agents) - len(missing_avatars),
            "missing_or_wrong": len(missing_avatars),
            "missing_ids": missing_avatars,
            "agents": agents
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/avatars/fix")
async def fix_avatars(db: Session = Depends(get_db)):
    """
    Atualiza os avatar_url de todos os agentes (IDs 1-19)
    """
    try:
        updates = []
        
        for agent_id, avatar_url in AGENT_AVATARS.items():
            result = db.execute(text("""
                UPDATE agents 
                SET avatar_url = :avatar_url
                WHERE id = :agent_id
                  AND (avatar_url != :avatar_url OR avatar_url IS NULL)
                RETURNING id, name
            """), {"agent_id": agent_id, "avatar_url": avatar_url})
            
            updated = result.fetchone()
            if updated:
                updates.append({
                    "id": updated[0],
                    "name": updated[1],
                    "avatar_url": avatar_url
                })
        
        db.commit()
        
        # Verificar resultado
        result = db.execute(text("""
            SELECT id, name, avatar_url
            FROM agents
            WHERE id <= 19
            ORDER BY id
        """))
        
        final_state = [{"id": r[0], "name": r[1], "avatar_url": r[2]} for r in result.fetchall()]
        
        return {
            "success": True,
            "updated_count": len(updates),
            "updates": updates,
            "final_state": final_state
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/duplicate-agents")
def delete_duplicate_agents(db: Session = Depends(get_db)):
    """
    Remove agentes duplicados (IDs > 19).
    Os agentes válidos são IDs 1-19.
    Agentes com IDs >= 20 são duplicados criados por erro.
    """
    try:
        # Primeiro verificar quais vão ser apagados
        result = db.execute(text("""
            SELECT id, name, email FROM agents WHERE id > 19 ORDER BY id
        """))
        to_delete = [{"id": r[0], "name": r[1], "email": r[2]} for r in result.fetchall()]
        
        if not to_delete:
            return {
                "success": True,
                "message": "Não há agentes duplicados para eliminar",
                "deleted_count": 0
            }
        
        # Reassignar propriedades ao agente 19 (coordenador)
        db.execute(text("""
            UPDATE properties SET agent_id = 19 WHERE agent_id > 19
        """))
        
        # Reassignar leads ao agente 19 (coordenador)
        db.execute(text("""
            UPDATE leads SET assigned_agent_id = 19 WHERE assigned_agent_id > 19
        """))
        
        # Eliminar refresh_tokens associados aos users dos agentes duplicados
        db.execute(text("""
            DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE agent_id > 19)
        """))
        
        # Eliminar users associados aos agentes duplicados
        db.execute(text("""
            DELETE FROM users WHERE agent_id > 19
        """))
        
        # Eliminar os agentes duplicados
        result = db.execute(text("""
            DELETE FROM agents WHERE id > 19 RETURNING id, name
        """))
        deleted = result.fetchall()
        
        db.commit()
        
        return {
            "success": True,
            "deleted_count": len(deleted),
            "deleted_agents": to_delete
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
