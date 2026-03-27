import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from auth import get_password_hash
from models import User, UserRole
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_users():
    """Seed default users for testing"""
    
    # Check if users already exist
    existing_count = await db.users.count_documents({})
    if existing_count > 0:
        print(f"Users already exist ({existing_count}). Skipping seed.")
        return
    
    users = [
        {
            "email": "admin@satria.go.id",
            "password": "Admin123!",
            "full_name": "Administrator SATRIA",
            "role": UserRole.ADMIN
        },
        {
            "email": "analyst@satria.go.id",
            "password": "Analyst123!",
            "full_name": "Financial Analyst",
            "role": UserRole.ANALYST
        },
        {
            "email": "regulator@ppatk.go.id",
            "password": "Regulator123!",
            "full_name": "PPATK Regulator",
            "role": UserRole.REGULATOR
        },
        {
            "email": "auditor@bpk.go.id",
            "password": "Auditor123!",
            "full_name": "BPK Auditor",
            "role": UserRole.AUDITOR
        },
    ]
    
    for user_data in users:
        password = user_data.pop('password')
        hashed_password = get_password_hash(password)
        
        user = User(**user_data, is_active=True)
        user_doc = user.model_dump()
        user_doc['hashed_password'] = hashed_password
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        
        await db.users.insert_one(user_doc)
        print(f"Created user: {user_data['email']}")
    
    print("\nUser seeding complete!")
    print("\nDefault credentials:")
    print("  Admin: admin@satria.go.id / Admin123!")
    print("  Analyst: analyst@satria.go.id / Analyst123!")
    print("  Regulator: regulator@ppatk.go.id / Regulator123!")
    print("  Auditor: auditor@bpk.go.id / Auditor123!")

if __name__ == "__main__":
    asyncio.run(seed_users())
    client.close()
