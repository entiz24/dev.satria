from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import io

# Import models and utilities
from models import *
from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_role
from ml_engine import ml_engine
from data_generator import data_generator
from ltkm_generator import ltkm_generator

security = HTTPBearer()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="SATRIA API", version="1.0.0")

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== Authentication Routes ==============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=True
    )
    
    user_doc = user.model_dump()
    user_doc['hashed_password'] = hashed_password
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Log audit
    await log_audit(user.id, user.email, "user_registered", "user", user.id)
    
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc.get('hashed_password', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get('is_active', False):
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    # Create access token
    access_token = create_access_token(data={"sub": user_doc['id']})
    
    # Convert datetime strings back to datetime objects for User model
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'hashed_password'})
    
    # Log audit
    await log_audit(user.id, user.email, "user_login", "auth", None)
    
    return Token(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(credentials = Depends(get_current_user)):
    """Get current user"""
    # Get fresh user data
    user_doc = await db.users.find_one({"id": credentials.credentials.split()[1] if hasattr(credentials, 'credentials') else credentials.id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**{k: v for k, v in user_doc.items() if k != 'hashed_password'})

# Helper function with dependency injection
async def get_current_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    from jose import jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        if isinstance(user_doc.get('created_at'), str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**{k: v for k, v in user_doc.items() if k != 'hashed_password'})
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# ============== Dashboard Routes ==============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user_from_token)):
    """Get dashboard statistics"""
    
    # Count statistics
    total_transactions = await db.transactions.count_documents({})
    flagged_transactions = await db.transactions.count_documents({"flagged": True})
    active_cases = await db.cases.count_documents({"status": {"$in": ["open", "investigating"]}})
    critical_alerts = await db.alerts.count_documents({"severity": "critical", "status": "new"})
    
    # Calculate average risk score
    pipeline = [
        {"$group": {"_id": None, "avg_risk": {"$avg": "$risk_score"}}}
    ]
    avg_result = await db.risk_scores.aggregate(pipeline).to_list(1)
    avg_risk_score = avg_result[0]['avg_risk'] if avg_result else 0
    
    # Transactions today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    transactions_today = await db.transactions.count_documents({
        "timestamp": {"$gte": today_start.isoformat()}
    })
    
    # High risk entities
    high_risk_entities = await db.entities.count_documents({"risk_score": {"$gte": 60}})
    
    return DashboardStats(
        total_transactions=total_transactions,
        flagged_transactions=flagged_transactions,
        active_cases=active_cases,
        critical_alerts=critical_alerts,
        avg_risk_score=round(avg_risk_score, 2),
        transactions_today=transactions_today,
        high_risk_entities=high_risk_entities
    )

# ============== Transaction Routes ==============

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    limit: int = 100,
    flagged_only: bool = False,
    current_user: User = Depends(get_current_user_from_token)
):
    """Get transactions"""
    query = {}
    if flagged_only:
        query["flagged"] = True
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Convert ISO strings to datetime
    for tx in transactions:
        if isinstance(tx.get('timestamp'), str):
            tx['timestamp'] = datetime.fromisoformat(tx['timestamp'])
    
    return transactions

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Get single transaction"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if isinstance(transaction.get('timestamp'), str):
        transaction['timestamp'] = datetime.fromisoformat(transaction['timestamp'])
    
    return Transaction(**transaction)

@api_router.post("/transactions/analyze/{transaction_id}")
async def analyze_transaction(transaction_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Run AI/ML analysis on a transaction"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Get entity transactions for LSTM analysis
    entity_transactions = await db.transactions.find(
        {"$or": [{"sender_id": transaction['sender_id']}, {"receiver_id": transaction['sender_id']}]},
        {"_id": 0}
    ).to_list(100)
    
    # Run ML analysis
    isolation_score, is_anomaly = ml_engine.detect_anomalies(transaction)
    lstm_analysis = ml_engine.analyze_sequence_patterns(entity_transactions)
    
    # Calculate ensemble score
    scores = {
        'isolation_forest_score': isolation_score,
        'lstm_score': lstm_analysis['risk_score'],
        'rule_based_score': 50  # Placeholder
    }
    
    final_score, risk_level = ml_engine.ensemble_risk_scoring(scores)
    
    # Update transaction
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "risk_score": final_score,
            "risk_level": risk_level,
            "flagged": final_score >= 50
        }}
    )
    
    # Save risk score
    risk_score_doc = RiskScore(
        entity_id=transaction['sender_id'],
        transaction_id=transaction_id,
        overall_score=final_score,
        isolation_forest_score=isolation_score,
        lstm_score=lstm_analysis['risk_score'],
        risk_level=RiskLevel(risk_level),
        factors=lstm_analysis['patterns']
    ).model_dump()
    risk_score_doc['timestamp'] = risk_score_doc['timestamp'].isoformat()
    
    await db.risk_scores.insert_one(risk_score_doc)
    
    # Create alert if high risk
    if final_score >= 60:
        alert_doc = Alert(
            alert_type="risk_threshold",
            severity=RiskLevel(risk_level),
            title=f"High Risk Transaction Detected",
            message=f"Transaction {transaction_id} flagged with risk score {final_score:.2f}",
            transaction_id=transaction_id,
            entity_id=transaction['sender_id']
        ).model_dump()
        alert_doc['created_at'] = alert_doc['created_at'].isoformat()
        await db.alerts.insert_one(alert_doc)
    
    await log_audit(current_user.id, current_user.email, "transaction_analyzed", "transaction", transaction_id)
    
    return {
        "transaction_id": transaction_id,
        "risk_score": final_score,
        "risk_level": risk_level,
        "is_anomaly": is_anomaly,
        "patterns_detected": lstm_analysis['patterns']
    }

# ============== Entity Routes ==============

@api_router.get("/entities", response_model=List[Entity])
async def get_entities(limit: int = 100, current_user: User = Depends(get_current_user_from_token)):
    """Get entities"""
    entities = await db.entities.find({}, {"_id": 0}).limit(limit).to_list(limit)
    
    for entity in entities:
        if isinstance(entity.get('created_at'), str):
            entity['created_at'] = datetime.fromisoformat(entity['created_at'])
    
    return entities

@api_router.get("/entities/{entity_id}", response_model=Entity)
async def get_entity(entity_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Get single entity"""
    entity = await db.entities.find_one({"id": entity_id}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    if isinstance(entity.get('created_at'), str):
        entity['created_at'] = datetime.fromisoformat(entity['created_at'])
    
    return Entity(**entity)

@api_router.get("/entities/{entity_id}/relationships")
async def get_entity_relationships(entity_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Get entity relationships for graph visualization"""
    relationships = await db.entity_relationships.find(
        {"$or": [{"source_entity_id": entity_id}, {"target_entity_id": entity_id}]},
        {"_id": 0}
    ).to_list(100)
    
    # Get related entities
    entity_ids = set([entity_id])
    for rel in relationships:
        entity_ids.add(rel['source_entity_id'])
        entity_ids.add(rel['target_entity_id'])
    
    entities = await db.entities.find({"id": {"$in": list(entity_ids)}}, {"_id": 0}).to_list(100)
    
    return {
        "entities": entities,
        "relationships": relationships
    }

@api_router.get("/entities/network/graph")
async def get_network_graph(current_user: User = Depends(get_current_user_from_token)):
    """Get full network graph for GNN visualization"""
    entities = await db.entities.find({}, {"_id": 0}).limit(50).to_list(50)
    relationships = await db.entity_relationships.find({}, {"_id": 0}).limit(100).to_list(100)
    
    # Run GNN analysis
    gnn_analysis = ml_engine.analyze_graph_network(entities, relationships)
    
    return {
        "nodes": entities,
        "edges": relationships,
        "analysis": gnn_analysis
    }

# ============== Case Management Routes ==============

@api_router.get("/cases", response_model=List[Case])
async def get_cases(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token)
):
    """Get cases"""
    query = {}
    if status:
        query["status"] = status
    
    cases = await db.cases.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for case in cases:
        if isinstance(case.get('created_at'), str):
            case['created_at'] = datetime.fromisoformat(case['created_at'])
        if isinstance(case.get('updated_at'), str):
            case['updated_at'] = datetime.fromisoformat(case['updated_at'])
    
    return cases

@api_router.post("/cases", response_model=Case)
async def create_case(case_data: CaseCreate, current_user: User = Depends(get_current_user_from_token)):
    """Create new case"""
    case_number = f"CASE-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    case = Case(
        case_number=case_number,
        title=case_data.title,
        description=case_data.description,
        status=CaseStatus.OPEN,
        priority=case_data.priority,
        entity_ids=case_data.entity_ids,
        transaction_ids=case_data.transaction_ids,
        created_by=current_user.id,
        timeline=[{
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "Case created",
            "user": current_user.full_name
        }]
    )
    
    case_doc = case.model_dump()
    case_doc['created_at'] = case_doc['created_at'].isoformat()
    case_doc['updated_at'] = case_doc['updated_at'].isoformat()
    
    await db.cases.insert_one(case_doc)
    await log_audit(current_user.id, current_user.email, "case_created", "case", case.id)
    
    return case

@api_router.patch("/cases/{case_id}", response_model=Case)
async def update_case(
    case_id: str,
    case_update: CaseUpdate,
    current_user: User = Depends(get_current_user_from_token)
):
    """Update case"""
    case = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    update_data = case_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Add to timeline
    timeline_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": f"Case updated: {', '.join(update_data.keys())}",
        "user": current_user.full_name
    }
    
    await db.cases.update_one(
        {"id": case_id},
        {
            "$set": update_data,
            "$push": {"timeline": timeline_entry}
        }
    )
    
    updated_case = await db.cases.find_one({"id": case_id}, {"_id": 0})
    
    if isinstance(updated_case.get('created_at'), str):
        updated_case['created_at'] = datetime.fromisoformat(updated_case['created_at'])
    if isinstance(updated_case.get('updated_at'), str):
        updated_case['updated_at'] = datetime.fromisoformat(updated_case['updated_at'])
    
    await log_audit(current_user.id, current_user.email, "case_updated", "case", case_id)
    
    return Case(**updated_case)

# ============== LTKM Report Routes ==============

@api_router.get("/ltkm/reports", response_model=List[LTKMReport])
async def get_ltkm_reports(current_user: User = Depends(get_current_user_from_token)):
    """Get LTKM reports"""
    reports = await db.ltkm_reports.find({}, {"_id": 0}).sort("generated_at", -1).to_list(100)
    
    for report in reports:
        if isinstance(report.get('generated_at'), str):
            report['generated_at'] = datetime.fromisoformat(report['generated_at'])
        if report.get('submitted_at') and isinstance(report['submitted_at'], str):
            report['submitted_at'] = datetime.fromisoformat(report['submitted_at'])
    
    return reports

@api_router.post("/ltkm/generate/{entity_id}")
async def generate_ltkm_report(entity_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Generate LTKM report for an entity"""
    # Get entity
    entity = await db.entities.find_one({"id": entity_id}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Get entity transactions
    transactions = await db.transactions.find(
        {"$or": [{"sender_id": entity_id}, {"receiver_id": entity_id}]},
        {"_id": 0}
    ).to_list(100)
    
    # Get risk scores
    risk_scores = await db.risk_scores.find({"entity_id": entity_id}, {"_id": 0}).to_list(10)
    
    # Calculate ML scores
    ml_scores = {
        'gnn_score': entity.get('risk_score', 0),
        'lstm_score': risk_scores[0].get('lstm_score', 0) if risk_scores else 0,
        'isolation_forest_score': risk_scores[0].get('isolation_forest_score', 0) if risk_scores else 0,
        'rule_based_score': 50
    }
    
    final_score, _ = ml_engine.ensemble_risk_scoring(ml_scores)
    
    # Generate report data
    report_data = ltkm_generator.generate_report_data(entity, transactions, ml_scores, final_score)
    
    # Save report
    report = LTKMReport(
        report_number=report_data['report_number'],
        entity_id=entity_id,
        transaction_ids=[tx['id'] for tx in transactions],
        suspicious_indicators=report_data['suspicious_indicators'],
        risk_score=final_score,
        report_data=report_data,
        generated_by=current_user.id
    )
    
    report_doc = report.model_dump()
    report_doc['generated_at'] = report_doc['generated_at'].isoformat()
    
    await db.ltkm_reports.insert_one(report_doc)
    await log_audit(current_user.id, current_user.email, "ltkm_generated", "ltkm_report", report.id)
    
    return report

@api_router.get("/ltkm/reports/{report_id}/pdf")
async def download_ltkm_pdf(report_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Download LTKM report as PDF"""
    report = await db.ltkm_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Generate PDF
    pdf_bytes = ltkm_generator.generate_report_pdf(report['report_data'])
    
    # Return as streaming response
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=LTKM_{report['report_number']}.pdf"
        }
    )

# ============== Alert Routes ==============

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token)
):
    """Get alerts"""
    query = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    
    for alert in alerts:
        if isinstance(alert.get('created_at'), str):
            alert['created_at'] = datetime.fromisoformat(alert['created_at'])
        if alert.get('acknowledged_at') and isinstance(alert['acknowledged_at'], str):
            alert['acknowledged_at'] = datetime.fromisoformat(alert['acknowledged_at'])
    
    return alerts

@api_router.patch("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Acknowledge an alert"""
    await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {
            "status": AlertStatus.ACKNOWLEDGED.value,
            "acknowledged_by": current_user.id,
            "acknowledged_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit(current_user.id, current_user.email, "alert_acknowledged", "alert", alert_id)
    
    return {"message": "Alert acknowledged"}

# ============== Watchlist Routes ==============

@api_router.get("/watchlist", response_model=List[WatchlistEntry])
async def get_watchlist(current_user: User = Depends(get_current_user_from_token)):
    """Get watchlist entries"""
    entries = await db.watchlist.find({}, {"_id": 0}).to_list(100)
    
    for entry in entries:
        if isinstance(entry.get('added_date'), str):
            entry['added_date'] = datetime.fromisoformat(entry['added_date'])
    
    return entries

@api_router.post("/watchlist/screen/{entity_id}")
async def screen_entity(entity_id: str, current_user: User = Depends(get_current_user_from_token)):
    """Screen entity against watchlist"""
    entity = await db.entities.find_one({"id": entity_id}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Simple name matching (in production, use fuzzy matching)
    watchlist_entries = await db.watchlist.find({}, {"_id": 0}).to_list(1000)
    
    matches = []
    entity_name = entity['name'].lower()
    
    for entry in watchlist_entries:
        if entry['entity_name'].lower() in entity_name or entity_name in entry['entity_name'].lower():
            matches.append(entry)
    
    # Update entity if match found
    if matches:
        await db.entities.update_one(
            {"id": entity_id},
            {"$set": {"watchlist_match": True}}
        )
        
        # Create alert
        alert_doc = Alert(
            alert_type="watchlist_match",
            severity=RiskLevel.CRITICAL,
            title="Watchlist Match Detected",
            message=f"Entity {entity['name']} matches {len(matches)} watchlist entries",
            entity_id=entity_id
        ).model_dump()
        alert_doc['created_at'] = alert_doc['created_at'].isoformat()
        await db.alerts.insert_one(alert_doc)
    
    await log_audit(current_user.id, current_user.email, "watchlist_screening", "entity", entity_id)
    
    return {
        "entity_id": entity_id,
        "matches": len(matches),
        "match_details": matches
    }

# ============== Intelligence Routes ==============

@api_router.get("/intelligence/threats", response_model=List[ThreatIntelligence])
async def get_threat_intelligence(current_user: User = Depends(get_current_user_from_token)):
    """Get threat intelligence feed"""
    threats = await db.threat_intelligence.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    
    for threat in threats:
        if isinstance(threat.get('created_at'), str):
            threat['created_at'] = datetime.fromisoformat(threat['created_at'])
        if threat.get('expires_at') and isinstance(threat['expires_at'], str):
            threat['expires_at'] = datetime.fromisoformat(threat['expires_at'])
    
    return threats

# ============== Audit Log Routes ==============

@api_router.get("/audit/logs", response_model=List[AuditLog])
async def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(get_current_user_from_token)
):
    """Get audit logs (Auditor/Admin only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

# ============== User Management Routes ==============

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user_from_token)):
    """Get all users (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).to_list(100)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

# ============== Data Initialization Routes ==============

@api_router.post("/admin/init-data")
async def initialize_data(current_user: User = Depends(get_current_user_from_token)):
    """Initialize dummy data (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if data already exists
    existing_count = await db.entities.count_documents({})
    if existing_count > 0:
        return {"message": "Data already initialized", "entities": existing_count}
    
    # Generate dummy data
    entities = data_generator.generate_entities(50)
    transactions = data_generator.generate_transactions(entities, 200)
    crypto_txs = data_generator.generate_crypto_transactions(50)
    relationships = data_generator.generate_relationships(entities, 100)
    watchlist = data_generator.generate_watchlist_entries(20)
    
    # Insert entities
    for entity in entities:
        entity_doc = entity.model_dump()
        entity_doc['created_at'] = entity_doc['created_at'].isoformat()
        await db.entities.insert_one(entity_doc)
    
    # Insert transactions
    for tx in transactions:
        tx_doc = tx.model_dump()
        tx_doc['timestamp'] = tx_doc['timestamp'].isoformat()
        await db.transactions.insert_one(tx_doc)
    
    # Insert crypto transactions
    for crypto_tx in crypto_txs:
        crypto_doc = crypto_tx.model_dump()
        crypto_doc['timestamp'] = crypto_doc['timestamp'].isoformat()
        await db.crypto_transactions.insert_one(crypto_doc)
    
    # Insert relationships
    for rel in relationships:
        rel_doc = rel.model_dump()
        rel_doc['created_at'] = rel_doc['created_at'].isoformat()
        await db.entity_relationships.insert_one(rel_doc)
    
    # Insert watchlist
    for entry in watchlist:
        entry_doc = entry.model_dump()
        entry_doc['added_date'] = entry_doc['added_date'].isoformat()
        await db.watchlist.insert_one(entry_doc)
    
    # Generate some threat intelligence
    threat_intel = [
        ThreatIntelligence(
            source="BSSN",
            intel_type="cyber",
            title="New Phishing Campaign Targeting Financial Institutions",
            description="A sophisticated phishing campaign has been detected targeting Indonesian banks",
            severity=RiskLevel.HIGH,
            indicators=["phishing", "credential_theft", "banking"]
        ),
        ThreatIntelligence(
            source="PPATK",
            intel_type="financial",
            title="Increased Money Laundering Activity via Crypto",
            description="Significant increase in crypto-based money laundering detected",
            severity=RiskLevel.CRITICAL,
            indicators=["cryptocurrency", "money_laundering", "chain_hopping"]
        )
    ]
    
    for intel in threat_intel:
        intel_doc = intel.model_dump()
        intel_doc['created_at'] = intel_doc['created_at'].isoformat()
        if intel_doc.get('expires_at'):
            intel_doc['expires_at'] = intel_doc['expires_at'].isoformat()
        await db.threat_intelligence.insert_one(intel_doc)
    
    await log_audit(current_user.id, current_user.email, "data_initialized", "system", None)
    
    return {
        "message": "Data initialized successfully",
        "entities": len(entities),
        "transactions": len(transactions),
        "crypto_transactions": len(crypto_txs),
        "relationships": len(relationships),
        "watchlist_entries": len(watchlist)
    }

# ============== Helper Functions ==============

async def log_audit(user_id: str, user_email: str, action: str, resource_type: str, resource_id: Optional[str]):
    """Log audit entry"""
    audit_log = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id
    )
    
    audit_doc = audit_log.model_dump()
    audit_doc['timestamp'] = audit_doc['timestamp'].isoformat()
    
    await db.audit_logs.insert_one(audit_doc)

# ============== Root Route ==============

@api_router.get("/")
async def root():
    return {
        "message": "SATRIA API v1.0.0",
        "description": "Financial Intelligence & Anti-Money Laundering System",
        "status": "operational"
    }

# ============== Health Check ==============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
