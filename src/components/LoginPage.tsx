import React, { useState } from 'react';
import { ArrowRight, Building2, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { User } from '../types';
import { apiClient } from '../services/apiClient';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.login(email.trim(), undefined, password);
      onLogin(result.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden lg:flex overflow-hidden p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-blue-950" />
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative z-10 flex w-full flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Building2 className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <div className="text-sm font-black tracking-[0.12em]">GESTION ÉVALUATION RH</div>
              <div className="text-xs text-slate-400">Capital humain & performance</div>
            </div>
          </div>

          <div className="max-w-xl">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              Revue annuelle
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.08]">
              Développer les talents.<br />
              Mesurer la performance.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
              Un espace unique pour piloter les campagnes, accompagner les équipes et valoriser chaque parcours professionnel.
            </p>
          </div>

          <p className="text-xs text-slate-500">© 2026 Gestion Évaluation RH · Accès sécurisé</p>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-10">
        <div className="w-full max-w-xl">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-slate-900">
              <Building2 className="h-7 w-7 text-emerald-700" />
              <span className="font-black tracking-wider">GESTION ÉVALUATION RH</span>
            </div>
          </div>

          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Bienvenue</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Connectez-vous à votre espace</h2>
            <p className="mt-2 text-sm text-slate-500">Saisissez vos identifiants professionnels pour accéder à la plateforme.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-slate-700">Adresse e-mail professionnelle</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="prenom.nom@groupepremium.ma"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-slate-700">Mot de passe</label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Mot de passe"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
            >
              <span>{loading ? 'Connexion en cours...' : 'Accéder à mon espace'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <p className="text-center text-[10px] text-slate-400">
              Accès réservé aux utilisateurs autorisés.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

