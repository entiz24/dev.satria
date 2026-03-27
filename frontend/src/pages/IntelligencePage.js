import React, { useEffect, useState } from 'react';
import { intelligenceAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { getRiskLevelColor, formatDate } from '../utils/helpers';
import { Shield, Activity } from 'lucide-react';

const IntelligencePage = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreats();
  }, []);

  const loadThreats = async () => {
    try {
      const response = await intelligenceAPI.getThreats();
      setThreats(response.data);
    } catch (error) {
      toast.error('Gagal memuat intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const cyberThreats = threats.filter(t => t.intel_type === 'cyber');
  const financialThreats = threats.filter(t => t.intel_type === 'financial');

  return (
    <div data-testid="intelligence-page">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Intelligence Fusion
        </h1>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Cyber-Financial Intelligence Center
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E5E5E5] border-2 border-[#0A0A0A] mb-8">
        <Card className="bg-white p-6 border-0 rounded-none" data-testid="cyber-intel-widget">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-[#002FA7]" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">
                Cyber Threat Intelligence
              </h2>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                BSSN Feed
              </p>
            </div>
          </div>
          <p className="text-4xl font-black font-mono">{cyberThreats.length}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mt-2">
            Active Threats
          </p>
        </Card>

        <Card className="bg-white p-6 border-0 rounded-none" data-testid="financial-intel-widget">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-8 w-8 text-[#002FA7]" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">
                Financial Intelligence
              </h2>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                PPATK Feed
              </p>
            </div>
          </div>
          <p className="text-4xl font-black font-mono">{financialThreats.length}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mt-2">
            ML/TF Indicators
          </p>
        </Card>
      </div>

      {/* Threats Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cyber Threats */}
        <div>
          <h3 className="text-xl font-bold uppercase tracking-tight mb-4">
            Cyber Threats (BSSN)
          </h3>
          <div className="space-y-4">
            {cyberThreats.length === 0 ? (
              <Card className="p-6 border-2 border-[#0A0A0A] rounded-none text-center">
                <p className="text-sm font-mono">No cyber threats</p>
              </Card>
            ) : (
              cyberThreats.map((threat, idx) => (
                <Card key={threat.id} className="p-6 border-2 border-[#0A0A0A] rounded-none" data-testid={`cyber-threat-${idx}`}>
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${getRiskLevelColor(threat.severity)} rounded-none`}>
                      {threat.severity}
                    </Badge>
                    <span className="text-xs uppercase tracking-wide font-bold text-muted-foreground">
                      {threat.source}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mb-2">{threat.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{threat.description}</p>
                  {threat.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {threat.indicators.map((indicator, i) => (
                        <span key={i} className="text-xs font-mono bg-[#F7F7F7] px-2 py-1">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Financial Threats */}
        <div>
          <h3 className="text-xl font-bold uppercase tracking-tight mb-4">
            Financial Intelligence (PPATK)
          </h3>
          <div className="space-y-4">
            {financialThreats.length === 0 ? (
              <Card className="p-6 border-2 border-[#0A0A0A] rounded-none text-center">
                <p className="text-sm font-mono">No financial threats</p>
              </Card>
            ) : (
              financialThreats.map((threat, idx) => (
                <Card key={threat.id} className="p-6 border-2 border-[#0A0A0A] rounded-none" data-testid={`financial-threat-${idx}`}>
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${getRiskLevelColor(threat.severity)} rounded-none`}>
                      {threat.severity}
                    </Badge>
                    <span className="text-xs uppercase tracking-wide font-bold text-muted-foreground">
                      {threat.source}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mb-2">{threat.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{threat.description}</p>
                  {threat.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {threat.indicators.map((indicator, i) => (
                        <span key={i} className="text-xs font-mono bg-[#F7F7F7] px-2 py-1">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligencePage;
