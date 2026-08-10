import React from 'react';
import { UserRole } from '../types';
import {
  BarChart3, Calendar, FileText, Users, TrendingUp,
  Clock, Settings, UserCheck, ShieldCheck, CheckCircle2, UserRound
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingCount?: number;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onSelectTab, pendingCount = 0, isOpen = true }) => {
  if (!isOpen) return null;

  const renderRhNav = () => (
    <>
      <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Direction Capital Humain
      </div>

      <button
        onClick={() => onSelectTab('dashboard')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'dashboard' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <span>1. Dashboard Global</span>
      </button>

      <button
        onClick={() => onSelectTab('campaigns')}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'campaigns' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>2. Campagnes</span>
        </div>
        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-800 text-emerald-200 rounded">Gestion</span>
      </button>

      <button
        onClick={() => onSelectTab('job_templates')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'job_templates' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <FileText className="w-4 h-4 text-emerald-400" />
        <span>3. Fiches de Poste</span>
      </button>

      <button
        onClick={() => onSelectTab('collaborators')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'collaborators' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4 text-emerald-400" />
        <span>4. Collaborateurs</span>
      </button>

      <div className="px-3 py-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Analytiques & Stratégie
      </div>

      <button
        onClick={() => onSelectTab('performance')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'performance' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span>5. Performance Groupe</span>
      </button>

      <button
        onClick={() => onSelectTab('history_drilldown')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'history_drilldown' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Clock className="w-4 h-4 text-emerald-400" />
        <span>6. Historique (Drill-down)</span>
      </button>

      <button
        onClick={() => onSelectTab('notifications_config')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'notifications_config' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Settings className="w-4 h-4 text-emerald-400" />
        <span>7. Config Notifications</span>
      </button>

      <div className="px-3 py-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Administration Système
      </div>

      <button
        onClick={() => onSelectTab('user_management')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'user_management' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4 text-amber-400" />
        <span>8. Gestion Utilisateurs</span>
      </button>

      <button
        onClick={() => onSelectTab('department_management')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'department_management' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span>9. Gestion Départements</span>
      </button>
    </>
  );

  const renderManagerNav = () => (
    <>
      <div className="px-3 py-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
        Espace Manager
      </div>

      <button
        onClick={() => onSelectTab('team_list')}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'team_list' ? 'bg-amber-800 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center space-x-3">
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>Mon Équipe</span>
        </div>
        {pendingCount > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-900 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onSelectTab('past_campaigns')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'past_campaigns' ? 'bg-amber-800 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Clock className="w-4 h-4 text-amber-400" />
        <span>Historique d'Équipe</span>
      </button>
    </>
  );

  const renderCollaborateurNav = () => (
    <>
      <div className="px-3 py-2 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
        Mon Espace Collaborateur
      </div>

      <button
        onClick={() => onSelectTab('my_eval')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'my_eval' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <FileText className="w-4 h-4 text-blue-400" />
        <span>Mon Auto-Évaluation</span>
      </button>

      <button
        onClick={() => onSelectTab('my_history')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'my_history' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Clock className="w-4 h-4 text-blue-400" />
        <span>Mes Anciennes Revues</span>
      </button>
    </>
  );

  const renderDgNav = () => (
    <>
      <div className="px-3 py-2 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
        Direction Générale
      </div>

      <button
        onClick={() => onSelectTab('dg_queue')}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'dg_queue' ? 'bg-purple-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>File de Validation</span>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500 text-white rounded-full">
          2
        </span>
      </button>

      <button
        onClick={() => onSelectTab('dg_archive')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
          activeTab === 'dg_archive' ? 'bg-purple-900 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <CheckCircle2 className="w-4 h-4 text-purple-400" />
        <span>Évaluations Validées</span>
      </button>
    </>
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex-shrink-0 flex flex-col justify-between hidden md:flex border-r border-slate-800 min-h-screen transition-all duration-300">
      <div>
        {/* Brand Logo & Name */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg text-lg">
            RH
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide text-white leading-tight">
              GESTION ÉVALUATION RH
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              Évaluations & Performance
            </div>
          </div>
        </div>

        {/* Role Navigation Items */}
        <div className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {role === 'rh' && renderRhNav()}
          {role === 'manager' && renderManagerNav()}
          {role === 'collaborateur' && renderCollaborateurNav()}
          {role === 'dg' && renderDgNav()}
          <div className="mt-4 border-t border-slate-800 pt-4">
            <button
              onClick={() => onSelectTab('my_profile')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'my_profile' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserRound className="w-4 h-4 text-cyan-400" />
              <span>Mon profil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300">Gestion Évaluation RH</div>
        <div>Portail RH © {new Date().getFullYear()}</div>
      </div>
    </aside>
  );
};
