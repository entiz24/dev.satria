import React, { useEffect, useState } from 'react';
import { casesAPI, entitiesAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { getRiskLevelColor, formatDate } from '../utils/helpers';
import { Plus, Briefcase } from 'lucide-react';

const CasesPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const response = await casesAPI.getAll();
      setCases(response.data);
    } catch (error) {
      toast.error('Gagal memuat cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      await casesAPI.create(formData);
      toast.success('Case berhasil dibuat');
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', priority: 'medium' });
      loadCases();
    } catch (error) {
      toast.error('Gagal membuat case');
    }
  };

  const handleUpdateStatus = async (caseId, newStatus) => {
    try {
      await casesAPI.update(caseId, { status: newStatus });
      toast.success('Status berhasil diupdate');
      loadCases();
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  return (
    <div data-testid="cases-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Case Management
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Investigation Workflow System
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-none bg-[#002FA7] hover:bg-[#0A0A0A] font-bold uppercase" data-testid="create-case-button">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-2 border-[#0A0A0A]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase">Create New Case</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="text-sm font-bold uppercase block mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="rounded-none border-2"
                  data-testid="case-title-input"
                />
              </div>
              <div>
                <label className="text-sm font-bold uppercase block mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="rounded-none border-2 min-h-[100px]"
                  data-testid="case-description-input"
                />
              </div>
              <div>
                <label className="text-sm font-bold uppercase block mb-2">Priority</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="rounded-none border-2" data-testid="case-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-none bg-[#002FA7] font-bold uppercase" data-testid="submit-case-button">
                Create Case
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cases Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8">
            <p className="text-sm font-mono">Loading...</p>
          </div>
        ) : cases.length === 0 ? (
          <Card className="p-8 text-center border-2 border-[#0A0A0A] rounded-none">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-mono">Tidak ada cases ditemukan</p>
          </Card>
        ) : (
          cases.map((caseItem, idx) => (
            <Card key={caseItem.id} className="p-6 border-2 border-[#0A0A0A] rounded-none" data-testid={`case-card-${idx}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-xs font-mono font-bold bg-[#F7F7F7] px-2 py-1">
                      {caseItem.case_number}
                    </code>
                    <Badge className={`${getRiskLevelColor(caseItem.priority)} rounded-none`}>
                      {caseItem.priority}
                    </Badge>
                    <Badge className="bg-[#0A0A0A] text-white rounded-none">
                      {caseItem.status}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{caseItem.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{caseItem.description}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created {formatDate(caseItem.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {caseItem.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(caseItem.id, 'investigating')}
                    className="rounded-none bg-[#002FA7] text-xs font-bold uppercase"
                    data-testid={`start-investigation-${idx}`}
                  >
                    Start Investigation
                  </Button>
                )}
                {caseItem.status === 'investigating' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(caseItem.id, 'pending_review')}
                      className="rounded-none bg-[#FFB703] text-black text-xs font-bold uppercase"
                      data-testid={`pending-review-${idx}`}
                    >
                      Pending Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(caseItem.id, 'closed')}
                      className="rounded-none bg-[#2A9D8F] text-white text-xs font-bold uppercase"
                      data-testid={`close-case-${idx}`}
                    >
                      Close Case
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CasesPage;
