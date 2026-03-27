import React, { useEffect, useState } from 'react';
import { ltkmAPI, entitiesAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { getRiskLevelColor, formatDate, downloadBlob } from '../utils/helpers';
import { FileText, Download, Plus } from 'lucide-react';

const LTKMPage = () => {
  const [reports, setReports] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsRes, entitiesRes] = await Promise.all([
        ltkmAPI.getReports(),
        entitiesAPI.getAll()
      ]);
      setReports(reportsRes.data);
      setEntities(entitiesRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedEntity) {
      toast.error('Pilih entitas terlebih dahulu');
      return;
    }

    setGenerating(true);
    try {
      await ltkmAPI.generate(selectedEntity);
      toast.success('LTKM report berhasil dibuat');
      setShowGenerateDialog(false);
      setSelectedEntity('');
      loadData();
    } catch (error) {
      toast.error('Gagal generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (reportId, reportNumber) => {
    try {
      const response = await ltkmAPI.downloadPDF(reportId);
      downloadBlob(response.data, `LTKM_${reportNumber}.pdf`);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Gagal download PDF');
    }
  };

  return (
    <div data-testid="ltkm-page">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-2">
            LTKM Reports
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Suspicious Transaction Reports
          </p>
        </div>

        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-semibold uppercase" data-testid="generate-ltkm-button">
              <Plus className="h-4 w-4 mr-2" />
              Generate LTKM
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold uppercase text-foreground">Generate LTKM Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold uppercase block mb-2 text-foreground">Select Entity</label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-foreground" data-testid="entity-select">
                    <SelectValue placeholder="Choose entity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name} ({entity.entity_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={generating || !selectedEntity}
                className="w-full bg-primary hover:bg-primary/90 font-semibold uppercase"
                data-testid="confirm-generate-button"
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8">
            <p className="text-sm font-mono text-muted-foreground">Loading...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center bg-card border border-white/10">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-mono text-muted-foreground">Belum ada LTKM report</p>
          </Card>
        ) : (
          reports.map((report, idx) => (
            <Card key={report.id} className="p-6 bg-card border border-white/10 hover:border-primary/50 transition-all" data-testid={`ltkm-report-${idx}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <code className="text-sm font-mono font-semibold bg-white/5 border border-white/10 px-3 py-1 rounded text-foreground">
                      {report.report_number}
                    </code>
                    <Badge className={`${getRiskLevelColor(report.report_data?.risk_level)}`}>
                      {report.report_data?.risk_level || 'N/A'}
                    </Badge>
                    <Badge className={`${report.submitted ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>
                      {report.submitted ? 'SUBMITTED' : 'DRAFT'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                        Risk Score
                      </p>
                      <p className="text-2xl font-black font-mono text-foreground">{report.risk_score.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                        Transactions
                      </p>
                      <p className="text-2xl font-black font-mono text-foreground">{report.transaction_ids.length}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                      Suspicious Indicators
                    </p>
                    <div className="space-y-1">
                      {report.suspicious_indicators.slice(0, 3).map((indicator, i) => (
                        <p key={i} className="text-xs bg-white/5 border-l-2 border-red-500/50 p-2 text-muted-foreground">
                          {indicator}
                        </p>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Generated {formatDate(report.generated_at)}
                  </p>
                </div>

                <Button
                  onClick={() => handleDownloadPDF(report.id, report.report_number)}
                  className="bg-primary hover:bg-primary/90 font-semibold uppercase shrink-0"
                  data-testid={`download-pdf-${idx}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LTKMPage;
