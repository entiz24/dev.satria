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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Entities
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Entity Registry & Network Analysis
          </p>
        </div>
        <Button
          onClick={loadNetworkGraph}
          className="rounded-none bg-[#002FA7] hover:bg-[#0A0A0A] font-bold uppercase"
          data-testid="load-graph-button"
        >
          <Network className="h-4 w-4 mr-2" />
          View Network Graph
        </Button>
      </div>

      {/* Entity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E5E5E5] border-2 border-[#0A0A0A]">
        {loading ? (
          <div className="col-span-full p-8 bg-white text-center">
            <p className="text-sm font-mono">Loading...</p>
          </div>
        ) : entities.length === 0 ? (
          <div className="col-span-full p-8 bg-white text-center">
            <p className="text-sm font-mono">Tidak ada entitas ditemukan</p>
          </div>
        ) : (
          entities.slice(0, 30).map((entity, idx) => (
            <Card key={entity.id} className="bg-white p-6 border-0 rounded-none" data-testid={`entity-card-${idx}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {entity.entity_type === 'company' ? (
                      <Building2 className="h-4 w-4 text-[#002FA7]" />
                    ) : (
                      <Users className="h-4 w-4 text-[#002FA7]" />
                    )}
                    <span className="text-xs uppercase font-bold tracking-wide">
                      {entity.entity_type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{entity.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{entity.identifier}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-[#F7F7F7]">
                  <span className="text-xs uppercase font-bold">Risk Score</span>
                  <Badge className={`${getRiskLevelColor(getRiskLevel(entity.risk_score))} rounded-none text-xs`}>
                    {entity.risk_score.toFixed(1)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#F7F7F7]">
                  <span className="text-xs uppercase font-bold">KYC</span>
                  <span className={`px-2 py-1 text-xs font-bold ${entity.kyc_verified ? 'bg-[#2A9D8F] text-white' : 'bg-gray-300 text-black'}`}>
                    {entity.kyc_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                {entity.watchlist_match && (
                  <div className="p-2 bg-[#E63946] text-white">
                    <p className="text-xs font-bold uppercase">⚠ Watchlist Match</p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Graph Analysis */}
      {graphData && (
        <Card className="mt-8 p-6 border-2 border-[#0A0A0A] rounded-none" data-testid="graph-analysis-card">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
            Graph Neural Network Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-[#F7F7F7]">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">
                Nodes (Entities)
              </p>
              <p className="text-3xl font-black font-mono">{graphData.analysis.node_count}</p>
            </div>
            <div className="p-4 bg-[#F7F7F7]">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">
                Edges (Relationships)
              </p>
              <p className="text-3xl font-black font-mono">{graphData.analysis.edge_count}</p>
            </div>
            <div className="p-4 bg-[#F7F7F7]">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">
                Suspicious Patterns
              </p>
              <p className="text-3xl font-black font-mono">{graphData.analysis.suspicious_patterns?.length || 0}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EntitiesPage;
