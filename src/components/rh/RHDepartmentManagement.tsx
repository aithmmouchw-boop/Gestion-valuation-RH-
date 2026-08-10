import React, { useState, useEffect } from 'react';
import { Direction, Filiale } from '../../types';
import { apiClient } from '../../services/apiClient';
import { Building2, Plus, MapPin, Layers, X, Download, FileSpreadsheet, Search } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

export const RHDepartmentManagement: React.FC = () => {
  const [directions, setDirections] = useState<Direction[]>([]);
  const [filiales, setFiliales] = useState<Filiale[]>([]);

  // Search states
  const [deptSearch, setDeptSearch] = useState('');
  const [filialeSearch, setFilialeSearch] = useState('');

  // Modals
  const [showAddDirModal, setShowAddDirModal] = useState(false);
  const [dirForm, setDirForm] = useState({ name: '', code: '' });

  const [showAddFilialeModal, setShowAddFilialeModal] = useState(false);
  const [filialeForm, setFilialeForm] = useState({ name: '', city: 'Casablanca' });

  const loadData = async () => {
    try {
      const dList = await apiClient.getDirections();
      const fList = await apiClient.getFiliales();
      setDirections(dList);
      setFiliales(fList);
    } catch (err) {
      console.error(err);
    } finally {
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDirection = async () => {
    if (!dirForm.name) {
      alert('Veuillez saisir le nom du département/direction.');
      return;
    }
    await apiClient.createDirection({
      name: dirForm.name,
      code: dirForm.code || dirForm.name.substring(0, 4).toUpperCase()
    });
    setShowAddDirModal(false);
    setDirForm({ name: '', code: '' });
    loadData();
  };

  const handleCreateFiliale = async () => {
    if (!filialeForm.name) {
      alert('Veuillez saisir le nom de la filiale.');
      return;
    }
    await apiClient.createFiliale({
      name: filialeForm.name,
      city: filialeForm.city
    });
    setShowAddFilialeModal(false);
    setFilialeForm({ name: '', city: 'Casablanca' });
    loadData();
  };

  const filteredDirections = directions.filter(d =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const filteredFiliales = filiales.filter(f =>
    f.name.toLowerCase().includes(filialeSearch.toLowerCase()) ||
    f.city.toLowerCase().includes(filialeSearch.toLowerCase())
  );

  const handleExportPDF = () => {
    const headers = ['Nom Direction', 'Code'];
    const rows = filteredDirections.map(d => [d.name, d.code]);
    exportToPDF('Organigramme des Directions — Groupe Premium', headers, rows, 'directions_groupe_premium');
  };

  const handleExportExcel = () => {
    const headers = ['Nom Direction', 'Code'];
    const rows = filteredDirections.map(d => [d.name, d.code]);
    exportToExcel('Directions & Départements', headers, rows, 'directions_groupe_premium');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-emerald-800" />
            <span>Gestion des Départements & Filiales</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Structure organisationnelle, découpage des directions métier et entités du Groupe Premium.
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
          <button 
            onClick={() => setShowAddDirModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Département</span>
          </button>
          <button 
            onClick={() => setShowAddFilialeModal(true)}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Filiale</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Directions / Départements List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-800" />
              <h2 className="font-bold text-base text-slate-900">Départements ({filteredDirections.length})</h2>
            </div>
            <button
              onClick={() => setShowAddDirModal(true)}
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Département</span>
            </button>
          </div>

          {/* Department Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code de département (ex: BTP, DEP-BTP)..."
              value={deptSearch}
              onChange={e => setDeptSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            {deptSearch && (
              <button
                onClick={() => setDeptSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredDirections.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Aucun département ne correspond au code ou nom "{deptSearch}".
              </div>
            ) : (
              filteredDirections.map(d => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-emerald-300 transition-colors">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{d.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Code Org: <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{d.code}</span></div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-[10px] rounded-full">
                    Actif
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filiales List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-amber-800" />
              <h2 className="font-bold text-base text-slate-900">Filiales & Implantation ({filteredFiliales.length})</h2>
            </div>
            <button
              onClick={() => setShowAddFilialeModal(true)}
              className="text-xs font-bold text-amber-800 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle</span>
            </button>
          </div>

          {/* Filiale Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une filiale par ville ou nom (ex: Casablanca, Tanger, Meknès)..."
              value={filialeSearch}
              onChange={e => setFilialeSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-amber-50/30 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all font-medium"
            />
            {filialeSearch && (
              <button
                onClick={() => setFilialeSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredFiliales.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Aucune filiale trouvée pour la ville ou nom "{filialeSearch}".
              </div>
            ) : (
              filteredFiliales.map(f => (
                <div key={f.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-amber-300 transition-colors">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{f.name}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-amber-700" />
                      <span className="font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{f.city}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-full">
                    Siège / Site
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddDirModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Ajouter un Nouveau Département</h3>
              <button onClick={() => setShowAddDirModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Département</label>
                <input
                  type="text"
                  placeholder="ex: Département BTP & Infrastructure..."
                  value={dirForm.name}
                  onChange={e => setDirForm({ ...dirForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code Org / Abréviation (Optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: DEP-BTP"
                  value={dirForm.code}
                  onChange={e => setDirForm({ ...dirForm, code: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="pt-2 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowAddDirModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateDirection}
                className="px-4 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-lg hover:bg-emerald-900"
              >
                Créer le Département
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Filiale Modal */}
      {showAddFilialeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Ajouter une Filiale / Entité</h3>
              <button onClick={() => setShowAddFilialeModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom de la Filiale</label>
                <input
                  type="text"
                  placeholder="ex: Premium Equipements - Tanger..."
                  value={filialeForm.name}
                  onChange={e => setFilialeForm({ ...filialeForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville / Localisation</label>
                <input
                  type="text"
                  placeholder="ex: Casablanca, Rabat, Tanger..."
                  value={filialeForm.city}
                  onChange={e => setFilialeForm({ ...filialeForm, city: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="pt-2 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowAddFilialeModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFiliale}
                className="px-4 py-1.5 bg-amber-800 text-white font-bold text-xs rounded-lg hover:bg-amber-900"
              >
                Créer la Filiale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

