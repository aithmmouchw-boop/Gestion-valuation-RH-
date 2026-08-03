import { Express, Request, Response } from 'express';
import { 
  usersData, filialesData, directionsData, fichesEvaluationData, 
  competencesTemplatesData, campagnesData, evaluationsData, notificationsConfigData, 
  auditLogsData, notificationsData 
} from './db';
import { 
  User, Campagne, Evaluation, EvaluationCompetence, AutoEvaluation, 
  BesoinFormation, Objectif, DashboardKPIs, CompetenceTemplate
} from '../types';
import { evaluationRepository } from './evaluationRepository';
import {
  deleteUserRecord, findAllUsers, insertUserCredentials, updateUserPassword,
  updateUserRecord, verifyUserPassword,
} from './userCredentialsRepository';
import { getExcelCompetencesForPoste, initializeExcelEvaluationTemplates } from './excelEvaluationTemplates';

let currentUsers = [...usersData];
let currentCampagnes = [...campagnesData];
let currentEvaluations = [...evaluationsData];
let currentFiches = [...fichesEvaluationData];
let currentCompetenceTemplates = [...competencesTemplatesData];
let currentNotificationsConfig = [...notificationsConfigData];
let currentAuditLogs = [...auditLogsData];
let currentNotifications = [...notificationsData];

export async function initializeEvaluationStore() {
  initializeExcelEvaluationTemplates();
  await evaluationRepository.initialize(evaluationsData);
  currentEvaluations = await evaluationRepository.findAll();
  for (let index = 0; index < currentEvaluations.length; index += 1) {
    const evaluation = currentEvaluations[index];
    const excelCompetences = getExcelCompetencesForPoste(evaluation.poste_name, evaluation.id);
    if (excelCompetences.length <= evaluation.competences.length) continue;
    const previousByName = new Map(evaluation.competences.map(item => [item.name.toLocaleLowerCase('fr'), item]));
    evaluation.competences = excelCompetences.map(item => {
      const previous = previousByName.get(item.name.toLocaleLowerCase('fr'));
      return previous ? { ...item, score: previous.score, comment: previous.comment } : item;
    });
    const saved = await evaluationRepository.update(evaluation.id, evaluation);
    if (saved) currentEvaluations[index] = saved;
  }
}

export async function initializeUserStore() {
  currentUsers = await findAllUsers();
}

export function setupApiRoutes(app: Express) {
  const buildCompetencesForPoste = (posteName: string, evaluationId: number): EvaluationCompetence[] => {
    const excelCompetences = getExcelCompetencesForPoste(posteName, evaluationId);
    if (excelCompetences.length > 0) return excelCompetences;
    const normalizedPoste = posteName.trim().toLocaleLowerCase('fr');
    const fiche = currentFiches.find(item =>
      item.poste_name.trim().toLocaleLowerCase('fr') === normalizedPoste ||
      normalizedPoste.includes(item.poste_name.trim().toLocaleLowerCase('fr')) ||
      item.poste_name.trim().toLocaleLowerCase('fr').includes(normalizedPoste),
    );
    const templates = fiche
      ? currentCompetenceTemplates.filter(template => template.fiche_id === fiche.id)
      : [];
    const source = templates.length > 0 ? templates : [
      { id: 1, fiche_id: 0, axe: 'savoir' as const, name: 'Connaissances nécessaires au poste', description: 'Maîtrise des connaissances et qualifications clés.', coefficient: 1 },
      { id: 2, fiche_id: 0, axe: 'savoir_faire' as const, name: 'Responsabilités et activités du poste', description: 'Utilisation des outils et méthodes nécessaires à la fonction.', coefficient: 1 },
      { id: 3, fiche_id: 0, axe: 'savoir_etre' as const, name: 'Comportement professionnel', description: 'Comportements attendus et respect des valeurs du Groupe.', coefficient: 1 },
    ];
    return source.map((template, index) => ({
      id: Date.now() + index,
      evaluation_id: evaluationId,
      competence_id: template.id,
      axe: template.axe,
      name: template.name,
      description: template.description,
      coefficient: template.coefficient,
      score: 0,
    }));
  };

  // Helper to extract bearer token or simulated session
  const getUserFromReq = (req: Request): User | undefined => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return undefined;
    const token = authHeader.replace('Bearer ', '');
    const userId = parseInt(token, 10);
    return currentUsers.find(u => u.id === userId);
  };

  const requireManager = (req: Request, res: Response) => {
    if (getUserFromReq(req)?.role !== 'manager') {
      res.status(403).json({ error: 'Cette modification est réservée au manager concerné.' });
      return false;
    }
    return true;
  };

  // 1. Auth Login (Sanctum simulation)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, role, password } = req.body;
    let user: User | undefined;

    if (email) {
      user = currentUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    } else if (role) {
      user = currentUsers.find(u => u.role === role);
    }

    if (!user || (role && user.role !== role)) {
      return res.status(401).json({ error: 'Adresse e-mail ou profil incorrect.' });
    }
    if (!password || !(await verifyUserPassword(user.id, password))) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    res.json({
      token: `${user.id}`,
      user
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    res.json({ user });
  });

  app.put('/api/auth/profile/password', async (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Le mot de passe actuel et le nouveau mot de passe sont obligatoires.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }
    if (!(await verifyUserPassword(user.id, currentPassword))) {
      return res.status(401).json({ error: 'Le mot de passe actuel est incorrect.' });
    }

    await updateUserPassword(user.id, newPassword);
    res.json({ message: 'Votre mot de passe a été modifié avec succès.' });
  });

  app.get('/api/users', (req: Request, res: Response) => {
    let list = [...currentUsers];
    if (req.query.role) list = list.filter(u => u.role === req.query.role);
    if (req.query.filiale) list = list.filter(u => u.filiale_name === req.query.filiale);
    if (req.query.direction) list = list.filter(u => u.direction_name === req.query.direction);
    if (req.query.manager_id) list = list.filter(u => u.manager_id === parseInt(req.query.manager_id as string, 10));
    res.json(list);
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    const { name, email, password, role, poste_name, filiale_name, direction_name, manager_id, manager_name, category } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Le nom, l’e-mail et le mot de passe sont obligatoires.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }
    if (currentUsers.some(user => user.email.toLowerCase() === String(email).toLowerCase())) {
      return res.status(409).json({ error: 'Cette adresse e-mail est déjà utilisée.' });
    }
    const newUser: User = {
      id: Date.now(),
      name: name || 'Nouvel Utilisateur',
      email: email || 'user@groupepremium.ma',
      role: role || 'collaborateur',
      poste_id: 1,
      poste_name: poste_name || 'Chef de Projet',
      filiale_id: 1,
      filiale_name: filiale_name || 'Casablanca (Siège)',
      direction_id: 1,
      direction_name: direction_name || 'Direction BTP & Infrastructure',
      manager_id: manager_id ? parseInt(manager_id, 10) : undefined,
      manager_name: manager_name || undefined,
      avatar: '',
      category: category || 'Cadre'
    };

    await insertUserCredentials(newUser, password);
    currentUsers.unshift(newUser);

    // A collaborator receives a blank current evaluation, never a fabricated history.
    const activeCampagne = currentCampagnes.find(c => c.status === 'ouverte');
    if (activeCampagne && newUser.role === 'collaborateur') {
      const blankEvaluation = await evaluationRepository.create({
        id: 0,
        campagne_id: activeCampagne.id,
        campagne_name: activeCampagne.name,
        user_id: newUser.id,
        user_name: newUser.name,
        user_avatar: '',
        user_category: newUser.category,
        poste_name: newUser.poste_name,
        filiale_name: newUser.filiale_name,
        direction_name: newUser.direction_name,
        manager_id: newUser.manager_id || 2,
        manager_name: newUser.manager_name || 'Nabil Idrissi',
        status: 'en_attente',
        score_savoir: 0,
        score_savoir_faire: 0,
        score_savoir_etre: 0,
        score_global: 0,
        competences: buildCompetencesForPoste(newUser.poste_name, 0),
        besoins_formation: [],
        axes_developpement: [],
        objectifs: []
      });
      currentEvaluations.unshift(blankEvaluation);
    }

    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const index = currentUsers.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });

    currentUsers[index] = { ...currentUsers[index], ...req.body };
    await updateUserRecord(currentUsers[index]);
    res.json(currentUsers[index]);
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await deleteUserRecord(id);
    currentUsers = currentUsers.filter(u => u.id !== id);
    res.json({ message: 'Utilisateur supprimé' });
  });

  // Directions & Filiales Endpoints
  app.get('/api/directions', (_req: Request, res: Response) => {
    res.json(directionsData);
  });

  app.post('/api/directions', (req: Request, res: Response) => {
    const { name, code } = req.body;
    const newDir = { id: Date.now(), name, code: code || 'DIR' };
    directionsData.push(newDir);
    res.status(201).json(newDir);
  });

  app.get('/api/filiales', (_req: Request, res: Response) => {
    res.json(filialesData);
  });

  app.post('/api/filiales', (req: Request, res: Response) => {
    const { name, city } = req.body;
    const newFiliale = { id: Date.now(), name: name || `Groupe Premium - ${city}`, city: city || name };
    filialesData.push(newFiliale);
    res.status(201).json(newFiliale);
  });

  // 2. RH KPIs & Dashboard Data
  app.get('/api/kpis', async (_req: Request, res: Response) => {
    // Recharger la table afin que chaque statistique reflète la base actuelle.
    currentEvaluations = await evaluationRepository.findAll();
    const activeCampagne = currentCampagnes.find(c => c.status === 'ouverte') || currentCampagnes[0];
    const evals = currentEvaluations.filter(e => e.campagne_id === activeCampagne?.id);

    const total = evals.length;
    const completed = evals.filter(e => e.status === 'valide' || e.status === 'soumis_dg').length;
    const pending = total - completed;
    const validated = evals.filter(e => e.status === 'valide').length;
    const globalProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Manager Delays
    const managers = currentUsers.filter(u => u.role === 'manager');
    const managerDelays = managers.map(m => {
      const mEvals = evals.filter(e => e.manager_id === m.id);
      const late = mEvals.filter(e => e.status === 'en_attente' || e.status === 'auto_eval_terminee' || e.status === 'en_cours_manager').length;
      return {
        manager_name: m.name,
        direction: m.direction_name,
        late_count: late,
        total_count: mEvals.length
      };
    });

    const calculateRealAverage = (items: Evaluation[]) => {
      const evaluatedItems = items.filter(item => item.score_global > 0);
      const average = evaluatedItems.length > 0
        ? evaluatedItems.reduce((sum, item) => sum + item.score_global, 0) / evaluatedItems.length
        : 0;
      return {
        average: Math.round(average * 10) / 10,
        evaluated: evaluatedItems.length,
        total: items.length,
      };
    };

    // Real averages by subsidiary
    const filialeAverages = filialesData
      .map(filiale => {
        const items = evals.filter(evaluation => evaluation.filiale_name.includes(filiale.city));
        return { filiale: filiale.city, ...calculateRealAverage(items) };
      })
      .filter(item => item.total > 0);

    // Real averages by direction
    const directionNames = [...new Set(evals.map(evaluation => evaluation.direction_name).filter(Boolean))];
    const directionAverages = directionNames.map(direction => {
      const items = evals.filter(evaluation => evaluation.direction_name === direction);
      return { direction, ...calculateRealAverage(items) };
    });

    // A family corresponds to the employee's professional direction/family.
    const familyAverages = directionNames.map(family => {
      const items = evals.filter(evaluation => evaluation.direction_name === family);
      return { family, ...calculateRealAverage(items) };
    });

    // A function corresponds to the employee's position/job title.
    const functionNames = [...new Set(evals.map(evaluation => evaluation.poste_name).filter(Boolean))];
    const functionAverages = functionNames.map(jobFunction => {
      const items = evals.filter(evaluation => evaluation.poste_name === jobFunction);
      return { function: jobFunction, ...calculateRealAverage(items) };
    });

    // Axis Averages (Savoir 20%, Savoir-faire 50%, Savoir-être 30%)
    const evaluatedEvals = evals.filter(e => e.score_global > 0);
    const avgSavoir = evaluatedEvals.length > 0 
      ? evaluatedEvals.reduce((a, c) => a + c.score_savoir, 0) / evaluatedEvals.length : 0;
    const avgSavoirFaire = evaluatedEvals.length > 0 
      ? evaluatedEvals.reduce((a, c) => a + c.score_savoir_faire, 0) / evaluatedEvals.length : 0;
    const avgSavoirEtre = evaluatedEvals.length > 0 
      ? evaluatedEvals.reduce((a, c) => a + c.score_savoir_etre, 0) / evaluatedEvals.length : 0;

    const axisAverages = [
      { axis: 'Savoir', weight: '20%', score: Math.round(avgSavoir * 10) / 10 },
      { axis: 'Savoir-faire', weight: '50%', score: Math.round(avgSavoirFaire * 10) / 10 },
      { axis: 'Savoir-être', weight: '30%', score: Math.round(avgSavoirEtre * 10) / 10 },
    ];

    const scoreDistribution = [
      { range: '< 60% (Insuffisant)', count: evals.filter(e => e.score_global > 0 && e.score_global < 60).length },
      { range: '60% - 75% (Moyen)', count: evals.filter(e => e.score_global >= 60 && e.score_global < 75).length },
      { range: '75% - 90% (Satisfaisant)', count: evals.filter(e => e.score_global >= 75 && e.score_global < 90).length },
      { range: '90% - 100% (Excellent)', count: evals.filter(e => e.score_global >= 90).length }
    ];

    const competenceGroups = new Map<string, { name: string; axe: string; scores: number[] }>();
    evals.flatMap(evaluation => evaluation.competences || []).forEach(competence => {
      if (Number(competence.score || 0) <= 0) return;
      const key = `${competence.axe}|${competence.name}`;
      const group = competenceGroups.get(key) || { name: competence.name, axe: competence.axe, scores: [] };
      group.scores.push(Number(competence.score));
      competenceGroups.set(key, group);
    });
    const realCompetencies = [...competenceGroups.values()].map(group => ({
      name: group.name,
      axe: group.axe,
      score: Math.round((group.scores.reduce((sum, score) => sum + score, 0) / group.scores.length) * 10) / 10,
    }));
    const topCompetencies = [...realCompetencies].sort((a, b) => b.score - a.score).slice(0, 4);
    const weakCompetencies = [...realCompetencies].sort((a, b) => a.score - b.score).slice(0, 3);

    const trainingGroups = new Map<string, { count: number; highPriority: number }>();
    evals.flatMap(evaluation => evaluation.besoins_formation || []).forEach(need => {
      const category = need.title || 'Autre besoin de formation';
      const group = trainingGroups.get(category) || { count: 0, highPriority: 0 };
      group.count += 1;
      if (need.priority === 'Haute') group.highPriority += 1;
      trainingGroups.set(category, group);
    });
    const trainingNeedsSummary = [...trainingGroups.entries()]
      .map(([category, values]) => ({ category, ...values }))
      .sort((a, b) => b.count - a.count);

    const kpis: DashboardKPIs = {
      globalProgress,
      totalEvaluations: total,
      completedEvaluations: completed,
      pendingEvaluations: pending,
      validatedEvaluations: validated,
      managerDelays,
      filialeAverages,
      directionAverages,
      familyAverages,
      functionAverages,
      axisAverages,
      scoreDistribution,
      topCompetencies,
      weakCompetencies,
      trainingNeedsSummary
    };

    res.json(kpis);
  });

  // 3. Campagnes CRUD & Actions
  app.get('/api/campaigns', (_req: Request, res: Response) => {
    res.json(currentCampagnes);
  });

  app.post('/api/campaigns', (req: Request, res: Response) => {
    const { name, description, year, start_date, auto_eval_deadline, manager_eval_deadline, dg_validation_deadline, end_date, status, regles_evaluations } = req.body;

    // Date validation
    if (new Date(start_date) > new Date(end_date) || new Date(auto_eval_deadline) > new Date(manager_eval_deadline)) {
      return res.status(400).json({ error: 'Incohérence chronologique dans la saisie des dates' });
    }

    const defaultManagers = currentUsers.filter(u => u.role === 'manager').map(u => u.name);

    const newCampagne: Campagne = {
      id: currentCampagnes.length + 1,
      name,
      description: description || '',
      year: parseInt(year, 10) || new Date().getFullYear(),
      start_date,
      auto_eval_deadline,
      manager_eval_deadline,
      dg_validation_deadline,
      end_date,
      status: status || 'brouillon',
      filiales: [...new Set(currentUsers.map(user => user.filiale_name).filter(Boolean))],
      directions: [...new Set(currentUsers.map(user => user.direction_name).filter(Boolean))],
      categories: [...new Set(currentUsers.map(user => user.category).filter(Boolean))],
      total_collaborateurs: currentUsers.filter(u => u.role === 'collaborateur').length,
      total_managers: currentUsers.filter(u => u.role === 'manager').length,
      total_dgs: 1,
      progress: 0,
      regles_evaluations: regles_evaluations || '1. Évaluation basée sur des faits concrets et réalisations.\n2. Respect impératif de la pondération officielle.\n3. Entretien individuel obligatoire avec chaque collaborateur.',
      managers_informes: defaultManagers,
      created_at: new Date().toISOString().split('T')[0]
    };

    currentCampagnes.unshift(newCampagne);

    // Record audit log
    const currentUser = getUserFromReq(req);
    currentAuditLogs.unshift({
      id: currentAuditLogs.length + 1,
      campagne_id: newCampagne.id,
      campagne_name: newCampagne.name,
      user_name: `${currentUser?.name} (RH)`,
      action: status === 'ouverte' ? 'Lancement direct et information des managers' : 'Création de la campagne et envoi des consignes aux managers',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.status(201).json(newCampagne);
  });

  app.put('/api/campaigns/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const index = currentCampagnes.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Campagne introuvable' });

    currentCampagnes[index] = { ...currentCampagnes[index], ...req.body };
    res.json(currentCampagnes[index]);
  });

  app.post('/api/campaigns/:id/launch', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const campagne = currentCampagnes.find(c => c.id === id);
    if (!campagne) return res.status(404).json({ error: 'Campagne introuvable' });

    campagne.status = 'ouverte';

    // Trigger Notifications to managers and collaborators
    const managers = currentUsers.filter(u => u.role === 'manager');
    managers.forEach(m => {
      currentNotifications.unshift({
        id: currentNotifications.length + 1,
        user_id: m.id,
        title: `Lancement de Campagne: ${campagne.name}`,
        message: `La campagne "${campagne.name}" est officiellement ouverte pour votre département et toute votre équipe. ${campagne.description} Consignes : ${campagne.regles_evaluations || ''}`,
        read: false,
        type: 'campaign_launch',
        created_at: new Date().toISOString().split('T')[0]
      });
    });

    const collaborators = currentUsers.filter(u => u.role === 'collaborateur');
    for (const c of collaborators) {
      const alreadyExists = currentEvaluations.some(
        evaluation => evaluation.campagne_id === campagne.id && evaluation.user_id === c.id,
      );
      if (!alreadyExists) {
        const evaluation = await evaluationRepository.create({
          id: 0,
          campagne_id: campagne.id,
          campagne_name: campagne.name,
          user_id: c.id,
          user_name: c.name,
          user_avatar: '',
          user_category: c.category,
          poste_name: c.poste_name,
          filiale_name: c.filiale_name,
          direction_name: c.direction_name,
          manager_id: c.manager_id || 0,
          manager_name: c.manager_name || 'Manager non affecté',
          status: 'en_attente',
          score_savoir: 0,
          score_savoir_faire: 0,
          score_savoir_etre: 0,
          score_global: 0,
          competences: buildCompetencesForPoste(c.poste_name, 0),
          besoins_formation: [],
          axes_developpement: [],
          objectifs: [],
        });
        currentEvaluations.unshift(evaluation);
      }

      currentNotifications.unshift({
        id: currentNotifications.length + 1,
        user_id: c.id,
        title: `🚀 Lancement de la Campagne d'Évaluation ${campagne.year}`,
        message: `La campagne "${campagne.name}" a été lancée par la DRH pour votre département. ${campagne.description} Vous pouvez remplir votre auto-évaluation. Consignes : ${campagne.regles_evaluations || ''}`,
        read: false,
        type: 'campaign_launch',
        created_at: new Date().toISOString().split('T')[0]
      });
    }

    // Record Audit Log
    const currentUser = getUserFromReq(req);
    currentAuditLogs.unshift({
      id: currentAuditLogs.length + 1,
      campagne_id: campagne.id,
      campagne_name: campagne.name,
      user_name: `${currentUser?.name || 'Direction RH'}`,
      action: `Lancement officiel et notification automatique à ${managers.length} managers et ${collaborators.length} collaborateurs.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.json({ message: 'Campagne lancée avec succès', campagne });
  });

  app.post('/api/campaigns/:id/close', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const campagne = currentCampagnes.find(c => c.id === id);
    if (!campagne) return res.status(404).json({ error: 'Campagne introuvable' });

    campagne.status = 'cloturee';

    const currentUser = getUserFromReq(req);
    currentAuditLogs.unshift({
      id: currentAuditLogs.length + 1,
      campagne_id: campagne.id,
      campagne_name: campagne.name,
      user_name: `${currentUser?.name || 'Direction RH'}`,
      action: 'Clôture de la campagne et consolidation des résultats',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.json({ message: 'Campagne clôturée avec succès', campagne });
  });

  app.post('/api/campaigns/:id/archive', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const campagne = currentCampagnes.find(c => c.id === id);
    if (!campagne) return res.status(404).json({ error: 'Campagne introuvable' });

    campagne.status = 'archivee';
    res.json({ message: 'Campagne archivée avec succès', campagne });
  });

  app.post('/api/campaigns/:id/relaunch', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const campagne = currentCampagnes.find(c => c.id === id);
    if (!campagne) return res.status(404).json({ error: 'Campagne introuvable' });

    // Send reminders to managers
    const managers = currentUsers.filter(u => u.role === 'manager');
    managers.forEach(m => {
      currentNotifications.unshift({
        id: currentNotifications.length + 1,
        user_id: m.id,
        title: `Rappel Relance: ${campagne.name}`,
        message: `Rappel automatique RH: Veuillez finaliser les évaluations de votre équipe pour la campagne ${campagne.name}.`,
        read: false,
        type: 'reminder',
        created_at: new Date().toISOString().split('T')[0]
      });
    });

    const currentUser = getUserFromReq(req);
    currentAuditLogs.unshift({
      id: currentAuditLogs.length + 1,
      campagne_id: campagne.id,
      campagne_name: campagne.name,
      user_name: `${currentUser?.name || 'Direction RH'}`,
      action: `Envoi d'un rappel général de relance à ${managers.length} managers.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.json({ message: `Relance générale envoyée avec succès à ${managers.length} managers.`, campagne });
  });

  app.post('/api/relaunch/manager', (req: Request, res: Response) => {
    const { manager_name } = req.body;
    const manager = currentUsers.find(u => u.name === manager_name || u.name.toLowerCase().includes((manager_name || '').toLowerCase()));
    
    if (manager) {
      currentNotifications.unshift({
        id: currentNotifications.length + 1,
        user_id: manager.id,
        title: `Rappel Relance RH Personnalisé`,
        message: `Attention: La Direction RH vous relance concernant les dossiers d'évaluation en retard de votre département (${manager.direction_name}).`,
        read: false,
        type: 'reminder',
        created_at: new Date().toISOString().split('T')[0]
      });
    }

    const currentUser = getUserFromReq(req);
    currentAuditLogs.unshift({
      id: currentAuditLogs.length + 1,
      campagne_id: 1,
      campagne_name: "Campagne Annuelle 2025",
      user_name: `${currentUser?.name || 'Direction RH'}`,
      action: `Relance individuelle transmise au manager ${manager_name}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.json({ message: `Relance envoyée avec succès au manager ${manager_name}.` });
  });

  // 4. Evaluations CRUD & Dynamic Manager Editing
  app.get('/api/evaluations', async (req: Request, res: Response) => {
    try {
      currentEvaluations = await evaluationRepository.findAll();
      let list = [...currentEvaluations];
      const { user_id, manager_id, campagne_id, status, filiale, direction } = req.query;

      if (user_id) list = list.filter(e => e.user_id === parseInt(user_id as string, 10));
      if (manager_id) list = list.filter(e => e.manager_id === parseInt(manager_id as string, 10));
      if (campagne_id) list = list.filter(e => e.campagne_id === parseInt(campagne_id as string, 10));
      if (status) list = list.filter(e => e.status === status);
      if (filiale) list = list.filter(e => e.filiale_name.includes(filiale as string));
      if (direction) list = list.filter(e => e.direction_name.includes(direction as string));

      res.json(list);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur de lecture SQL' });
    }
  });

  app.get('/api/evaluations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const evaluation = await evaluationRepository.findById(id);
      if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur de lecture SQL' });
    }
  });

  app.post('/api/evaluations', async (req: Request, res: Response) => {
    try {
      const evaluation = req.body as Evaluation;
      const created = await evaluationRepository.create(evaluation);
      currentEvaluations.unshift(created);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur de création SQL' });
    }
  });

  app.delete('/api/evaluations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await evaluationRepository.delete(id);
      if (!deleted) return res.status(404).json({ error: 'Évaluation non trouvée' });
      currentEvaluations = currentEvaluations.filter(e => e.id !== id);
      res.json({ message: 'Évaluation supprimée avec succès' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur de suppression SQL' });
    }
  });

  // Manager updates scores, competencies, training, development, objectives
  app.put('/api/evaluations/:id', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const evalIndex = currentEvaluations.findIndex(e => e.id === id);
    if (evalIndex === -1) return res.status(404).json({ error: 'Évaluation non trouvée' });

    const currentEval = currentEvaluations[evalIndex];
    if (!currentEval.interview_date) {
      return res.status(403).json({ error: 'Vous devez planifier l’entretien avec le collaborateur avant de modifier les notes.' });
    }
    const updated = { ...currentEval, ...req.body };

    // Auto recalculate weighted score
    if (updated.competences && updated.competences.length > 0) {
      const savoirs = updated.competences.filter((c: EvaluationCompetence) => c.axe === 'savoir');
      const savoirFaires = updated.competences.filter((c: EvaluationCompetence) => c.axe === 'savoir_faire');
      const savoirEtres = updated.competences.filter((c: EvaluationCompetence) => c.axe === 'savoir_etre');

      const calcAxisAvg = (items: EvaluationCompetence[]) => {
        if (items.length === 0) return 0;
        const totalCoeff = items.reduce((acc, curr) => acc + (curr.coefficient || 1), 0);
        const weightedScore = items.reduce((acc, curr) => acc + (curr.score * (curr.coefficient || 1)), 0);
        return totalCoeff > 0 ? Math.round((weightedScore / totalCoeff) * 10) / 10 : 0;
      };

      updated.score_savoir = calcAxisAvg(savoirs);
      updated.score_savoir_faire = calcAxisAvg(savoirFaires);
      updated.score_savoir_etre = calcAxisAvg(savoirEtres);

      // 20% Savoir + 50% Savoir-faire + 30% Savoir-être
      updated.score_global = Math.round(
        (updated.score_savoir * 0.20) + 
        (updated.score_savoir_faire * 0.50) + 
        (updated.score_savoir_etre * 0.30)
      * 10) / 10;
    }

    try {
      const saved = await evaluationRepository.update(id, updated);
      if (!saved) return res.status(404).json({ error: 'Évaluation non trouvée' });
      currentEvaluations[evalIndex] = saved;
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur de mise à jour SQL' });
    }
  });

  // Manager dynamically adds a new competence card
  app.post('/api/evaluations/:id/competences', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    const { axe, name, description, coefficient, score, comment } = req.body;
    const newComp: EvaluationCompetence = {
      id: Date.now(),
      evaluation_id: id,
      axe: axe || 'savoir_faire',
      name: name || 'Nouvelle Compétence',
      description: description || '',
      coefficient: parseFloat(coefficient) || 1,
      score: parseFloat(score) || 80,
      comment: comment || ''
    };

    evaluation.competences.push(newComp);

    // Recalculate global scores
    const savoirs = evaluation.competences.filter(c => c.axe === 'savoir');
    const savoirFaires = evaluation.competences.filter(c => c.axe === 'savoir_faire');
    const savoirEtres = evaluation.competences.filter(c => c.axe === 'savoir_etre');

    const calcAxisAvg = (items: EvaluationCompetence[]) => {
      if (items.length === 0) return 0;
      const totalCoeff = items.reduce((acc, curr) => acc + (curr.coefficient || 1), 0);
      const weightedScore = items.reduce((acc, curr) => acc + (curr.score * (curr.coefficient || 1)), 0);
      return totalCoeff > 0 ? Math.round((weightedScore / totalCoeff) * 10) / 10 : 0;
    };

    evaluation.score_savoir = calcAxisAvg(savoirs);
    evaluation.score_savoir_faire = calcAxisAvg(savoirFaires);
    evaluation.score_savoir_etre = calcAxisAvg(savoirEtres);
    evaluation.score_global = Math.round(
      (evaluation.score_savoir * 0.20) + 
      (evaluation.score_savoir_faire * 0.50) + 
      (evaluation.score_savoir_etre * 0.30)
    * 10) / 10;

    await evaluationRepository.update(id, evaluation);
    res.status(201).json({ message: 'Compétence ajoutée', newComp, evaluation });
  });

  // Manager deletes a competence card
  app.delete('/api/evaluations/:id/competences/:compId', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const compId = parseInt(req.params.compId, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    evaluation.competences = evaluation.competences.filter(c => c.id !== compId);

    // Recalculate
    const savoirs = evaluation.competences.filter(c => c.axe === 'savoir');
    const savoirFaires = evaluation.competences.filter(c => c.axe === 'savoir_faire');
    const savoirEtres = evaluation.competences.filter(c => c.axe === 'savoir_etre');

    const calcAxisAvg = (items: EvaluationCompetence[]) => {
      if (items.length === 0) return 0;
      const totalCoeff = items.reduce((acc, curr) => acc + (curr.coefficient || 1), 0);
      const weightedScore = items.reduce((acc, curr) => acc + (curr.score * (curr.coefficient || 1)), 0);
      return totalCoeff > 0 ? Math.round((weightedScore / totalCoeff) * 10) / 10 : 0;
    };

    evaluation.score_savoir = calcAxisAvg(savoirs);
    evaluation.score_savoir_faire = calcAxisAvg(savoirFaires);
    evaluation.score_savoir_etre = calcAxisAvg(savoirEtres);
    evaluation.score_global = Math.round(
      (evaluation.score_savoir * 0.20) + 
      (evaluation.score_savoir_faire * 0.50) + 
      (evaluation.score_savoir_etre * 0.30)
    * 10) / 10;

    await evaluationRepository.update(id, evaluation);
    res.json({ message: 'Compétence supprimée', evaluation });
  });

  // Manager adds a training need (Besoin de Formation)
  app.post('/api/evaluations/:id/training', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    const { title, description, priority, comment } = req.body;
    const newTraining: BesoinFormation = {
      id: Date.now(),
      evaluation_id: id,
      title: title || 'Nouvelle Formation',
      description: description || '',
      priority: priority || 'Moyenne',
      comment: comment || ''
    };

    evaluation.besoins_formation.push(newTraining);
    await evaluationRepository.update(id, evaluation);
    res.status(201).json({ message: 'Besoin de formation ajouté', newTraining, evaluation });
  });

  // Manager deletes a training need
  app.delete('/api/evaluations/:id/training/:trainingId', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const trainingId = parseInt(req.params.trainingId, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    evaluation.besoins_formation = evaluation.besoins_formation.filter(b => b.id !== trainingId);
    await evaluationRepository.update(id, evaluation);
    res.json({ message: 'Besoin de formation supprimé', evaluation });
  });

  // Manager adds an Objective
  app.post('/api/evaluations/:id/objectives', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    const { title, description, target_date, progress, status, is_next_year } = req.body;
    const newObjective: Objectif = {
      id: Date.now(),
      evaluation_id: id,
      title: title || 'Nouveau Projet / Objectif',
      description: description || '',
      target_date: target_date || `${new Date().getFullYear()}-12-31`,
      progress: progress || 0,
      status: status || 'Non débuté',
      is_next_year: is_next_year !== undefined ? is_next_year : true
    };

    evaluation.objectifs.push(newObjective);
    await evaluationRepository.update(id, evaluation);
    res.status(201).json({ message: 'Objectif ajouté', newObjective, evaluation });
  });

  // Manager deletes an Objective
  app.delete('/api/evaluations/:id/objectives/:objId', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const objId = parseInt(req.params.objId, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    evaluation.objectifs = evaluation.objectifs.filter(o => o.id !== objId);
    await evaluationRepository.update(id, evaluation);
    res.json({ message: 'Objectif supprimé', evaluation });
  });

  // Submit evaluation by manager to DG
  app.post('/api/evaluations/:id/submit', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });
    if (evaluation.competences.length === 0 || evaluation.competences.some(competence => Number(competence.score) <= 0)) {
      return res.status(400).json({ error: 'Tous les critères Savoir, Savoir-faire et Savoir-être doivent être notés avant la soumission.' });
    }

    evaluation.status = 'soumis_dg';

    // Platform notification to collaborator ONLY (as per requirements: "Aucun email n'est envoyé au collaborateur à cette étape")
    currentNotifications.unshift({
      id: currentNotifications.length + 1,
      user_id: evaluation.user_id,
      title: 'Évaluation Manager Finalisée',
      message: `Votre entretien de performance pour la campagne ${evaluation.campagne_name} a été complété par votre manager ${evaluation.manager_name}.`,
      read: false,
      type: 'eval_submitted',
      created_at: new Date().toISOString().split('T')[0]
    });

    await evaluationRepository.update(id, evaluation);
    res.json({ message: 'Évaluation transmise à la Direction Générale', evaluation });
  });

  app.post('/api/evaluations/:id/submit-correction', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(item => item.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });
    if (evaluation.status !== 'a_corriger') return res.status(409).json({ error: 'Ce dossier n’est pas en correction.' });
    if (evaluation.competences.some(competence => Number(competence.score) <= 0)) {
      return res.status(400).json({ error: 'Terminez toutes les notes avant de demander la confirmation du collaborateur.' });
    }
    evaluation.manager_correction_submitted_at = new Date().toISOString();
    await evaluationRepository.update(id, evaluation);
    currentNotifications.unshift({
      id: currentNotifications.length + 1,
      user_id: evaluation.user_id,
      title: 'Corrections du manager terminées',
      message: `${evaluation.manager_name} a corrigé votre dossier. Consultez les résultats et confirmez-les pour les transmettre directement à la DG.`,
      read: false,
      type: 'eval_submitted',
      created_at: new Date().toISOString().split('T')[0]
    });
    res.json({ message: 'Corrections terminées. Le collaborateur a été notifié.', evaluation });
  });

  app.post('/api/evaluations/:id/confirm-correction', async (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(item => item.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });
    if (!user || user.role !== 'collaborateur' || user.id !== evaluation.user_id) {
      return res.status(403).json({ error: 'Confirmation réservée au collaborateur concerné.' });
    }
    if (evaluation.status !== 'a_corriger' || !evaluation.manager_correction_submitted_at) {
      return res.status(409).json({ error: 'Les corrections du manager ne sont pas encore terminées.' });
    }
    evaluation.status = 'soumis_dg';
    evaluation.correction_confirmed_at = new Date().toISOString();
    await evaluationRepository.update(id, evaluation);
    const recipients = currentUsers.filter(item => item.role === 'dg' || item.id === evaluation.manager_id);
    recipients.forEach(recipient => currentNotifications.unshift({
      id: currentNotifications.length + 1,
      user_id: recipient.id,
      title: 'Dossier corrigé confirmé par le collaborateur',
      message: `${evaluation.user_name} a confirmé le dossier corrigé. Il est transmis à la DG pour validation finale.`,
      read: false,
      type: 'eval_submitted',
      created_at: new Date().toISOString().split('T')[0]
    }));
    res.json({ message: 'Confirmation enregistrée. Dossier envoyé à la DG pour validation finale.', evaluation });
  });

  // Collaborator submits auto-evaluation
  app.post('/api/evaluations/:id/auto-eval', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });
    const campaign = currentCampagnes.find(c => c.id === evaluation.campagne_id);
    if (!campaign || campaign.status !== 'ouverte') {
      return res.status(403).json({
        error: 'L’auto-évaluation est verrouillée jusqu’au lancement officiel de la campagne par la DRH.',
      });
    }
    if (evaluation.auto_evaluation?.ratings && Object.keys(evaluation.auto_evaluation.ratings).length > 0) {
      return res.status(409).json({ error: 'Cette auto-évaluation a déjà été validée et ne peut plus être modifiée.' });
    }

    const { balance = '', achievements = '', difficulties = '', aspirations = '', ratings = {}, comments = {} } = req.body;
    const validRatings = ['A+', 'A', 'B+', 'B', 'B-', 'C', 'D'];
    const competenceIds = new Set(evaluation.competences.map(competence => String(competence.id)));
    if (competenceIds.size === 0 || [...competenceIds].some(competenceId => !validRatings.includes(ratings[competenceId]))) {
      return res.status(400).json({ error: 'Veuillez choisir un niveau pour chaque critère de la fiche.' });
    }
    const autoEval: AutoEvaluation = {
      id: Date.now(),
      evaluation_id: id,
      user_id: evaluation.user_id,
      balance,
      achievements,
      difficulties,
      aspirations,
      ratings,
      comments,
      submitted_at: new Date().toISOString().split('T')[0]
    };

    evaluation.auto_evaluation = autoEval;
    evaluation.status = 'auto_eval_terminee';

    currentNotifications.unshift({
      id: currentNotifications.length + 1,
      user_id: evaluation.manager_id,
      title: `Auto-évaluation reçue : ${evaluation.user_name}`,
      message: `${evaluation.user_name} a validé sa fiche d’auto-évaluation. Consultez-la puis planifiez l’entretien individuel.`,
      read: false,
      type: 'eval_submitted',
      created_at: new Date().toISOString().split('T')[0]
    });

    await evaluationRepository.update(id, evaluation);
    res.json({ message: 'Auto-évaluation enregistrée', evaluation });
  });

  // Manager schedules the mandatory interview after receiving the self-evaluation.
  app.post('/api/evaluations/:id/interview', async (req: Request, res: Response) => {
    if (!requireManager(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(item => item.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });
    if (!evaluation.auto_evaluation) {
      return res.status(409).json({ error: 'Le collaborateur doit d’abord valider son auto-évaluation.' });
    }
    const { interview_date, message } = req.body;
    if (!interview_date || new Date(interview_date).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Choisissez une date et une heure futures pour l’entretien.' });
    }
    evaluation.interview_date = interview_date;
    evaluation.interview_message = message || 'Réunion de discussion de votre évaluation annuelle.';
    evaluation.status = 'en_cours_manager';
    await evaluationRepository.update(id, evaluation);
    currentNotifications.unshift({
      id: currentNotifications.length + 1,
      user_id: evaluation.user_id,
      title: `Entretien planifié avec ${evaluation.manager_name}`,
      message: `Votre entretien d’évaluation est planifié le ${new Date(interview_date).toLocaleString('fr-FR')}. ${evaluation.interview_message}`,
      read: false,
      type: 'interview_scheduled',
      created_at: new Date().toISOString().split('T')[0]
    });
    res.json({ message: 'Entretien planifié et collaborateur notifié.', evaluation });
  });

  // Collaborator signs / acknowledges evaluation
  app.post('/api/evaluations/:id/sign', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    evaluation.signed_at_user = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await evaluationRepository.update(id, evaluation);
    res.json({ message: 'Évaluation signée avec succès', evaluation });
  });

  // DG validates or rejects evaluation
  app.post('/api/evaluations/:id/validate-dg', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const evaluation = currentEvaluations.find(e => e.id === id);
    if (!evaluation) return res.status(404).json({ error: 'Évaluation non trouvée' });

    const { action, comment } = req.body; // action: 'valider' | 'renvoyer'

    if (action === 'valider') {
      evaluation.status = 'valide';
      evaluation.validated_at_dg = new Date().toISOString().split('T')[0];
      evaluation.dg_comment = comment || 'Validé par la Direction Générale';
    } else {
      evaluation.status = 'a_corriger';
      evaluation.dg_comment = comment || 'Ajustements demandés par la Direction Générale';
      evaluation.manager_correction_submitted_at = undefined;
      evaluation.correction_confirmed_at = undefined;
      [evaluation.manager_id, evaluation.user_id].forEach(userId => currentNotifications.unshift({
        id: currentNotifications.length + 1,
        user_id: userId,
        title: 'Dossier renvoyé pour correction par la DG',
        message: `La DG a renvoyé le dossier de ${evaluation.user_name}. Motif : ${evaluation.dg_comment}`,
        read: false,
        type: 'eval_submitted',
        created_at: new Date().toISOString().split('T')[0]
      }));
    }

    await evaluationRepository.update(id, evaluation);
    res.json({ message: `Dossier ${action === 'valider' ? 'validé' : 'renvoyé au manager'}`, evaluation });
  });

  // 5. Historique DRILL-DOWN Endpoint
  app.get('/api/history/drilldown', (_req: Request, res: Response) => {
    // Return structured hierarchy for 3-step drill-down
    // Screen 1: Past campaigns list
    // Screen 2: Departments list with their managers for a selected campaign
    // Screen 3: Manager detail with his collaborators list

    const campaignsList = currentCampagnes.map(c => {
      const cEvals = currentEvaluations.filter(e => e.campagne_id === c.id);
      const scoredEvals = cEvals.filter(e => e.score_global > 0);
      const completedEvals = cEvals.filter(e => e.status === 'valide' || e.status === 'soumis_dg');
      const avg = scoredEvals.length > 0
        ? Math.round((scoredEvals.reduce((acc, curr) => acc + curr.score_global, 0) / scoredEvals.length) * 10) / 10
        : 0;
      return {
        id: c.id,
        year: c.year,
        name: c.name,
        completion_rate: cEvals.length > 0 ? Math.round((completedEvals.length / cEvals.length) * 100) : 0,
        average_score: avg,
        status: c.status
      };
    });

    res.json({ campaigns: campaignsList });
  });

  // 6. Notifications & Config
  app.get('/api/notifications', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const userNotifs = currentNotifications.filter(n => n.user_id === user?.id || user?.role === 'rh');
    res.json(userNotifs);
  });

  app.get('/api/notifications/config', (_req: Request, res: Response) => {
    res.json(currentNotificationsConfig);
  });

  app.put('/api/notifications/config', (req: Request, res: Response) => {
    currentNotificationsConfig = req.body;
    res.json({ message: 'Configuration mise à jour', config: currentNotificationsConfig });
  });

  app.get('/api/audit-logs', (_req: Request, res: Response) => {
    res.json(currentAuditLogs);
  });

  // 7. Fiches de poste CRUD
  app.get('/api/job-templates', (_req: Request, res: Response) => {
    res.json({
      fiches: currentFiches,
      templates: currentCompetenceTemplates
    });
  });

  app.put('/api/job-templates/fiches/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const index = currentFiches.findIndex(f => f.id === id);
    if (index === -1) return res.status(404).json({ error: 'Fiche introuvable' });

    currentFiches[index] = { ...currentFiches[index], ...req.body, updated_at: new Date().toISOString().split('T')[0] };
    res.json(currentFiches[index]);
  });

  app.post('/api/job-templates/competences', (req: Request, res: Response) => {
    const { fiche_id, axe, name, description, coefficient } = req.body;
    const newComp: CompetenceTemplate = {
      id: Date.now(),
      fiche_id: parseInt(fiche_id, 10),
      axe: axe || 'savoir_faire',
      name: name || 'Nouvelle Compétence',
      description: description || '',
      coefficient: parseFloat(coefficient) || 1
    };

    currentCompetenceTemplates.push(newComp);
    res.status(201).json(newComp);
  });

  app.put('/api/job-templates/competences/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const index = currentCompetenceTemplates.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Compétence introuvable' });

    currentCompetenceTemplates[index] = { ...currentCompetenceTemplates[index], ...req.body };
    res.json(currentCompetenceTemplates[index]);
  });

  app.delete('/api/job-templates/competences/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    currentCompetenceTemplates = currentCompetenceTemplates.filter(c => c.id !== id);
    res.json({ message: 'Compétence modèle supprimée' });
  });

  const launchDueCampaigns = async () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
    const dueCampaigns = currentCampagnes.filter(
      campaign => campaign.status === 'brouillon' && campaign.start_date <= today,
    );

    for (const campaign of dueCampaigns) {
      campaign.status = 'ouverte';
      const managers = currentUsers.filter(user => user.role === 'manager');
      const collaborators = currentUsers.filter(user => user.role === 'collaborateur');

      for (const manager of managers) {
        currentNotifications.unshift({
          id: currentNotifications.length + 1,
          user_id: manager.id,
          title: `Lancement automatique de campagne : ${campaign.name}`,
          message: `La campagne "${campaign.name}" est ouverte automatiquement à la date prévue. ${campaign.description} Consignes : ${campaign.regles_evaluations || ''}`,
          read: false,
          type: 'campaign_launch',
          created_at: today,
        });
      }

      for (const collaborator of collaborators) {
        const exists = currentEvaluations.some(
          evaluation => evaluation.campagne_id === campaign.id && evaluation.user_id === collaborator.id,
        );
        if (!exists) {
          const evaluation = await evaluationRepository.create({
            id: 0,
            campagne_id: campaign.id,
            campagne_name: campaign.name,
            user_id: collaborator.id,
            user_name: collaborator.name,
            user_avatar: '',
            user_category: collaborator.category,
            poste_name: collaborator.poste_name,
            filiale_name: collaborator.filiale_name,
            direction_name: collaborator.direction_name,
            manager_id: collaborator.manager_id || 0,
            manager_name: collaborator.manager_name || 'Manager non affecté',
            status: 'en_attente',
            score_savoir: 0,
            score_savoir_faire: 0,
            score_savoir_etre: 0,
            score_global: 0,
            competences: buildCompetencesForPoste(collaborator.poste_name, 0),
            besoins_formation: [],
            axes_developpement: [],
            objectifs: [],
          });
          currentEvaluations.unshift(evaluation);
        }
        currentNotifications.unshift({
          id: currentNotifications.length + 1,
          user_id: collaborator.id,
          title: `Lancement automatique de campagne : ${campaign.name}`,
          message: `La campagne "${campaign.name}" est ouverte à la date prévue. ${campaign.description} Vous pouvez maintenant remplir votre auto-évaluation.`,
          read: false,
          type: 'campaign_launch',
          created_at: today,
        });
      }

      currentAuditLogs.unshift({
        id: currentAuditLogs.length + 1,
        campagne_id: campaign.id,
        campagne_name: campaign.name,
        user_name: 'Planificateur automatique',
        action: `Lancement automatique à la date prévue et notification de ${managers.length} managers et ${collaborators.length} collaborateurs.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }
  };

  void launchDueCampaigns();
  const campaignScheduler = setInterval(() => void launchDueCampaigns(), 60_000);
  campaignScheduler.unref();
}
