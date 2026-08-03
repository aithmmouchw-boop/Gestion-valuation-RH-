import React, { useState, useEffect } from 'react';
import { User, Evaluation } from '../../types';
import { apiClient } from '../../services/apiClient';
import { UserInitials } from '../UserInitials';
import { CollaboratorDetailDossier } from './CollaboratorDetailDossier';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { Search, Filter, Download, FileSpreadsheet, ArrowRight, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ManagerViewProps {
  currentUser: User;
  initialTab?: string;
}

export const ManagerView: React.FC<ManagerViewProps> = ({ currentUser, initialTab }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState<'active' | 'history'>(
    initialTab === 'past_campaigns' ? 'history' : 'active'
  );

  useEffect(() => {
    if (initialTab === 'past_campaigns') {
      setCurrentTab('history');
    } else if (initialTab === 'team_list') {
      setCurrentTab('active');
    }
  }, [initialTab]);

  const loadTeamEvaluations = () => {
    setLoading(true);
    apiClient.getEvaluations({ manager_id: currentUser.id.toString() }).then(res => {
      setEvaluations(res);
      setLoading(false);
    }).catch(console.error);
  };

  const handleDeleteEvaluation = async (id: number, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'évaluation de ${name} ?`)) {
      await apiClient.deleteEvaluation(id);
      loadTeamEvaluations();
    }
  };

  useEffect(() => {
    loadTeamEvaluations();
  }, [currentUser]);

  if (selectedEvalId) {
    return (
      <CollaboratorDetailDossier
        evaluationId={selectedEvalId}
        onBack={() => {
          setSelectedEvalId(null);
          loadTeamEvaluations();
        }}
      />
    );
  }

  const filteredEvals = evaluations.filter(e => {
    const matchesSearch = e.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || e.poste_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const historicalEvaluations = evaluations.filter(evaluation =>
    evaluation.score_global > 0 && (evaluation.status === 'valide' || evaluation.status === 'soumis_dg'),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-300">En attente</span>;
      case 'auto_eval_terminee':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-300">Auto-éval terminée</span>;
      case 'en_cours_manager':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">En cours manager</span>;
      case 'soumis_dg':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-300">Soumis DG</span>;
      case 'valide':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">Terminé & Validé</span>;
      case 'a_corriger':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300">À corriger</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full">En attente</span>;
    }
  };

  const handleExportPDF = () => {
    const headers = ['Collaborateur', 'Poste', 'Département', 'Statut Auto-éval', 'Statut Évaluation', 'Moyenne'];
    const rows = filteredEvals.map(e => [
      e.user_name,
      e.poste_name,
      e.direction_name,
      e.auto_evaluation ? 'Complétée' : 'Non soumise',
      e.status,
      e.score_global > 0 ? `${e.score_global}/100` : '-'
    ]);
    exportToPDF(`Équipe Manager ${currentUser.name} — Groupe Premium`, headers, rows, 'equipe_manager');
  };

  const handleExportExcel = () => {
    const headers = ['Collaborateur', 'Poste', 'Département', 'Statut Auto-éval', 'Statut Évaluation', 'Moyenne'];
    const rows = filteredEvals.map(e => [
      e.user_name,
      e.poste_name,
      e.direction_name,
      e.auto_evaluation ? 'Complétée' : 'Non soumise',
      e.status,
      e.score_global > 0 ? `${e.score_global}/100` : '-'
    ]);
    exportToExcel(`Équipe ${currentUser.name}`, headers, rows, 'equipe_manager');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-800 uppercase tracking-widest">Espace Manager</div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Gestion des Évaluations de mon Équipe</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultez les dossiers de votre équipe ({filteredEvals.length} collaborateurs rattachés).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={handleExportPDF} className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5 border border-slate-200">
            <Download className="w-4 h-4 text-emerald-700" />
            <span>PDF</span>
          </button>
          <button onClick={handleExportExcel} className="px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center space-x-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm flex space-x-2 text-xs font-bold">
        <button
          onClick={() => setCurrentTab('active')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${currentTab === 'active' ? 'bg-amber-800 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          1. Mon Équipe (Campagne en Cours)
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${currentTab === 'history' ? 'bg-amber-800 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          2. Historique d'Équipe (Archives & Tendances)
        </button>
      </div>

      {/* DG Returned Dossiers Alert Section */}
      {evaluations.some(e => e.status === 'a_corriger') && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-rose-900 font-extrabold text-sm">
              <AlertTriangle className="w-6 h-6 text-rose-600 animate-bounce" />
              <span>Dossier(s) Renvoyé(s) par la Direction Générale pour Correction</span>
            </div>
            <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-full">Action Requise</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            La Direction Générale a retourné un ou plusieurs dossiers d'évaluation nécessitant des ajustements ou compléments avant validation finale. Veuillez cliquer ci-dessous pour modifier.
          </p>
          <div className="space-y-2 pt-2 border-t border-rose-200">
            {evaluations.filter(e => e.status === 'a_corriger').map(ev => (
              <div key={ev.id} className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{ev.user_name}</span> ({ev.poste_name})
                  {ev.dg_comment && <p className="text-[11px] text-rose-700 font-medium italic mt-0.5">Motif DG: "{ev.dg_comment}"</p>}
                </div>
                <button
                  onClick={() => setSelectedEvalId(ev.id)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Corriger le Dossier</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTab === 'history' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">Historique des Évaluations de l'Équipe</h2>
              <p className="text-xs text-slate-500 mt-0.5">Suivi historique des performances de vos collaborateurs directs sur les campagnes passées.</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full">
              Groupe Premium • Archives
            </span>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {historicalEvaluations.length === 0 && <div className="py-12 text-center text-sm text-slate-500">Aucun historique saisi pour votre équipe.</div>}
            {historicalEvaluations.map(ev => (
              <div key={ev.id} className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)_140px_150px] gap-3 items-center px-3 py-4 hover:bg-amber-50/40">
                <div className="flex items-center space-x-3">
                  <UserInitials name={ev.user_name} className="w-9 h-9 border border-amber-600 text-[10px]" />
                  <div><div className="font-bold text-sm text-slate-900">{ev.user_name}</div><div className="text-[11px] text-slate-500">{ev.poste_name}</div></div>
                </div>
                <div className="text-xs text-slate-600"><strong>{ev.campagne_name}</strong><br />{ev.direction_name}</div>
                <div className="font-black text-emerald-800">{ev.score_global} / 100</div>
                <button onClick={() => setSelectedEvalId(ev.id)} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-amber-800">Consulter</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Statut:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="auto_eval_terminee">Auto-éval terminée</option>
            <option value="en_cours_manager">En cours manager</option>
            <option value="soumis_dg">Soumis DG</option>
            <option value="valide">Terminé & Validé</option>
          </select>
        </div>
      </div>

      {/* Liste alignée des collaborateurs */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Chargement de votre équipe...</div>
      ) : filteredEvals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200">
          Aucun collaborateur trouvé avec ces filtres.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          <div className="hidden lg:grid grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(170px,1fr)_140px_180px] gap-4 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Collaborateur</span>
            <span>Auto-évaluation</span>
            <span>Évaluation manager</span>
            <span>Moyenne</span>
            <span className="text-right">Actions</span>
          </div>
          {filteredEvals.map(ev => (
            <div
              key={ev.id}
              className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(170px,1fr)_140px_180px] gap-3 lg:gap-4 items-center px-4 py-4 hover:bg-amber-50/40 transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0">
                  <UserInitials name={ev.user_name} className="w-10 h-10 border border-emerald-600 text-[10px]" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{ev.user_name}</h3>
                    <p className="text-[11px] text-slate-500">{ev.poste_name} • {ev.direction_name}</p>
                  </div>
              </div>

              <div className="flex lg:block items-center gap-2 text-xs">
                <span className="lg:hidden text-slate-500">Auto-évaluation :</span>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${ev.auto_evaluation ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-500'}`}>
                  {ev.auto_evaluation ? 'Soumise' : 'En attente'}
                </span>
              </div>

              <div className="flex lg:block items-center gap-2 text-xs">
                <span className="lg:hidden text-slate-500">Évaluation manager :</span>
                {getStatusBadge(ev.status)}
              </div>

              <div className="text-xs">
                <span className="lg:hidden text-slate-500 mr-2">Moyenne :</span>
                <span className="font-black text-emerald-900">
                  {ev.score_global > 0 ? `${ev.score_global} / 100` : 'Non calculée'}
                </span>
              </div>

              <div className="flex items-center lg:justify-end space-x-2">
                <button
                  onClick={() => setSelectedEvalId(ev.id)}
                  className="px-3 py-2 bg-slate-900 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Consulter</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => handleDeleteEvaluation(ev.id, ev.user_name)}
                  className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition-colors border border-slate-200"
                  title="Supprimer l'évaluation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}
</div>
);
};
