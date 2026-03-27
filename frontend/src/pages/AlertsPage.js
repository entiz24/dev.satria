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
        <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Alerts
        </h1>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Real-time Alert Management
        </p>
      </div>

      {/* Filter Buttons */}
      <Card className="mb-6 p-4 border-2 border-[#0A0A0A] rounded-none">
        <div className="flex gap-2">
          {['new', 'acknowledged', 'resolved'].map(status => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              className="rounded-none border-2 font-bold uppercase"
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
            <p className="text-sm font-mono">Loading...</p>
          </div>
        ) : alerts.length === 0 ? (
          <Card className="p-8 text-center border-2 border-[#0A0A0A] rounded-none">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-mono">Tidak ada alerts</p>
          </Card>
        ) : (
          alerts.map((alert, idx) => (
            <Card key={alert.id} className="p-6 border-2 border-[#0A0A0A] rounded-none" data-testid={`alert-card-${idx}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={`${getRiskLevelColor(alert.severity)} rounded-none px-3 py-1`}>
                      {alert.severity}
                    </Badge>
                    <Badge className="bg-[#0A0A0A] text-white rounded-none px-3 py-1">
                      {alert.alert_type}
                    </Badge>
                    <Badge className={`${alert.status === 'new' ? 'bg-[#FFB703]' : 'bg-[#2A9D8F]'} text-white rounded-none px-3 py-1`}>
                      {alert.status}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>

                  {alert.entity_id && (
                    <p className="text-xs font-mono bg-[#F7F7F7] inline-block px-2 py-1 mb-2">
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
                    className="rounded-none bg-[#002FA7] hover:bg-[#0A0A0A] font-bold uppercase"
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
