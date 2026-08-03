import React, { useState, useEffect } from 'react';
import { User, UserRole, Direction, Filiale } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { 
  Users, UserPlus, Search, Filter, Trash2, Edit3, 
  Download, FileSpreadsheet, X 
} from 'lucide-react';
import { UserInitials } from '../UserInitials';

export const RHUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [filiales, setFiliales] = useState<Filiale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'collaborateur' as UserRole,
    poste_name: 'Chef de Projet',
    filiale_name: 'Groupe Premium - Casablanca (Siège)',
    direction_name: 'Direction BTP & Infrastructure',
    manager_id: '',
    category: 'Cadre' as 'Cadre' | 'Manager' | 'Technicien' | 'Agent'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const uList = await apiClient.getUsers();
      const dList = await apiClient.getDirections();
      const fList = await apiClient.getFiliales();
      setUsers(uList);
      setDirections(dList);
      setFiliales(fList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const managersList = users.filter(u => u.role === 'manager' || u.role === 'dg');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.poste_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDir = directionFilter === 'all' || u.direction_name === directionFilter;
    return matchesSearch && matchesRole && matchesDir;
  });

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert('Veuillez remplir le nom, l’e-mail et le mot de passe de l’utilisateur.');
      return;
    }
    if (formData.password.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const selectedManager = managersList.find(m => m.id.toString() === formData.manager_id);

    await apiClient.createUser({
      ...formData,
      manager_id: formData.manager_id ? parseInt(formData.manager_id, 10) : undefined,
      manager_name: selectedManager ? selectedManager.name : undefined
    });

    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'collaborateur',
      poste_name: 'Chef de Projet',
      filiale_name: 'Groupe Premium - Casablanca (Siège)',
      direction_name: 'Direction BTP & Infrastructure',
      manager_id: '',
      category: 'Cadre'
    });
    loadData();
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    const selectedManager = managersList.find(m => m.id.toString() === editingUser.manager_id?.toString());
    await apiClient.updateUser(editingUser.id, {
      ...editingUser,
      manager_name: selectedManager ? selectedManager.name : editingUser.manager_name
    });
    setEditingUser(null);
    loadData();
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (confirm(`Supprimer l'utilisateur ${name} ?`)) {
      await apiClient.deleteUser(id);
      loadData();
    }
  };

  const handleExportPDF = () => {
    const headers = ['Nom & Prénom', 'Email', 'Rôle', 'Poste', 'Département', 'Manager Référent'];
    const rows = filteredUsers.map(u => [
      u.name,
      u.email,
      u.role.toUpperCase(),
      u.poste_name,
      u.direction_name,
      u.manager_name || '-'
    ]);
    exportToPDF('Répertoire des Utilisateurs — Groupe Premium', headers, rows, 'utilisateurs_groupe_premium');
  };

  const handleExportExcel = () => {
    const headers = ['Nom & Prénom', 'Email', 'Rôle', 'Poste', 'Département', 'Manager Référent'];
    const rows = filteredUsers.map(u => [
      u.name,
      u.email,
      u.role.toUpperCase(),
      u.poste_name,
      u.direction_name,
      u.manager_name || '-'
    ]);
    exportToExcel('Répertoire Utilisateurs', headers, rows, 'utilisateurs_groupe_premium');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-800" />
            <span>Gestion des Utilisateurs & Attribution des Rôles</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administration des comptes, assignation des départements, filiales et affectation des managers référents.
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
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Compte Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou poste..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-600">Rôle:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="all">Tous les rôles</option>
              <option value="rh">Direction RH</option>
              <option value="manager">Manager</option>
              <option value="collaborateur">Collaborateur</option>
              <option value="dg">Direction Générale</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-600">Département:</span>
            <select
              value={directionFilter}
              onChange={e => setDirectionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="all">Tous les départements</option>
              {directions.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                <th className="p-4 pl-6">Utilisateur</th>
                <th className="p-4">Rôle</th>
                <th className="p-4">Poste & Catégorie</th>
                <th className="p-4">Département</th>
                <th className="p-4">Manager Référent</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Chargement du répertoire des utilisateurs...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Aucun utilisateur trouvé.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <UserInitials name={u.name} className="w-10 h-10 border-2 border-slate-200 text-[10px] shadow-xs" />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        u.role === 'rh' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        u.role === 'manager' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        u.role === 'dg' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                        'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {u.role === 'rh' ? 'DRH / RH' : u.role === 'manager' ? 'Manager' : u.role === 'dg' ? 'Direction Générale' : 'Collaborateur'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{u.poste_name}</div>
                      <div className="text-[10px] text-slate-400">{u.category}</div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{u.direction_name}</td>
                    <td className="p-4 font-bold text-slate-800">
                      {u.manager_name ? (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {u.manager_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">N/A (Souverain)</span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setEditingUser({ ...u })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Modifier l'utilisateur"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-800" />
                <span>Créer un Nouvel Utilisateur</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Role Selection - Strictly 3 Roles */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Sélection du Rôle Système</label>
                <select
                  value={formData.role}
                  onChange={e => {
                    const newRole = e.target.value as UserRole;
                    const defaultDir = formData.direction_name || directions[0]?.name || 'Direction BTP & Infrastructure';
                    setFormData({
                      ...formData,
                      role: newRole,
                      poste_name: newRole === 'dg' ? `Directeur Général - ${defaultDir}` : newRole === 'manager' ? 'Chef de Département' : 'Collaborateur Technique',
                      direction_name: defaultDir,
                      category: newRole === 'dg' ? 'Manager' : newRole === 'manager' ? 'Manager' : 'Cadre'
                    });
                  }}
                  className="w-full p-2.5 border-2 border-emerald-600 bg-emerald-50/50 rounded-xl font-bold text-slate-900 text-xs shadow-sm"
                >
                  <option value="collaborateur">1. Collaborateur</option>
                  <option value="manager">2. Manager / Chef de Service</option>
                  <option value="dg">3. Direction Générale (DG)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Chaque rôle est associé à un département/direction spécifique du Groupe Premium.
                </p>
              </div>

              {/* Basic Fields Required for ALL roles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom & Prénom *</label>
                  <input
                    type="text"
                    placeholder="ex: Youssef El Amrani"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adresse Email *</label>
                  <input
                    type="email"
                    placeholder="ex: youssef@groupepremium.ma"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mot de passe temporaire *</label>
                <input
                  type="password"
                  placeholder="8 caractères minimum"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-600"
                />
                <p className="mt-1 text-[10px] text-slate-500">L’utilisateur pourra le modifier depuis la rubrique « Mon profil ».</p>
              </div>

              {/* Department and Filiale for ALL roles (Collaborateur, Manager, DG) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Département / Direction *</label>
                  <select
                    value={formData.direction_name}
                    onChange={e => {
                      const newDir = e.target.value;
                      setFormData({ 
                        ...formData, 
                        direction_name: newDir,
                        poste_name: formData.role === 'dg' ? `Directeur Général - ${newDir}` : formData.poste_name
                      });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-600 font-semibold text-slate-900"
                  >
                    {directions.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Filiale / Implantation *</label>
                  <select
                    value={formData.filiale_name}
                    onChange={e => setFormData({ ...formData, filiale_name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-600"
                  >
                    {filiales.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intitulé du Poste</label>
                <input
                  type="text"
                  placeholder={formData.role === 'dg' ? "ex: Directeur Général BTP" : formData.role === 'manager' ? "ex: Chef de Département" : "ex: Ingénieur Etudes"}
                  value={formData.poste_name}
                  onChange={e => setFormData({ ...formData, poste_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Additional Specific Fields for Collaborateur ONLY */}
              {formData.role === 'collaborateur' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Catégorie Professionnelle</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      >
                        <option value="Cadre">Cadre</option>
                        <option value="Technicien">Technicien</option>
                        <option value="Agent">Agent de Maîtrise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Manager Référent *</label>
                      <select
                        value={formData.manager_id}
                        onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                        className="w-full p-2 border border-amber-300 bg-amber-50/50 rounded-lg font-bold"
                      >
                        <option value="">Sélectionner un Manager...</option>
                        {managersList.map(m => (
                          <option key={m.id} value={m.id.toString()}>
                            {m.name} ({m.direction_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Info Box for DG */}
              {formData.role === 'dg' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px] font-medium">
                  <strong>Compte Direction Générale (DG) :</strong> Directeur Général affecté au département <em>{formData.direction_name}</em>. Possède le pouvoir souverain de validation finale des évaluations de ce département.
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                className="px-5 py-2 bg-emerald-800 text-white font-bold text-xs rounded-lg hover:bg-emerald-900 shadow"
              >
                Créer l'Utilisateur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Modifier l'Utilisateur: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Rôle Système</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full p-2 border-2 border-emerald-600 bg-emerald-50/50 rounded-lg font-bold"
                >
                  <option value="collaborateur">Collaborateur</option>
                  <option value="manager">Manager / Chef de Service</option>
                  <option value="dg">Direction Générale (DG)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom & Prénom</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Département / Direction *</label>
                  <select
                    value={editingUser.direction_name}
                    onChange={e => setEditingUser({ ...editingUser, direction_name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                  >
                    {directions.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intitulé du Poste</label>
                  <input
                    type="text"
                    value={editingUser.poste_name}
                    onChange={e => setEditingUser({ ...editingUser, poste_name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {editingUser.role === 'collaborateur' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manager Référent</label>
                  <select
                    value={editingUser.manager_id || ''}
                    onChange={e => setEditingUser({ ...editingUser, manager_id: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Aucun</option>
                    {managersList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.direction_name})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-5 py-2 bg-emerald-800 text-white font-bold text-xs rounded-lg hover:bg-emerald-900 shadow"
              >
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
