import React, { useEffect, useState } from 'react';
import { dashboardAPI, alertsAPI } from '../services/api';
import { Card } from './ui/card';
import { AlertTriangle, TrendingUp, Users, FileText, Activity, Shield } from 'lucide-react';
import { getRiskLevelColor } from '../utils/helpers';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        dashboardAPI.getStats(),
        alertsAPI.getAll({ severity: 'critical', status: 'new' })
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm font-mono text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Transactions',
      value: stats?.total_transactions || 0,
      icon: Activity,
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      title: 'Flagged Transactions',
      value: stats?.flagged_transactions || 0,
      icon: AlertTriangle,
      gradient: 'from-red-500/20 to-orange-500/20'
    },
    {
      title: 'Active Cases',
      value: stats?.active_cases || 0,
      icon: FileText,
      gradient: 'from-yellow-500/20 to-amber-500/20'
    },
    {
      title: 'Avg Risk Score',
      value: `${stats?.avg_risk_score || 0}/100`,
      icon: TrendingUp,
      gradient: 'from-green-500/20 to-emerald-500/20'
    }
  ];

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-2">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Real-time Intelligence Overview
        </p>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 sm:p-6 bg-gradient-to-br bg-card border border-white/10 hover:border-primary/50 transition-all duration-200" data-testid={`stat-card-${idx}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">
                {stat.title}
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-foreground">
                {stat.value}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Alerts and Status - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
        <Card className="p-4 sm:p-6 bg-card border border-white/10" data-testid="critical-alerts-widget">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Critical Alerts
            </h2>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada alert kritis</p>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors" data-testid={`alert-${alert.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-1 text-xs font-semibold uppercase ${getRiskLevelColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-card border border-white/10" data-testid="system-status-widget">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              AI/ML System Status
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Graph Neural Network', status: 'Active' },
              { name: 'LSTM Sequence Model', status: 'Running' },
              { name: 'Isolation Forest', status: 'Running' },
              { name: 'Crypto Tracing Engine', status: 'Active' },
              { name: 'Risk Scoring Engine', status: 'Active' }
            ].map((system, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm font-medium text-foreground">{system.name}</span>
                <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-semibold uppercase rounded">
                  {system.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Intelligence Fusion - Responsive */}
      <Card className="p-4 sm:p-6 bg-card border border-white/10" data-testid="intelligence-fusion-widget">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6">
          Intelligence Fusion Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  Cyber Threat Intelligence
                </p>
                <p className="text-sm text-foreground">BSSN Feed</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm text-muted-foreground">Active Threats</span>
                <span className="font-mono font-bold text-foreground">23</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm text-muted-foreground">IOCs Detected</span>
                <span className="font-mono font-bold text-foreground">45</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  Financial Intelligence
                </p>
                <p className="text-sm text-foreground">PPATK Feed</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm text-muted-foreground">Watchlist Hits</span>
                <span className="font-mono font-bold text-foreground">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm text-muted-foreground">ML/TF Typologies</span>
                <span className="font-mono font-bold text-foreground">8</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
