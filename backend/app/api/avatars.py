"""
API endpoint to update agent avatars
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

# Staff agents data
STAFF_AGENTS = {
    19: {"name": "Ana Vindima", "email": "ana.vindima@imoveismais.pt", "avatar": "/avatars/19.png"},
    20: {"name": "Maria Olaio", "email": "maria.olaio@imoveismais.pt", "avatar": "/avatars/20.png"},
    21: {"name": "Andreia Borges", "email": "andreia.borges@imoveismais.pt", "avatar": "/avatars/21.png"},
    22: {"name": "Sara Ferreira", "email": "sara.ferreira@imoveismais.pt", "avatar": "/avatars/22.png"},
    23: {"name": "Cláudia Libânio", "email": "claudia.libanio@imoveismais.pt", "avatar": "/avatars/23.png"},
}

AVATAR_MAPPING = {
    24: "/avatars/antonio-silva.png",
    25: "/avatars/hugo-belo.png",
    26: "/avatars/bruno-libanio.png",
    27: "/avatars/nelson-neto.png",
    28: "/avatars/joao-paiva.png",
    29: "/avatars/marisa-barosa.png",
    30: "/avatars/eduardo-coelho.png",
    31: "/avatars/joao-silva.png",
    32: "/avatars/hugo-mota.png",
    33: "/avatars/joao-pereira.png",
    34: "/avatars/joao-carvalho.png",
    35: "/avatars/tiago-vindima.png",
    36: "/avatars/mickael-soares.png",
    37: "/avatars/paulo-rodrigues.png",
}

@router.post("/update-avatars")
def update_avatars(db: Session = Depends(get_db)):
    """Update agent avatars in database"""
    results = {
        "column_added": False,
        "staff_created": [],
        "staff_updated": [],
        "avatars_updated": [],
        "errors": []
    }
    
    try:
        # 1. Add avatar_url column if it doesn't exist
        try:
            db.execute(text("""
                ALTER TABLE agents 
                ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
            """))
            db.commit()
            results["column_added"] = True
        except Exception as e:
            results["errors"].append(f"Column: {str(e)}")
        
        # 2. Create/update staff agents
        for agent_id, data in STAFF_AGENTS.items():
            try:
                # Check if exists
                result = db.execute(
                    text("SELECT id FROM agents WHERE id = :id"),
                    {"id": agent_id}
                )
                exists = result.fetchone()
                
                if exists:
                    # Update
                    db.execute(
                        text("""
                            UPDATE agents 
                            SET name = :name, email = :email, avatar_url = :avatar
                            WHERE id = :id
                        """),
                        {"id": agent_id, "name": data["name"], "email": data["email"], "avatar": data["avatar"]}
                    )
                    results["staff_updated"].append(f"{agent_id}: {data['name']}")
                else:
                    # Create
                    db.execute(
                        text("""
                            INSERT INTO agents (id, name, email, avatar_url)
                            VALUES (:id, :name, :email, :avatar)
                        """),
                        {"id": agent_id, "name": data["name"], "email": data["email"], "avatar": data["avatar"]}
                    )
                    results["staff_created"].append(f"{agent_id}: {data['name']}")
                
                db.commit()
            except Exception as e:
                results["errors"].append(f"Agent {agent_id}: {str(e)}")
        
        # 3. Update avatars for existing agents
        for agent_id, avatar_url in AVATAR_MAPPING.items():
            try:
                result = db.execute(
                    text("UPDATE agents SET avatar_url = :avatar WHERE id = :id"),
                    {"avatar": avatar_url, "id": agent_id}
                )
                db.commit()
                if result.rowcount > 0:
                    results["avatars_updated"].append(f"Agent {agent_id}")
            except Exception as e:
                results["errors"].append(f"Avatar {agent_id}: {str(e)}")
        
        # 4. Get count
        result = db.execute(text("""
            SELECT COUNT(*) FROM agents WHERE avatar_url IS NOT NULL
        """))
        total_with_avatars = result.scalar()
        
        results["total_with_avatars"] = total_with_avatars
        results["success"] = True
        
    except Exception as e:
        results["success"] = False
        results["errors"].append(f"General error: {str(e)}")
    
    return results
