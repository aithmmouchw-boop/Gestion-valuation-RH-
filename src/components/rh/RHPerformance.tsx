import React, { useState, useEffect } from 'react';
import { DashboardKPIs } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileSpreadsheet } from 'lucide-react';

export const RHPerformance: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    apiClient.getKPIs().then(setKpis).catch(console.error);
  }, []);

  if (!kpis) return null;

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#005C3B'];

  const handleExportPDF = () => {
    const headers = ['Catégorie / Tranche', 'Nombre de Collaborateurs'];
    const rows = kpis.scoreDistribution.map(s => [s.range, s.count]);
    exportToPDF('Rapport de Performance Groupe — Groupe Premium', headers, rows, 'performance_groupe');
  };

  const handleExportExcel = () => {
    const headers = ['Catégorie / Tranche', 'Nombre de Collaborateurs'];
    const rows = kpis.scoreDistribution.map(s => [s.range, s.count]);
    exportToExcel('Performance', headers, rows, 'performance_groupe');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytique de Performance Groupe</h1>
          <p className="text-xs text-slate-500 mt-1">
            Distribution des résultats, moyenne Groupe, moyennes par filiale et par direction métier.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4">
            Répartition des Résultats de Performance
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis.scoreDistribution}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {kpis.scoreDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filiale Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4">
            Comparatif des Moyennes par Filiale (2025)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.filialeAverages}>
                <XAxis dataKey="filiale" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="average" fill="#005C3B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

