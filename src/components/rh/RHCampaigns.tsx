import React, { useState, useEffect } from 'react';
import { Campagne, CampagneStatus, User } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { 
  Plus, Search, Filter, Play, CheckCircle, Archive, 
  Eye, Edit3, Calendar, AlertCircle, Download, FileSpreadsheet, X, Bell
} from 'lucide-react';

export const RHCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedCampaignForView, setSelectedCampaignForView] = useState<Campagne | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campagne | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // New Campaign Form
  const [formData, setFormData] = useState({
    name: 'Campagne Annuelle de Performance 2026',
    description: 'Campagne d\'évaluation annuelle pour les cadres et techniciens du Groupe Premium',
    year: '2026',
    start_date: '2026-01-15',
    auto_eval_deadline: '2026-02-15',
    manager_eval_deadline: '2026-03-15',
    dg_validation_deadline: '2026-03-25',
    end_date: '2026-03-31',
    regles_evaluations: '1. Évaluation factuelle basée sur les réalisations réelles de l\'année.\n2. Respect de la pondération officielle : Savoir (20%), Savoir-faire (50%), Savoir-être (30%).\n3. Entretien individuel obligatoire d\'au moins 45 minutes.\n4. Formalisation systématique d\'au moins une demande de formation ou axe d\'amélioration.',
    managers_informes: [] as string[],
    filiales: ['Casablanca (Siège)', 'Agadir', 'Meknès', 'Kénitra', 'Tanger'],
    directions: ['Direction BTP & Infrastructure', 'Direction Industrie & Équipements', 'Direction Transport & Logistique', 'Direction Fourniture Industrielle'],
    categories: ['Cadre', 'Manager', 'Technicien', 'Agent']
  });

  const [dateError, setDateError] = useState('');

  const loadCampaigns = () => {
    setLoading(true);
    apiClient.getCampaigns().then(res => {
      setCampaigns(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
    apiClient.getUsers().then(setPlatformUsers).catch(() => setPlatformUsers([]));
  }, []);

  const managers = platformUsers.filter(user => user.role === 'manager');
  const collaborators = platformUsers.filter(user => user.role === 'collaborateur');
  const departments = [...new Set(platformUsers.map(user => user.direction_name).filter(Boolean))];

  const handleLaunch = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir lancer cette campagne ? Des notifications automatiques seront envoyées à tous les managers concernés.')) {
      try {
        const result = await apiClient.launchCampaign(id);
        showToast(result.message || 'Campagne lancée avec succès.');
        loadCampaigns();
      } catch (error: any) {
        showToast(error.message || 'Impossible de lancer la campagne.');
      }
    }
  };

  const handleClose = async (id: number) => {
    if (confirm('Confirmer la clôture de cette campagne ?')) {
      await apiClient.closeCampaign(id);
      loadCampaigns();
    }
  };

  const handleArchive = async (id: number) => {
    if (confirm('Archiver cette campagne ?')) {
      await apiClient.archiveCampaign(id);
      showToast('Campagne archivée avec succès');
      loadCampaigns();
    }
  };

  const handleRelaunch = async (id: number) => {
    try {
      const res = await apiClient.relaunchCampaign(id);
      showToast(res.message || 'Relance envoyée aux managers');
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la relance');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;
    try {
      await apiClient.updateCampaign(editingCampaign.id, editingCampaign);
      showToast('Campagne mise à jour avec succès');
      setEditingCampaign(null);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la modification');
    }
  };

  // Date coherence check
  const validateDates = () => {
    const start = new Date(formData.start_date);
    const autoDeadline = new Date(formData.auto_eval_deadline);
    const mgrDeadline = new Date(formData.manager_eval_deadline);
    const dgDeadline = new Date(formData.dg_validation_deadline);
    const end = new Date(formData.end_date);

    if (start > autoDeadline) {
      setDateError('La date d\'ouverture doit être antérieure à la date limite d\'auto-évaluation.');
      return false;
    }
    if (autoDeadline > mgrDeadline) {
      setDateError('La date limite d\'auto-évaluation doit être antérieure à l\'évaluation manager.');
      return false;
    }
    if (mgrDeadline > dgDeadline) {
      setDateError('La date limite d\'évaluation manager doit être antérieure à la validation DG.');
      return false;
    }
    if (dgDeadline > end) {
      setDateError('La validation DG doit être antérieure à la clôture de la campagne.');
      return false;
    }

    setDateError('');
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateDates()) return;
    await apiClient.createCampaign({ ...formData, status: 'brouillon' });
    setShowModal(false);
    loadCampaigns();
  };

  const handleLaunchFromModal = async () => {
    if (!validateDates()) return;
    try {
      const created = await apiClient.createCampaign({ ...formData, status: 'brouillon' });
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
      if (formData.start_date <= today) {
        await apiClient.launchCampaign(created.id);
        showToast('Campagne lancée et utilisateurs informés.');
      } else {
        showToast(`Campagne planifiée : lancement automatique le ${formData.start_date}.`);
      }
      setShowModal(false);
      loadCampaigns();
    } catch (error: any) {
      showToast(error.message || 'Impossible de créer ou lancer la campagne.');
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'all' || c.year.toString() === selectedYear;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesYear && matchesStatus;
  });

  const getStatusBadge = (status: CampagneStatus) => {
    switch (status) {
      case 'brouillon':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded-full">Brouillon</span>;
      case 'ouverte':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">Ouverte</span>;
      case 'en_cours':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-full">En cours</span>;
      case 'cloturee':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 rounded-full">Clôturée</span>;
      case 'archivee':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 rounded-full">Archivée</span>;
    }
  };

  const handleExportPDF = () => {
    const headers = ['Nom Campagne', 'Année', 'Début', 'Fin', 'Statut', 'Nb Collaborateurs', 'Progression'];
    const rows = filteredCampaigns.map(c => [c.name, c.year, c.start_date, c.end_date, c.status, c.total_collaborateurs, `${c.progress}%`]);
    exportToPDF('Liste des Campagnes d\'Évaluation - Groupe Premium', headers, rows, 'campagnes_rh');
  };

  const handleExportExcel = () => {
    const headers = ['Nom Campagne', 'Année', 'Début', 'Fin', 'Statut', 'Nb Collaborateurs', 'Progression'];
    const rows = filteredCampaigns.map(c => [c.name, c.year, c.start_date, c.end_date, c.status, c.total_collaborateurs, `${c.progress}%`]);
    exportToExcel('Campagnes', headers, rows, 'campagnes_rh');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestion des Campagnes d'Évaluation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Création, programmation, lancement et suivi de l'avancement des campagnes Groupe Premium.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => { setShowModal(true); setModalStep(1); }}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nouvelle Campagne</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une campagne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Année:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
            >
              <option value="all">Toutes</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-600">Statut:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
            >
              <option value="all">Tous</option>
              <option value="brouillon">Brouillon</option>
              <option value="ouverte">Ouverte</option>
              <option value="en_cours">En cours</option>
              <option value="cloturee">Clôturée</option>
              <option value="archivee">Archivée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">Nom de la Campagne</th>
                <th className="p-4">Année</th>
                <th className="p-4">Période</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Collaborateurs</th>
                <th className="p-4">Progression</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Chargement des campagnes...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aucune campagne trouvée.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal line-clamp-1">{c.description}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{c.year}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.start_date} au {c.end_date}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 font-bold text-slate-800">{c.total_collaborateurs} pers.</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${c.progress}%` }}></div>
                        </div>
                        <span className="font-bold text-slate-800">{c.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedCampaignForView(c)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Consulter les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingCampaign({ ...c })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Modifier la campagne"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {c.status === 'brouillon' && (
                          <button
                            onClick={() => handleLaunch(c.id)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors font-bold"
                            title="Lancer la campagne"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        {c.status === 'ouverte' && (
                          <>
                            <button
                              onClick={() => handleRelaunch(c.id)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title="Envoyer une relance / rappels aux managers"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleClose(c.id)}
                              className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-md transition-colors font-bold"
                              title="Clôturer la campagne"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {c.status === 'cloturee' && (
                          <button
                            onClick={() => handleArchive(c.id)}
                            className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                            title="Archiver"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Multi-Section Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Création d'une Nouvelle Campagne</h3>
                <p className="text-xs text-slate-400">Section {modalStep} sur 2</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Tabs Indicator */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                onClick={() => setModalStep(1)}
                className={`flex-1 py-3 text-center border-b-2 ${modalStep === 1 ? 'border-emerald-700 text-emerald-900 bg-white font-extrabold' : 'border-transparent text-slate-500'}`}
              >
                1. Infos Générales
              </button>
              <button
                onClick={() => setModalStep(2)}
                className={`flex-1 py-3 text-center border-b-2 ${modalStep === 2 ? 'border-emerald-700 text-emerald-900 bg-white font-extrabold' : 'border-transparent text-slate-500'}`}
              >
                2. Résumé
              </button>
              <button
                onClick={() => setModalStep(3)}
                className="hidden"
              >
                3. Modèles Fiches
              </button>
              <button
                onClick={() => setModalStep(4)}
                className="hidden"
              >
                4. Résumé
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {dateError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{dateError}</span>
                </div>
              )}

              {modalStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la Campagne</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Année</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date d'Ouverture</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Limite Auto-éval</label>
                      <input
                        type="date"
                        value={formData.auto_eval_deadline}
                        onChange={(e) => setFormData({ ...formData, auto_eval_deadline: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Limite Manager</label>
                      <input
                        type="date"
                        value={formData.manager_eval_deadline}
                        onChange={(e) => setFormData({ ...formData, manager_eval_deadline: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Limite DG</label>
                      <input
                        type="date"
                        value={formData.dg_validation_deadline}
                        onChange={(e) => setFormData({ ...formData, dg_validation_deadline: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Rules and Guidelines Section */}
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Règles, Principes & Éléments à Respecter dans l'Évaluation ({formData.year})
                      </label>
                      <p className="text-[11px] text-slate-500 mb-1.5">
                        Proposez les règles claires, critères d'attribution des notes et consignes que les managers devront obligatoirement appliquer.
                      </p>
                      <textarea
                        rows={3}
                        value={formData.regles_evaluations}
                        onChange={(e) => setFormData({ ...formData, regles_evaluations: e.target.value })}
                        placeholder="1. Évaluation factuelle basée sur les réalisations...\n2. Entretien individuel obligatoire...\n3. Identification d'un besoin de formation..."
                        className="w-full p-2.5 bg-amber-50/40 border border-amber-300 rounded-lg text-xs font-medium text-slate-800"
                      />
                    </div>

                    <div className="hidden">
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Managers Informés & Destinataires des Consignes
                      </label>
                      <p className="text-[11px] text-slate-500 mb-1.5">
                        Ces managers recevront immédiatement une notification avec les règles ci-dessus dès le lancement.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['Nabil Idrissi (BTP)', 'Youssef Chraibi (Industrie)', 'Salma El Amrani (Transport)', 'Karim Berrada (Fourniture)'].map(m => (
                          <label key={m} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200 font-semibold text-slate-800">
                            <input
                              type="checkbox"
                              checked={formData.managers_informes.includes(m)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, managers_informes: [...formData.managers_informes, m] });
                                } else {
                                  setFormData({ ...formData, managers_informes: formData.managers_informes.filter(item => item !== m) });
                                }
                              }}
                              className="rounded text-emerald-700 focus:ring-emerald-500"
                            />
                            <span>{m}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 20 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-emerald-900">Estimation de la Population Cible</div>
                      <div className="text-emerald-700 mt-0.5">Calculé automatiquement selon vos filtres</div>
                    </div>
                    <div className="flex space-x-4 font-bold text-slate-900 text-sm">
                      <div>Collaborateurs: <span className="text-emerald-800">6</span></div>
                      <div>Managers: <span className="text-amber-800">4</span></div>
                      <div>DGs: <span className="text-purple-800">1</span></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Filiales Concernées</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['Casablanca (Siège)', 'Agadir', 'Meknès', 'Kénitra', 'Tanger'].map(f => (
                        <label key={f} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                          <input type="checkbox" defaultChecked className="rounded text-emerald-700 focus:ring-emerald-500" />
                          <span>{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Directions Concernées</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['Direction BTP', 'Direction Industrie', 'Direction Transport', 'Direction Fourniture'].map(d => (
                        <label key={d} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                          <input type="checkbox" defaultChecked className="rounded text-emerald-700 focus:ring-emerald-500" />
                          <span>{d}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 30 && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600">
                    Modèles de fiches d'évaluation associées par poste :
                  </p>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-3 bg-slate-50 font-bold flex justify-between">
                      <span>Poste</span>
                      <span>Grille Associée</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span>Chef de Projet BTP</span>
                      <span className="font-semibold text-emerald-800">Grille Fiche de Poste - Chef de Projet BTP</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span>Ingénieur BTP Senior</span>
                      <span className="font-semibold text-emerald-800">Grille Fiche de Poste - Ingénieur Structure</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span>Technicien Maintenance</span>
                      <span className="font-semibold text-emerald-800">Grille Fiche de Poste - Maintenance Industrielle</span>
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 text-sm">{formData.name}</div>
                    <div><strong>Année :</strong> {formData.year}</div>
                    <div><strong>Période :</strong> Du {formData.start_date} au {formData.end_date}</div>
                    <div><strong>Limite auto-évaluation :</strong> {formData.auto_eval_deadline}</div>
                    <div><strong>Limite manager :</strong> {formData.manager_eval_deadline}</div>
                    <div><strong>Limite validation DG :</strong> {formData.dg_validation_deadline}</div>
                    <div><strong>Filiales :</strong> {formData.filiales.join(', ')}</div>
                    <div><strong>Description :</strong> {formData.description}</div>
                    <div><strong>Population :</strong> {collaborators.length} collaborateurs et {managers.length} managers</div>
                    <div><strong>Départements informés :</strong> {departments.join(', ') || 'Aucun département'}</div>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-1.5 text-slate-900">
                    <div className="font-bold text-amber-900">Règles & Consignes d'Évaluation Définies :</div>
                    <p className="whitespace-pre-line text-xs font-medium text-slate-800">{formData.regles_evaluations}</p>
                  </div>

                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-1 text-slate-900">
                    <div className="font-bold text-blue-900">Information automatique de toute la plateforme</div>
                    <p>{managers.length} managers et {collaborators.length} collaborateurs recevront le message, la description et les consignes de cette campagne.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors"
              >
                Enregistrer en Brouillon
              </button>

              <div className="flex space-x-2">
                {modalStep > 1 && (
                  <button
                    onClick={() => setModalStep(modalStep - 1)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100"
                  >
                    Précédent
                  </button>
                )}
                {modalStep < 2 ? (
                  <button
                    onClick={() => setModalStep(modalStep + 1)}
                    className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800"
                  >
                    Suivant
                  </button>
                ) : (
                  <button
                    onClick={handleLaunchFromModal}
                    className="px-5 py-2 bg-emerald-800 text-white font-bold text-xs rounded-lg hover:bg-emerald-900 shadow-md"
                  >
                    {formData.start_date > new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' })
                      ? 'Planifier la Campagne'
                      : '🚀 Lancer la Campagne'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Modifier la Campagne</span>
              </h3>
              <button onClick={() => setEditingCampaign(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom de la Campagne</label>
                <input
                  type="text"
                  value={editingCampaign.name}
                  onChange={e => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Année</label>
                  <input
                    type="number"
                    value={editingCampaign.year}
                    onChange={e => setEditingCampaign({ ...editingCampaign, year: parseInt(e.target.value, 10) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut</label>
                  <select
                    value={editingCampaign.status}
                    onChange={e => setEditingCampaign({ ...editingCampaign, status: e.target.value as CampagneStatus })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="ouverte">Ouverte</option>
                    <option value="cloturee">Clôturée</option>
                    <option value="archivee">Archivée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Début</label>
                  <input
                    type="date"
                    value={editingCampaign.start_date}
                    onChange={e => setEditingCampaign({ ...editingCampaign, start_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={editingCampaign.end_date}
                    onChange={e => setEditingCampaign({ ...editingCampaign, end_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deadline Auto-évaluation</label>
                <input
                  type="date"
                  value={editingCampaign.auto_eval_deadline}
                  onChange={e => setEditingCampaign({ ...editingCampaign, auto_eval_deadline: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCampaign.description}
                  onChange={e => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Règles & Consignes de l'Évaluation</label>
                <textarea
                  rows={3}
                  value={editingCampaign.regles_evaluations || ''}
                  onChange={e => setEditingCampaign({ ...editingCampaign, regles_evaluations: e.target.value })}
                  className="w-full p-2 border border-amber-300 bg-amber-50/30 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 shadow-md"
              >
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Campaign Details Modal */}
      {selectedCampaignForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedCampaignForView.name}</h3>
                <p className="text-xs text-slate-500">Campagne Annuelle - {selectedCampaignForView.year}</p>
              </div>
              <button onClick={() => setSelectedCampaignForView(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-200">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Calendrier & Deadlines</div>
                <div><strong>Ouverture :</strong> {selectedCampaignForView.start_date}</div>
                <div><strong>Deadline Auto-Eval :</strong> {selectedCampaignForView.auto_eval_deadline}</div>
                <div><strong>Deadline Manager :</strong> {selectedCampaignForView.manager_eval_deadline}</div>
                <div><strong>Validation DG :</strong> {selectedCampaignForView.dg_validation_deadline}</div>
                <div><strong>Clôture Finale :</strong> {selectedCampaignForView.end_date}</div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl space-y-2 border border-emerald-200 text-emerald-900">
                <div className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Périmètre & Cible</div>
                <div><strong>Statut :</strong> {selectedCampaignForView.status.toUpperCase()}</div>
                <div><strong>Progression Global :</strong> {selectedCampaignForView.progress}%</div>
                <div><strong>Collaborateurs Totaux :</strong> {selectedCampaignForView.total_collaborateurs}</div>
                <div><strong>Filiales :</strong> {selectedCampaignForView.filiales?.join(', ') || 'Toutes'}</div>
                <div><strong>Directions :</strong> {selectedCampaignForView.directions?.join(', ') || 'Toutes'}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Description :</span>
              <p className="text-slate-600 mt-1">{selectedCampaignForView.description}</p>
            </div>

            {selectedCampaignForView.regles_evaluations && (
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-amber-900 block">Règles & Consignes de l'Évaluation :</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">{selectedCampaignForView.regles_evaluations}</p>
              </div>
            )}

            {selectedCampaignForView.managers_informes && selectedCampaignForView.managers_informes.length > 0 && (
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
                <span className="font-bold text-blue-900 block">Managers Informés :</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCampaignForView.managers_informes.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[11px]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCampaignForView(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
