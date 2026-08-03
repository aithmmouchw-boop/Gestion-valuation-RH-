import React, { useState, useEffect } from 'react';
import { FicheEvaluation, CompetenceTemplate, AxeType } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { FileText, Download, FileSpreadsheet, Plus, Edit2, Upload, Trash2, X } from 'lucide-react';

export const RHJobTemplates: React.FC = () => {
  const [fiches, setFiches] = useState<FicheEvaluation[]>([]);
  const [templates, setTemplates] = useState<CompetenceTemplate[]>([]);
  const [selectedFicheId, setSelectedFicheId] = useState<number>(1);

  // Edit Modals
  const [showEditFicheModal, setShowEditFicheModal] = useState(false);
  const [ficheForm, setFicheForm] = useState({ name: '', description: '' });

  const [showAddCritereModal, setShowAddCritereModal] = useState(false);
  const [addCritereAxe, setAddCritereAxe] = useState<AxeType>('savoir_faire');
  const [critereForm, setCritereForm] = useState({ name: '', description: '', coefficient: 1 });

  const [editingCritere, setEditingCritere] = useState<CompetenceTemplate | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadData = () => {
    apiClient.getJobTemplates().then(res => {
      setFiches(res.fiches);
      setTemplates(res.templates);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentFiche = fiches.find(f => f.id === selectedFicheId) || fiches[0];
  const currentCompetencies = templates.filter(t => t.fiche_id === (currentFiche ? currentFiche.id : selectedFicheId));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentFiche) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let importedCount = 0;

      try {
        // Try parsing JSON first
        if (file.name.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
          const parsed = JSON.parse(content);
          const itemsToImport = Array.isArray(parsed) ? parsed : (parsed.competences || parsed.criteres || []);

          for (const item of itemsToImport) {
            await apiClient.addJobCompetence({
              fiche_id: currentFiche.id,
              axe: item.axe || 'savoir_faire',
              name: item.name || item.nom || item.title || 'Critère Importé',
              description: item.description || '',
              coefficient: Number(item.coefficient || item.coeff || 1)
            });
            importedCount++;
          }
        } else {
          // Parse CSV or TXT line by line: axe;nom;description;coefficient
          const lines = content.split('\n');
          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine || cleanLine.startsWith('#') || cleanLine.toLowerCase().startsWith('axe')) continue;

            const parts = cleanLine.includes(';') ? cleanLine.split(';') : cleanLine.split(',');
            if (parts.length >= 2) {
              const rawAxe = parts[0].trim().toLowerCase();
              const axe: AxeType = rawAxe.includes('etre') || rawAxe.includes('être') ? 'savoir_etre' : 
                                   rawAxe.includes('faire') ? 'savoir_faire' : 'savoir';
              const name = parts[1].trim();
              const description = parts[2] ? parts[2].trim() : 'Critère importé depuis fichier';
              const coefficient = parts[3] ? parseFloat(parts[3].trim()) || 1 : 1;

              await apiClient.addJobCompetence({
                fiche_id: currentFiche.id,
                axe,
                name,
                description,
                coefficient
              });
              importedCount++;
            }
          }
        }

        alert(`Importation réussie ! ${importedCount} critère(s) de compétence ont été ajoutés au modèle "${currentFiche.poste_name}".`);
        loadData();
      } catch (err: any) {
        alert("Erreur lors de la lecture du fichier : Veuillez vérifier le format (JSON ou CSV formaté 'axe;nom;description;coefficient').");
      }
    };

    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleOpenEditFiche = () => {
    if (!currentFiche) return;
    setFicheForm({ name: currentFiche.name, description: currentFiche.description });
    setShowEditFicheModal(true);
  };

  const handleSaveFiche = async () => {
    if (!currentFiche) return;
    await apiClient.updateJobFiche(currentFiche.id, ficheForm);
    setShowEditFicheModal(false);
    loadData();
  };

  const handleAddCritere = async () => {
    if (!critereForm.name || !currentFiche) return;
    await apiClient.addJobCompetence({
      fiche_id: currentFiche.id,
      axe: addCritereAxe,
      name: critereForm.name,
      description: critereForm.description,
      coefficient: critereForm.coefficient
    });
    setShowAddCritereModal(false);
    setCritereForm({ name: '', description: '', coefficient: 1 });
    loadData();
  };

  const handleSaveCritereEdit = async () => {
    if (!editingCritere) return;
    await apiClient.updateJobCompetence(editingCritere.id, {
      name: editingCritere.name,
      description: editingCritere.description,
      coefficient: editingCritere.coefficient,
      axe: editingCritere.axe
    });
    setEditingCritere(null);
    loadData();
  };

  const handleDeleteCritere = async (id: number) => {
    if (confirm('Supprimer ce critère du modèle ?')) {
      await apiClient.deleteJobCompetence(id);
      loadData();
    }
  };

  const handleExportPDF = () => {
    const headers = ['Axe', 'Intitulé Compétence', 'Description', 'Coeff.'];
    const rows = currentCompetencies.map(c => [
      c.axe.toUpperCase().replace('_', '-'),
      c.name,
      c.description,
      c.coefficient
    ]);
    exportToPDF(`Fiche de Poste — ${currentFiche?.name || ''}`, headers, rows, 'fiche_de_poste');
  };

  const handleExportExcel = () => {
    const headers = ['Axe', 'Intitulé Compétence', 'Description', 'Coeff.'];
    const rows = currentCompetencies.map(c => [
      c.axe.toUpperCase().replace('_', '-'),
      c.name,
      c.description,
      c.coefficient
    ]);
    exportToExcel('Fiche de Poste', headers, rows, 'fiche_de_poste');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestion des Fiches de Poste & Compétences</h1>
          <p className="text-xs text-slate-500 mt-1">
            Mapping entre postes, grilles d'évaluation et référentiel de compétences Groupe Premium.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv,.txt"
            className="hidden"
          />
          <button onClick={handleExportPDF} className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5 border border-slate-200">
            <Download className="w-4 h-4 text-emerald-700" />
            <span>PDF</span>
          </button>
          <button onClick={handleExportExcel} className="px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center space-x-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Importer Fichier Modèle</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Fiches List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="font-bold text-xs text-slate-400 uppercase tracking-wider px-2 mb-2">
            Modèles de Fiches ({fiches.length})
          </div>

          {fiches.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFicheId(f.id)}
              className={`w-full text-left p-3 rounded-xl transition-all border ${
                selectedFicheId === f.id
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm font-bold'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="text-xs">{f.poste_name}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{f.description}</div>
            </button>
          ))}
        </div>

        {/* Right Mapping Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          {currentFiche && (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{currentFiche.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{currentFiche.description}</p>
                </div>
                <button 
                  onClick={handleOpenEditFiche}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Éditer Modèle</span>
                </button>
              </div>

              {/* Competencies grouped by axis */}
              <div className="space-y-4 mt-6">
                {['savoir', 'savoir_faire', 'savoir_etre'].map(axeKey => {
                  const axe = axeKey as AxeType;
                  const items = currentCompetencies.filter(c => c.axe === axe);
                  const axeTitle = axe === 'savoir' ? 'Savoir (20%)' : axe === 'savoir_faire' ? 'Savoir-faire (50%)' : 'Savoir-être (30%)';
                  const badgeColor = axe === 'savoir' ? 'bg-blue-100 text-blue-800' : axe === 'savoir_faire' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800';

                  return (
                    <div key={axe} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 p-3 font-bold text-xs flex justify-between items-center border-b border-slate-200">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold ${badgeColor}`}>
                          {axeTitle}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-500">{items.length} critère(s)</span>
                          <button
                            onClick={() => {
                              setAddCritereAxe(axe);
                              setShowAddCritereModal(true);
                            }}
                            className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-emerald-800 transition-colors flex items-center space-x-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Ajouter Critère</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 divide-y divide-slate-100 text-xs">
                        {items.length === 0 ? (
                          <p className="p-2 text-slate-400 italic">Aucun critère défini pour cet axe.</p>
                        ) : (
                          items.map(item => (
                            <div key={item.id} className="py-2.5 flex justify-between items-center">
                              <div className="space-y-0.5 pr-4">
                                <div className="font-bold text-slate-800">{item.name}</div>
                                <div className="text-[11px] text-slate-500">{item.description}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded text-[10px]">Coeff: {item.coefficient}</span>
                                <button
                                  onClick={() => setEditingCritere({ ...item })}
                                  className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                  title="Modifier le critère"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCritere(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                                  title="Supprimer le critère"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Fiche Modal */}
      {showEditFicheModal && currentFiche && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Modifier le Modèle de Fiche de Poste</h3>
              <button onClick={() => setShowEditFicheModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intitulé de la Fiche / Poste</label>
                <input
                  type="text"
                  value={ficheForm.name}
                  onChange={e => setFicheForm({ ...ficheForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Périmètre</label>
                <textarea
                  rows={3}
                  value={ficheForm.description}
                  onChange={e => setFicheForm({ ...ficheForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="pt-2 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowEditFicheModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveFiche}
                className="px-4 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-lg hover:bg-emerald-900"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Critere Modal */}
      {showAddCritereModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Ajouter un Critère au Modèle ({addCritereAxe.toUpperCase()})</h3>
              <button onClick={() => setShowAddCritereModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Critère</label>
                <input
                  type="text"
                  placeholder="ex: Capacité de Négociation..."
                  value={critereForm.name}
                  onChange={e => setCritereForm({ ...critereForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Indicateurs d'évaluation</label>
                <textarea
                  rows={2}
                  placeholder="ex: Évalue la capacité à conclure des accords satisfaisants..."
                  value={critereForm.description}
                  onChange={e => setCritereForm({ ...critereForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pondération / Coefficient</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={critereForm.coefficient}
                  onChange={e => setCritereForm({ ...critereForm, coefficient: parseFloat(e.target.value) || 1 })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="pt-2 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowAddCritereModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCritere}
                className="px-4 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-lg hover:bg-emerald-900"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Critere Modal */}
      {editingCritere && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Modifier le Critère du Modèle</h3>
              <button onClick={() => setEditingCritere(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Axe de Compétence</label>
                <select
                  value={editingCritere.axe}
                  onChange={e => setEditingCritere({ ...editingCritere, axe: e.target.value as AxeType })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="savoir">Savoir (20%)</option>
                  <option value="savoir_faire">Savoir-faire (50%)</option>
                  <option value="savoir_etre">Savoir-être (30%)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Critère</label>
                <input
                  type="text"
                  value={editingCritere.name}
                  onChange={e => setEditingCritere({ ...editingCritere, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCritere.description}
                  onChange={e => setEditingCritere({ ...editingCritere, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coefficient</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={editingCritere.coefficient}
                  onChange={e => setEditingCritere({ ...editingCritere, coefficient: parseFloat(e.target.value) || 1 })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="pt-2 border-t flex justify-end space-x-2">
              <button
                onClick={() => setEditingCritere(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCritereEdit}
                className="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
