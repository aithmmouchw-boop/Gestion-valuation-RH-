import React, { useState, useEffect } from 'react';
import { Evaluation, EvaluationCompetence, Objectif } from '../../types';
import { apiClient } from '../../services/apiClient';
import { UserInitials } from '../UserInitials';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { 
  ArrowLeft, Plus, Trash2, Save, Send, AlertCircle, CheckCircle2, X, Download, FileSpreadsheet 
} from 'lucide-react';

interface CollaboratorDetailDossierProps {
  evaluationId: number;
  onBack: () => void;
  readOnly?: boolean;
  showGuidelines?: boolean;
}

const ratingPercentages: Record<string, string> = {
  'A+': '100%', A: '90%', 'B+': '80%', B: '70%', 'B-': '50%', C: '30%', D: '10%',
};

export const CollaboratorDetailDossier: React.FC<CollaboratorDetailDossierProps> = ({
  evaluationId,
  onBack,
  readOnly = false,
  showGuidelines = true,
}) => {
  const defaultObjectiveDate = `${new Date().getFullYear()}-12-31`;
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'auto_eval' | 'savoir' | 'savoir_faire' | 'savoir_etre' | 'besoins' | 'objectifs' | 'historique'>('resume');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewMessage, setInterviewMessage] = useState('Réunion pour discuter ensemble de votre auto-évaluation annuelle.');

  // Modals for adding
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [addSkillAxe, setAddSkillAxe] = useState<'savoir' | 'savoir_faire' | 'savoir_etre'>('savoir_faire');
  const [newSkillForm, setNewSkillForm] = useState({ name: '', description: '', coefficient: 1, score: 80, comment: '' });

  const [showAddTrainingModal, setShowAddTrainingModal] = useState(false);
  const [newTrainingForm, setNewTrainingForm] = useState({ title: '', description: '', priority: 'Haute' as 'Haute' | 'Moyenne' | 'Basse', comment: '' });

  const [showAddObjectiveModal, setShowAddObjectiveModal] = useState(false);
  const [newObjectiveForm, setNewObjectiveForm] = useState<{ title: string; description: string; target_date: string; progress: number; status: Objectif['status'] }>({ title: '', description: '', target_date: defaultObjectiveDate, progress: 0, status: 'Non débuté' });

  const loadEvaluation = () => {
    setLoading(true);
    apiClient.getEvaluationDetail(evaluationId).then(res => {
      setEvaluation(res);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    loadEvaluation();
  }, [evaluationId]);

  if (loading || !evaluation) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  // Recalculate weights locally for immediate responsive reactivity
  const savoirs = evaluation.competences.filter(c => c.axe === 'savoir');
  const savoirFaires = evaluation.competences.filter(c => c.axe === 'savoir_faire');
  const savoirEtres = evaluation.competences.filter(c => c.axe === 'savoir_etre');

  const calcAvg = (items: EvaluationCompetence[]) => {
    if (items.length === 0) return 0;
    const sum = items.reduce((a, c) => a + (c.score || 0), 0);
    return Math.round((sum / items.length) * 10) / 10;
  };

  const scoreSavoir = calcAvg(savoirs);
  const scoreSavoirFaire = calcAvg(savoirFaires);
  const scoreSavoirEtre = calcAvg(savoirEtres);
  const scoreGlobal = Math.round((scoreSavoir * 0.20 + scoreSavoirFaire * 0.50 + scoreSavoirEtre * 0.30) * 10) / 10;

  const handleScoreChange = (compId: number, newScore: number) => {
    const updatedCompetences = evaluation.competences.map(c => c.id === compId ? { ...c, score: newScore } : c);
    setEvaluation({ ...evaluation, competences: updatedCompetences });
  };

  const handleCommentChange = (compId: number, comment: string) => {
    const updatedCompetences = evaluation.competences.map(c => c.id === compId ? { ...c, comment } : c);
    setEvaluation({ ...evaluation, competences: updatedCompetences });
  };

  const handleDeleteCompetence = async (compId: number) => {
    if (confirm('Supprimer ce critère de compétence de la grille ?')) {
      const updated = await apiClient.deleteCompetence(evaluation.id, compId);
      setEvaluation(updated.evaluation);
    }
  };

  const handleAddCompetenceSubmit = async () => {
    if (!newSkillForm.name) return;
    const res = await apiClient.addCompetence(evaluation.id, { ...newSkillForm, axe: addSkillAxe });
    setEvaluation(res.evaluation);
    setShowAddSkillModal(false);
    setNewSkillForm({ name: '', description: '', coefficient: 1, score: 80, comment: '' });
  };

  const handleAddTrainingSubmit = async () => {
    if (!newTrainingForm.title) return;
    const res = await apiClient.addTrainingNeed(evaluation.id, newTrainingForm);
    setEvaluation(res.evaluation);
    setShowAddTrainingModal(false);
    setNewTrainingForm({ title: '', description: '', priority: 'Haute', comment: '' });
  };

  const handleDeleteTraining = async (trainingId: number) => {
    if (confirm('Supprimer ce besoin de formation ?')) {
      const res = await apiClient.deleteTrainingNeed(evaluation.id, trainingId);
      setEvaluation(res.evaluation);
    }
  };

  const handleAddObjectiveSubmit = async () => {
    if (!newObjectiveForm.title) return;
    const res = await apiClient.addObjective(evaluation.id, newObjectiveForm);
    setEvaluation(res.evaluation);
    setShowAddObjectiveModal(false);
    setNewObjectiveForm({ title: '', description: '', target_date: defaultObjectiveDate, progress: 0, status: 'Non débuté' });
  };

  const handleDeleteObjective = async (objId: number) => {
    if (confirm('Supprimer cet objectif ?')) {
      const res = await apiClient.deleteObjective(evaluation.id, objId);
      setEvaluation(res.evaluation);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await apiClient.updateEvaluation(evaluation.id, evaluation);
    setIsSaving(false);
    setSuccessMessage('Brouillon enregistré avec succès');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleScheduleInterview = async () => {
    if (!interviewDate) return;
    setIsSaving(true);
    try {
      const result = await apiClient.scheduleInterview(evaluation.id, interviewDate, interviewMessage);
      setEvaluation(result.evaluation);
      setSuccessMessage(result.message);
      setTimeout(() => setSuccessMessage(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitToDG = async () => {
    const firstIncomplete = evaluation.competences.find(competence => Number(competence.score) <= 0);
    if (firstIncomplete) {
      setActiveTab(firstIncomplete.axe);
      setSuccessMessage(`Complétez d’abord toutes les notes de l’axe ${firstIncomplete.axe.replace('_', '-')}.`);
      return;
    }
    if (!confirm('Soumettre cette évaluation à la Direction Générale ?')) return;
    setIsSaving(true);
    try {
      const saved = await apiClient.updateEvaluation(evaluation.id, evaluation);
      setEvaluation(saved);
      const result = await apiClient.submitEvaluationToDG(evaluation.id);
      setEvaluation(result.evaluation);
      setSuccessMessage('Évaluation transmise à la DG. Vous restez dans le dossier pour consultation.');
    } catch (error: any) {
      setSuccessMessage(error.message || 'La soumission a échoué.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitCorrection = async () => {
    const firstIncomplete = evaluation.competences.find(competence => Number(competence.score) <= 0);
    if (firstIncomplete) {
      setActiveTab(firstIncomplete.axe);
      setSuccessMessage('Toutes les notes doivent être complétées avant la confirmation du collaborateur.');
      return;
    }
    setIsSaving(true);
    try {
      const saved = await apiClient.updateEvaluation(evaluation.id, evaluation);
      setEvaluation(saved);
      const result = await apiClient.submitCorrectionToCollaborator(evaluation.id);
      setEvaluation(result.evaluation);
      setSuccessMessage(result.message);
    } catch (error: any) {
      setSuccessMessage(error.message || 'Impossible de terminer la correction.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    const headers = ['Axe', 'Compétence', 'Note', 'Commentaire'];
    const rows = evaluation.competences.map(c => [
      c.axe.toUpperCase().replace('_', '-'),
      c.name,
      `${c.score}/100`,
      c.comment || '-'
    ]);
    exportToPDF(`Dossier RH — ${evaluation.user_name}`, headers, rows, `dossier_${evaluation.user_name}`);
  };

  const handleExportExcel = () => {
    const headers = ['Axe', 'Compétence', 'Note', 'Commentaire'];
    const rows = evaluation.competences.map(c => [
      c.axe.toUpperCase().replace('_', '-'),
      c.name,
      `${c.score}/100`,
      c.comment || '-'
    ]);
    exportToExcel(`Dossier ${evaluation.user_name}`, headers, rows, `dossier_${evaluation.user_name}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des collaborateurs</span>
        </button>

        <div className="flex items-center space-x-2">
          <button onClick={handleExportPDF} className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-1">
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>PDF</span>
          </button>
          <button onClick={handleExportExcel} className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Main Digital RH File Header & Permanent Sticky Summary Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Columns: Main dossier info & Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5">
            <UserInitials name={evaluation.user_name} className="w-20 h-20 border-2 border-emerald-600 text-xl shadow-md" />

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-extrabold text-[10px] rounded-full">
                  {evaluation.user_category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-semibold">{evaluation.filiale_name}</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 mt-1">{evaluation.user_name}</h1>
              <p className="text-xs font-semibold text-slate-600">{evaluation.poste_name} — {evaluation.direction_name}</p>

              <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-4">
                <span>Manager: <strong>{evaluation.manager_name}</strong></span>
                <span>Campagne: <strong>{evaluation.campagne_name}</strong></span>
                <span>Entretien: <strong>{evaluation.interview_date || 'Non planifié'}</strong></span>
              </div>
            </div>
          </div>

          {/* Campaign Guidelines Banner — manager only */}
          {showGuidelines && (
          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start space-x-3 text-xs text-amber-950 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900 text-sm">Règles & Consignes d'Évaluation DRH ({evaluation.campagne_name})</div>
              <p className="mt-1 font-medium text-slate-800 leading-relaxed">
                1. Évaluation factuelle basée sur les réalisations réelles et preuves de travail.<br/>
                2. Respect strict des pondérations officielles : Savoir (20%), Savoir-faire (50%), Savoir-être (30%).<br/>
                3. Entretien individuel obligatoire d'au moins 45 minutes avec le collaborateur.<br/>
                4. Formalisation systématique d'au moins un besoin de formation.
              </p>
            </div>
          </div>
          )}

          {readOnly && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-900">
              Consultation DG en lecture seule — aucune modification n’est autorisée.
            </div>
          )}

          {!readOnly && evaluation.auto_evaluation && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
              <div>
                <h3 className="font-bold text-sm text-indigo-950">Entretien individuel avec {evaluation.user_name}</h3>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  {evaluation.interview_date
                    ? `Entretien planifié le ${new Date(evaluation.interview_date).toLocaleString('fr-FR')}. Les notes manager sont déverrouillées.`
                    : 'Planifiez l’entretien pour notifier le collaborateur et déverrouiller la notation manager.'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-2">
                <input type="datetime-local" value={interviewDate} onChange={event => setInterviewDate(event.target.value)} className="p-2 rounded-lg border border-indigo-200 bg-white text-xs" />
                <input type="text" value={interviewMessage} onChange={event => setInterviewMessage(event.target.value)} className="p-2 rounded-lg border border-indigo-200 bg-white text-xs" placeholder="Message de la réunion" />
                <button onClick={handleScheduleInterview} disabled={!interviewDate || isSaving} className="px-4 py-2 rounded-lg bg-indigo-900 disabled:bg-slate-400 text-white font-bold text-xs">
                  Planifier et notifier
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs (Without Page Reload) */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'resume' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Résumé
            </button>
            <button
              onClick={() => setActiveTab('auto_eval')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'auto_eval' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Auto-évaluation
            </button>
            <button
              onClick={() => setActiveTab('savoir')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'savoir' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Savoir (20%)
            </button>
            <button
              onClick={() => setActiveTab('savoir_faire')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'savoir_faire' ? 'bg-emerald-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Savoir-faire (50%)
            </button>
            <button
              onClick={() => setActiveTab('savoir_etre')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'savoir_etre' ? 'bg-purple-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Savoir-être (30%)
            </button>
            <button
              onClick={() => setActiveTab('besoins')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'besoins' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Formations
            </button>
            <button
              onClick={() => setActiveTab('objectifs')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'objectifs' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Objectifs
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'historique' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Historique
            </button>
          </div>

          {/* TAB CONTENTS */}

          {/* 1. Résumé */}
          {activeTab === 'resume' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Résumé Général & Synthèse Manager</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {evaluation.summary_comment || 'Aucune appréciation globale renseignée pour le moment.'}
              </p>

              {!readOnly && <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Appréciation Générale du Manager
                </label>
                <textarea
                  rows={3}
                  value={evaluation.summary_comment || ''}
                  onChange={(e) => setEvaluation({ ...evaluation, summary_comment: e.target.value })}
                  placeholder="Rédigez un commentaire de synthèse sur la performance de l'année..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>}
            </div>
          )}

          {/* 2. Auto-évaluation (Consultable uniquement) */}
          {activeTab === 'auto_eval' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Auto-évaluation Renseignée par le Collaborateur</h3>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 font-bold text-[10px] rounded-full">
                  Consultation seule
                </span>
              </div>

              {!evaluation.auto_evaluation ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">L'auto-évaluation n'a pas encore été soumise par le collaborateur.</p>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800">Niveaux cochés par le collaborateur :</span>
                    {evaluation.competences.map(competence => (
                      <div key={competence.id} className="py-2 border-b border-slate-100 space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span>{competence.name}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-blue-900 text-white font-black">
                            {ratingPercentages[evaluation.auto_evaluation?.ratings?.[String(competence.id)] || ''] || 'Non renseigné'}
                          </span>
                        </div>
                        {evaluation.auto_evaluation?.comments?.[String(competence.id)] && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">Justification : {evaluation.auto_evaluation.comments[String(competence.id)]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">1. Bilan de l'Année:</span>
                    <p className="p-3 bg-slate-50 rounded-xl mt-1 text-slate-700 border border-slate-100">{evaluation.auto_evaluation.balance}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">2. Réalisations Clés:</span>
                    <p className="p-3 bg-slate-50 rounded-xl mt-1 text-slate-700 border border-slate-100">{evaluation.auto_evaluation.achievements}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">3. Difficultés Rencontrées:</span>
                    <p className="p-3 bg-slate-50 rounded-xl mt-1 text-slate-700 border border-slate-100">{evaluation.auto_evaluation.difficulties}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">4. Aspirations Professionnelles:</span>
                    <p className="p-3 bg-slate-50 rounded-xl mt-1 text-slate-700 border border-slate-100">{evaluation.auto_evaluation.aspirations}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3, 4, 5. Competencies Tabs (Savoir, Savoir-faire, Savoir-être) */}
          {(activeTab === 'savoir' || activeTab === 'savoir_faire' || activeTab === 'savoir_etre') && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Grille Évaluation: {activeTab === 'savoir' ? 'Savoir (20%)' : activeTab === 'savoir_faire' ? 'Savoir-faire (50%)' : 'Savoir-être (30%)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {readOnly ? 'Notes et commentaires renseignés par le manager.' : 'Attribuez une note sur 100 et modifiez ou ajoutez dynamiquement des compétences.'}
                  </p>
                </div>

                {!readOnly && <button
                  onClick={() => {
                    setAddSkillAxe(activeTab);
                    setShowAddSkillModal(true);
                  }}
                  className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une compétence</span>
                </button>}
              </div>

              {/* Cards for each skill */}
              <div className="space-y-4">
                {evaluation.competences.filter(c => c.axe === activeTab).map(c => (
                  <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                      </div>
                      {!readOnly && <button
                        onClick={() => handleDeleteCompetence(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Supprimer cette compétence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>}
                    </div>

                    {/* Niveaux officiels issus du fichier d'évaluation */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs">
                        <div className="font-bold text-slate-700">Niveau manager :</div>
                        <div className="mt-1 text-blue-800 font-bold">
                          Choix collaborateur : {ratingPercentages[evaluation.auto_evaluation?.ratings?.[String(c.id)] || ''] || 'Non renseigné'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[100, 90, 80, 70, 50, 30, 10].map(score => (
                          <button
                            key={score}
                            type="button"
                            disabled={readOnly || !evaluation.interview_date}
                            onClick={() => handleScoreChange(c.id, Number(score))}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-black ${c.score === score ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-white text-slate-700 border-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {score}%
                          </button>
                        ))}
                      </div>
                    </div>
                    {!readOnly && !evaluation.interview_date && <p className="text-[11px] font-bold text-amber-700">Notation verrouillée jusqu’à la planification de l’entretien.</p>}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Commentaire (Facultatif)</label>
                      {readOnly ? (
                        <p className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                          {c.comment || 'Aucun commentaire.'}
                        </p>
                      ) : <input
                        type="text"
                        value={c.comment || ''}
                        onChange={(e) => handleCommentChange(c.id, e.target.value)}
                        placeholder="Observation sur cette compétence..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Besoins de formation */}
          {activeTab === 'besoins' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Besoins de Formation Identifiés</h3>
                {!readOnly && <button
                  onClick={() => setShowAddTrainingModal(true)}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter Formation</span>
                </button>}
              </div>

              <div className="space-y-3">
                {evaluation.besoins_formation.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun besoin de formation renseigné.</p>
                ) : (
                  evaluation.besoins_formation.map(b => (
                    <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start text-xs hover:border-slate-300 transition-all">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{b.title}</div>
                        <div className="text-slate-600">{b.description}</div>
                        {b.comment && <div className="text-slate-400 italic text-[11px]">Commentaire: {b.comment}</div>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 font-bold rounded-full text-[10px] ${b.priority === 'Haute' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                          Priorité: {b.priority}
                        </span>
                        {!readOnly && <button
                          onClick={() => handleDeleteTraining(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 7. Objectifs */}
          {activeTab === 'objectifs' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Objectifs de l'Année Suivante</h3>
                {!readOnly && <button
                  onClick={() => setShowAddObjectiveModal(true)}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter Objectif</span>
                </button>}
              </div>

              <div className="space-y-3">
                {evaluation.objectifs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun objectif défini pour l'année suivante.</p>
                ) : (
                  evaluation.objectifs.map(o => (
                    <div key={o.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center hover:border-slate-300 transition-all">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{o.title}</div>
                        <div className="text-slate-600">{o.description}</div>
                        <div className="text-slate-400 text-[10px]">Date cible: <strong>{o.target_date}</strong></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] border border-emerald-200">
                          {o.status}
                        </span>
                        {!readOnly && <button
                          onClick={() => handleDeleteObjective(o.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 8. Historique */}
          {activeTab === 'historique' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Historique des Anciennes Évaluations</h3>
              <div className="py-10 text-center text-xs text-slate-500">Aucun ancien résultat enregistré pour ce collaborateur.</div>
            </div>
          )}

          {/* Bottom Action Bar */}
          {!readOnly && <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            {successMessage && (
              <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMessage}</span>
              </span>
            )}
            {!successMessage && <div />}

            <div className="flex space-x-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer en Brouillon</span>
              </button>

              <button
                onClick={evaluation.status === 'a_corriger' ? handleSubmitCorrection : handleSubmitToDG}
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{evaluation.status === 'a_corriger' ? 'Terminer la correction et notifier' : 'Soumettre l’Évaluation à la DG'}</span>
              </button>
            </div>
          </div>}
        </div>

        {/* Right 1 Column: PERMANENT STICKY SUMMARY CARD (Visible at all times during consultation) */}
        <div className="lg:col-span-1 sticky top-20 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Résumé Permanent
              </div>
              <div className="text-sm font-black text-slate-900 mt-0.5">Calcul Automatique</div>
            </div>

            {/* Score Gauges */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Savoir (20%)</span>
                  <span className="text-blue-800">{scoreSavoir}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${scoreSavoir}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Savoir-faire (50%)</span>
                  <span className="text-emerald-800">{scoreSavoirFaire}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${scoreSavoirFaire}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Savoir-être (30%)</span>
                  <span className="text-purple-800">{scoreSavoirEtre}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${scoreSavoirEtre}%` }}></div>
                </div>
              </div>
            </div>

            {/* Final Overall Weighted Score */}
            <div className="p-4 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl text-center shadow-md space-y-1">
              <div className="text-[10px] font-bold uppercase text-emerald-400">Moyenne Finale Pondérée</div>
              <div className="text-3xl font-black text-white">{scoreGlobal} <span className="text-xs text-slate-300 font-normal">/ 100</span></div>
            </div>

            <div className="text-center pt-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-900 font-extrabold text-[11px] rounded-full border border-amber-200">
                Statut: {evaluation.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add Competence */}
      {!readOnly && showAddSkillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">➕ Ajouter une Compétence Dynamique</h3>
              <button onClick={() => setShowAddSkillModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de la Compétence</label>
                <input
                  type="text"
                  value={newSkillForm.name}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, name: e.target.value })}
                  placeholder="Ex: BIM & Revit 3D, Gestion de crise..."
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Critère</label>
                <textarea
                  rows={2}
                  value={newSkillForm.description}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note Initiale (0 - 100)</label>
                <input
                  type="number"
                  value={newSkillForm.score}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, score: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowAddSkillModal(false)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Annuler</button>
              <button onClick={handleAddCompetenceSubmit} className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold shadow">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add Training (Besoin de Formation) */}
      {!readOnly && showAddTrainingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">🎓 Ajouter un Besoin de Formation</h3>
              <button onClick={() => setShowAddTrainingModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Intitulé / Thématique de la Formation *</label>
                <input
                  type="text"
                  value={newTrainingForm.title}
                  onChange={(e) => setNewTrainingForm({ ...newTrainingForm, title: e.target.value })}
                  placeholder="Ex: Certification Management BTP, Anglais des Affaires..."
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Objectif visé</label>
                <textarea
                  rows={2}
                  value={newTrainingForm.description}
                  onChange={(e) => setNewTrainingForm({ ...newTrainingForm, description: e.target.value })}
                  placeholder="Objectifs pédagogiques et impact métier attendu..."
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priorité</label>
                <select
                  value={newTrainingForm.priority}
                  onChange={(e) => setNewTrainingForm({ ...newTrainingForm, priority: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-semibold"
                >
                  <option value="Haute">Haute (Cruciale)</option>
                  <option value="Moyenne">Moyenne (Souhaitée)</option>
                  <option value="Basse">Basse (Optionnelle)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commentaire Manager</label>
                <input
                  type="text"
                  value={newTrainingForm.comment}
                  onChange={(e) => setNewTrainingForm({ ...newTrainingForm, comment: e.target.value })}
                  placeholder="Ex: À planifier au T2 2025..."
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowAddTrainingModal(false)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Annuler</button>
              <button onClick={handleAddTrainingSubmit} className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold shadow">Enregistrer Formation</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add Objective */}
      {!readOnly && showAddObjectiveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">🎯 Ajouter un Objectif pour l'Année Suivante</h3>
              <button onClick={() => setShowAddObjectiveModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Intitulé de l'Objectif *</label>
                <input
                  type="text"
                  value={newObjectiveForm.title}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, title: e.target.value })}
                  placeholder="Ex: Livrer le chantier X à temps, Réduire les délais de 15%..."
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Critères de Succès</label>
                <textarea
                  rows={2}
                  value={newObjectiveForm.description}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, description: e.target.value })}
                  placeholder="Précisez les indicateurs de mesure..."
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date Cible de Réalisation</label>
                <input
                  type="date"
                  value={newObjectiveForm.target_date}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, target_date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Statut Initial</label>
                <select
                  value={newObjectiveForm.status}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg font-semibold"
                >
                  <option value="Non débuté">Non débuté</option>
                  <option value="En cours">En cours</option>
                  <option value="Atteint">Atteint</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowAddObjectiveModal(false)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600">Annuler</button>
              <button onClick={handleAddObjectiveSubmit} className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold shadow">Enregistrer Objectif</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
