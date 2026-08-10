import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { User } from '../types';

interface Props { user: User; onComplete: (user: User) => void; onLogout: () => void; }

export const FirstLoginPassword: React.FC<Props> = ({ user, onComplete, onLogout }) => {
  const [temporaryPassword,setTemporaryPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [visible,setVisible]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const rules=[['8 caractères minimum',newPassword.length>=8],['Une lettre majuscule',/[A-Z]/.test(newPassword)],['Une lettre minuscule',/[a-z]/.test(newPassword)],['Un chiffre',/\d/.test(newPassword)],['Un caractère spécial',/[^A-Za-z0-9]/.test(newPassword)]] as const;
  const valid=rules.every(([,ok])=>ok)&&newPassword===confirmation&&temporaryPassword.length>0;
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(!valid){setError('Respectez toutes les règles et confirmez correctement le nouveau mot de passe.');return;}setLoading(true);setError('');try{const result=await apiClient.changePassword(temporaryPassword,newPassword);if(result.user)onComplete(result.user);else onComplete({...user,must_change_password:false});}catch(e){setError(e instanceof Error?e.message:'Modification impossible.');}finally{setLoading(false);}};
  return <main className="min-h-screen bg-slate-950 p-4 flex items-center justify-center">
    <section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center"><ShieldCheck className="h-6 w-6"/></div><div><div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Première connexion obligatoire</div><h1 className="text-xl font-black text-slate-950">Sécurisez votre compte</h1><p className="mt-1 text-xs text-slate-500">Bienvenue {user.name}. Aucun menu n’est accessible avant cette étape.</p></div></div><button onClick={onLogout} title="Se déconnecter" className="p-2 text-slate-400 hover:text-rose-600"><LogOut className="h-5 w-5"/></button></div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {[['Mot de passe temporaire',temporaryPassword,setTemporaryPassword,'current-password'],['Nouveau mot de passe',newPassword,setNewPassword,'new-password'],['Confirmer le nouveau mot de passe',confirmation,setConfirmation,'new-password']] .map(([label,value,setter,auto])=><div key={label as string}><label className="mb-1.5 block text-xs font-bold text-slate-700">{label as string}</label><div className="relative"><KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/><input type={visible?'text':'password'} value={value as string} onChange={e=>(setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} autoComplete={auto as string} required className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none focus:border-emerald-600"/><button type="button" onClick={()=>setVisible(v=>!v)} className="absolute right-3 top-3.5 text-slate-400">{visible?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></div>)}
        <div className="grid grid-cols-1 gap-1.5 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">{rules.map(([label,ok])=><div key={label} className={`flex items-center gap-1.5 text-[11px] font-semibold ${ok?'text-emerald-700':'text-slate-400'}`}><CheckCircle2 className="h-3.5 w-3.5"/>{label}</div>)}</div>
        {confirmation&&newPassword!==confirmation&&<p className="text-xs font-semibold text-rose-600">Les deux nouveaux mots de passe ne correspondent pas.</p>}
        {error&&<div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}
        <button disabled={!valid||loading} className="w-full rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white disabled:bg-slate-400">{loading?'Sécurisation en cours...':'Valider et accéder à mon espace'}</button>
      </form>
    </section>
  </main>;
};

