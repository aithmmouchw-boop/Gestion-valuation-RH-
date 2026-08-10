import React, { useState, useEffect } from 'react';
import { DashboardKPIs } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { CheckCircle2, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';

export const RHCompetencies: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    apiClient.getKPIs().then(setKpis).catch(console.error);
  }, []);

  if (!kpis) return null;

  const handleExportPDF = () => {
    const headers = ['Compétence', 'Axe', 'Note Moyenne'];
    const rows = [
      ...kpis.topCompetencies.map(c => [c.name, c.axe, `${c.score}/100`]),
      ...kpis.weakCompetencies.map(c => [c.name, c.axe, `${c.score}/100`])
    ];
    exportToPDF('Bilan des Compétences Groupe — Groupe Premium', headers, rows, 'competences_groupe');
  };

  const handleExportExcel = () => {
    const headers = ['Compétence', 'Axe', 'Note Moyenne'];
    const rows = [
      ...kpis.topCompetencies.map(c => [c.name, c.axe, `${c.score}/100`]),
      ...kpis.weakCompetencies.map(c => [c.name, c.axe, `${c.score}/100`])
    ];
    exportToExcel('Compétences', headers, rows, 'competences_groupe');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analyse des Compétences Groupe</h1>
          <p className="text-xs text-slate-500 mt-1">
            Compétences les mieux maîtrisées vs. à renforcer sur les 3 axes (Savoir 20%, Savoir-faire 50%, Savoir-être 30%).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={handleExportPDF} className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5 border border-slate-200">
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export PDF</span>
          </button>
          <button onClick={handleExportExcel} className="px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center space-x-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Mastered Skills */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>Compétences les Mieux Maîtrisées</span>
          </div>

          <div className="divide-y divide-slate-100">
            {kpis.topCompetencies.map((comp, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{comp.name}</div>
                  <span className="text-[10px] text-slate-500 font-medium">{comp.axe}</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full">
                  {comp.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Skills to Strengthen */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Compétences à Renforcer (Priorités Formation)</span>
          </div>

          <div className="divide-y divide-slate-100">
            {kpis.weakCompetencies.map((comp, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{comp.name}</div>
                  <span className="text-[10px] text-slate-500 font-medium">{comp.axe}</span>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-xs rounded-full">
                  {comp.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

