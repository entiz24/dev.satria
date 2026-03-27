import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any, Tuple
import networkx as nx
from datetime import datetime, timedelta
import random

class MLEngine:
    """AI/ML Detection Engine for SATRIA System"""
    
    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.trained = False
        
    def train_isolation_forest(self, transaction_data: List[Dict[str, Any]]):
        """Train Isolation Forest model on transaction data"""
        if not transaction_data:
            return
        
        # Extract features
        features = []
        for tx in transaction_data:
            features.append([
                tx.get('amount', 0),
                tx.get('transaction_count', 0),
                tx.get('hour_of_day', 0),
                tx.get('day_of_week', 0),
            ])
        
        X = np.array(features)
        X_scaled = self.scaler.fit_transform(X)
        self.isolation_forest.fit(X_scaled)
        self.trained = True
    
    def detect_anomalies(self, transaction: Dict[str, Any]) -> Tuple[float, bool]:
        """Detect anomalies using Isolation Forest"""
        if not self.trained:
            # Return random score for demo
            score = random.uniform(0, 100)
            is_anomaly = score > 70
            return score, is_anomaly
        
        features = np.array([[
            transaction.get('amount', 0),
            transaction.get('transaction_count', 0),
            transaction.get('hour_of_day', 0),
            transaction.get('day_of_week', 0),
        ]])
        
        X_scaled = self.scaler.transform(features)
        prediction = self.isolation_forest.predict(X_scaled)
        anomaly_score = self.isolation_forest.score_samples(X_scaled)
        
        # Convert to 0-100 scale (higher is more suspicious)
        normalized_score = (1 - (anomaly_score[0] + 0.5)) * 100
        normalized_score = max(0, min(100, normalized_score))
        
        is_anomaly = prediction[0] == -1
        return normalized_score, is_anomaly
    
    def analyze_graph_network(self, entities: List[Dict], relationships: List[Dict]) -> Dict[str, Any]:
        """Graph Neural Network simulation - analyze entity relationships"""
        G = nx.DiGraph()
        
        # Add nodes
        for entity in entities:
            G.add_node(entity['id'], **entity)
        
        # Add edges
        for rel in relationships:
            G.add_edge(
                rel['source_entity_id'],
                rel['target_entity_id'],
                weight=rel.get('strength', 1.0),
                transaction_count=rel.get('transaction_count', 0)
            )
        
        # Calculate metrics
        results = {
            'node_count': G.number_of_nodes(),
            'edge_count': G.number_of_edges(),
            'clusters': [],
            'suspicious_patterns': []
        }
        
        if G.number_of_nodes() > 0:
            # Detect communities (potential fraud rings)
            if G.number_of_edges() > 0:
                try:
                    # Calculate centrality metrics
                    degree_centrality = nx.degree_centrality(G)
                    betweenness = nx.betweenness_centrality(G)
                    
                    # Find highly connected nodes (potential money mules)
                    suspicious_nodes = []
                    for node_id, centrality in degree_centrality.items():
                        if centrality > 0.5:  # Highly connected
                            suspicious_nodes.append({
                                'entity_id': node_id,
                                'centrality': centrality,
                                'betweenness': betweenness.get(node_id, 0),
                                'risk_indicator': 'hub_node'
                            })
                    
                    results['suspicious_patterns'] = suspicious_nodes
                    
                    # Detect cycles (potential layering)
                    try:
                        cycles = list(nx.simple_cycles(G))
                        if len(cycles) > 0:
                            results['suspicious_patterns'].append({
                                'pattern': 'circular_transactions',
                                'cycle_count': len(cycles),
                                'description': 'Potential layering detected'
                            })
                    except:
                        pass
                        
                except Exception as e:
                    print(f"Graph analysis error: {e}")
        
        return results
    
    def analyze_sequence_patterns(self, transactions: List[Dict]) -> Dict[str, Any]:
        """LSTM-style sequence analysis simulation"""
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
            time_diffs = []
            for i in range(1, min(len(sorted_txs), 6)):
                try:
                    t1 = sorted_txs[i-1].get('timestamp')
                    t2 = sorted_txs[i].get('timestamp')
                    if isinstance(t1, str):
                        t1 = datetime.fromisoformat(t1)
                    if isinstance(t2, str):
                        t2 = datetime.fromisoformat(t2)
                    diff = (t2 - t1).total_seconds() / 60  # minutes
                    time_diffs.append(diff)
                except:
                    pass
            
            if time_diffs and np.mean(time_diffs) < 5:  # Less than 5 min average
                patterns_detected.append('rapid_succession')
                risk_score += 25
        
        # Detect unusual amounts
        amounts = [tx.get('amount', 0) for tx in sorted_txs]
        if amounts:
            avg_amount = np.mean(amounts)
            std_amount = np.std(amounts)
            
            unusual_txs = [amt for amt in amounts if amt > avg_amount + 2 * std_amount]
            if len(unusual_txs) > 0:
                patterns_detected.append('unusual_amount_pattern')
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
        """Crypto wallet tracing and chain-hopping detection"""
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
        
        # Clustering (simplified)
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
        """Ensemble risk scoring - weighted combination of all models"""
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

# Global ML engine instance
ml_engine = MLEngine()
