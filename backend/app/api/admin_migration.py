"""
Admin endpoint para aplicar migração de tasks no Railway.
TEMPORÁRIO - Remover após migração aplicada.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db, SessionLocal, engine
from sqlalchemy.orm import Session
from app.agents.models import Agent
from app.models.client import Client
from app.models.website_client import WebsiteClient

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


@router.post("/add-social-columns")
def add_twitter_tiktok_columns(db: Session = Depends(get_db)):
    """
    Adicionar colunas twitter e tiktok à tabela agent_site_preferences
    """
    results = []
    
    try:
        # Verificar e adicionar coluna twitter
        check_twitter = text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='agent_site_preferences' AND column_name='twitter'
        """)
        twitter_exists = db.execute(check_twitter).fetchone() is not None
        
        if not twitter_exists:
            db.execute(text("ALTER TABLE agent_site_preferences ADD COLUMN twitter VARCHAR(255)"))
            results.append("✅ Coluna 'twitter' adicionada")
        else:
            results.append("⚠️ Coluna 'twitter' já existe")
        
        # Verificar e adicionar coluna tiktok
        check_tiktok = text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='agent_site_preferences' AND column_name='tiktok'
        """)
        tiktok_exists = db.execute(check_tiktok).fetchone() is not None
        
        if not tiktok_exists:
            db.execute(text("ALTER TABLE agent_site_preferences ADD COLUMN tiktok VARCHAR(255)"))
            results.append("✅ Coluna 'tiktok' adicionada")
        else:
            results.append("⚠️ Coluna 'tiktok' já existe")
        
        db.commit()
        
        return {
            "status": "success",
            "messages": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/setup-staff-users")
def setup_staff_users(db: Session = Depends(get_db)):
    """
    Cria ou atualiza os users de staff para o site público.
    - Adiciona coluna role_label se não existir
    - Cria Maria Olaio, Andreia Borges, Sara Ferreira, Cláudia Libânio
    """
    from app.users.models import User, UserRole
    from app.agents.models import Agent
    from app.users.services import hash_password
    
    results = []
    
    try:
        # 1. Adicionar coluna role_label se não existir
        check_col = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'role_label'
            );
        """)
        col_exists = db.execute(check_col).scalar()
        
        if not col_exists:
            db.execute(text("ALTER TABLE users ADD COLUMN role_label VARCHAR"))
            results.append("✅ Coluna 'role_label' adicionada à tabela users")
        else:
            results.append("⚠️ Coluna 'role_label' já existe")
        
        # 1b. Adicionar coluna display_name se não existir
        check_display = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'display_name'
            );
        """)
        display_exists = db.execute(check_display).scalar()
        
        if not display_exists:
            db.execute(text("ALTER TABLE users ADD COLUMN display_name VARCHAR"))
            results.append("✅ Coluna 'display_name' adicionada à tabela users")
        else:
            results.append("⚠️ Coluna 'display_name' já existe")
        
        db.commit()
        
        # 2. Definir staff members
        staff_to_create = [
            {
                "email": "m.olaio@imoveismais.pt",
                "full_name": "Maria Olaio",
                "role": UserRole.COORDINATOR.value,
                "phone": "244001003",
                "password": "staff2024",
                "works_for_agent_name": None,
                "role_label": "Diretora Financeira",
            },
            {
                "email": "a.borges@imoveismais.pt",
                "full_name": "Andreia Borges",
                "role": UserRole.COORDINATOR.value,
                "phone": "244001004",
                "password": "staff2024",
                "works_for_agent_name": None,
                "role_label": "Assistente Administrativa",
            },
            {
                "email": "s.ferreira@imoveismais.pt",
                "full_name": "Sara Ferreira",
                "role": UserRole.COORDINATOR.value,
                "phone": "244001002",
                "password": "staff2024",
                "works_for_agent_name": None,
                "role_label": "Assistente Administrativa",
            },
            {
                "email": "c.libanio@imoveismais.pt",
                "full_name": "Cláudia Libânio",
                "role": UserRole.ASSISTANT.value,
                "phone": "912118911",
                "password": "staff2024",
                "works_for_agent_name": "Bruno Libânio",
                "role_label": None,
            },
        ]
        
        # 3. Criar/atualizar staff
        for staff_data in staff_to_create:
            existing = db.query(User).filter(User.email == staff_data["email"]).first()
            
            if existing:
                updated = False
                if existing.phone != staff_data["phone"]:
                    existing.phone = staff_data["phone"]
                    updated = True
                if staff_data.get("role_label") and existing.role_label != staff_data.get("role_label"):
                    existing.role_label = staff_data.get("role_label")
                    updated = True
                if updated:
                    results.append(f"✅ Atualizado: {staff_data['full_name']}")
                else:
                    results.append(f"⚠️ Sem alterações: {staff_data['full_name']}")
                continue
            
            # Buscar agent_id
            works_for_agent_id = None
            if staff_data.get("works_for_agent_name"):
                agent = db.query(Agent).filter(Agent.name == staff_data["works_for_agent_name"]).first()
                if agent:
                    works_for_agent_id = agent.id
            
            new_user = User(
                email=staff_data["email"],
                hashed_password=hash_password(staff_data["password"]),
                full_name=staff_data["full_name"],
                role=staff_data["role"],
                phone=staff_data["phone"],
                is_active=True,
                works_for_agent_id=works_for_agent_id,
                role_label=staff_data.get("role_label"),
            )
            db.add(new_user)
            results.append(f"✅ Criado: {staff_data['full_name']} (Role: {staff_data['role']})")
        
        db.commit()
        
        return {
            "status": "success",
            "messages": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-staff-avatar/{user_id}")
async def upload_staff_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload de avatar para um user de staff.
    POST /admin/upload-staff-avatar/{user_id}
    """
    from app.users.models import User
    from app.core.storage import storage
    
    # 1. Verificar se user existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} não encontrado")
    
    # 2. Upload para Cloudinary
    try:
        # Ler conteúdo do arquivo
        content = await file.read()
        
        # Criar file-like object
        from io import BytesIO
        file_obj = BytesIO(content)
        
        # Upload para pasta de avatares de staff
        url = await storage.upload_file(
            file_obj,
            folder=f"avatars/staff",
            filename=f"{user_id}.png"
        )
        
        # 3. Atualizar avatar_url no user
        user.avatar_url = url
        db.commit()
        
        return {
            "status": "success",
            "user_id": user_id,
            "name": user.full_name,
            "avatar_url": url
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")


@router.post("/migrate-website-clients")
def migrate_website_clients(db: Session = Depends(get_db)):
    """
    Cria a tabela website_clients para autenticação de clientes do site.
    """
    results = []
    
    try:
        # Verificar se tabela já existe
        check_table = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'website_clients'
            );
        """)
        exists = db.execute(check_table).scalar()
        
        if exists:
            results.append("⚠️ Tabela 'website_clients' já existe!")
        else:
            # Criar tabela
            create_sql = text("""
                CREATE TABLE website_clients (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    email VARCHAR NOT NULL UNIQUE,
                    phone VARCHAR,
                    hashed_password VARCHAR NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_verified BOOLEAN DEFAULT FALSE,
                    receive_alerts BOOLEAN DEFAULT TRUE,
                    search_preferences TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    last_login TIMESTAMP
                );
                CREATE INDEX ix_website_clients_id ON website_clients(id);
                CREATE UNIQUE INDEX ix_website_clients_email ON website_clients(email);
            """)
            db.execute(create_sql)
            db.commit()
            results.append("✅ Tabela 'website_clients' criada com sucesso!")
        
        return {
            "status": "success",
            "messages": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/migrate-website-clients-v2")
def migrate_website_clients_v2(db: Session = Depends(get_db)):
    """
    Adiciona novos campos à tabela website_clients para sistema de leads.
    - client_type: investidor, pontual, arrendamento
    - interest_type: compra, arrendamento
    - assigned_agent_id: FK para users
    - agent_selected_by_client: boolean
    
    E cria tabela lead_distribution_counters para round-robin.
    """
    results = []
    
    try:
        # Adicionar novas colunas a website_clients
        columns_to_add = [
            ("client_type", "VARCHAR DEFAULT 'pontual'"),
            ("interest_type", "VARCHAR DEFAULT 'compra'"),
            ("assigned_agent_id", "INTEGER REFERENCES users(id)"),
            ("agent_selected_by_client", "BOOLEAN DEFAULT FALSE"),
        ]
        
        for col_name, col_def in columns_to_add:
            try:
                add_col = text(f"ALTER TABLE website_clients ADD COLUMN IF NOT EXISTS {col_name} {col_def}")
                db.execute(add_col)
                results.append(f"✅ Coluna '{col_name}' adicionada/verificada")
            except Exception as e:
                results.append(f"⚠️ Coluna '{col_name}': {str(e)}")
        
        db.commit()
        
        # Criar tabela lead_distribution_counters
        check_counters = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'lead_distribution_counters'
            );
        """)
        counters_exists = db.execute(check_counters).scalar()
        
        if counters_exists:
            results.append("⚠️ Tabela 'lead_distribution_counters' já existe")
        else:
            create_counters = text("""
                CREATE TABLE lead_distribution_counters (
                    id SERIAL PRIMARY KEY,
                    counter_type VARCHAR UNIQUE NOT NULL,
                    last_agent_index INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX ix_lead_distribution_counters_type ON lead_distribution_counters(counter_type);
            """)
            db.execute(create_counters)
            db.commit()
            results.append("✅ Tabela 'lead_distribution_counters' criada!")
        
        # Inicializar contadores se não existirem
        for counter_type in ["investidor", "pontual"]:
            check_counter = text(f"SELECT id FROM lead_distribution_counters WHERE counter_type = '{counter_type}'")
            exists = db.execute(check_counter).first()
            if not exists:
                insert_counter = text(f"INSERT INTO lead_distribution_counters (counter_type, last_agent_index) VALUES ('{counter_type}', 0)")
                db.execute(insert_counter)
                results.append(f"✅ Contador '{counter_type}' inicializado")
        
        db.commit()
        
        return {
            "status": "success",
            "messages": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fix-leads-message")
def fix_leads_message_column(db: Session = Depends(get_db)):
    """
    Adicionar coluna message à tabela leads se não existir.
    """
    results = []
    
    try:
        # Verificar se coluna message existe
        check_column = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'leads' AND column_name = 'message'
            );
        """)
        exists = db.execute(check_column).scalar()
        
        if exists:
            results.append("✅ Coluna 'message' já existe na tabela leads")
        else:
            # Adicionar coluna
            db.execute(text("ALTER TABLE leads ADD COLUMN message TEXT"))
            db.commit()
            results.append("✅ Coluna 'message' adicionada à tabela leads")
        
        return {
            "status": "success",
            "messages": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fix-leads-status")
def fix_leads_status_enum(db: Session = Depends(get_db)):
    """
    Normalizar valores de status na tabela leads para maiúsculas.
    """
    results = []
    
    try:
        # Converter status minúsculos para maiúsculos
        status_map = [
            ("'new'", "'NEW'"),
            ("'contacted'", "'CONTACTED'"),
            ("'qualified'", "'QUALIFIED'"),
            ("'proposal_sent'", "'PROPOSAL_SENT'"),
            ("'visit_scheduled'", "'VISIT_SCHEDULED'"),
            ("'negotiation'", "'NEGOTIATION'"),
            ("'converted'", "'CONVERTED'"),
            ("'lost'", "'LOST'"),
        ]
        
        for old_val, new_val in status_map:
            update_sql = text(f"UPDATE leads SET status = {new_val} WHERE status = {old_val}")
            result = db.execute(update_sql)
            if result.rowcount > 0:
                results.append(f"✅ Convertidos {result.rowcount} registos de {old_val} para {new_val}")
        
        db.commit()
        
        if not results:
            results.append("✅ Todos os status já estão normalizados")
        
        return {
            "status": "success",
            "messages": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/migrate-escritura-invoice-fields")
def migrate_escritura_invoice_fields(db: Session = Depends(get_db)):
    """
    Garantir que colunas de fatura existem na tabela escrituras para evitar crashes no painel.
    """
    results = []

    columns = [
        ("fatura_emitida", "BOOLEAN DEFAULT FALSE"),
        ("numero_fatura", "VARCHAR(50)"),
        ("data_fatura", "TIMESTAMPTZ"),
        ("fatura_pedida", "BOOLEAN DEFAULT FALSE"),
        ("pedido_fatura_nota", "TEXT"),
        ("data_pedido_fatura", "TIMESTAMPTZ"),
        ("pedido_fatura_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
    ]

    try:
        for col_name, col_def in columns:
            db.execute(text(f"ALTER TABLE escrituras ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
            results.append(f"✅ Coluna '{col_name}' adicionada/verificada")

        db.commit()

        return {
            "status": "success",
            "messages": results,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync-website-clients-to-crm")
def sync_website_clients_to_crm(db: Session = Depends(get_db)):
    """
    Sincronizar todos os website_clients para clients, garantindo visibilidade no backoffice/mobile.
    """
    summary = {
        "total": 0,
        "created": 0,
        "updated": 0,
        "skipped_without_agent": 0,
        "errors": [],
    }

    try:
        website_clients = db.query(WebsiteClient).all()
        summary["total"] = len(website_clients)

        for wc in website_clients:
            if not wc.assigned_agent_id:
                summary["skipped_without_agent"] += 1
                continue

            try:
                agent = db.query(Agent).filter(Agent.id == wc.assigned_agent_id).first()
                client_type_crm = "comprador" if wc.interest_type == "compra" else "arrendatario"

                existing = db.query(Client).filter(
                    Client.email == wc.email,
                    Client.agent_id == wc.assigned_agent_id,
                ).first()

                if existing:
                    existing.nome = wc.name or existing.nome
                    existing.telefone = wc.phone or existing.telefone
                    existing.email = wc.email
                    existing.client_type = client_type_crm
                    existing.origin = "website"
                    if agent and agent.agency_id:
                        existing.agency_id = agent.agency_id
                    existing.is_active = True
                    existing.updated_at = datetime.utcnow()
                    summary["updated"] += 1
                else:
                    new_client = Client(
                        agent_id=wc.assigned_agent_id,
                        agency_id=agent.agency_id if agent else None,
                        nome=wc.name,
                        email=wc.email,
                        telefone=wc.phone,
                        client_type=client_type_crm,
                        origin="website",
                        is_active=True,
                    )
                    db.add(new_client)
                    summary["created"] += 1

                db.commit()

            except Exception as sync_err:
                db.rollback()
                summary["errors"].append({
                    "website_client_id": wc.id,
                    "email": wc.email,
                    "error": str(sync_err),
                })

        return {
            "status": "success",
            "summary": summary,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
