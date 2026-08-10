import React, { useState, useEffect } from 'react';
import { DashboardKPIs } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export const RHDevelopment: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    apiClient.getKPIs().then(setKpis).catch(console.error);
  }, []);

  if (!kpis) return null;

  const handleExportPDF = () => {
    const headers = ['Domaine de Formation', 'Nombre de Demandes', 'Priorités Hautes'];
    const rows = kpis.trainingNeedsSummary.map(t => [t.category, t.count, t.highPriority]);
    exportToPDF('Plan de Développement RH & Besoins de Formation — Groupe Premium', headers, rows, 'developpement_rh');
  };

  const handleExportExcel = () => {
    const headers = ['Domaine de Formation', 'Nombre de Demandes', 'Priorités Hautes'];
    const rows = kpis.trainingNeedsSummary.map(t => [t.category, t.count, t.highPriority]);
    exportToExcel('Développement RH', headers, rows, 'developpement_rh');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Consolidation Développement RH & Formations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Besoins de formation exprimés lors des entretiens d'évaluation et plans d'accompagnement.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.trainingNeedsSummary.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{item.category}</div>
            <div className="text-3xl font-black text-slate-900">{item.count} <span className="text-xs text-slate-400 font-normal">demandes</span></div>
            <div className="flex items-center space-x-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg w-max">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{item.highPriority} priorités hautes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

