"""
Admin endpoint para aplicar migração de tasks no Railway.
TEMPORÁRIO - Remover após migração aplicada.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db, SessionLocal, engine
from sqlalchemy.orm import Session

router = APIRouter(prefix="/admin", tags=["Admin Migration"])


@router.post("/migrate-tasks")
def migrate_tasks_table(db: Session = Depends(get_db)):
    """
    🚨 ENDPOINT TEMPORÁRIO PARA MIGRAÇÃO
    Cria tabela tasks no PostgreSQL Railway.
    Executar uma vez e depois remover este endpoint.
    """
    results = []
    
    try:
        # 1. Verificar se tabela já existe
        check_table = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'tasks'
            );
        """)
        exists = db.execute(check_table).scalar()
        
        if exists:
            results.append("⚠️ Tabela 'tasks' já existe!")
            # Remover tabela antiga para recriar corretamente
            results.append("🗑️ Removendo tabela antiga...")
            db.execute(text("DROP TABLE IF EXISTS tasks CASCADE;"))
            results.append("✅ Tabela antiga removida")
        
        results.append("✅ Iniciando criação da tabela tasks...")
        
        # 2. Criar tipos ENUM
        results.append("📝 Criando tipos ENUM...")
        
        enum_sqls = [
            """
            DO $$ BEGIN
                CREATE TYPE tasktype AS ENUM ('VISIT', 'CALL', 'MEETING', 'FOLLOWUP', 'OTHER');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            """,
            """
            DO $$ BEGIN
                CREATE TYPE taskstatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            """,
            """
            DO $$ BEGIN
                CREATE TYPE taskpriority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            """
        ]
        
        for enum_sql in enum_sqls:
            db.execute(text(enum_sql))
        
        results.append("✅ Tipos ENUM criados")
        
        # 3. Criar tabela tasks
        results.append("📝 Criando tabela 'tasks'...")
        
        create_table_sql = text("""
            CREATE TABLE tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR NOT NULL,
                description TEXT,
                
                -- Tipo e status
                task_type tasktype NOT NULL,
                status taskstatus NOT NULL DEFAULT 'PENDING',
                priority taskpriority NOT NULL DEFAULT 'MEDIUM',
                
                -- Datas
                due_date TIMESTAMP NOT NULL,
                completed_at TIMESTAMP,
                reminder_sent BOOLEAN DEFAULT FALSE,
                
                -- Foreign Keys
                lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
                property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
                assigned_agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
                created_by_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
                
                -- Timestamps
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        """)
        
        db.execute(create_table_sql)
        results.append("✅ Tabela 'tasks' criada")
        
        # 4. Criar índices
        results.append("📝 Criando índices...")
        
        index_sqls = [
            "CREATE INDEX ix_tasks_id ON tasks(id);",
            "CREATE INDEX ix_tasks_task_type ON tasks(task_type);",
            "CREATE INDEX ix_tasks_status ON tasks(status);",
            "CREATE INDEX ix_tasks_priority ON tasks(priority);",
            "CREATE INDEX ix_tasks_due_date ON tasks(due_date);",
            "CREATE INDEX ix_tasks_lead_id ON tasks(lead_id);",
            "CREATE INDEX ix_tasks_property_id ON tasks(property_id);",
            "CREATE INDEX ix_tasks_assigned_agent_id ON tasks(assigned_agent_id);"
        ]
        
        for idx_sql in index_sqls:
            db.execute(text(idx_sql))
        
        results.append(f"✅ {len(index_sqls)} índices criados")
        
        # 5. Atualizar alembic_version
        results.append("📝 Atualizando alembic_version...")
        
        # Primeiro verificar se tabela alembic_version existe
        create_alembic_table = text("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL PRIMARY KEY
            );
        """)
        db.execute(create_alembic_table)
        
        update_version_sql = text("""
            INSERT INTO alembic_version (version_num) 
            VALUES ('189fdabc9260')
            ON CONFLICT (version_num) DO NOTHING;
        """)
        
        db.execute(update_version_sql)
        results.append("✅ Versão Alembic atualizada para 189fdabc9260")
        
        # 6. Commit de todas as mudanças
        db.commit()
        
        # 7. Validar estrutura
        results.append("🔍 Validando estrutura...")
        
        validate_sql = text("""
            SELECT column_name, data_type 
            FROM information_schema.columns
            WHERE table_name = 'tasks'
            ORDER BY ordinal_position;
        """)
        
        columns = db.execute(validate_sql).fetchall()
        results.append(f"✅ Tabela tem {len(columns)} colunas")
        
        # Verificar índices
        index_check_sql = text("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE tablename = 'tasks';
        """)
        
        index_count = db.execute(index_check_sql).scalar()
        results.append(f"✅ {index_count} índices criados")
        
        results.append("")
        results.append("="*60)
        results.append("🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        results.append("="*60)
        results.append("")
        results.append("✅ Tabela 'tasks' criada no PostgreSQL Railway")
        results.append("✅ Índices criados para performance")
        results.append("✅ Tipos ENUM registrados")
        results.append("✅ Foreign keys configuradas")
        results.append("✅ Alembic version atualizada")
        results.append("")
        results.append("🚀 Próximo passo: Testar endpoints /calendar/tasks")
        results.append("")
        results.append("⚠️ IMPORTANTE: Remover endpoint /admin/migrate-tasks após validação")
        
        return {
            "status": "success",
            "messages": results
        }
        
    except SQLAlchemyError as e:
        db.rollback()
        error_msg = str(e)
        results.append(f"❌ Erro SQL: {error_msg}")
        raise HTTPException(status_code=500, detail={
            "status": "error",
            "messages": results,
            "error": error_msg
        })
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        results.append(f"❌ Erro: {error_msg}")
        raise HTTPException(status_code=500, detail={
            "status": "error",
            "messages": results,
            "error": error_msg
        })


@router.get("/check-tasks-table")
def check_tasks_table(db: Session = Depends(get_db)):
    """Verifica se tabela tasks existe e quantos registros tem."""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        exists = 'tasks' in tables
        
        if not exists:
            return {
                "exists": False,
                "message": "Tabela 'tasks' NÃO existe. Execute POST /admin/migrate-tasks"
            }
        
        # Contar registros
        count_sql = text("SELECT COUNT(*) FROM tasks;")
        count = db.execute(count_sql).scalar()
        
        # Pegar colunas
        columns_info = inspector.get_columns('tasks')
        columns = [{"name": c['name'], "type": str(c['type'])} for c in columns_info]
        
        # Pegar índices
        indexes_info = inspector.get_indexes('tasks')
        indexes = [idx['name'] for idx in indexes_info]
        
        return {
            "exists": True,
            "record_count": count,
            "column_count": len(columns),
            "columns": columns,
            "index_count": len(indexes),
            "indexes": indexes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
