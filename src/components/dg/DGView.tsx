import React, { useState, useEffect } from 'react';
import { User, Evaluation } from '../../types';
import { apiClient } from '../../services/apiClient';
import { UserInitials } from '../UserInitials';
import { CollaboratorDetailDossier } from '../manager/CollaboratorDetailDossier';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { 
  CheckCircle2, XCircle, Eye, ShieldCheck, Download, FileSpreadsheet, AlertCircle 
} from 'lucide-react';

interface DGViewProps {
  currentUser: User;
  initialTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const DGView: React.FC<DGViewProps> = ({ currentUser, initialTab, onNavigateTab }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'validated'>(
    initialTab === 'dg_archive' ? 'validated' : 'pending'
  );

  useEffect(() => {
    if (initialTab === 'dg_archive') {
      setActiveTab('validated');
    } else if (initialTab === 'dg_queue') {
      setActiveTab('pending');
    }
  }, [initialTab]);

  const selectDgTab = (tab: 'pending' | 'validated') => {
    setActiveTab(tab);
    onNavigateTab?.(tab === 'validated' ? 'dg_archive' : 'dg_queue');
  };

  // Return modal state
  const [rejectingEvalId, setRejectingEvalId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const loadPendingEvaluations = () => {
    setLoading(true);
    apiClient.getEvaluations().then(res => {
      setEvaluations(res);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    loadPendingEvaluations();
  }, []);

  if (selectedEvalId) {
    return (
      <CollaboratorDetailDossier
        evaluationId={selectedEvalId}
        readOnly
        showGuidelines={false}
        onBack={() => {
          setSelectedEvalId(null);
          loadPendingEvaluations();
        }}
      />
    );
  }

  const pendingEvals = evaluations.filter(e => e.status === 'soumis_dg' || e.status === 'signee');
  const validatedEvals = evaluations.filter(e => e.status === 'valide' || e.status === 'validee');

  const handleValidate = async (id: number) => {
    const evaluation = evaluations.find(item => item.id === id);
    const confirmationMessage = evaluation?.status === 'signee'
      ? 'Valider définitivement cette évaluation annuelle ?'
      : "Valider le contenu de cette évaluation et la transmettre au collaborateur pour signature ?";
    if (confirm(confirmationMessage)) {
      await apiClient.validateEvaluationByDG(id);
      loadPendingEvaluations();
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingEvalId || !rejectComment) return;
    await apiClient.rejectEvaluationByDG(rejectingEvalId, rejectComment);
    setRejectingEvalId(null);
    setRejectComment('');
    loadPendingEvaluations();
  };

  const handleExportPDF = () => {
    const headers = ['Collaborateur', 'Poste', 'Manager', 'Filiale', 'Score Global', 'Statut'];
    const rows = evaluations.map(e => [
      e.user_name,
      e.poste_name,
      e.manager_name,
      e.filiale_name,
      e.score_global > 0 ? `${e.score_global}/100` : '-',
      e.status
    ]);
    exportToPDF('File d\'Attente Direction Générale — Groupe Premium', headers, rows, 'validation_dg');
  };

  const handleExportExcel = () => {
    const headers = ['Collaborateur', 'Poste', 'Manager', 'Filiale', 'Score Global', 'Statut'];
    const rows = evaluations.map(e => [
      e.user_name,
      e.poste_name,
      e.manager_name,
      e.filiale_name,
      e.score_global > 0 ? `${e.score_global}/100` : '-',
      e.status
    ]);
    exportToExcel('Validation DG', headers, rows, 'validation_dg');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
            Interface Direction Générale
          </span>
          <h1 className="text-2xl font-black mt-2">File d'Attente de Validation des Évaluations</h1>
          <p className="text-xs text-slate-300 mt-1">
            Examinez et validez les dossiers soumis par les managers de votre direction : {currentUser.direction_name || 'Direction Générale'}.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={handleExportPDF} className="px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded-lg flex items-center space-x-1.5 shadow">
            <Download className="w-4 h-4 text-emerald-700" />
            <span>PDF</span>
          </button>
          <button onClick={handleExportExcel} className="px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center space-x-1.5 shadow">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">En Attente de Validation</div>
          <div className="text-3xl font-black text-purple-900">{pendingEvals.length} <span className="text-xs font-normal text-slate-400">dossier(s)</span></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Validés définitivement</div>
          <div className="text-3xl font-black text-emerald-800">{validatedEvals.length} <span className="text-xs font-normal text-slate-400">dossier(s)</span></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Campagne Groupe</div>
          <div className="text-3xl font-black text-slate-900">{evaluations.length} <span className="text-xs font-normal text-slate-400">collaborateurs</span></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm flex space-x-2 text-xs font-bold">
        <button
          onClick={() => selectDgTab('pending')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'pending' ? 'bg-purple-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          1. File d'attente DG ({pendingEvals.length})
        </button>
        <button
          onClick={() => selectDgTab('validated')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'validated' ? 'bg-emerald-800 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          2. Évaluations validées ({validatedEvals.length})
        </button>
      </div>

      {activeTab === 'pending' ? (
        /* Pending Validation List */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900 flex justify-between items-center">
            <span>Dossiers soumis à la Direction Générale ({pendingEvals.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Action requise</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Chargement...</div>
          ) : pendingEvals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Aucun dossier en attente de validation pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingEvals.map(ev => (
                <div key={ev.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <UserInitials name={ev.user_name} className="w-12 h-12 border-2 border-emerald-600 text-xs shadow" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{ev.user_name}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded">{ev.user_category}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ev.poste_name} — {ev.direction_name} ({ev.filiale_name})</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Manager: <strong>{ev.manager_name}</strong></p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Score */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Moyenne Finale</div>
                      <div className="text-lg font-black text-emerald-900">{ev.score_global} / 100</div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedEvalId(ev.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span>Consulter</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingEvalId(ev.id);
                          setRejectComment('');
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 flex items-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Renvoyer au manager</span>
                      </button>

                      <button
                        onClick={() => handleValidate(ev.id)}
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{ev.status === 'signee' ? 'Valider définitivement' : 'Valider le contenu'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Validated List */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 font-bold text-xs text-emerald-900 flex justify-between items-center">
            <span className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Dossiers définitivement validés ({validatedEvals.length})</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-bold uppercase">Archivé Definitif</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Chargement...</div>
          ) : validatedEvals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Aucune évaluation validée pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {validatedEvals.map(ev => (
                <div key={ev.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <UserInitials name={ev.user_name} className="w-12 h-12 border-2 border-emerald-600 text-xs shadow" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{ev.user_name}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded">Validé DG</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ev.poste_name} — {ev.direction_name} ({ev.filiale_name})</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Manager: <strong>{ev.manager_name}</strong> • Validé le: <strong>{ev.validated_at_dg || '2025-01-15'}</strong>
                      </p>
                      {ev.dg_comment && <p className="text-xs text-emerald-900 font-semibold italic mt-1">"{ev.dg_comment}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Moyenne Finale</div>
                      <div className="text-xl font-black text-emerald-800">{ev.score_global} / 100</div>
                    </div>

                    <button
                      onClick={() => setSelectedEvalId(ev.id)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Consulter le dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingEvalId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Motif de Renvoi au Manager pour Correction</span>
            </h3>

            <div>
              <textarea
                rows={3}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Rédigez les remarques ou corrections demandées..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setRejectingEvalId(null)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Annuler</button>
              <button onClick={handleRejectSubmit} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold shadow">Confirmer le Renvoi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

