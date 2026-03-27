import random
from datetime import datetime, timedelta, timezone
from typing import List
import uuid
from models import (
    Transaction, CryptoTransaction, Entity, EntityRelationship,
    TransactionType, RiskLevel, WatchlistEntry
)

class DummyDataGenerator:
    """Generate realistic dummy data for SATRIA system"""
    
    def __init__(self):
        self.indonesian_names = [
            "Budi Santoso", "Siti Nurhaliza", "Ahmad Rizki", "Dewi Lestari",
            "Eko Prasetyo", "Rina Wijaya", "Joko Widodo", "Maya Sari",
            "Agus Setiawan", "Linda Kartini", "Bambang Sutopo", "Ayu Ting Ting",
            "Doni Pratama", "Fitri Handayani", "Hendra Gunawan", "Ratna Sari"
        ]
        
        self.company_names = [
            "PT Maju Jaya", "PT Sejahtera Abadi", "CV Karya Mandiri",
            "PT Global Indo", "PT Nusantara Prima", "CV Berkah Sentosa"
        ]
        
        self.cryptocurrencies = ["BTC", "ETH", "USDT", "BNB", "XRP"]
        self.blockchains = ["Bitcoin", "Ethereum", "Binance Smart Chain", "Polygon"]
    
    def generate_entity_id(self) -> str:
        return f"ENT-{str(uuid.uuid4())[:8].upper()}"
    
    def generate_wallet_address(self, blockchain: str = "Ethereum") -> str:
        if blockchain in ["Ethereum", "Binance Smart Chain", "Polygon"]:
            return "0x" + "".join(random.choices("0123456789abcdef", k=40))
        else:  # Bitcoin
            return "1" + "".join(random.choices("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", k=33))
    
    def generate_entities(self, count: int = 50) -> List[Entity]:
        """Generate dummy entities (persons and companies)"""
        entities = []
        
        for i in range(count):
            is_company = random.random() > 0.7
            
            if is_company:
                entity = Entity(
                    id=self.generate_entity_id(),
                    entity_type="company",
                    name=random.choice(self.company_names),
                    identifier=f"NPWP-{random.randint(100000000000, 999999999999)}",
                    kyc_verified=random.random() > 0.2,
                    risk_score=random.uniform(0, 100),
                    watchlist_match=random.random() > 0.95,
                    metadata={
                        "industry": random.choice(["Trading", "Manufacturing", "Services", "Technology"]),
                        "registration_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(100, 3650))).isoformat()
                    }
                )
            else:
                entity = Entity(
                    id=self.generate_entity_id(),
                    entity_type="person",
                    name=random.choice(self.indonesian_names),
                    identifier=f"NIK-{random.randint(1000000000000000, 9999999999999999)}",
                    kyc_verified=random.random() > 0.3,
                    risk_score=random.uniform(0, 100),
                    watchlist_match=random.random() > 0.98,
                    metadata={
                        "age": random.randint(18, 70),
                        "occupation": random.choice(["Employee", "Business Owner", "Trader", "Professional"])
                    }
                )
            
            entities.append(entity)
        
        return entities
    
    def generate_transactions(self, entities: List[Entity], count: int = 200) -> List[Transaction]:
        """Generate dummy financial transactions"""
        transactions = []
        
        for i in range(count):
            sender = random.choice(entities)
            receiver = random.choice([e for e in entities if e.id != sender.id])
            
            tx_type = random.choice(list(TransactionType))
            if tx_type == TransactionType.CRYPTO:
                tx_type = TransactionType.TRANSFER
            
            # Generate realistic amounts
            amount_ranges = [
                (1000000, 10000000, 0.5),  # 1M - 10M (50%)
                (10000000, 50000000, 0.3),  # 10M - 50M (30%)
                (50000000, 200000000, 0.15),  # 50M - 200M (15%)
                (200000000, 1000000000, 0.05)  # 200M - 1B (5%)
            ]
            
            rand = random.random()
            cumsum = 0
            for min_amt, max_amt, prob in amount_ranges:
                cumsum += prob
                if rand < cumsum:
                    amount = random.uniform(min_amt, max_amt)
                    break
            
            # Timestamp within last 30 days
            timestamp = datetime.now(timezone.utc) - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            transaction = Transaction(
                transaction_type=tx_type,
                amount=round(amount, 2),
                currency="IDR",
                sender_id=sender.id,
                receiver_id=receiver.id,
                sender_name=sender.name,
                receiver_name=receiver.name,
                timestamp=timestamp,
                description=f"{tx_type.value} transaction",
                metadata={
                    "channel": random.choice(["Mobile Banking", "Internet Banking", "ATM", "Branch"]),
                    "reference": f"TRX{random.randint(100000, 999999)}"
                }
            )
            
            transactions.append(transaction)
        
        return transactions
    
    def generate_crypto_transactions(self, count: int = 50) -> List[CryptoTransaction]:
        """Generate dummy cryptocurrency transactions"""
        crypto_txs = []
        
        for i in range(count):
            blockchain = random.choice(self.blockchains)
            crypto = random.choice(self.cryptocurrencies)
            
            tx = CryptoTransaction(
                from_address=self.generate_wallet_address(blockchain),
                to_address=self.generate_wallet_address(blockchain),
                amount=random.uniform(0.1, 100),
                cryptocurrency=crypto,
                blockchain=blockchain,
                tx_hash="0x" + "".join(random.choices("0123456789abcdef", k=64)),
                timestamp=datetime.now(timezone.utc) - timedelta(
                    days=random.randint(0, 30),
                    hours=random.randint(0, 23)
                ),
                chain_hopping_detected=random.random() > 0.9
            )
            
            crypto_txs.append(tx)
        
        return crypto_txs
    
    def generate_relationships(self, entities: List[Entity], count: int = 100) -> List[EntityRelationship]:
        """Generate entity relationships based on transactions"""
        relationships = []
        used_pairs = set()
        
        for i in range(count):
            source = random.choice(entities)
            target = random.choice([e for e in entities if e.id != source.id])
            
            pair = tuple(sorted([source.id, target.id]))
            if pair in used_pairs:
                continue
            
            used_pairs.add(pair)
            
            relationship = EntityRelationship(
                source_entity_id=source.id,
                target_entity_id=target.id,
                relationship_type=random.choice(["transfer", "ownership", "control", "business_partner"]),
                strength=random.uniform(0.1, 1.0),
                transaction_count=random.randint(1, 50),
                total_amount=random.uniform(1000000, 500000000)
            )
            
            relationships.append(relationship)
        
        return relationships
    
    def generate_watchlist_entries(self, count: int = 20) -> List[WatchlistEntry]:
        """Generate watchlist entries"""
        watchlist = []
        
        list_types = ["OFAC", "UN Security Council", "FATF", "BNPT"]
        reasons = [
            "Terrorism financing",
            "Money laundering",
            "Sanctions violation",
            "Drug trafficking",
            "Fraud"
        ]
        
        for i in range(count):
            entry = WatchlistEntry(
                list_type=random.choice(list_types),
                entity_name=random.choice(self.indonesian_names + self.company_names),
                identifier=f"ID-{random.randint(100000, 999999)}",
                reason=random.choice(reasons),
                added_date=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365))
            )
            watchlist.append(entry)
        
        return watchlist

# Global generator instance
data_generator = DummyDataGenerator()
