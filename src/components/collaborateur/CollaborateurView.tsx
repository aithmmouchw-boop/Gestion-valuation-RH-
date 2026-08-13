import React, { useState, useEffect } from 'react';
import { User, Evaluation, Campagne } from '../../types';
import { apiClient } from '../../services/apiClient';
import { exportDossierEvaluationPDF } from '../../utils/exportUtils';
import { Send, CheckCircle2, Clock, Check, Download, Lock } from 'lucide-react';
import { CollaboratorDetailDossier } from '../manager/CollaboratorDetailDossier';

interface CollaborateurViewProps {
  currentUser: User;
  initialTab?: string;
  onNavigateTab?: (tab: string) => void;
}

const evaluationLevels = [
  { value: 'A+', label: '100%' }, { value: 'A', label: '90%' }, { value: 'B+', label: '80%' },
  { value: 'B', label: '70%' }, { value: 'B-', label: '50%' }, { value: 'C', label: '30%' },
  { value: 'D', label: '10%' },
] as const;

const normalizeAxis = (axis?: string) => {
  const value = (axis || '').toLowerCase().replace(/[-\s]/g, '_');
  if (value.includes('faire')) return 'savoir_faire';
  if (value.includes('etre') || value.includes('être')) return 'savoir_etre';
  if (value.includes('savoir')) return 'savoir';
  return 'autres';
};

export const CollaborateurView: React.FC<CollaborateurViewProps> = ({ currentUser, initialTab, onNavigateTab }) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campagne | null>(null);
  const [historyEvaluations, setHistoryEvaluations] = useState<Evaluation[]>([]);
  const [selectedHistoryEvaluationId, setSelectedHistoryEvaluationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auto_eval' | 'manager_eval' | 'history'>(
    initialTab === 'my_history' ? 'history' : 'auto_eval'
  );

  useEffect(() => {
    if (initialTab === 'my_history') {
      setActiveTab('history');
    } else if (initialTab === 'my_eval' || initialTab === 'collab_eval') {
      setActiveTab('auto_eval');
    }
  }, [initialTab]);

  const selectCollaborateurTab = (tab: 'auto_eval' | 'manager_eval' | 'history') => {
    setActiveTab(tab);
    onNavigateTab?.(tab === 'history' ? 'my_history' : 'my_eval');
  };

  // Form State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [ratingComments, setRatingComments] = useState<Record<string, string>>({});
  const [selfReview, setSelfReview] = useState({ balance: '', achievements: '', difficulties: '', aspirations: '' });
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [submittingAutoEval, setSubmittingAutoEval] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.getEvaluations({ user_id: currentUser.id.toString() }),
      apiClient.getCampaigns()
    ]).then(([evalRes, campRes]) => {
      setHistoryEvaluations(evalRes.filter(review =>
        review.score_global > 0 && (review.status === 'valide' || review.status === 'soumis_dg' || review.status === 'signee'),
      ));
      const openCamp = campRes.find((campaign: Campagne) => campaign.status === 'ouverte');
      const currentEvaluation = openCamp
        ? evalRes.find(review => review.campagne_id === openCamp.id)
        : evalRes[0];

      if (currentEvaluation) {
        const ev = currentEvaluation;
        setEvaluation(ev);
        if (ev.auto_evaluation) {
          setRatings(ev.auto_evaluation.ratings || {});
          setRatingComments(ev.auto_evaluation.comments || {});
          setSelfReview({
            balance: ev.auto_evaluation.balance || '',
            achievements: ev.auto_evaluation.achievements || '',
            difficulties: ev.auto_evaluation.difficulties || '',
            aspirations: ev.auto_evaluation.aspirations || '',
          });
          const savedRatings = ev.auto_evaluation.ratings || {};
          setIsSubmitted(ev.competences.length > 0 && ev.competences.every(competence => Boolean(savedRatings[String(competence.id)])));
        }
      }
      setActiveCampaign(openCamp || null);
      setLoading(false);
    }).catch(console.error);
  }, [currentUser]);

  const handleSubmitAutoEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingAutoEval || isSubmitted) return;
    if (!activeCampaign || activeCampaign.status !== 'ouverte') {
      alert('La campagne doit être lancée par la DRH avant de pouvoir remplir cette auto-évaluation.');
      return;
    }
    if (!evaluation || evaluation.campagne_id !== activeCampaign.id) {
      alert("Votre dossier d'évaluation n'est pas encore associé à cette campagne. Contactez la DRH.");
      return;
    }
    if (evaluation.competences.some(competence => !ratings[String(competence.id)])) {
      setFormError('Certains critères ne sont pas encore cochés. Ils sont signalés en rouge ci-dessous.');
      return;
    }
    if (evaluation.competences.some(competence => !ratingComments[String(competence.id)]?.trim())) {
      setFormError('Ajoutez un commentaire ou une justification pour chaque critère avant de valider.');
      return;
    }
    if (!selfReview.balance.trim() || !selfReview.achievements.trim() || !selfReview.difficulties.trim()) {
      setFormError('Complétez les points forts, les points à améliorer et le développement à envisager avant de valider.');
      return;
    }
    try {
      setFormError('');
      setSubmittingAutoEval(true);
      const result = await apiClient.submitAutoEvaluation(evaluation.id, { ...selfReview, aspirations: selfReview.aspirations || '-', ratings, comments: ratingComments });
      setEvaluation(result.evaluation);
      setIsSubmitted(true);
      setFormMessage(`Votre fiche a été validée et envoyée automatiquement à ${evaluation.manager_name}.`);
    } catch (error: any) {
      setFormError(error.message || 'La transmission au manager a échoué.');
    } finally {
      setSubmittingAutoEval(false);
    }
  };

  const handleSign = async () => {
    if (!evaluation) return;
    if (!['dg_validee', 'validee', 'correction_a_confirmer'].includes(evaluation.status)) {
      alert("Votre évaluation n'est pas encore disponible pour signature.");
      return;
    }
    const res = await apiClient.signEvaluation(evaluation.id);
    setEvaluation(res.evaluation);
    alert(evaluation.status === 'correction_a_confirmer'
      ? 'Vous avez signé la correction. Le dossier a été transmis à la Direction Générale pour validation finale.'
      : 'Vous avez pris connaissance et signé votre évaluation annuelle.');
  };

  const handleConfirmCorrection = async () => {
    if (!evaluation) return;
    try {
      const result = await apiClient.confirmCorrection(evaluation.id);
      setEvaluation(result.evaluation);
      alert(result.message);
    } catch (error: any) {
      alert(error.message || 'La confirmation a échoué.');
    }
  };

  const exportCollaboratorDossier = (item: Evaluation) => {
    const headers = ['Axe', 'Question / compétence', 'Commentaire', 'Note'];
    const rows = item.competences.map(competence => {
      const axis = normalizeAxis(competence.axe);
      const axisLabel = axis === 'savoir'
        ? 'Savoir'
        : axis === 'savoir_faire'
          ? 'Savoir-faire'
          : axis === 'savoir_etre'
            ? 'Savoir-être'
            : 'Autres critères';
      return [
        axisLabel,
        competence.description ? `${competence.name}\n${competence.description}` : competence.name,
        competence.comment || '-',
        competence.score ? `${competence.score}/100` : '-',
      ];
    });
    rows.push(
      ['Synthèse', 'Points forts', item.synthesis_points_forts || '-', '-'],
      ['Synthèse', 'Points à améliorer', item.synthesis_points_ameliorer || '-', '-'],
      ['Synthèse', 'Développement à envisager', item.synthesis_developpement || '-', '-'],
      ['Synthèse', 'Demande de mobilité', item.mobility_request || '-', '-'],
      ['Synthèse', 'Appréciation globale du manager', item.summary_comment || '-', '-'],
    );

    const managerStatus = item.score_global > 0 ? 'Validé par le manager' : 'Non validé';
    const collaboratorStatus = item.signed_at_user ? `Signé le ${item.signed_at_user}` : 'Non signé';
    const dgStatus = item.validated_at_dg ? `Validé le ${item.validated_at_dg}` : 'Non validé';

    const validations = [
      { role: 'Collaborateur', name: item.user_name, status: collaboratorStatus, comment: 'Validation et prise de connaissance' },
      { role: 'Manager évaluateur', name: item.manager_name, status: managerStatus, comment: 'Évaluation réalisée par le manager' },
      { role: 'Direction Générale', name: 'Direction Générale', status: dgStatus, comment: item.dg_comment || 'Validation du dossier' },
    ];

    exportDossierEvaluationPDF(
      `Fiche d'évaluation complète - ${item.user_name}`,
      headers,
      rows,
      validations,
      `dossier_${item.user_name}`
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement de votre dossier...</div>;
  }

  if (selectedHistoryEvaluationId) {
    return (
      <CollaboratorDetailDossier
        evaluationId={selectedHistoryEvaluationId}
        readOnly
        readOnlyContext="rh"
        showGuidelines={false}
        onBack={() => setSelectedHistoryEvaluationId(null)}
      />
    );
  }

  const isCampaignOpen = activeCampaign && activeCampaign.status === 'ouverte';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-800 text-white font-black text-lg flex items-center justify-center border-2 border-blue-400 shadow-md shrink-0">
            {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full">
              Espace Collaborateur
            </span>
            <h1 className="text-xl font-black mt-1">Bienvenue, {currentUser.name}</h1>
            <p className="text-xs text-slate-300">{currentUser.poste_name} • {currentUser.filiale_name}</p>
          </div>
        </div>
 
        {activeCampaign ? (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center text-xs">
            <div className="text-slate-300">Statut Campagne DRH</div>
            <div className="font-bold text-emerald-400 flex items-center justify-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{activeCampaign.name} (Ouverte)</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center text-xs">
            <div className="text-slate-300">Statut Campagne DRH</div>
            <div className="font-bold text-amber-300 flex items-center justify-center space-x-1.5 mt-0.5">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Aucune campagne active</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm flex space-x-2 text-xs font-bold">
        <button
          onClick={() => selectCollaborateurTab('auto_eval')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'auto_eval' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Mon auto-évaluation
        </button>
        <button
          onClick={() => selectCollaborateurTab('manager_eval')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'manager_eval' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          2. Évaluation du Manager & Score
        </button>
        <button
          onClick={() => selectCollaborateurTab('history')}
          className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          3. Historique mes Revues
        </button>
      </div>

      {/* TAB 1: Auto-evaluation form */}
      {activeTab === 'auto_eval' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">Formulaire d'auto-évaluation annuelle</h2>
              <p className="text-xs text-slate-500 mt-0.5">Complétez votre bilan de l'année dès l'ouverture de la campagne par la DRH.</p>
            </div>
            {isSubmitted && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Auto-évaluation transmise</span>
              </span>
            )}
          </div>

          {isSubmitted ? (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto font-black">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Auto-évaluation transmise</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  Votre auto-évaluation a été envoyée à votre manager. Vous ne pouvez plus la modifier pendant cette campagne.
                </p>
              </div>
            </div>
          ) : !isCampaignOpen ? (
            /* Banner when DRH has NOT launched a campaign yet */
            <div className="bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto font-black">
                <Lock className="w-7 h-7 text-amber-700" />
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h3 className="font-black text-base text-amber-950">
                  Aucune campagne d'évaluation n'est actuellement ouverte par la DRH
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Le formulaire d'auto-évaluation reste temporairement indisponible. Dès que la Direction RH aura officiellement lancé une campagne, vous recevrez une notification et les champs de saisie seront débloqués.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-200/80 text-amber-950 font-bold text-xs rounded-full border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-800" />
                    <span>En attente du lancement DRH</span>
                  </span>
                </div>
              </div>
            </div>
          ) : !evaluation || evaluation.campagne_id !== activeCampaign.id ? (
            <div className="bg-blue-50/90 border-2 border-blue-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto font-black">
                <Clock className="w-7 h-7 text-blue-700" />
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h3 className="font-black text-base text-blue-950">
                  Campagne ouverte, dossier en attente d'affectation
                </h3>
                <p className="text-xs text-blue-900 leading-relaxed font-medium">
                  La campagne {activeCampaign.name} est lancée, mais votre dossier d'évaluation n'est pas encore associé à cette campagne. Contactez la DRH pour activer votre formulaire.
                </p>
              </div>
            </div>
          ) : (
            /* Form available when campaign IS open */
            <div className="space-y-6">
              {/* Campaign Launch Alert Banner */}
              {!isSubmitted && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 text-emerald-900 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong>Campagne Lancée par la DRH : {activeCampaign.name}</strong>
                  <p className="text-[11px] text-emerald-800 font-normal mt-0.5">
                    Vous êtes autorisé(e) à remplir votre auto-évaluation. Date limite fixée au <strong>{activeCampaign.auto_eval_deadline}</strong>.
                  </p>
                </div>
              </div>}

              {isSubmitted ? (
                <div className="bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto font-black">
                    <Lock className="w-7 h-7 text-amber-700" />
                  </div>
                  <div className="max-w-xl mx-auto space-y-2">
                    <h3 className="font-black text-base text-amber-950">Auto-évaluation validée et verrouillée</h3>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      Votre fiche complète a été envoyée automatiquement à <strong>{evaluation.manager_name}</strong>. Vous ne pouvez plus modifier vos réponses. Votre manager peut maintenant consulter vos résultats, planifier l’entretien et compléter sa propre notation.
                    </p>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-200/80 text-amber-950 font-bold text-xs rounded-full border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-800" /> En attente du traitement manager
                    </span>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmitAutoEval} className="space-y-5 text-xs">
                {formMessage && <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 font-bold text-emerald-900">{formMessage}</div>}
                {formError && <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 font-bold text-rose-900">{formError}</div>}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-950">
                  Cochez un seul pourcentage pour chaque critère : 100 %, 90 %, 80 %, 70 %, 50 %, 30 % ou 10 %.
                  <strong className="block mt-1">Progression : {Object.keys(ratings).filter(id => evaluation.competences.some(item => String(item.id) === id)).length} / {evaluation.competences.length} critères cochés.</strong>
                </div>

                {(['savoir', 'savoir_faire', 'savoir_etre', 'autres'] as const).map(axis => {
                  const axisItems = evaluation?.competences.filter(competence => normalizeAxis(competence.axe) === axis) || [];
                  if (axisItems.length === 0) return null;
                  const title = axis === 'savoir' ? 'Savoir (20 %)' : axis === 'savoir_faire' ? 'Savoir-faire (50 %)' : axis === 'savoir_etre' ? 'Savoir-être (30 %)' : 'Autres critères';
                  return (
                    <section key={axis} className="space-y-2">
                      <h3 className="font-black text-sm text-slate-900 border-b border-slate-200 pb-2">{title}</h3>
                      {axisItems.map(competence => (
                        <div key={competence.id} className={`grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_minmax(360px,auto)] gap-3 items-center p-3 border-b ${formError && !ratings[String(competence.id)] ? 'border-rose-300 bg-rose-50' : 'border-slate-100'}`}>
                          <div>
                            <div className="font-bold text-slate-900">{competence.name}</div>
                            {competence.description && <div className="text-[11px] text-slate-500">{competence.description}</div>}
                          </div>
                          <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {evaluationLevels.map(level => (
                              <label key={level.value} className={`cursor-pointer px-2.5 py-1.5 rounded-lg border font-black transition-colors ${ratings[String(competence.id)] === level.value ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-300 hover:border-blue-500'} ${isSubmitted ? 'pointer-events-none opacity-80' : ''}`}>
                                <input
                                  type="radio"
                                  name={`rating-${competence.id}`}
                                  value={level.value}
                                  checked={ratings[String(competence.id)] === level.value}
                                  onChange={() => {
                                    setRatings(current => ({ ...current, [String(competence.id)]: level.value }));
                                    setFormError('');
                                  }}
                                  className="sr-only"
                                  disabled={isSubmitted}
                                />
                                {level.label}
                              </label>
                            ))}
                          </div>
                          <textarea
                            rows={2}
                            value={ratingComments[String(competence.id)] || ''}
                            onChange={event => setRatingComments(current => ({ ...current, [String(competence.id)]: event.target.value }))}
                            placeholder="Commentaire ou justification obligatoire"
                            className="w-full min-w-0 p-2 rounded-lg border border-slate-300 bg-white text-[11px]"
                            disabled={isSubmitted}
                          />
                          </div>
                        </div>
                      ))}
                    </section>
                  );
                })}

                <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="font-black text-sm text-slate-900">Synthèse de votre auto-évaluation</h3>
                  {([
                    ['balance', '1. Points forts', 'Indiquez au minimum 3 points forts observés pendant la période évaluée.'],
                    ['achievements', '2. Points à améliorer', 'Indiquez au minimum 3 points à améliorer.'],
                    ['difficulties', '3. Développement à envisager', 'Précisez les formations, évolutions ou accompagnements à envisager.'],
                  ] as const).map(([field, label, placeholder]) => (
                    <div key={field}>
                      <label className="mb-1.5 block font-bold text-slate-900">{label} *</label>
                      <textarea
                        rows={3}
                        value={selfReview[field]}
                        onChange={event => { setSelfReview(current => ({ ...current, [field]: event.target.value })); setFormError(''); }}
                        placeholder={placeholder}
                        className={`w-full rounded-xl border bg-white p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 ${formError && !selfReview[field].trim() ? 'border-rose-400' : 'border-slate-300'}`}
                        required
                        disabled={isSubmitted}
                      />
                    </div>
                  ))}
                </section>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitted || submittingAutoEval}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submittingAutoEval ? 'Transmission en cours...' : 'Valider et transmettre à mon Manager'}</span>
              </button>
            </div>
          </form>
              )}
        </div>
      )}
        </div>
      )}

      {/* TAB 2: View Manager's Evaluation & Sign */}
      {activeTab === 'manager_eval' && evaluation && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">Évaluation Complétée par votre Manager</h2>
              <p className="text-xs text-slate-500">Manager: {evaluation.manager_name}</p>
            </div>

          </div>

          <div className="p-4 bg-slate-50 rounded-xl border space-y-2 text-xs">
            <div className="font-bold text-slate-900">Appréciation de votre Manager :</div>
            <p className="text-slate-700 italic">{evaluation.summary_comment || 'Aucun commentaire renseigné.'}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-sm text-slate-900">Détail complet de l'évaluation</h3>
            {(['savoir', 'savoir_faire', 'savoir_etre', 'autres'] as const).map(axis => {
              const axisItems = evaluation.competences.filter(competence => normalizeAxis(competence.axe) === axis);
              if (axisItems.length === 0) return null;
              const title = axis === 'savoir' ? 'Savoir (20 %)' : axis === 'savoir_faire' ? 'Savoir-faire (50 %)' : axis === 'savoir_etre' ? 'Savoir-être (30 %)' : 'Autres critères';

              return (
                <section key={axis} className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 font-black text-xs text-slate-900 border-b border-slate-200">
                    {title}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {axisItems.map(competence => (
                      <div key={competence.id} className="grid grid-cols-1 md:grid-cols-[1fr_110px] gap-3 p-4 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{competence.name}</div>
                          {competence.description && <div className="mt-0.5 text-[11px] text-slate-500">{competence.description}</div>}
                          <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-700">
                            {competence.comment || 'Aucun commentaire manager renseigné.'}
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center self-start">
                          <div className="text-[10px] font-bold uppercase text-emerald-800">Note</div>
                          <div className="mt-1 text-lg font-black text-emerald-900">
                            {competence.score ? `${competence.score}/100` : '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {evaluation.status === 'a_corriger' && (
            <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl space-y-3">
              <div>
                <div className="font-black text-sm text-amber-950">Dossier renvoyé par la DG</div>
                <p className="text-xs text-amber-900 mt-1">Motif : {evaluation.dg_comment || 'Corrections demandées.'}</p>
              </div>
              {evaluation.manager_correction_submitted_at ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-emerald-900">Le manager a terminé les corrections. Confirmez pour transmettre directement le dossier à la DG.</p>
                  <button onClick={handleConfirmCorrection} className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl">
                    Confirmer et envoyer à la DG
                  </button>
                </div>
              ) : (
                <p className="text-xs font-semibold text-amber-800">Votre manager a été informé. Le bouton de confirmation apparaîtra après ses corrections.</p>
              )}
            </div>
          )}

          {evaluation.status === 'correction_a_confirmer' && (
            <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2">
              <div className="font-black text-sm text-emerald-950">Correction prête à signer</div>
              <p className="text-xs text-emerald-900">
                Votre manager a terminé les corrections demandées par la Direction Générale. Signez votre évaluation pour transmettre automatiquement le dossier à la DG.
              </p>
            </div>
          )}

          {evaluation.status === 'soumis_dg' && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 font-semibold">
              Votre dossier est en cours d’analyse par la Direction Générale. La signature sera disponible après validation du contenu.
            </div>
          )}

          {/* Signature / Prise de Connaissance */}
          {(['dg_validee', 'correction_a_confirmer', 'signee', 'valide', 'validee'] as string[]).includes(evaluation.status) && <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-emerald-900">Signature & Prise de Connaissance</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                {evaluation.signed_at_user ? `Signé le ${evaluation.signed_at_user}` : evaluation.status === 'correction_a_confirmer' ? 'Signez la correction pour transmettre le dossier à la DG.' : 'Veuillez confirmer que vous avez pris connaissance de votre évaluation.'}
              </div>
            </div>

            {!evaluation.signed_at_user ? (
              <button
                onClick={handleSign}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{evaluation.status === 'correction_a_confirmer' ? 'Signer et envoyer à la DG' : "Signer l'Évaluation"}</span>
              </button>
            ) : (
              <span className="px-3 py-1 bg-emerald-200 text-emerald-900 font-extrabold text-xs rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Signé & Enregistré</span>
              </span>
            )}
          </div>}
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">Historique de vos Revues & Évaluations Annuelles</h2>
              <p className="text-xs text-slate-500 mt-0.5">Consultez et téléchargez vos archives de performance au sein du Groupe Premium.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {historyEvaluations.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-500">
                Aucun historique disponible. Une évaluation apparaîtra ici après sa saisie et sa validation.
              </div>
            )}
            {historyEvaluations.map(item => (
              <div key={item.id} className="p-5 hover:bg-blue-50/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-[10px] rounded-full uppercase">
                      Évaluation enregistrée
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{item.campagne_name}</h3>
                    <p className="text-xs text-slate-500">Manager Évaluateur : {item.manager_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Score Global</div>
                    <div className="text-xl font-black text-emerald-800">
                      {item.score_global} / 100
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedHistoryEvaluationId(item.id)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Consulter le dossier
                  </button>
                  <button
                    onClick={() => exportCollaboratorDossier(item)}
                    className="px-3 py-2 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Télécharger la fiche complète
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <div>Savoir : <strong>{item.score_savoir}/100</strong></div>
                  <div>Savoir-faire : <strong>{item.score_savoir_faire}/100</strong></div>
                  <div>Savoir-être : <strong>{item.score_savoir_etre}/100</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

