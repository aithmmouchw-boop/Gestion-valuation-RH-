import React, { useState, useEffect } from 'react';
import { User, UserRole, Direction, Filiale, Poste } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { 
  Users, UserPlus, Search, Filter, Trash2, Edit3, 
  Download, FileSpreadsheet, X, Mail 
} from 'lucide-react';
import { UserInitials } from '../UserInitials';

const categoryOptions: Record<UserRole, User['category'][]> = {
  collaborateur: ['Employé', 'Technicien', 'Agent', 'Cadre'],
  manager: ['Cadre'],
  dg: ['Cadre dirigeant'],
  rh: ['Cadre'],
};

export const RHUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [filiales, setFiliales] = useState<Filiale[]>([]);
  const [postes, setPostes] = useState<Poste[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'collaborateur' as UserRole,
    poste_name: '',
    filiale_name: '',
    direction_name: '',
    manager_id: '',
    category: 'Employé' as User['category']
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const uList = await apiClient.getUsers();
      const dList = await apiClient.getDirections();
      const fList = await apiClient.getFiliales();
      const pList = await apiClient.getPostes();
      setUsers(uList);
      setDirections(dList);
      setFiliales(fList);
      setPostes(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getManagersForAssignment = (directionName?: string, filialeName?: string) => users.filter(user => {
    if (user.role !== 'manager') return false;
    if (directionName && user.direction_name !== directionName) return false;
    if (filialeName && user.filiale_name !== filialeName) return false;
    return true;
  });
  const managersList = getManagersForAssignment(formData.direction_name, formData.filiale_name);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.poste_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDir = directionFilter === 'all' || u.direction_name === directionFilter;
    return matchesSearch && matchesRole && matchesDir;
  });

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email) {
      alert('Veuillez remplir le nom et l’adresse e-mail de l’utilisateur.');
      return;
    }
    if (formData.role === 'collaborateur' && (!formData.direction_name || !formData.filiale_name || !formData.poste_name || !formData.manager_id)) {
      alert('Le département, la filiale, le poste et le Manager référent sont obligatoires pour un collaborateur.'); return;
    }
    if (formData.role === 'manager' && (!formData.direction_name || !formData.filiale_name || !formData.poste_name)) {
      alert('Le département, la filiale et le poste sont obligatoires pour un Manager.'); return;
    }
    if (formData.role === 'dg' && !formData.direction_name && !formData.filiale_name) {
      alert('Sélectionnez le département ou la filiale supervisée par le Directeur Général.'); return;
    }

    const selectedManager = managersList.find(m => m.id.toString() === formData.manager_id);

    setCreatingUser(true);
    try {
      const result = await apiClient.createUser({
        ...formData,
        manager_id: formData.manager_id ? parseInt(formData.manager_id, 10) : undefined,
        manager_name: selectedManager ? selectedManager.name : undefined
      });
      alert(result.message);
      setShowAddModal(false);
      setFormData({ name: '', email: '', role: 'collaborateur', poste_name: '', filiale_name: '', direction_name: '', manager_id: '', category: 'Employé' });
      loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "La création de l'utilisateur a échoué.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    const editingManagersList = getManagersForAssignment(editingUser.direction_name, editingUser.filiale_name);
    const selectedManager = editingManagersList.find(m => m.id.toString() === editingUser.manager_id?.toString());
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

  const handleResendInvitation = async (id: number) => {
    try { const result = await apiClient.resendUserInvitation(id); alert(result.message); }
    catch (error) { alert(error instanceof Error ? error.message : "Impossible d'envoyer l'invitation."); }
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
                        {u.must_change_password && <button onClick={() => handleResendInvitation(u.id)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md" title="Renvoyer l'invitation par email"><Mail className="w-4 h-4" /></button>}
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
              {/* Le rôle pilote automatiquement les champs affichés. */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">Sélection du Rôle Système</label>
                <select
                  value={formData.role}
                  onChange={e => {
                    const newRole = e.target.value as UserRole;
                    setFormData({
                      ...formData,
                      role: newRole,
                      poste_name: '', direction_name: '', filiale_name: '', manager_id: '',
                      category: categoryOptions[newRole][0]
                    });
                  }}
                  className="w-full p-2.5 border-2 border-emerald-600 bg-emerald-50/50 rounded-xl font-bold text-slate-900 text-xs shadow-sm"
                >
                  <option value="rh">1. DRH / D.Dev</option>
                  <option value="manager">2. Manager</option>
                  <option value="collaborateur">3. Collaborateur</option>
                  <option value="dg">4. Directeur Général (DG)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Seuls les champs utiles au rôle sélectionné sont affichés.
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

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900">
                <strong>Accès sécurisé :</strong> un mot de passe temporaire unique sera généré automatiquement et envoyé à cette adresse email. Le DRH ne pourra pas le consulter. L’utilisateur devra le remplacer lors de sa première connexion.
              </div>

              {formData.role !== 'rh' && <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Département / Direction {formData.role !== 'dg' && '*'}</label>
                  <select
                    value={formData.direction_name}
                    onChange={e => {
                      const newDir = e.target.value;
                      setFormData({ ...formData, direction_name: newDir, poste_name: '', manager_id: '' });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-600 font-semibold text-slate-900"
                  >
                    <option value="">Sélectionner une direction...</option>
                    {directions.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Filiale / Implantation {formData.role !== 'dg' && '*'}</label>
                  <select
                    value={formData.filiale_name}
                    onChange={e => setFormData({ ...formData, filiale_name: e.target.value, manager_id: '' })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-600"
                  >
                    <option value="">Sélectionner une filiale...</option>
                    {filiales.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>}

              {(formData.role === 'manager' || formData.role === 'collaborateur') && <div>
                <div><label className="block font-semibold text-slate-700 mb-1">Poste *</label><select
                  value={formData.poste_name}
                  onChange={e => setFormData({ ...formData, poste_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"><option value="">Sélectionner un poste...</option>{postes.filter(p => !formData.direction_name || p.direction_id === directions.find(d => d.name === formData.direction_name)?.id).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
              </div>}

              <div><label className="block font-semibold text-slate-700 mb-1">Catégorie professionnelle *</label><select value={formData.category} onChange={e => setFormData({...formData,category:e.target.value as User['category']})} className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50">{categoryOptions[formData.role].map(category => <option key={category} value={category}>{category}</option>)}</select></div>

              {formData.role === 'collaborateur' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Manager Référent *</label>
                      <select
                        value={formData.manager_id}
                        onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                        className="w-full p-2 border border-amber-300 bg-amber-50/50 rounded-lg font-bold"
                      >
                        <option value="">Sélectionner un Manager...</option>
                        {managersList.length === 0 && (
                          <option value="" disabled>Aucun manager disponible pour cette filiale</option>
                        )}
                        {managersList.map(m => (
                          <option key={m.id} value={m.id.toString()}>
                            {m.name} ({m.filiale_name})
                          </option>
                        ))}
                      </select>
                    </div>
              )}

              {/* Info Box for DG */}
              {formData.role === 'dg' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px] font-medium">
                  <strong>Compte Direction Générale :</strong> sélectionnez uniquement la direction ou la filiale supervisée. Les champs poste, catégorie et Manager référent ne sont pas nécessaires.
                </div>
              )}
              {formData.role === 'rh' && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]"><strong>DRH / D.Dev :</strong> accès global à l’application. Aucune affectation à une direction, une filiale, un poste ou un Manager n’est nécessaire.</div>}
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
                disabled={creatingUser}
                className="px-5 py-2 bg-emerald-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-lg hover:bg-emerald-900 shadow"
              >
                {creatingUser ? 'Création en cours...' : "Créer l'Utilisateur"}
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
                  <option value="rh">DRH / D.Dev</option>
                  <option value="collaborateur">Collaborateur</option>
                  <option value="manager">Manager</option>
                  <option value="dg">Directeur Général (DG)</option>
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
                    onChange={e => setEditingUser({ ...editingUser, direction_name: e.target.value, manager_id: undefined })}
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filiale / implantation</label>
                <select
                  value={editingUser.filiale_name || ''}
                  onChange={e => setEditingUser({ ...editingUser, filiale_name: e.target.value, manager_id: undefined })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Sélectionner une filiale...</option>
                  {filiales.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
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
                    {getManagersForAssignment(editingUser.direction_name, editingUser.filiale_name).length === 0 && (
                      <option value="" disabled>Aucun manager disponible pour cette filiale</option>
                    )}
                    {getManagersForAssignment(editingUser.direction_name, editingUser.filiale_name).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.filiale_name})</option>
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

