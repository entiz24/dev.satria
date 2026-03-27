import React, { useEffect, useState } from 'react';
import { entitiesAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { getRiskLevelColor } from '../utils/helpers';
import { Users, Building2, Network } from 'lucide-react';

const EntitiesPage = () => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      const response = await entitiesAPI.getAll();
      setEntities(response.data);
    } catch (error) {
      toast.error('Gagal memuat entitas');
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkGraph = async () => {
    try {
      const response = await entitiesAPI.getNetworkGraph();
      setGraphData(response.data);
      toast.success('Network graph loaded');
    } catch (error) {
      toast.error('Gagal memuat network graph');
    }
  };

  const getRiskLevel = (score) => {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  };

  return (
    <div data-testid="entities-page">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-2">
            Entities
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Entity Registry & Network Analysis
          </p>
        </div>
        <Button
          onClick={loadNetworkGraph}
          className="bg-primary hover:bg-primary/90 font-semibold uppercase"
          data-testid="load-graph-button"
        >
          <Network className="h-4 w-4 mr-2" />
          View Network Graph
        </Button>
      </div>

      {/* Entity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center">
            <p className="text-sm font-mono text-muted-foreground">Loading...</p>
          </div>
        ) : entities.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <p className="text-sm font-mono text-muted-foreground">Tidak ada entitas ditemukan</p>
          </div>
        ) : (
          entities.slice(0, 30).map((entity, idx) => (
            <Card key={entity.id} className="bg-card border border-white/10 p-6 hover:border-primary/50 transition-all" data-testid={`entity-card-${idx}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {entity.entity_type === 'company' ? (
                      <Building2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Users className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs uppercase font-semibold tracking-wide text-muted-foreground">
                      {entity.entity_type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-foreground">{entity.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{entity.identifier}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                  <span className="text-xs uppercase font-semibold text-muted-foreground">Risk Score</span>
                  <Badge className={`${getRiskLevelColor(getRiskLevel(entity.risk_score))} text-xs`}>
                    {entity.risk_score.toFixed(1)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                  <span className="text-xs uppercase font-semibold text-muted-foreground">KYC</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${entity.kyc_verified ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>
                    {entity.kyc_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                {entity.watchlist_match && (
                  <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md">
                    <p className="text-xs font-semibold uppercase">⚠ Watchlist Match</p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Graph Analysis */}
      {graphData && (
        <Card className="mt-8 p-6 bg-card border border-white/10" data-testid="graph-analysis-card">
          <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">
            Graph Neural Network Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded-md">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">
                Nodes (Entities)
              </p>
              <p className="text-3xl font-black font-mono text-foreground">{graphData.analysis.node_count}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-md">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">
                Edges (Relationships)
              </p>
              <p className="text-3xl font-black font-mono text-foreground">{graphData.analysis.edge_count}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-md">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">
                Suspicious Patterns
              </p>
              <p className="text-3xl font-black font-mono text-foreground">{graphData.analysis.suspicious_patterns?.length || 0}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EntitiesPage;
