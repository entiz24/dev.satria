"""
Lightweight ML Engine for SATRIA System
Rule-based scoring without heavy ML dependencies
Optimized for deployment on resource-constrained environments
"""

import random
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import json

class MLEngine:
    """Lightweight AI/ML Detection Engine for SATRIA System"""
    
    def __init__(self):
        self.trained = True  # Always ready
        
    def detect_anomalies(self, transaction: Dict[str, Any]) -> Tuple[float, bool]:
        """Detect anomalies using rule-based scoring"""
        score = 0.0
        
        # High amount transactions
        amount = transaction.get('amount', 0)
        if amount > 100000000:  # > 100M IDR
            score += 30
        elif amount > 50000000:  # > 50M IDR
            score += 20
        elif amount > 10000000:  # > 10M IDR
            score += 10
            
        # Round amounts (potential smurfing)
        if amount % 1000000 == 0 and amount > 0:
            score += 15
            
        # Transaction metadata checks
        metadata = transaction.get('metadata', {})
        if metadata:
            # Late night transactions (22:00 - 05:00)
            if 'timestamp' in transaction:
                try:
                    ts = transaction['timestamp']
                    if isinstance(ts, str):
                        ts = datetime.fromisoformat(ts)
                    hour = ts.hour
                    if 22 <= hour or hour <= 5:
                        score += 10
                except:
                    pass
        
        # Normalize to 0-100 scale
        final_score = min(score, 100)
        is_anomaly = final_score > 70
        
        return final_score, is_anomaly
    
    def analyze_graph_network(self, entities: List[Dict], relationships: List[Dict]) -> Dict[str, Any]:
        """Graph analysis using simple connectivity metrics"""
        results = {
            'node_count': len(entities),
            'edge_count': len(relationships),
            'clusters': [],
            'suspicious_patterns': []
        }
        
        if not entities or not relationships:
            return results
        
        # Build adjacency map
        entity_connections = {}
        for entity in entities:
            entity_connections[entity['id']] = 0
            
        for rel in relationships:
            source = rel.get('source_entity_id')
            target = rel.get('target_entity_id')
            if source in entity_connections:
                entity_connections[source] += 1
            if target in entity_connections:
                entity_connections[target] += 1
        
        # Find highly connected nodes (potential hubs)
        avg_connections = sum(entity_connections.values()) / len(entity_connections) if entity_connections else 0
        
        for entity_id, connections in entity_connections.items():
            if connections > avg_connections * 2:  # More than 2x average
                results['suspicious_patterns'].append({
                    'entity_id': entity_id,
                    'connections': connections,
                    'risk_indicator': 'hub_node',
                    'score': min(50 + connections * 5, 100)
                })
        
        # Detect potential circular patterns
        if len(relationships) > 3:
            results['suspicious_patterns'].append({
                'pattern': 'potential_layering',
                'description': 'Multiple interconnected entities detected',
                'score': 40
            })
        
        return results
    
    def analyze_sequence_patterns(self, transactions: List[Dict]) -> Dict[str, Any]:
        """LSTM-style sequence analysis using rule-based patterns"""
        if not transactions:
            return {'patterns': [], 'risk_score': 0}
        
        # Sort by timestamp
        sorted_txs = sorted(transactions, key=lambda x: x.get('timestamp', datetime.now()))
        
        patterns_detected = []
        risk_score = 0
        
        # Detect structuring (multiple transactions just below reporting threshold)
        threshold = 100000000  # 100 million IDR
        near_threshold = [tx for tx in sorted_txs if threshold * 0.8 < tx.get('amount', 0) < threshold]
        
        if len(near_threshold) >= 3:
            patterns_detected.append('structuring_detected')
            risk_score += 30
        
        # Detect rapid succession transactions
        if len(sorted_txs) >= 5:
            rapid_count = 0
            for i in range(1, min(len(sorted_txs), 6)):
                try:
                    t1 = sorted_txs[i-1].get('timestamp')
                    t2 = sorted_txs[i].get('timestamp')
                    if isinstance(t1, str):
                        t1 = datetime.fromisoformat(t1)
                    if isinstance(t2, str):
                        t2 = datetime.fromisoformat(t2)
                    diff_minutes = (t2 - t1).total_seconds() / 60
                    if diff_minutes < 10:  # Less than 10 minutes
                        rapid_count += 1
                except:
                    pass
            
            if rapid_count >= 3:
                patterns_detected.append('rapid_succession')
                risk_score += 25
        
        # Detect unusual amounts using simple statistics
        amounts = [tx.get('amount', 0) for tx in sorted_txs if tx.get('amount', 0) > 0]
        if len(amounts) > 3:
            avg_amount = sum(amounts) / len(amounts)
            max_amount = max(amounts)
            
            if max_amount > avg_amount * 3:  # 3x more than average
                patterns_detected.append('unusual_amount_spike')
                risk_score += 20
        
        # Detect round amounts (potential smurfing)
        round_amounts = [tx for tx in sorted_txs if tx.get('amount', 0) % 1000000 == 0]
        if len(round_amounts) >= 3:
            patterns_detected.append('round_amount_smurfing')
            risk_score += 15
        
        return {
            'patterns': patterns_detected,
            'risk_score': min(risk_score, 100),
            'transaction_count': len(sorted_txs),
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
    
    def trace_crypto_wallet(self, wallet_address: str, transactions: List[Dict]) -> Dict[str, Any]:
        """Crypto wallet tracing using pattern detection"""
        # Filter transactions for this wallet
        wallet_txs = [
            tx for tx in transactions 
            if tx.get('from_address') == wallet_address or tx.get('to_address') == wallet_address
        ]
        
        if not wallet_txs:
            return {
                'wallet_address': wallet_address,
                'chain_hopping': False,
                'risk_score': 0,
                'cluster_id': None
            }
        
        # Detect chain-hopping (multiple blockchains)
        blockchains_used = set(tx.get('blockchain', 'unknown') for tx in wallet_txs)
        chain_hopping = len(blockchains_used) > 1
        
        # Simple clustering based on address pattern
        cluster_id = f"cluster_{hash(wallet_address) % 1000}"
        
        # Calculate risk
        risk_score = 20 if chain_hopping else 5
        
        # Check for rapid movements
        if len(wallet_txs) > 10:
            risk_score += 15
        
        # Check for large amounts
        total_volume = sum(tx.get('amount', 0) for tx in wallet_txs)
        if total_volume > 1000000:  # Arbitrary threshold
            risk_score += 20
        
        # Check for suspicious patterns
        if len(blockchains_used) > 2:
            risk_score += 15
        
        return {
            'wallet_address': wallet_address,
            'chain_hopping': chain_hopping,
            'blockchains': list(blockchains_used),
            'transaction_count': len(wallet_txs),
            'total_volume': total_volume,
            'risk_score': min(risk_score, 100),
            'cluster_id': cluster_id
        }
    
    def ensemble_risk_scoring(self, scores: Dict[str, float]) -> Tuple[float, str]:
        """Ensemble risk scoring - weighted combination of all detection methods"""
        weights = {
            'gnn_score': 0.25,
            'lstm_score': 0.25,
            'isolation_forest_score': 0.25,
            'rule_based_score': 0.25
        }
        
        weighted_sum = 0
        total_weight = 0
        
        for model, weight in weights.items():
            if model in scores and scores[model] is not None:
                weighted_sum += scores[model] * weight
                total_weight += weight
        
        if total_weight == 0:
            final_score = 0
        else:
            final_score = weighted_sum / total_weight
        
        # Determine risk level
        if final_score >= 75:
            risk_level = 'critical'
        elif final_score >= 50:
            risk_level = 'high'
        elif final_score >= 25:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return final_score, risk_level
    
    def train_isolation_forest(self, transaction_data: List[Dict[str, Any]]):
        """Mock training - no actual ML training needed"""
        pass  # No-op for lightweight version

# Global ML engine instance
ml_engine = MLEngine()
