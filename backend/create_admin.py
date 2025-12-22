"""
Create admin user in Railway database.
Run with: railway run python create_admin.py
"""
import sys
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.users.models import User, UserRole
from app.security import get_password_hash

def create_admin():
    """Create admin user linked to agent_id 1."""
    print("🔐 Creating admin user...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == "tvindima@imoveismais.pt").first()
        if existing:
            print("⚠️  User already exists, updating password...")
            existing.hashed_password = get_password_hash("kkkkkkkk")
            db.commit()
            print(f"✅ Password updated for: {existing.email}")
            print(f"   User ID: {existing.id}")
            print(f"   Agent ID: {existing.agent_id}")
            return 0
        
        # Create new user
        admin_user = User(
            email="tvindima@imoveismais.pt",
            hashed_password=get_password_hash("kkkkkkkk"),
            full_name="Tiago Vindima",
            role=UserRole.ADMIN.value,
            is_active=True,
            agent_id=1  # Link to agent created earlier
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Admin user created successfully!")
        print(f"   Email: {admin_user.email}")
        print(f"   User ID: {admin_user.id}")
        print(f"   Agent ID: {admin_user.agent_id}")
        print(f"   Role: {admin_user.role}")
        print("\n🎉 You can now login with:")
        print(f"   Email: tvindima@imoveismais.pt")
        print(f"   Password: kkkkkkkk")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return 1
    finally:
        db.close()

if __name__ == "__main__":
    sys.exit(create_admin())
