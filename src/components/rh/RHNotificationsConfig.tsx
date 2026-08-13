import React, { useState, useEffect } from 'react';
import { NotificationConfig } from '../../types';
import { apiClient } from '../../services/apiClient';
import { CheckCircle2, Save, BellRing } from 'lucide-react';

export const RHNotificationsConfig: React.FC = () => {
  const [configList, setConfigList] = useState<NotificationConfig[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.getNotificationConfig().then(config => setConfigList(config.map(item => ({ ...item, enabled: true })))).catch(console.error);
  }, []);

  const handleToggle = (id: string) => {
    setConfigList(prev => prev.map(item => item.id === id ? { ...item, enabled: true } : item));
  };

  const handleFrequencyChange = (id: string, freq: string) => {
    setConfigList(prev => prev.map(item => item.id === id ? { ...item, frequency: freq } : item));
  };

  const handleSave = async () => {
    await apiClient.updateNotificationConfig(configList.map(item => ({ ...item, enabled: true })));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Configuration des Notifications & Relances RH</h1>
          <p className="text-xs text-slate-500 mt-1">
            Paramétrez les alertes automatiques envoyées aux managers et collaborateurs.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les Paramètres</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Paramètres de notification mis à jour avec succès.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {configList.map(item => (
          <div key={item.id} className="p-6 flex items-start justify-between gap-6 hover:bg-slate-50 transition-colors">
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-3">
                <BellRing className="w-4 h-4 text-emerald-800" />
                <span className="font-bold text-sm text-slate-900">{item.label}</span>
              </div>
              <p className="text-xs text-slate-500 pl-7">{item.description}</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Frequency Selector */}
              <select
                value={item.frequency}
                onChange={(e) => handleFrequencyChange(item.id, e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="Immédiat">Immédiat</option>
                <option value="Tous les jours">Tous les jours</option>
                <option value="Tous les 3 jours">Tous les 3 jours</option>
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="À la clôture">À la clôture</option>
              </select>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(item.id)}
                title="Toutes les notifications sont activées"
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  item.enabled ? 'bg-emerald-800' : 'bg-slate-300'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  item.enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

