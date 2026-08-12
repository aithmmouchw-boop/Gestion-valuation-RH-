import React, { useState, useEffect } from 'react';
import { User, UserRole, NotificationItem } from '../types';
import { Bell, LogOut, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { UserInitials } from './UserInitials';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    apiClient.getNotifications().then(setNotifications).catch(() => {});
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'rh': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'manager': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'collaborateur': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'dg': return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'rh': return 'Direction RH';
      case 'manager': return 'Manager d\'Équipe';
      case 'collaborateur': return 'Collaborateur';
      case 'dg': return 'Direction Générale';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
      {/* Organization Info */}
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>GROUPE PREMIUM MAROC</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-700">{currentUser.filiale_name}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        {/* Current role is informational and cannot be changed */}
        <div className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span className="hidden sm:inline">Rôle :</span>
          <span className={`rounded border px-2 py-0.5 text-[11px] ${getRoleBadgeColor(currentUser.role)}`}>
            {getRoleLabel(currentUser.role)}
          </span>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Notifications</span>
                <span className="text-[10px] text-slate-500">{notifications.length} nouvelles</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">Aucun message</p>
                ) : (
                  notifications.map(n => (
                    <a
                      key={n.id}
                      href={n.link_url || '#'}
                      className="block p-3 hover:bg-slate-50 transition-colors"
                      onClick={event => {
                        if (!n.link_url) event.preventDefault();
                      }}
                    >
                      <div className="font-semibold text-xs text-slate-800">{n.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{n.message}</div>
                      <div className="text-[9px] text-slate-400 mt-1">{n.created_at}</div>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <UserInitials name={currentUser.name} className="w-8 h-8 border border-emerald-600 text-[10px]" />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
            <div className="text-[10px] font-semibold text-slate-500 truncate max-w-[230px]">
              {getRoleLabel(currentUser.role)} · {currentUser.direction_name || 'Famille non renseigné'}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

