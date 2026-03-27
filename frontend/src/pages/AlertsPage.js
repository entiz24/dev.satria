import React, { useEffect, useState } from 'react';
import { alertsAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { getRiskLevelColor, formatDate } from '../utils/helpers';
import { AlertTriangle, Check } from 'lucide-react';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('new');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const response = await alertsAPI.getAll({ status: filter });
      setAlerts(response.data);
    } catch (error) {
      toast.error('Gagal memuat alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsAPI.acknowledge(alertId);
      toast.success('Alert acknowledged');
      loadAlerts();
    } catch (error) {
      toast.error('Gagal acknowledge alert');
    }
  };

  return (
    <div data-testid="alerts-page">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-2">
          Alerts
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Real-time Alert Management
        </p>
      </div>

      {/* Filter Buttons */}
      <Card className="mb-6 p-4 bg-card border border-white/10">
        <div className="flex gap-2 flex-wrap">
          {['new', 'acknowledged', 'resolved'].map(status => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              className="font-semibold uppercase"
              data-testid={`filter-${status}-button`}
            >
              {status}
            </Button>
          ))}
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8">
            <p className="text-sm font-mono text-muted-foreground">Loading...</p>
          </div>
        ) : alerts.length === 0 ? (
          <Card className="p-8 text-center bg-card border border-white/10">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-mono text-muted-foreground">Tidak ada alerts</p>
          </Card>
        ) : (
          alerts.map((alert, idx) => (
            <Card key={alert.id} className="p-6 bg-card border border-white/10 hover:border-primary/50 transition-all" data-testid={`alert-card-${idx}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <Badge className={`${getRiskLevelColor(alert.severity)} px-3 py-1`}>
                      {alert.severity}
                    </Badge>
                    <Badge className="bg-white/5 text-foreground border border-white/10 px-3 py-1">
                      {alert.alert_type}
                    </Badge>
                    <Badge className={`${alert.status === 'new' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'} px-3 py-1`}>
                      {alert.status}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 text-foreground">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>

                  {alert.entity_id && (
                    <p className="text-xs font-mono bg-white/5 inline-block px-2 py-1 mb-2 text-muted-foreground rounded">
                      Entity: {alert.entity_id.substring(0, 12)}...
                    </p>
                  )}

                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created {formatDate(alert.created_at)}
                  </p>
                </div>

                {alert.status === 'new' && (
                  <Button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="bg-primary hover:bg-primary/90 font-semibold uppercase shrink-0"
                    data-testid={`acknowledge-alert-${idx}`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
