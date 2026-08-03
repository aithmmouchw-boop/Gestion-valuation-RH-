import React, { useState } from 'react';
import { AtSign, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, UserRound } from 'lucide-react';
import { User } from '../types';
import { apiClient } from '../services/apiClient';
import { UserInitials } from './UserInitials';

interface MyProfileProps {
  currentUser: User;
}

export const MyProfile: React.FC<MyProfileProps> = ({ currentUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmation) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.changePassword(currentPassword, newPassword);
      setSuccess(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Modification impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Compte utilisateur</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">Consultez vos informations personnelles et sécurisez votre accès.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center border-b border-slate-100 pb-6 text-center">
            <UserInitials name={currentUser.name} className="h-20 w-20 text-xl ring-4 ring-emerald-100" />
            <h2 className="mt-4 text-lg font-black text-slate-950">{currentUser.name}</h2>
            <span className="mt-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-800">
              {currentUser.role}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nom complet</div>
                <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AtSign className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Adresse e-mail</div>
                <div className="text-sm font-bold text-slate-800">{currentUser.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mot de passe</div>
                <div className="text-sm font-bold tracking-[0.25em] text-slate-800">••••••••••••</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-950">Changer mon mot de passe</h2>
              <p className="text-xs text-slate-500">Utilisez au minimum 8 caractères.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'current-password', label: 'Mot de passe actuel', value: currentPassword, setter: setCurrentPassword },
              { id: 'new-password', label: 'Nouveau mot de passe', value: newPassword, setter: setNewPassword },
              { id: 'confirm-password', label: 'Confirmer le nouveau mot de passe', value: confirmation, setter: setConfirmation },
            ].map(field => (
              <div key={field.id}>
                <label htmlFor={field.id} className="mb-1.5 block text-xs font-bold text-slate-700">{field.label}</label>
                <div className="relative">
                  <input
                    id={field.id}
                    type={showPasswords ? 'text' : 'password'}
                    value={field.value}
                    onChange={event => field.setter(event.target.value)}
                    required
                    autoComplete={field.id === 'current-password' ? 'current-password' : 'new-password'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(value => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="Afficher ou masquer les mots de passe"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}

            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {loading ? 'Modification en cours...' : 'Modifier mon mot de passe'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
