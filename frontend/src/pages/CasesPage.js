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
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-2">
            Case Management
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Investigation Workflow System
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-semibold uppercase" data-testid="create-case-button">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold uppercase text-foreground">Create New Case</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="text-sm font-semibold uppercase block mb-2 text-foreground">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary text-foreground"
                  data-testid="case-title-input"
                />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase block mb-2 text-foreground">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary text-foreground min-h-[100px]"
                  data-testid="case-description-input"
                />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase block mb-2 text-foreground">Priority</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-foreground" data-testid="case-priority-select">
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
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-semibold uppercase" data-testid="submit-case-button">
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
            <p className="text-sm font-mono text-muted-foreground">Loading...</p>
          </div>
        ) : cases.length === 0 ? (
          <Card className="p-8 text-center bg-card border border-white/10">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-mono text-muted-foreground">Tidak ada cases ditemukan</p>
          </Card>
        ) : (
          cases.map((caseItem, idx) => (
            <Card key={caseItem.id} className="p-6 bg-card border border-white/10 hover:border-primary/50 transition-all" data-testid={`case-card-${idx}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <code className="text-xs font-mono font-semibold bg-white/5 border border-white/10 px-2 py-1 rounded text-foreground">
                      {caseItem.case_number}
                    </code>
                    <Badge className={`${getRiskLevelColor(caseItem.priority)}`}>
                      {caseItem.priority}
                    </Badge>
                    <Badge className="bg-white/5 text-foreground border border-white/10">
                      {caseItem.status}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{caseItem.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{caseItem.description}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created {formatDate(caseItem.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {caseItem.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(caseItem.id, 'investigating')}
                    className="bg-primary hover:bg-primary/90 text-xs font-semibold uppercase"
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
                      className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/30 text-xs font-semibold uppercase"
                      data-testid={`pending-review-${idx}`}
                    >
                      Pending Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(caseItem.id, 'closed')}
                      className="bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30 text-xs font-semibold uppercase"
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
