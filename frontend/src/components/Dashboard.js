import React, { useEffect, useState } from 'react';
import { dashboardAPI, alertsAPI } from '../services/api';
import { Card } from './ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Users, FileText, Activity } from 'lucide-react';
import { getRiskLevelColor, formatCurrency } from '../utils/helpers';
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
        <p className="text-sm font-mono">Loading...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Transactions',
      value: stats?.total_transactions || 0,
      icon: Activity,
      color: '#002FA7'
    },
    {
      title: 'Flagged Transactions',
      value: stats?.flagged_transactions || 0,
      icon: AlertTriangle,
      color: '#E63946'
    },
    {
      title: 'Active Cases',
      value: stats?.active_cases || 0,
      icon: FileText,
      color: '#FFB703'
    },
    {
      title: 'Avg Risk Score',
      value: `${stats?.avg_risk_score || 0}/100`,
      icon: TrendingUp,
      color: '#2A9D8F'
    }
  ];

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Real-time Intelligence Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#E5E5E5] border-2 border-[#0A0A0A] mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-white p-6 border-0 rounded-none" data-testid={`stat-card-${idx}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-black" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
                <Icon className="h-8 w-8" style={{ color: stat.color }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#E5E5E5] border-2 border-[#0A0A0A]">
        <Card className="bg-white p-6 border-0 rounded-none" data-testid="critical-alerts-widget">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
            Critical Alerts
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada alert kritis</p>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4 border-2 border-[#E5E5E5]" data-testid={`alert-${alert.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-bold uppercase ${getRiskLevelColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm font-bold">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-white p-6 border-0 rounded-none" data-testid="system-status-widget">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
            System Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#F7F7F7]">
              <span className="text-sm font-bold uppercase">ML Engine</span>
              <span className="px-3 py-1 bg-[#2A9D8F] text-white text-xs font-bold uppercase">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F7F7]">
              <span className="text-sm font-bold uppercase">GNN Model</span>
              <span className="px-3 py-1 bg-[#2A9D8F] text-white text-xs font-bold uppercase">Running</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F7F7]">
              <span className="text-sm font-bold uppercase">LSTM Model</span>
              <span className="px-3 py-1 bg-[#2A9D8F] text-white text-xs font-bold uppercase">Running</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F7F7]">
              <span className="text-sm font-bold uppercase">Isolation Forest</span>
              <span className="px-3 py-1 bg-[#2A9D8F] text-white text-xs font-bold uppercase">Running</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F7F7]">
              <span className="text-sm font-bold uppercase">Crypto Tracing</span>
              <span className="px-3 py-1 bg-[#2A9D8F] text-white text-xs font-bold uppercase">Active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Risk Score Distribution */}
      <Card className="mt-8 p-6 border-2 border-[#0A0A0A] rounded-none" data-testid="risk-distribution-widget">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
          Intelligence Fusion Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4">
              Cyber Threat Intelligence (BSSN)
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#F7F7F7]">
                <span className="text-sm font-mono">Active Threats</span>
                <span className="font-mono font-bold">23</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F7F7F7]">
                <span className="text-sm font-mono">IOCs Detected</span>
                <span className="font-mono font-bold">45</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4">
              Financial Intelligence (PPATK)
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#F7F7F7]">
                <span className="text-sm font-mono">Watchlist Hits</span>
                <span className="font-mono font-bold">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F7F7F7]">
                <span className="text-sm font-mono">ML/TF Typologies</span>
                <span className="font-mono font-bold">8</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
