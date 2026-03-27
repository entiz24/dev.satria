import React, { useEffect, useState } from 'react';
import { auditAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { formatDate } from '../utils/helpers';
import { Database } from 'lucide-react';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await auditAPI.getLogs({ limit: 100 });
      setLogs(response.data);
    } catch (error) {
      toast.error('Gagal memuat audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="audit-page">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-2">
          Audit Logs
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Immutable Activity Trail
        </p>
      </div>

      {/* Logs Table */}
      <div className="border border-white/10 rounded-md overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="audit-logs-table">
            <thead className="bg-primary/10 border-b border-white/10">
              <tr>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-foreground">Timestamp</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-foreground">User</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-foreground">Action</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-foreground">Resource</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-foreground">Resource ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <p className="text-sm font-mono text-muted-foreground">Loading...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-mono text-muted-foreground">Tidak ada audit logs</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`} data-testid={`audit-log-${idx}`}>
                    <td className="p-4">
                      <p className="text-xs font-mono text-muted-foreground">{formatDate(log.timestamp)}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-foreground">{log.user_email}</p>
                      <p className="text-xs font-mono text-muted-foreground">{log.user_id.substring(0, 8)}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-xs uppercase font-semibold bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs uppercase font-semibold text-foreground">{log.resource_type}</span>
                    </td>
                    <td className="p-4">
                      {log.resource_id ? (
                        <code className="text-xs font-mono text-muted-foreground">{log.resource_id.substring(0, 12)}...</code>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditPage;
