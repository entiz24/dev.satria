import React, { useEffect, useState } from 'react';
import { transactionsAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatDate, getRiskLevelColor } from '../utils/helpers';
import { Search, Play } from 'lucide-react';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showFlagged, setShowFlagged] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, [showFlagged]);

  const loadTransactions = async () => {
    try {
      const response = await transactionsAPI.getAll({ flagged_only: showFlagged });
      setTransactions(response.data);
    } catch (error) {
      toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (txId) => {
    setAnalyzing(txId);
    try {
      const response = await transactionsAPI.analyze(txId);
      toast.success(`Analysis complete: Risk Score ${response.data.risk_score.toFixed(2)}`);
      await loadTransactions();
    } catch (error) {
      toast.error('Analisis gagal');
    } finally {
      setAnalyzing(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    !filter || 
    tx.sender_name?.toLowerCase().includes(filter.toLowerCase()) ||
    tx.receiver_name?.toLowerCase().includes(filter.toLowerCase()) ||
    tx.id?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div data-testid="transactions-page">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Transactions
        </h1>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Real-time Transaction Monitoring
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-6 border-2 border-[#0A0A0A] rounded-none">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 rounded-none border-2"
                data-testid="search-transactions-input"
              />
            </div>
          </div>
          <Button
            onClick={() => setShowFlagged(!showFlagged)}
            variant={showFlagged ? 'default' : 'outline'}
            className="rounded-none border-2 font-bold uppercase"
            data-testid="filter-flagged-button"
          >
            {showFlagged ? 'Show All' : 'Show Flagged Only'}
          </Button>
        </div>
      </Card>

      {/* Transactions Table */}
      <div className="border-2 border-[#0A0A0A]">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="transactions-table">
            <thead className="bg-[#0A0A0A] text-white">
              <tr>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wide">ID</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wide">Type</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wide">From</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wide">To</th>
                <th className="text-right p-4 text-xs font-bold uppercase tracking-wide">Amount</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wide">Risk</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wide">Date</th>
                <th className="text-center p-4 text-xs font-bold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-8">
                    <p className="text-sm font-mono">Loading...</p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8">
                    <p className="text-sm font-mono">Tidak ada transaksi ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 50).map((tx, idx) => (
                  <tr key={tx.id} className={`border-b border-[#E5E5E5] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F7F7F7]'}`} data-testid={`transaction-row-${idx}`}>
                    <td className="p-4">
                      <code className="text-xs font-mono">{tx.id.substring(0, 8)}</code>
                    </td>
                    <td className="p-4">
                      <span className="text-xs uppercase font-bold">{tx.transaction_type}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold">{tx.sender_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold">{tx.receiver_name}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-mono font-bold">{formatCurrency(tx.amount)}</p>
                    </td>
                    <td className="p-4">
                      {tx.risk_score ? (
                        <div>
                          <Badge className={`${getRiskLevelColor(tx.risk_level)} rounded-none`}>
                            {tx.risk_level}
                          </Badge>
                          <p className="text-xs font-mono mt-1">{tx.risk_score.toFixed(1)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not analyzed</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-xs">{new Date(tx.timestamp).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(tx.id)}
                        disabled={analyzing === tx.id}
                        className="rounded-none bg-[#002FA7] hover:bg-[#0A0A0A] text-xs"
                        data-testid={`analyze-button-${idx}`}
                      >
                        {analyzing === tx.id ? (
                          <span className="font-mono">...</span>
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
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

export default TransactionsPage;
