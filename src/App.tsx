import React, { useState, useEffect } from 'react';
import { User } from './types';
import { apiClient, clearAuthToken, getAuthToken } from './services/apiClient';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { MyProfile } from './components/MyProfile';

// RH Views
import { RHDashboard } from './components/rh/RHDashboard';
import { RHCampaigns } from './components/rh/RHCampaigns';
import { RHJobTemplates } from './components/rh/RHJobTemplates';
import { RHCollaborators } from './components/rh/RHCollaborators';
import { RHPerformance } from './components/rh/RHPerformance';
import { RHHistoryDrillDown } from './components/rh/RHHistoryDrillDown';
import { RHNotificationsConfig } from './components/rh/RHNotificationsConfig';
import { RHUserManagement } from './components/rh/RHUserManagement';
import { RHDepartmentManagement } from './components/rh/RHDepartmentManagement';

// Other Role Views
import { ManagerView } from './components/manager/ManagerView';
import { CollaborateurView } from './components/collaborateur/CollaborateurView';
import { DGView } from './components/dg/DGView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!getAuthToken()) {
      setInitializing(false);
      return;
    }
    apiClient.getCurrentUser().then(user => {
      setCurrentUser(user);
      setDefaultTab(user.role);
    }).catch(() => {
      clearAuthToken();
      setCurrentUser(null);
    }).finally(() => setInitializing(false));
  }, []);

  const setDefaultTab = (role: User['role']) => {
    if (role === 'rh') setActiveTab('dashboard');
    else if (role === 'manager') setActiveTab('team_list');
    else if (role === 'collaborateur') setActiveTab('my_eval');
    else setActiveTab('dg_queue');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setDefaultTab(user.role);
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
        Vérification de votre session...
      </div>
    );
  }

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const renderView = () => {
    if (activeTab === 'my_profile') {
      return <MyProfile currentUser={currentUser} />;
    }

    switch (activeTab) {
      // RH Views
      case 'dashboard':
      case 'rh_dashboard':
        return <RHDashboard />;
      case 'campaigns':
      case 'rh_campaigns':
        return <RHCampaigns />;
      case 'job_templates':
      case 'rh_templates':
        return <RHJobTemplates />;
      case 'collaborators':
      case 'rh_collaborators':
        return <RHCollaborators />;
      case 'performance':
      case 'rh_performance':
        return <RHPerformance />;
      case 'history_drilldown':
      case 'rh_history':
        return <RHHistoryDrillDown />;
      case 'notifications_config':
      case 'rh_notifications':
        return <RHNotificationsConfig />;
      case 'user_management':
        return <RHUserManagement />;
      case 'department_management':
        return <RHDepartmentManagement />;

      // Manager Views
      case 'team_list':
      case 'manager_team':
      case 'past_campaigns':
        return <ManagerView currentUser={currentUser} initialTab={activeTab} />;

      // Collaborator Views
      case 'my_eval':
      case 'collab_eval':
      case 'my_history':
        return <CollaborateurView currentUser={currentUser} initialTab={activeTab} />;

      // DG Views
      case 'dg_queue':
      case 'dg_archive':
      case 'dg_validation':
        return <DGView currentUser={currentUser} initialTab={activeTab} />;

      default:
        return <RHDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col antialiased">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          role={currentUser.role} 
          activeTab={activeTab} 
          onSelectTab={setActiveTab} 
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
