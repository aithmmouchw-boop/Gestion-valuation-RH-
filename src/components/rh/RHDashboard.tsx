import React, { useState, useEffect } from 'react';
import { Campagne, DashboardKPIs, Evaluation, User } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  CheckCircle2, Clock, AlertTriangle, Download, FileSpreadsheet, TrendingUp, Layers 
} from 'lucide-react';

export const RHDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [relaunchingManager, setRelaunchingManager] = useState<string | null>(null);
  const [relaunchSuccess, setRelaunchSuccess] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campagne[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({ campaignId: 'active', filiale: 'all', poste: 'all', year: 'all' });

  const loadData = () => {
    Promise.all([
      apiClient.getKPIs(),
      apiClient.getCampaigns(),
      apiClient.getEvaluations(),
      apiClient.getUsers(),
    ]).then(([res, campaignRes, evaluationRes, userRes]) => {
      setKpis(res);
      setCampaigns(campaignRes);
      setEvaluations(evaluationRes);
      setUsers(userRes);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRelaunchManager = async (managerName: string) => {
    setRelaunchingManager(managerName);
    try {
      const res = await apiClient.relaunchManager(managerName);
      setRelaunchSuccess(res.message || `Relance envoyée avec succès à ${managerName}`);
      setTimeout(() => setRelaunchSuccess(null), 5000);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la relance.");
    } finally {
      setRelaunchingManager(null);
    }
  };

  const handleRelaunchAll = async () => {
    setRelaunchingManager('ALL');
    try {
      const res = await apiClient.relaunchCampaign(1);
      setRelaunchSuccess(res.message || "Relance générale transmise à tous les managers !");
      setTimeout(() => setRelaunchSuccess(null), 5000);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la relance générale.");
    } finally {
      setRelaunchingManager(null);
    }
  };

  if (loading || !kpis) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  const delayedManagers = kpis.managerDelays.filter(manager => {
    if (manager.late_count <= 0 || manager.total_count <= 0) return false;
    const progress = Math.round(((manager.total_count - manager.late_count) / manager.total_count) * 100);
    return progress < 100;
  });

  const COLORS = ['#005C3B', '#10B981', '#F59E0B', '#EF4444'];

  const activeCampaign = campaigns.find(campaign => ['ouverte', 'en_cours'].includes(campaign.status));
  const selectedCampaignId = filters.campaignId === 'active'
    ? activeCampaign?.id
    : filters.campaignId === 'all'
      ? undefined
      : Number(filters.campaignId);
  const selectedYear = filters.year === 'all' ? undefined : Number(filters.year);
  const filteredEvaluations = evaluations.filter(evaluation => {
    const campaign = campaigns.find(item => item.id === evaluation.campagne_id);
    if (selectedCampaignId && evaluation.campagne_id !== selectedCampaignId) return false;
    if (!selectedCampaignId && filters.campaignId === 'active' && activeCampaign && evaluation.campagne_id !== activeCampaign.id) return false;
    if (selectedYear && campaign?.year !== selectedYear) return false;
    if (filters.filiale !== 'all' && evaluation.filiale_name !== filters.filiale) return false;
    if (filters.poste !== 'all' && evaluation.poste_name !== filters.poste) return false;
    return true;
  });
  const finalEvaluations = filteredEvaluations.filter(evaluation => ['valide', 'validee'].includes(evaluation.status) && evaluation.score_global > 0);
  const selectedCampaignForProgress = selectedCampaignId ? campaigns.find(campaign => campaign.id === selectedCampaignId) : activeCampaign;
  const getCampaignTimeProgress = (campaign?: Campagne) => {
    if (!campaign?.start_date || !campaign?.end_date) return kpis.globalProgress;
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const duration = Math.max(1, end.getTime() - start.getTime());
    const elapsed = Math.min(Math.max(today.getTime() - start.getTime(), 0), duration);
    return Math.round((elapsed / duration) * 100);
  };
  const averageBy = (key: 'filiale_name') => {
    const groups = new Map<string, Evaluation[]>();
    finalEvaluations.forEach(evaluation => {
      const label = evaluation[key] || 'Non renseigné';
      groups.set(label, [...(groups.get(label) || []), evaluation]);
    });
    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      value: Math.round(items.reduce((sum, item) => sum + item.score_global, 0) / items.length),
      evaluated: items.length,
      total: filteredEvaluations.filter(evaluation => evaluation[key] === label).length || items.length,
    })).sort((a, b) => b.value - a.value);
  };
  const filialePerformanceItems = averageBy('filiale_name').length
    ? averageBy('filiale_name')
    : kpis.filialeAverages.map(item => ({
      label: item.filiale,
      value: item.average,
      evaluated: item.evaluated,
      total: item.total,
    })).filter(item => item.total > 0 || item.evaluated > 0);
  const filteredProgress = getCampaignTimeProgress(selectedCampaignForProgress);
  const dashboardYear = selectedCampaignForProgress?.year || (selectedYear ? String(selectedYear) : activeCampaign?.year || new Date().getFullYear());
  const pendingOrInProgressCount = filteredEvaluations.length ? filteredEvaluations.length - finalEvaluations.length : kpis.pendingEvaluations;
  const completedCount = finalEvaluations.length || kpis.completedEvaluations;
  const totalCount = filteredEvaluations.length || kpis.totalEvaluations;
  const exportEvaluationBase = finalEvaluations.length ? finalEvaluations : filteredEvaluations.filter(evaluation => evaluation.score_global > 0);
  const averageScore = (key: 'score_savoir' | 'score_savoir_faire' | 'score_savoir_etre') => {
    if (!exportEvaluationBase.length) return 0;
    return Math.round(exportEvaluationBase.reduce((sum, evaluation) => sum + (Number(evaluation[key]) || 0), 0) / exportEvaluationBase.length);
  };
  const completionRate = (key: 'synthesis_points_forts' | 'synthesis_points_ameliorer' | 'synthesis_developpement') => {
    const base = finalEvaluations.length || filteredEvaluations.length || 0;
    if (!base) return { count: 0, total: 0, percentage: 0 };
    const source = finalEvaluations.length ? finalEvaluations : filteredEvaluations;
    const count = source.filter(evaluation => String(evaluation[key] || '').trim().length > 0).length;
    return { count, total: base, percentage: Math.round((count / base) * 100) };
  };
  const buildDashboardExportRows = () => {
    const pointsForts = completionRate('synthesis_points_forts');
    const pointsAmeliorer = completionRate('synthesis_points_ameliorer');
    const developpement = completionRate('synthesis_developpement');
    const lateEvaluationsCount = delayedManagers.reduce((sum, manager) => sum + manager.late_count, 0);
    const campaignLabel = selectedCampaignForProgress?.name || (filters.campaignId === 'all' ? 'Toutes les campagnes' : 'Campagne active');

    return [
      ['Campagne analysée', campaignLabel, 'Selon les filtres sélectionnés'],
      ['Avancement Global', `${filteredProgress}%`, 'Calculé selon la période de la campagne'],
      ['Évaluations Réalisées', completedCount, `${completedCount} sur ${totalCount} évaluation(s)`],
      ['En Attente / En Cours', pendingOrInProgressCount, `${pendingOrInProgressCount} évaluation(s) non finalisée(s)`],
      ['Retards Managers', delayedManagers.length, `${lateEvaluationsCount} évaluation(s) en retard`],
      ['Savoir global', `${averageScore('score_savoir')}%`, 'Moyenne globale calculée en arrière-plan'],
      ['Savoir-faire global', `${averageScore('score_savoir_faire')}%`, 'Moyenne globale calculée en arrière-plan'],
      ['Savoir-être global', `${averageScore('score_savoir_etre')}%`, 'Moyenne globale calculée en arrière-plan'],
      ['Points forts renseignés', `${pointsForts.percentage}%`, `${pointsForts.count} dossier(s) sur ${pointsForts.total}`],
      ['Points à améliorer renseignés', `${pointsAmeliorer.percentage}%`, `${pointsAmeliorer.count} dossier(s) sur ${pointsAmeliorer.total}`],
      ['Développement à envisager renseigné', `${developpement.percentage}%`, `${developpement.count} dossier(s) sur ${developpement.total}`],
    ];
  };

  const handleExportPDF = () => {
    const headers = ['Indicateur', 'Valeur', 'Détail'];
    exportToPDF('Rapport Tableau de bord RH - Groupe Premium', headers, buildDashboardExportRows(), 'rapport_tableau_de_bord_rh');
  };

  const handleExportExcel = () => {
    const headers = ['Indicateur', 'Valeur', 'Détail'];
    exportToExcel('Tableau de bord RH', headers, buildDashboardExportRows(), 'rapport_tableau_de_bord_rh');
  };

  const filiales = Array.from(new Set(users.map(user => user.filiale_name).filter(Boolean))).sort();
  const postes = Array.from(new Set(users.map(user => user.poste_name).filter(Boolean))).sort();
  const years = campaigns
    .map(campaign => Number(campaign.year))
    .filter((year, index, list) => Number.isFinite(year) && list.indexOf(year) === index)
    .sort((a, b) => b - a);

  const renderCircularMetrics = (items: { label: string; value: number; evaluated: number; total: number }[]) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item, index) => {
        const value = Math.max(0, Math.min(100, Number(item.value) || 0));
        const color = COLORS[index % COLORS.length];
        return (
          <div key={item.label} className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <div className="relative h-[120px] w-[120px]">
              <PieChart width={120} height={120}>
                <Pie
                  data={[{ value }, { value: 100 - value }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={39}
                  outerRadius={53}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={color} />
                  <Cell fill="#E2E8F0" />
                </Pie>
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black text-slate-900">
                {value}%
              </div>
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] font-bold text-slate-700">{item.label}</div>
            <div className="mt-1 text-[10px] font-medium text-slate-500">
              {item.evaluated} évaluation(s) notée(s) sur {item.total}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderFilialeDonutChart = (items: { label: string; value: number; evaluated: number; total: number }[]) => {
    const chartData = items.map(item => ({
      name: item.label,
      value: Math.max(0, Math.min(100, Number(item.value) || 0)),
      detail: `${item.evaluated} évaluation(s) notée(s) sur ${item.total}`,
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 items-center">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((_, index) => (
                  <Cell key={`filiale-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value}%`, `${name} - ${props.payload.detail}`]} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-800 truncate">{item.label}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.value}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, item.value))}%`, backgroundColor: COLORS[index % COLORS.length] }} />
              </div>
              <div className="mt-1 text-[10px] font-medium text-slate-500">
                {item.evaluated} évaluation(s) notée(s) sur {item.total}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
            Direction Capital Humain — Groupe Premium
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Tableau de Bord Global — Performance {dashboardYear}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi en temps réel des campagnes d'évaluation (Casablanca, Agadir, Meknès, Kénitra, Tanger)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Campagne</label>
          <select value={filters.campaignId} onChange={event => setFilters(prev => ({ ...prev, campaignId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700">
            <option value="active">Campagne active</option>
            <option value="all">Toutes les campagnes</option>
            {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filiale</label>
          <select value={filters.filiale} onChange={event => setFilters(prev => ({ ...prev, filiale: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700">
            <option value="all">Toutes les filiales</option>
            {filiales.map(filiale => <option key={filiale} value={filiale}>{filiale}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Poste</label>
          <select value={filters.poste} onChange={event => setFilters(prev => ({ ...prev, poste: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700">
            <option value="all">Tous les postes</option>
            {postes.map(poste => <option key={poste} value={poste}>{poste}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Année</label>
          <select value={filters.year} onChange={event => setFilters(prev => ({ ...prev, year: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700">
            <option value="all">Toutes les années</option>
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Avancement Global</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{filteredProgress}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${filteredProgress}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Objectif de complétion: 100%</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Évaluations Réalisées</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{finalEvaluations.length || kpis.completedEvaluations} <span className="text-xs font-normal text-slate-500">/ {filteredEvaluations.length || kpis.totalEvaluations}</span></div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-3">
            {finalEvaluations.length || kpis.validatedEvaluations} validées définitivement
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">En Attente / En Cours</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{filteredEvaluations.length ? filteredEvaluations.length - finalEvaluations.length : kpis.pendingEvaluations}</div>
          <p className="text-[11px] text-amber-700 font-medium mt-3">
            Relances automatiques activées
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Retards Managers</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {delayedManagers.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Managers ayant au moins une évaluation en retard</p>
        </div>
      </div>

      {/* Axis Breakdown Banner (Savoir 20%, Savoir-faire 50%, Savoir-être 30%) */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
          <Layers className="w-4 h-4" />
          <span>Pondération Officielle des Évaluations Groupe Premium</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {kpis.axisAverages.map(axis => (
            <div key={axis.axis} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center text-xs font-medium text-slate-200">
                <span>Axe: {axis.axis}</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">Poids: {axis.weight}</span>
              </div>
              <div className="text-2xl font-black text-white mt-1">{axis.score} <span className="text-xs font-normal text-slate-300">/ 100</span></div>
              <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${axis.score}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center justify-between">
            <span>Répartition des performances par filiale</span>
            <span className="text-xs text-slate-400 font-normal">Filtrée par campagne, poste, filiale et année</span>
          </h3>
          {filialePerformanceItems.length ? renderFilialeDonutChart(filialePerformanceItems) : <p className="text-xs text-slate-500">Aucune donnée de performance disponible pour les filtres sélectionnés.</p>}
        </div>
      </div>

      {relaunchSuccess && (
        <div className="bg-emerald-800 text-white p-4 rounded-xl shadow-lg border border-emerald-700 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-xs">{relaunchSuccess}</span>
          </div>
          <button onClick={() => setRelaunchSuccess(null)} className="text-emerald-200 hover:text-white text-xs font-bold">
            Fermer
          </button>
        </div>
      )}

      {/* Manager Delays Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Suivi des Retards d'Évaluation par Manager</span>
          </h3>
          
          {delayedManagers.length > 0 && <button
            onClick={handleRelaunchAll}
            disabled={relaunchingManager === 'ALL'}
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{relaunchingManager === 'ALL' ? 'Envoi en cours...' : 'Relancer Tous les Managers en Retard'}</span>
          </button>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3.5 pl-5">Nom du Manager</th>
                <th className="p-3.5">Direction</th>
                <th className="p-3.5">Évaluations en Retard</th>
                <th className="p-3.5">Total à Réaliser</th>
                <th className="p-3.5">Taux d'Avancement</th>
                <th className="p-3.5 pr-5">Action RH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {delayedManagers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-semibold text-emerald-700">
                    Aucun manager ne possède d’évaluation en retard.
                  </td>
                </tr>
              ) : delayedManagers.map((m, idx) => {
                const adv = Math.round(((m.total_count - m.late_count) / m.total_count) * 100) || 0;
                const isRelaunching = relaunchingManager === m.manager_name;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900">{m.manager_name}</td>
                    <td className="p-3.5 text-slate-600">{m.direction}</td>
                    <td className="p-3.5 font-bold text-rose-600">{m.late_count} évaluation(s)</td>
                    <td className="p-3.5 text-slate-600">{m.total_count} collaborateurs</td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${adv === 100 ? 'bg-emerald-600' : 'bg-amber-500'}`} style={{ width: `${adv}%` }}></div>
                        </div>
                        <span className="font-semibold text-slate-700">{adv}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 pr-5">
                      <button 
                        onClick={() => handleRelaunchManager(m.manager_name)}
                        disabled={isRelaunching}
                        className="px-3 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <span>{isRelaunching ? 'Envoi...' : 'Relancer'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

