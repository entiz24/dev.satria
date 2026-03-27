from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    REGULATOR = "regulator"
    AUDITOR = "auditor"

class TransactionType(str, Enum):
    TRANSFER = "transfer"
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    CRYPTO = "crypto"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CaseStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    PENDING_REVIEW = "pending_review"
    CLOSED = "closed"
    ESCALATED = "escalated"

class AlertStatus(str, Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# Transaction Models
class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_type: TransactionType
    amount: float
    currency: str = "IDR"
    sender_id: str
    receiver_id: str
    sender_name: str
    receiver_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    flagged: bool = False
    metadata: Optional[Dict[str, Any]] = None

class CryptoTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_address: str
    to_address: str
    amount: float
    cryptocurrency: str
    blockchain: str
    tx_hash: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    risk_score: Optional[float] = None
    cluster_id: Optional[str] = None
    chain_hopping_detected: bool = False

# Entity Models
class Entity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_type: str  # person, company, wallet
    name: str
    identifier: str  # ID number, tax number, wallet address
    kyc_verified: bool = False
    risk_score: float = 0.0
    watchlist_match: bool = False
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Relationship Models
class EntityRelationship(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_entity_id: str
    target_entity_id: str
    relationship_type: str  # transfer, ownership, control
    strength: float  # 0.0 to 1.0
    transaction_count: int = 0
    total_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Risk Scoring Models
class RiskScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_id: str
    transaction_id: Optional[str] = None
    overall_score: float  # 0-100
    gnn_score: Optional[float] = None
    lstm_score: Optional[float] = None
    isolation_forest_score: Optional[float] = None
    rule_based_score: Optional[float] = None
    risk_level: RiskLevel
    factors: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ML Detection Models
class MLDetection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    model_type: str  # gnn, lstm, isolation_forest, crypto_tracing
    entity_id: Optional[str] = None
    transaction_id: Optional[str] = None
    detection_score: float
    anomaly_type: Optional[str] = None
    patterns_detected: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Case Management Models
class Case(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_number: str
    title: str
    description: str
    status: CaseStatus
    priority: RiskLevel
    assigned_to: Optional[str] = None
    entity_ids: List[str] = []
    transaction_ids: List[str] = []
    evidence: List[Dict[str, Any]] = []
    timeline: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class CaseCreate(BaseModel):
    title: str
    description: str
    priority: RiskLevel
    entity_ids: List[str] = []
    transaction_ids: List[str] = []

class CaseUpdate(BaseModel):
    status: Optional[CaseStatus] = None
    assigned_to: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[RiskLevel] = None

# LTKM Report Models
class LTKMReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_number: str
    case_id: Optional[str] = None
    entity_id: str
    transaction_ids: List[str]
    suspicious_indicators: List[str]
    risk_score: float
    report_data: Dict[str, Any]
    generated_by: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    submitted: bool = False
    submitted_at: Optional[datetime] = None

# Alert Models
class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_type: str  # risk_threshold, watchlist_match, pattern_detected
    severity: RiskLevel
    title: str
    message: str
    entity_id: Optional[str] = None
    transaction_id: Optional[str] = None
    status: AlertStatus = AlertStatus.NEW
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None

# Watchlist Models
class WatchlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    list_type: str  # OFAC, UN, FATF, BNPT
    entity_name: str
    identifier: Optional[str] = None
    reason: str
    added_date: datetime = Field(default_factory=datetime.utcnow)

# Audit Log Models
class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Intelligence Models
class ThreatIntelligence(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str  # BSSN, PPATK
    intel_type: str  # cyber, financial
    title: str
    description: str
    severity: RiskLevel
    indicators: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

# Dashboard Stats Models
class DashboardStats(BaseModel):
    total_transactions: int
    flagged_transactions: int
    active_cases: int
    critical_alerts: int
    avg_risk_score: float
    transactions_today: int
    high_risk_entities: int
