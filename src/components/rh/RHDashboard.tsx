import React, { useState, useEffect } from 'react';
import { DashboardKPIs } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { PieChart, Pie, Cell } from 'recharts';
import { 
  CheckCircle2, Clock, AlertTriangle, Download, FileSpreadsheet, TrendingUp, Layers 
} from 'lucide-react';

export const RHDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [relaunchingManager, setRelaunchingManager] = useState<string | null>(null);
  const [relaunchSuccess, setRelaunchSuccess] = useState<string | null>(null);

  const loadData = () => {
    apiClient.getKPIs().then(res => {
      setKpis(res);
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

  const handleExportPDF = () => {
    const headers = ['Manager', 'Direction', 'Évaluations en Retard', 'Total à Réaliser'];
    const rows = delayedManagers.map(m => [m.manager_name, m.direction, m.late_count, m.total_count]);
    exportToPDF('Indicateurs de Performance & Suivi RH - Groupe Premium', headers, rows, 'kpis_dashboard');
  };

  const handleExportExcel = () => {
    const headers = ['Manager', 'Direction', 'Évaluations en Retard', 'Total à Réaliser'];
    const rows = delayedManagers.map(m => [m.manager_name, m.direction, m.late_count, m.total_count]);
    exportToExcel('KPIs RH', headers, rows, 'kpis_dashboard');
  };

  const COLORS = ['#005C3B', '#10B981', '#F59E0B', '#EF4444'];

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
            Direction Capital Humain — Groupe Premium
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Tableau de Bord Global — Performance 2025
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Avancement Global</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{kpis.globalProgress}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${kpis.globalProgress}%` }}></div>
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
          <div className="text-3xl font-black text-slate-900 mt-2">{kpis.completedEvaluations} <span className="text-xs font-normal text-slate-500">/ {kpis.totalEvaluations}</span></div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-3">
            {kpis.validatedEvaluations} validées par la Direction Générale
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">En Attente / En Cours</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{kpis.pendingEvaluations}</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real averages by professional family */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center justify-between">
            <span>Performance réelle par Famille Métier</span>
            <span className="text-xs text-slate-400 font-normal">Moyenne des évaluations notées</span>
          </h3>
          {renderCircularMetrics(kpis.familyAverages.map(item => ({
            label: item.family,
            value: item.average,
            evaluated: item.evaluated,
            total: item.total,
          })))}
        </div>

        {/* Real averages by job function */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center justify-between">
            <span>Performance réelle par Fonction</span>
            <span className="text-xs text-slate-400 font-normal">Postes et fonctions des collaborateurs</span>
          </h3>
          {renderCircularMetrics(kpis.functionAverages.map(item => ({
            label: item.function,
            value: item.average,
            evaluated: item.evaluated,
            total: item.total,
          })))}
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

