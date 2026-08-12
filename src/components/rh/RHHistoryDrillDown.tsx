import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { User, Evaluation } from '../../types';
import { UserInitials } from '../UserInitials';
import { CollaboratorDetailDossier } from '../manager/CollaboratorDetailDossier';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { PieChart, Pie, Cell } from 'recharts';
import { 
  ChevronRight, Building2, Download, FileSpreadsheet, ArrowLeft, Eye
} from 'lucide-react';

interface DrillCampaign {
  id: number;
  year: number;
  name: string;
  completion_rate: number;
  average_score: number;
  status: string;
}

interface DirectionWithManagers {
  direction_name: string;
  code: string;
  managers: User[];
}

export const RHHistoryDrillDown: React.FC = () => {
  // Navigation level state
  // level 1: Campaigns list
  // level 2: Selected campaign -> Departments & Managers list
  // level 3: Selected manager -> Manager detail & Collaborators list
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  const [campaigns, setCampaigns] = useState<DrillCampaign[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');

  // Selected entities for breadcrumb and drill-down
  const [selectedCampaign, setSelectedCampaign] = useState<DrillCampaign | null>(null);
  const [selectedDirectionName, setSelectedDirectionName] = useState<string | null>(null);
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.getHistoryDrilldown(),
      apiClient.getEvaluations(),
      apiClient.getUsers()
    ]).then(([hRes, eRes, uRes]) => {
      setCampaigns(hRes.campaigns);
      setAllEvaluations(eRes);
      setAllUsers(uRes);
    }).catch(console.error);
  }, []);

  // Level 1 -> Click Campaign
  const handleSelectCampaign = (c: DrillCampaign) => {
    setSelectedCampaign(c);
    setSelectedDirectionName(null);
    setSelectedManager(null);
    setLevel(2);
  };

  // Level 2 -> Click Manager
  const handleSelectManager = (mgr: User, dirName: string) => {
    setSelectedDirectionName(dirName);
    setSelectedManager(mgr);
    setLevel(3);
  };

  // Reset to level 1
  const handleGoToLevel1 = () => {
    setLevel(1);
    setSelectedCampaign(null);
    setSelectedDirectionName(null);
    setSelectedManager(null);
  };

  // Reset to level 2
  const handleGoToLevel2 = () => {
    setLevel(2);
    setSelectedManager(null);
  };

  // Group managers by Direction for Level 2
  const getDirectionsForCampaign = (): DirectionWithManagers[] => {
    const managerIdsWithData = new Set(allEvaluations
      .filter(evaluation => evaluation.campagne_id === selectedCampaign?.id && evaluation.score_global > 0)
      .map(evaluation => evaluation.manager_id));
    const managers = allUsers.filter(u => u.role === 'manager' && managerIdsWithData.has(u.id));
    const directionsMap: Record<string, User[]> = {};

    managers.forEach(m => {
      const dir = m.direction_name;
      if (!directionsMap[dir]) directionsMap[dir] = [];
      directionsMap[dir].push(m);
    });

    return Object.keys(directionsMap).map(dirName => ({
      direction_name: dirName,
      code: dirName.split(' ')[1] || 'DIR',
      managers: directionsMap[dirName]
    }));
  };

  // Get Collaborators for selected manager in Level 3
  const getCollaboratorsForSelectedManager = () => {
    if (!selectedManager || !selectedCampaign) return [];
    const userIdsWithHistory = new Set(allEvaluations
      .filter(evaluation => evaluation.campagne_id === selectedCampaign.id && evaluation.manager_id === selectedManager.id && evaluation.score_global > 0)
      .map(evaluation => evaluation.user_id));
    return allUsers.filter(u => u.manager_id === selectedManager.id && userIdsWithHistory.has(u.id));
  };

  const getEvaluationForUserInCampaign = (userId: number) => {
    if (!selectedCampaign) return null;
    return allEvaluations.find(e => e.user_id === userId && e.campagne_id === selectedCampaign.id);
  };

  // Exports for current view
  const handleExportPDF = () => {
    if (level === 1) {
      const headers = ['Année', 'Campagne', 'Moyenne Groupe', 'Taux de Complétion'];
      const rows = campaigns.map(c => [c.year, c.name, `${c.average_score}/100`, `${c.completion_rate}%`]);
      exportToPDF('Historique des Campagnes RH — Groupe Premium', headers, rows, 'historique_campagnes');
    } else if (level === 2) {
      const headers = ['Direction', 'Manager', 'Poste', 'Filiale'];
      const dirs = getDirectionsForCampaign();
      const rows: any[] = [];
      dirs.forEach(d => {
        d.managers.forEach(m => {
          rows.push([d.direction_name, m.name, m.poste_name, m.filiale_name]);
        });
      });
      exportToPDF(`Historique Campagne ${selectedCampaign?.year} — Familles & Managers`, headers, rows, 'historique_familles');
    } else if (level === 3 && selectedManager) {
      const collabList = getCollaboratorsForSelectedManager();
      const headers = [
        'Collaborateur',
        'Poste',
        'Filiale',
        'Statut',
        'Score Global',
        'Points forts',
        'Points à améliorer',
        'Développement à envisager',
      ];
      const rows = collabList.map(c => {
        const ev = getEvaluationForUserInCampaign(c.id);
        return [
          c.name,
          c.poste_name,
          c.filiale_name,
          ev?.status || 'En attente',
          ev?.score_global ? `${ev.score_global}/100` : '-',
          ev?.synthesis_points_forts || '-',
          ev?.synthesis_points_ameliorer || '-',
          ev?.synthesis_developpement || '-',
        ];
      });
      exportToPDF(`Équipe Manager ${selectedManager.name} — ${selectedCampaign?.year}`, headers, rows, 'historique_manager');
    }
  };

  const handleExportExcel = () => {
    if (level === 1) {
      const headers = ['Année', 'Campagne', 'Moyenne Groupe', 'Taux de Complétion'];
      const rows = campaigns.map(c => [c.year, c.name, `${c.average_score}/100`, `${c.completion_rate}%`]);
      exportToExcel('Historique Campagnes', headers, rows, 'historique_campagnes');
    } else if (level === 3 && selectedManager) {
      const collabList = getCollaboratorsForSelectedManager();
      const headers = [
        'Collaborateur',
        'Poste',
        'Filiale',
        'Statut',
        'Score Global',
        'Points forts',
        'Points à améliorer',
        'Développement à envisager',
      ];
      const rows = collabList.map(c => {
        const ev = getEvaluationForUserInCampaign(c.id);
        return [
          c.name,
          c.poste_name,
          c.filiale_name,
          ev?.status || 'En attente',
          ev?.score_global ? `${ev.score_global}/100` : '-',
          ev?.synthesis_points_forts || '-',
          ev?.synthesis_points_ameliorer || '-',
          ev?.synthesis_developpement || '-',
        ];
      });
      exportToExcel(`Manager ${selectedManager.name}`, headers, rows, 'historique_manager');
    }
  };

  const campaignEvaluations = selectedCampaign
    ? allEvaluations.filter(evaluation => evaluation.campagne_id === selectedCampaign.id)
    : [];
  const filteredCampaigns = campaigns.filter(campaign => {
    const query = campaignSearchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      campaign.name.toLowerCase().includes(query) ||
      campaign.year.toString().includes(query) ||
      campaign.status.toLowerCase().includes(query)
    );
  });
  const scoredCampaignEvaluations = campaignEvaluations.filter(evaluation => evaluation.score_global > 0);
  const completedCampaignEvaluations = campaignEvaluations.filter(evaluation => evaluation.status === 'valide' || evaluation.status === 'soumis_dg');
  const campaignAverage = scoredCampaignEvaluations.length > 0
    ? Math.round((scoredCampaignEvaluations.reduce((sum, evaluation) => sum + evaluation.score_global, 0) / scoredCampaignEvaluations.length) * 10) / 10
    : 0;

  const aggregateScores = (key: 'manager_name' | 'direction_name') => {
    const labels = [...new Set(campaignEvaluations.map(evaluation => evaluation[key]).filter(Boolean))];
    return labels.map(label => {
      const items = campaignEvaluations.filter(evaluation => evaluation[key] === label);
      const scored = items.filter(evaluation => evaluation.score_global > 0);
      return {
        label,
        value: scored.length > 0 ? Math.round((scored.reduce((sum, evaluation) => sum + evaluation.score_global, 0) / scored.length) * 10) / 10 : 0,
        evaluated: scored.length,
        total: items.length,
      };
    });
  };

  const renderCampaignCircles = (items: ReturnType<typeof aggregateScores>) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-col items-center p-3 text-center">
          <div className="relative w-[118px] h-[118px]">
            <PieChart width={118} height={118}>
              <Pie data={[{ value: item.value }, { value: 100 - item.value }]} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={52} startAngle={90} endAngle={-270} stroke="none">
                <Cell fill={['#047857', '#2563EB', '#D97706', '#7C3AED'][index % 4]} />
                <Cell fill="#E2E8F0" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center font-black text-slate-900">{item.value}%</div>
          </div>
          <div className="text-[11px] font-bold text-slate-800">{item.label}</div>
          <div className="text-[10px] text-slate-500">{item.evaluated} notée(s) / {item.total}</div>
        </div>
      ))}
    </div>
  );

  if (selectedEvaluationId !== null) {
    return (
      <CollaboratorDetailDossier
        evaluationId={selectedEvaluationId}
        onBack={() => setSelectedEvaluationId(null)}
        readOnly
        readOnlyContext="rh"
        showGuidelines={false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Exports */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Historique Général & Navigation en Profondeur</h1>
          <p className="text-xs text-slate-500 mt-1">
            Explorez les campagnes passées par Direction Métier, Manager et Collaborateur (Drill-down).
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

      {/* Breadcrumb Bar (Fil d'Ariane) */}
      <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-md flex items-center space-x-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={handleGoToLevel1}
          className={`hover:text-emerald-400 transition-colors ${level === 1 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}
        >
          Historique
        </button>

        {selectedCampaign && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <button
              onClick={handleGoToLevel2}
              className={`hover:text-emerald-400 transition-colors ${level === 2 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}
            >
              Campagne {selectedCampaign.year}
            </button>
          </>
        )}

        {selectedDirectionName && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-300">{selectedDirectionName}</span>
          </>
        )}

        {selectedManager && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-emerald-400 font-bold">{selectedManager.name}</span>
          </>
        )}
      </div>

      {level === 1 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <input
            type="text"
            value={campaignSearchTerm}
            onChange={event => setCampaignSearchTerm(event.target.value)}
            placeholder="Rechercher une campagne par nom, année ou statut..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>
      )}

      {/* SCREEN 1: List of Past Campaigns */}
      {level === 1 && (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          <div className="hidden md:grid grid-cols-[100px_1fr_160px_160px_110px] gap-4 px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Année</span>
            <span>Campagne</span>
            <span>Moyenne</span>
            <span>Complétion</span>
            <span></span>
          </div>
          {filteredCampaigns.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              Aucune campagne trouvée.
            </div>
          )}
          {filteredCampaigns.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelectCampaign(c)}
              className="w-full grid grid-cols-1 md:grid-cols-[100px_1fr_160px_160px_110px] gap-2 md:gap-4 items-center px-3 py-4 text-left hover:bg-emerald-50/60 transition-colors group"
            >
              <span className="font-black text-emerald-900">{c.year}</span>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-900">{c.name}</div>
                <div className="text-[11px] text-slate-500">Revue annuelle consolidée Groupe Premium</div>
              </div>
              <span className="font-black text-slate-900"><span className="md:hidden text-xs font-medium text-slate-400">Moyenne : </span>{c.average_score} / 100</span>
              <span className="font-black text-emerald-800"><span className="md:hidden text-xs font-medium text-slate-400">Complétion : </span>{c.completion_rate}%</span>
              <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-700 flex items-center md:justify-end gap-1">Explorer <ChevronRight className="w-4 h-4" /></span>
            </button>
          ))}
        </div>
      )}

      {/* SCREEN 2: Departments & Managers List */}
      {level === 2 && selectedCampaign && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-800" />
              <span>Familles & Managers — Campagne {selectedCampaign.year}</span>
            </h2>
            <button
              onClick={handleGoToLevel1}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour aux Campagnes</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl"><div className="text-[10px] uppercase font-bold text-slate-500">Évaluations</div><div className="text-2xl font-black text-slate-900">{campaignEvaluations.length}</div></div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl"><div className="text-[10px] uppercase font-bold text-slate-500">Terminées</div><div className="text-2xl font-black text-emerald-800">{completedCampaignEvaluations.length}</div></div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl"><div className="text-[10px] uppercase font-bold text-slate-500">Progression réelle</div><div className="text-2xl font-black text-blue-800">{campaignEvaluations.length ? Math.round((completedCampaignEvaluations.length / campaignEvaluations.length) * 100) : 0}%</div></div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl"><div className="text-[10px] uppercase font-bold text-slate-500">Moyenne réelle</div><div className="text-2xl font-black text-purple-800">{campaignAverage}/100</div></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white p-4 border border-slate-200 rounded-xl">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Performance par Manager</h3>
              {aggregateScores('manager_name').length ? renderCampaignCircles(aggregateScores('manager_name')) : <p className="text-xs text-slate-500">Aucune donnée notée.</p>}
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-xl">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Performance par Famille Métier</h3>
              {aggregateScores('direction_name').length ? renderCampaignCircles(aggregateScores('direction_name')) : <p className="text-xs text-slate-500">Aucune donnée notée.</p>}
            </div>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {getDirectionsForCampaign().map(dir => (
              <div key={dir.direction_name} className="py-3">
                <div className="px-3 py-2 font-bold text-xs text-slate-900 flex justify-between items-center">
                  <span>{dir.direction_name}</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]">
                    {dir.managers.length} Manager(s)
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {dir.managers.map(mgr => (
                    <button
                      key={mgr.id}
                      onClick={() => handleSelectManager(mgr, dir.direction_name)}
                      className="w-full px-3 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <UserInitials name={mgr.name} className="w-9 h-9 border border-slate-300 text-[10px]" />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{mgr.name}</div>
                          <div className="text-[10px] text-slate-500">{mgr.poste_name} • {mgr.filiale_name}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-xs font-bold text-emerald-800">
                        <span>Voir l'équipe</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 3: Manager Detail & Collaborators List */}
      {level === 3 && selectedManager && selectedCampaign && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoToLevel2}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la liste des familles</span>
            </button>
          </div>

          {/* Manager Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <UserInitials name={selectedManager.name} className="w-16 h-16 border-2 border-emerald-600 text-base" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Manager Rattaché
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{selectedManager.name}</h2>
                <p className="text-xs text-slate-500">{selectedManager.poste_name} • {selectedManager.direction_name} ({selectedManager.filiale_name})</p>
              </div>
            </div>

            <div className="flex space-x-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs">
              <div>
                <div className="text-slate-400 font-medium">Collaborateurs</div>
                <div className="text-xl font-black text-slate-900">{getCollaboratorsForSelectedManager().length} personnes</div>
              </div>
              <div>
                <div className="text-slate-400 font-medium">Campagne</div>
                <div className="text-xl font-black text-emerald-800">{selectedCampaign.year}</div>
              </div>
            </div>
          </div>

          {/* Collaborators Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
              Liste des Collaborateurs de l'Équipe
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4 pl-6">Collaborateur</th>
                  <th className="p-4">Poste</th>
                  <th className="p-4">Filiale</th>
                  <th className="p-4">Statut d'Évaluation</th>
                  <th className="p-4 pr-6">Score Global Calculé</th>
                  <th className="p-4 pr-6 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getCollaboratorsForSelectedManager().map(collab => {
                  const ev = getEvaluationForUserInCampaign(collab.id);
                  return (
                    <tr key={collab.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 flex items-center space-x-3">
                        <UserInitials name={collab.name} className="w-8 h-8 border border-slate-200 text-[9px]" />
                        <div>
                          <div className="font-bold text-slate-900">{collab.name}</div>
                          <div className="text-[10px] text-slate-500">{collab.email}</div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{collab.poste_name}</td>
                      <td className="p-4 text-slate-600">{collab.filiale_name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold text-[11px] rounded-full">
                          {ev?.status || 'En attente'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 font-bold text-emerald-900">
                        {ev?.score_global ? `${ev.score_global} / 100` : 'Non calculé'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {ev && (
                          <button
                            type="button"
                            onClick={() => setSelectedEvaluationId(ev.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Voir le dossier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


