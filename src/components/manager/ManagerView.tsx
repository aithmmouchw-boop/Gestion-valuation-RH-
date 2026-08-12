import React, { useState, useEffect } from 'react';
import { User, Evaluation, Campagne } from '../../types';
import { apiClient } from '../../services/apiClient';
import { UserInitials } from '../UserInitials';
import { CollaboratorDetailDossier } from './CollaboratorDetailDossier';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { Search, Filter, Download, FileSpreadsheet, ArrowRight, AlertTriangle, RefreshCw, Users, CalendarCheck, CheckCircle2, Clock } from 'lucide-react';

interface ManagerViewProps {
  currentUser: User;
  initialTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const ManagerView: React.FC<ManagerViewProps> = ({ currentUser, initialTab, onNavigateTab }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [campaigns, setCampaigns] = useState<Campagne[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [posteFilter, setPosteFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [collaboratorFilter, setCollaboratorFilter] = useState('all');
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

  const selectManagerTab = (tab: 'active' | 'history') => {
    setCurrentTab(tab);
    onNavigateTab?.(tab === 'history' ? 'past_campaigns' : 'team_list');
  };

  const loadTeamEvaluations = () => {
    setLoading(true);
    Promise.all([
      apiClient.getEvaluations({ manager_id: currentUser.id.toString() }),
      apiClient.getCampaigns(),
    ]).then(([res, campaignRes]) => {
      setEvaluations(res.filter(evaluation => evaluation.manager_id === currentUser.id));
      setCampaigns(campaignRes);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    loadTeamEvaluations();
  }, [currentUser]);

  if (selectedEvalId) {
    return (
      <CollaboratorDetailDossier
        evaluationId={selectedEvalId}
        readOnly={['valide', 'validee'].includes(evaluations.find(evaluation => evaluation.id === selectedEvalId)?.status || '')}
        readOnlyContext="dg"
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
    const matchesCampaign = campaignFilter === 'all' || e.campagne_id.toString() === campaignFilter;
    const matchesPoste = posteFilter === 'all' || e.poste_name === posteFilter;
    const matchesFamily = familyFilter === 'all' || e.direction_name === familyFilter;
    const matchesCollaborator = collaboratorFilter === 'all' || e.user_name === collaboratorFilter;
    return matchesSearch && matchesStatus && matchesCampaign && matchesPoste && matchesFamily && matchesCollaborator;
  });
  const historicalEvaluations = evaluations.filter(evaluation =>
    evaluation.score_global > 0 && (evaluation.status === 'valide' || evaluation.status === 'soumis_dg' || evaluation.status === 'signee'),
  );
  const uniquePostes = Array.from(new Set(evaluations.map(e => e.poste_name).filter(Boolean))).sort();
  const uniqueFamilies = Array.from(new Set(evaluations.map(e => e.direction_name).filter(Boolean))).sort();
  const uniqueCollaborators = Array.from(new Set(evaluations.map(e => e.user_name).filter(Boolean))).sort();
  const managerKpis = {
    total: filteredEvals.length,
    completed: filteredEvals.filter(e => ['valide', 'validee'].includes(e.status)).length,
    pending: filteredEvals.filter(e => !['valide', 'validee'].includes(e.status)).length,
    plannedInterviews: filteredEvals.filter(e => e.interview_status === 'planifie' || Boolean(e.interview_date)).length,
    doneInterviews: filteredEvals.filter(e => e.interview_status === 'realise').length,
    returned: filteredEvals.filter(e => e.status === 'a_corriger').length,
    submittedDG: filteredEvals.filter(e => e.status === 'soumis_dg' || e.status === 'signee').length,
    validatedDG: filteredEvals.filter(e => e.status === 'dg_validee').length,
    waitingCollaborator: filteredEvals.filter(e => ['dg_validee', 'correction_a_confirmer'].includes(e.status)).length,
  };
  const percentOfTeam = (value: number) => managerKpis.total > 0 ? Math.round((value / managerKpis.total) * 100) : 0;
  const statCards = [
    { label: 'Collaborateurs', value: managerKpis.total, detail: 'Équipe filtrée', icon: Users, accent: 'text-emerald-300', bar: 100 },
    { label: 'Évaluations terminées', value: managerKpis.completed, detail: `${percentOfTeam(managerKpis.completed)}% de l’équipe`, icon: CheckCircle2, accent: 'text-emerald-300', bar: percentOfTeam(managerKpis.completed) },
    { label: 'Évaluations en attente', value: managerKpis.pending, detail: `${percentOfTeam(managerKpis.pending)}% de l’équipe`, icon: Clock, accent: 'text-amber-300', bar: percentOfTeam(managerKpis.pending) },
    { label: 'Entretiens planifiés', value: managerKpis.plannedInterviews, detail: `${percentOfTeam(managerKpis.plannedInterviews)}% de l’équipe`, icon: CalendarCheck, accent: 'text-blue-300', bar: percentOfTeam(managerKpis.plannedInterviews) },
    { label: 'Entretiens réalisés', value: managerKpis.doneInterviews, detail: `${percentOfTeam(managerKpis.doneInterviews)}% de l’équipe`, icon: CheckCircle2, accent: 'text-emerald-300', bar: percentOfTeam(managerKpis.doneInterviews) },
    { label: 'À corriger', value: managerKpis.returned, detail: `${managerKpis.returned} dossier(s) retourné(s)`, icon: AlertTriangle, accent: 'text-rose-300', bar: percentOfTeam(managerKpis.returned) },
    { label: 'Soumis à la DG', value: managerKpis.submittedDG, detail: `${percentOfTeam(managerKpis.submittedDG)}% de l’équipe`, icon: RefreshCw, accent: 'text-purple-300', bar: percentOfTeam(managerKpis.submittedDG) },
    { label: 'Validés par la DG', value: managerKpis.validatedDG, detail: 'En attente de validation finale', icon: CheckCircle2, accent: 'text-emerald-300', bar: percentOfTeam(managerKpis.validatedDG) },
    { label: 'Validation collaborateur', value: managerKpis.waitingCollaborator, detail: 'En attente de signature', icon: Clock, accent: 'text-blue-300', bar: percentOfTeam(managerKpis.waitingCollaborator) },
  ];

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
      case 'signee':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-300">Signée par le collaborateur</span>;
      case 'valide':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">Terminé & Validé</span>;
      case 'a_corriger':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300">À corriger</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full">En attente</span>;
    }
  };

  const handleExportPDF = () => {
    const headers = ['Collaborateur', 'Poste', 'Famille', 'Statut Auto-éval', 'Statut Évaluation', 'Moyenne'];
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
    const headers = ['Collaborateur', 'Poste', 'Famille', 'Statut Auto-éval', 'Statut Évaluation', 'Moyenne'];
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
          >
            <option value="all">Toutes les campagnes</option>
            {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </div>

        <select value={posteFilter} onChange={(e) => setPosteFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
          <option value="all">Tous les postes</option>
          {uniquePostes.map(poste => <option key={poste} value={poste}>{poste}</option>)}
        </select>

        <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
          <option value="all">Toutes les familles</option>
          {uniqueFamilies.map(family => <option key={family} value={family}>{family}</option>)}
        </select>

        <select value={collaboratorFilter} onChange={(e) => setCollaboratorFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
          <option value="all">Tous les collaborateurs</option>
          {uniqueCollaborators.map(collaborator => <option key={collaborator} value={collaborator}>{collaborator}</option>)}
        </select>

        <div className="flex items-center space-x-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="auto_eval_terminee">Auto-éval terminée</option>
            <option value="en_cours_manager">En cours manager</option>
            <option value="soumis_dg">Soumis DG</option>
            <option value="dg_validee">En attente collaborateur</option>
            <option value="a_corriger">À corriger</option>
            <option value="valide">Terminé & Validé</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-6 shadow-lg border border-slate-800">
        <div className="flex items-center space-x-3 mb-5">
          <Users className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">Tableau de bord manager</h2>
            <p className="text-xs text-slate-300 mt-1">Suivi clair de l’état des évaluations de votre équipe.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statCards.map(({ label, value, detail, icon: Icon, accent, bar }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-100">{label}</div>
                  <div className="mt-4 flex items-end space-x-2">
                    <span className="text-4xl font-black text-white">{value}</span>
                    <span className="pb-1 text-sm font-semibold text-slate-300">/ {managerKpis.total || 0}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-400/10 px-3 py-2">
                  <Icon className={`w-5 h-5 ${accent}`} />
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${Math.min(bar, 100)}%` }} />
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-300">{detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm flex space-x-2 text-xs font-bold">
        <button
          onClick={() => selectManagerTab('active')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${currentTab === 'active' ? 'bg-amber-800 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          1. Mon Équipe (Campagne en Cours)
        </button>
        <button
          onClick={() => selectManagerTab('history')}
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
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Dossiers renvoyés par la Direction Générale pour correction</span>
            </div>
            <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-full">Action requise</span>
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
                  <span>Corriger le dossier</span>
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
              Archives
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

              <div className="flex flex-wrap items-center lg:justify-end gap-2">
                <button
                  onClick={() => setSelectedEvalId(ev.id)}
                  className="px-3 py-2 bg-slate-900 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Voir le dossier</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setSelectedEvalId(ev.id)}
                  disabled={['valide', 'validee'].includes(ev.status)}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 disabled:bg-slate-100 disabled:text-slate-400 text-amber-900 font-bold text-xs rounded-lg transition-colors"
                >
                  {ev.score_global > 0 ? "Modifier l'évaluation" : "Commencer l'évaluation"}
                </button>
                <button
                  onClick={() => setSelectedEvalId(ev.id)}
                  disabled={['valide', 'validee'].includes(ev.status)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 text-blue-900 font-bold text-xs rounded-lg transition-colors"
                >
                  Planifier l'entretien
                </button>
                <button
                  onClick={() => selectManagerTab('history')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                >
                  Historique
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

