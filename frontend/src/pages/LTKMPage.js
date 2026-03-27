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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            LTKM Reports
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Suspicious Transaction Reports
          </p>
        </div>

        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-none bg-[#002FA7] hover:bg-[#0A0A0A] font-bold uppercase" data-testid="generate-ltkm-button">
              <Plus className="h-4 w-4 mr-2" />
              Generate LTKM
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-2 border-[#0A0A0A]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase">Generate LTKM Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold uppercase block mb-2">Select Entity</label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="rounded-none border-2" data-testid="entity-select">
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
                className="w-full rounded-none bg-[#002FA7] font-bold uppercase"
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
            <p className="text-sm font-mono">Loading...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center border-2 border-[#0A0A0A] rounded-none">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-mono">Belum ada LTKM report</p>
          </Card>
        ) : (
          reports.map((report, idx) => (
            <Card key={report.id} className="p-6 border-2 border-[#0A0A0A] rounded-none" data-testid={`ltkm-report-${idx}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <code className="text-sm font-mono font-bold bg-[#F7F7F7] px-3 py-1 border-2 border-[#0A0A0A]">
                      {report.report_number}
                    </code>
                    <Badge className={`${getRiskLevelColor(report.report_data?.risk_level)} rounded-none`}>
                      {report.report_data?.risk_level || 'N/A'}
                    </Badge>
                    <Badge className={`${report.submitted ? 'bg-[#2A9D8F]' : 'bg-gray-400'} text-white rounded-none`}>
                      {report.submitted ? 'SUBMITTED' : 'DRAFT'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-1">
                        Risk Score
                      </p>
                      <p className="text-2xl font-black font-mono">{report.risk_score.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-1">
                        Transactions
                      </p>
                      <p className="text-2xl font-black font-mono">{report.transaction_ids.length}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-2">
                      Suspicious Indicators
                    </p>
                    <div className="space-y-1">
                      {report.suspicious_indicators.slice(0, 3).map((indicator, i) => (
                        <p key={i} className="text-xs bg-[#F7F7F7] p-2 border-l-4 border-[#E63946]">
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
                  className="rounded-none bg-[#0A0A0A] hover:bg-[#002FA7] font-bold uppercase"
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
