"""
Create email_verifications table in production
"""
from sqlalchemy import text
from app.database import engine

def create_email_verifications_table():
    print("Creating email_verifications table...")
    
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS email_verifications (
                id SERIAL PRIMARY KEY,
                email VARCHAR(200) NOT NULL,
                name VARCHAR(200) NOT NULL,
                company_name VARCHAR(200) NOT NULL,
                hashed_password VARCHAR(200) NOT NULL,
                sector VARCHAR(50) DEFAULT 'real_estate',
                phone VARCHAR(50),
                logo_url VARCHAR(500),
                primary_color VARCHAR(20),
                verification_code VARCHAR(6) NOT NULL,
                verification_token VARCHAR(100) UNIQUE NOT NULL,
                is_verified BOOLEAN DEFAULT false,
                verified_at TIMESTAMP WITH TIME ZONE,
                tenant_id INTEGER,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                ip_address VARCHAR(50),
                user_agent VARCHAR(500)
            )
        """))
        
        # Create indices
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(verification_token)"))
        
        conn.commit()
        print("✅ Table created!")
        
        # Verify
        result = conn.execute(text("SELECT COUNT(*) FROM email_verifications"))
        print(f"   Records: {result.scalar()}")

if __name__ == "__main__":
    create_email_verifications_table()
