import React, { useState, useEffect } from 'react';
import { User, Evaluation } from '../../types';
import { apiClient } from '../../services/apiClient';
import { UserInitials } from '../UserInitials';
import { exportDossierEvaluationPDF, exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { Search, Download, FileSpreadsheet, Printer } from 'lucide-react';

export const RHCollaborators: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiliale, setSelectedFiliale] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedManager, setSelectedManager] = useState('all');

  useEffect(() => {
    Promise.all([
      apiClient.getUsers(),
      apiClient.getEvaluations()
    ]).then(([uRes, eRes]) => {
      setUsers(uRes.filter(u => u.role === 'collaborateur'));
      setEvaluations(eRes);
    }).catch(console.error);
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.poste_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFiliale = selectedFiliale === 'all' || u.filiale_name.includes(selectedFiliale);
    const matchesDirection = selectedDirection === 'all' || u.direction_name.includes(selectedDirection);
    const matchesManager = selectedManager === 'all' || u.manager_id?.toString() === selectedManager;
    return matchesSearch && matchesFiliale && matchesDirection && matchesManager;
  });

  const getEvaluationForUser = (userId: number) => {
    return evaluations.find(e => e.user_id === userId);
  };

  const formatAxis = (axis?: string) => {
    const value = (axis || '').toLowerCase();
    if (value.includes('faire')) return 'Savoir-faire';
    if (value.includes('etre') || value.includes('être')) return 'Savoir-être';
    if (value.includes('savoir')) return 'Savoir';
    return 'Autres critères';
  };

  const handlePrintEvaluation = (user: User) => {
    const ev = getEvaluationForUser(user.id);
    if (!ev) {
      alert("Aucune évaluation disponible pour ce collaborateur.");
      return;
    }

    const headers = ['Axe', 'Question / compétence', 'Commentaire', 'Note'];
    const rows = ev.competences.map(competence => [
      formatAxis(competence.axe),
      competence.description ? `${competence.name}\n${competence.description}` : competence.name,
      competence.comment || '-',
      competence.score ? `${competence.score}/100` : '-',
    ]);

    rows.push(
      ['Résultat', 'Note finale', '-', ev.score_global > 0 ? `${ev.score_global}/100` : '-'],
      ['Synthèse', 'Points forts', ev.synthesis_points_forts || '-', '-'],
      ['Synthèse', 'Points à améliorer', ev.synthesis_points_ameliorer || '-', '-'],
      ['Synthèse', 'Développement à envisager', ev.synthesis_developpement || '-', '-'],
      ['Synthèse', 'Appréciation globale du manager', ev.summary_comment || '-', '-'],
    );

    exportDossierEvaluationPDF(
      `Fiche d'évaluation complète - ${ev.user_name}`,
      headers,
      rows,
      [
        { role: 'Collaborateur', name: ev.user_name, status: ev.signed_at_user ? `Signé le ${ev.signed_at_user}` : 'Non signé', comment: 'Validation et prise de connaissance' },
        { role: 'Manager évaluateur', name: ev.manager_name, status: ev.score_global > 0 ? 'Évaluation réalisée' : 'Non finalisée', comment: 'Évaluation managériale' },
        { role: 'Direction Générale', name: 'Direction Générale', status: ev.validated_at_dg ? `Validé le ${ev.validated_at_dg}` : 'Non validé', comment: ev.dg_comment || 'Validation du dossier' },
      ],
      `fiche_evaluation_${ev.user_name}`
    );
  };

  const buildExportRows = () => filteredUsers.map(u => {
    const ev = getEvaluationForUser(u.id);
    return [
      u.name,
      u.poste_name,
      u.filiale_name,
      u.direction_name,
      u.manager_name || '-',
      ev?.score_global ? `${ev.score_global}/100` : 'En attente',
      ev?.synthesis_points_forts || '-',
      ev?.synthesis_points_ameliorer || '-',
      ev?.synthesis_developpement || '-',
    ];
  });

  const exportHeaders = [
    'Collaborateur',
    'Poste',
    'Filiale',
    'Famille',
    'Manager',
    'Score Global',
    'Points forts',
    'Points à améliorer',
    'Développement à envisager',
  ];

  const handleExportPDF = () => {
    const headers = exportHeaders;
    const rows = buildExportRows();
    exportToPDF('Liste des Collaborateurs — Groupe Premium', headers, rows, 'collaborateurs_rh');
  };

  const handleExportExcel = () => {
    exportToExcel('Collaborateurs', exportHeaders, buildExportRows(), 'collaborateurs_rh');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Répertoire des Collaborateurs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Filtres croisés par Filiale (Casablanca, Agadir, Meknès, Kénitra, Tanger), Direction et Manager.
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

      {/* Cross Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedFiliale}
            onChange={(e) => setSelectedFiliale(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="all">Toutes Filiales</option>
            <option value="Casablanca">Casablanca</option>
            <option value="Agadir">Agadir</option>
            <option value="Meknès">Meknès</option>
            <option value="Kénitra">Kénitra</option>
            <option value="Tanger">Tanger</option>
          </select>

          <select
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="all">Toutes Directions</option>
            <option value="BTP">Direction BTP</option>
            <option value="Industrie">Direction Industrie</option>
            <option value="Transport">Direction Transport</option>
            <option value="Fourniture">Direction Fourniture</option>
          </select>

          <select
            value={selectedManager}
            onChange={(e) => setSelectedManager(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="all">Tous Managers</option>
            <option value="2">Nabil Idrissi</option>
            <option value="3">Youssef Chraibi</option>
            <option value="4">Salma El Amrani</option>
            <option value="5">Karim Berrada</option>
          </select>
        </div>
      </div>

      {/* Collaborators List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4 pl-6">Collaborateur</th>
              <th className="p-4">Poste & Catégorie</th>
              <th className="p-4">Filiale</th>
              <th className="p-4">Direction</th>
              <th className="p-4">Manager Direct</th>
              <th className="p-4">Score Global 2025</th>
              <th className="p-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(u => {
              const ev = getEvaluationForUser(u.id);
              return (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 pl-6 flex items-center space-x-3">
                    <UserInitials name={u.name} className="w-9 h-9 border-2 border-slate-200 text-[10px] shadow-xs" />
                    <div>
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{u.poste_name}</div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{u.category}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{u.filiale_name}</td>
                  <td className="p-4 text-slate-600">{u.direction_name}</td>
                  <td className="p-4 font-bold text-slate-800">{u.manager_name || 'Direction'}</td>
                  <td className="p-4 font-bold">
                    {ev && ev.score_global > 0 ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black">
                        {ev.score_global} / 100
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full">
                        En cours
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handlePrintEvaluation(u)}
                      disabled={!ev}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

