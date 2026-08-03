import { 
  User, Filiale, Direction, Poste, FicheEvaluation, CompetenceTemplate, 
  Campagne, Evaluation, NotificationItem, NotificationConfig, AuditLog
} from '../types';

// Initial Mock Seed Data for Groupe Premium
export const filialesData: Filiale[] = [
  { id: 1, name: 'Groupe Premium - Casablanca (Siège)', city: 'Casablanca' },
  { id: 2, name: 'Groupe Premium - Agadir', city: 'Agadir' },
  { id: 3, name: 'Groupe Premium - Meknès', city: 'Meknès' },
  { id: 4, name: 'Groupe Premium - Kénitra', city: 'Kénitra' },
  { id: 5, name: 'Groupe Premium - Tanger', city: 'Tanger' },
];

export const directionsData: Direction[] = [
  { id: 1, name: 'Direction BTP & Infrastructure', code: 'BTP' },
  { id: 2, name: 'Direction Industrie & Équipements', code: 'IND' },
  { id: 3, name: 'Direction Transport & Logistique', code: 'TRP' },
  { id: 4, name: 'Direction Fourniture Industrielle', code: 'FIN' },
  { id: 5, name: 'Direction Capital Humain & RH', code: 'RH' },
  { id: 6, name: 'Direction Finance & Stratégie', code: 'FIN' },
];

export const postesData: Poste[] = [
  { id: 1, name: 'Chef de Projet BTP', direction_id: 1, fiche_id: 1 },
  { id: 2, name: 'Ingénieur Calcul Structure', direction_id: 1, fiche_id: 2 },
  { id: 3, name: 'Technicien Maintenance Industrielle', direction_id: 2, fiche_id: 3 },
  { id: 4, name: 'Responsable Exploitation Transport', direction_id: 3, fiche_id: 4 },
  { id: 5, name: 'Spécialiste Ventes Industrielles', direction_id: 4, fiche_id: 5 },
  { id: 6, name: 'Responsable Recrutement & Talent', direction_id: 5, fiche_id: 6 },
];

export const usersData: User[] = [
  {
    id: 1,
    name: 'Meriem Benjelloun',
    email: 'rh@groupepremium.ma',
    role: 'rh',
    poste_id: 6,
    poste_name: 'Directrice Capital Humain',
    filiale_id: 1,
    filiale_name: 'Casablanca (Siège)',
    direction_id: 5,
    direction_name: 'Direction Capital Humain & RH',
    avatar: '',
    category: 'Cadre'
  },
  {
    id: 2,
    name: 'Nabil Idrissi',
    email: 'nabil.idrissi@groupepremium.ma',
    role: 'manager',
    poste_id: 1,
    poste_name: 'Directeur Technique BTP',
    filiale_id: 1,
    filiale_name: 'Casablanca (Siège)',
    direction_id: 1,
    direction_name: 'Direction BTP & Infrastructure',
    avatar: '',
    category: 'Manager'
  },
  {
    id: 3,
    name: 'Youssef Chraibi',
    email: 'youssef.chraibi@groupepremium.ma',
    role: 'manager',
    poste_id: 3,
    poste_name: 'Manager Usine & Maintenance',
    filiale_id: 2,
    filiale_name: 'Agadir',
    direction_id: 2,
    direction_name: 'Direction Industrie & Équipements',
    avatar: '',
    category: 'Manager'
  },
  {
    id: 4,
    name: 'Salma El Amrani',
    email: 'salma.elamrani@groupepremium.ma',
    role: 'manager',
    poste_id: 4,
    poste_name: 'Manager Hub Logistique',
    filiale_id: 5,
    filiale_name: 'Tanger',
    direction_id: 3,
    direction_name: 'Direction Transport & Logistique',
    avatar: '',
    category: 'Manager'
  },
  {
    id: 5,
    name: 'Karim Berrada',
    email: 'karim.berrada@groupepremium.ma',
    role: 'manager',
    poste_id: 5,
    poste_name: 'Responsable Agence',
    filiale_id: 4,
    filiale_name: 'Kénitra',
    direction_id: 4,
    direction_name: 'Direction Fourniture Industrielle',
    avatar: '',
    category: 'Manager'
  },
  {
    id: 6,
    name: 'Amine Tazi',
    email: 'amine.tazi@groupepremium.ma',
    role: 'collaborateur',
    poste_id: 2,
    poste_name: 'Ingénieur BTP Senior',
    filiale_id: 1,
    filiale_name: 'Casablanca (Siège)',
    direction_id: 1,
    direction_name: 'Direction BTP & Infrastructure',
    manager_id: 2,
    manager_name: 'Nabil Idrissi',
    avatar: '',
    category: 'Cadre'
  },
  {
    id: 7,
    name: 'Hind Loudiyi',
    email: 'hind.loudiyi@groupepremium.ma',
    role: 'collaborateur',
    poste_id: 1,
    poste_name: 'Chef de Projet BTP',
    filiale_id: 1,
    filiale_name: 'Casablanca (Siège)',
    direction_id: 1,
    direction_name: 'Direction BTP & Infrastructure',
    manager_id: 2,
    manager_name: 'Nabil Idrissi',
    avatar: '',
    category: 'Cadre'
  },
  {
    id: 8,
    name: 'Omar Fassi',
    email: 'omar.fassi@groupepremium.ma',
    role: 'collaborateur',
    poste_id: 3,
    poste_name: 'Technicien Maintenance',
    filiale_id: 2,
    filiale_name: 'Agadir',
    direction_id: 2,
    direction_name: 'Direction Industrie & Équipements',
    manager_id: 3,
    manager_name: 'Youssef Chraibi',
    avatar: '',
    category: 'Technicien'
  },
  {
    id: 9,
    name: 'Sofia Benbrahim',
    email: 'sofia.benbrahim@groupepremium.ma',
    role: 'collaborateur',
    poste_id: 4,
    poste_name: 'Superviseur Flotte Transport',
    filiale_id: 5,
    filiale_name: 'Tanger',
    direction_id: 3,
    direction_name: 'Direction Transport & Logistique',
    manager_id: 4,
    manager_name: 'Salma El Amrani',
    avatar: '',
    category: 'Cadre'
  },
  {
    id: 10,
    name: 'Mehdi Alaoui',
    email: 'mehdi.alaoui@groupepremium.ma',
    role: 'collaborateur',
    poste_id: 5,
    poste_name: 'Spécialiste Technico-Commercial',
    filiale_id: 4,
    filiale_name: 'Kénitra',
    direction_id: 4,
    direction_name: 'Direction Fourniture Industrielle',
    manager_id: 5,
    manager_name: 'Karim Berrada',
    avatar: '',
    category: 'Cadre'
  },
  {
    id: 11,
    name: 'Zineb Filali',
    email: 'zineb.filali@groupepremium.ma',
    role: 'collaborateur',
    poste_id: 3,
    poste_name: 'Technicienne Automatisme',
    filiale_id: 3,
    filiale_name: 'Meknès',
    direction_id: 2,
    direction_name: 'Direction Industrie & Équipements',
    manager_id: 3,
    manager_name: 'Youssef Chraibi',
    avatar: '',
    category: 'Technicien'
  },
  {
    id: 12,
    name: 'Hassan El Fassi',
    email: 'dg@groupepremium.ma',
    role: 'dg',
    poste_id: 1,
    poste_name: 'Directeur Général Groupe',
    filiale_id: 1,
    filiale_name: 'Casablanca (Siège)',
    direction_id: 6,
    direction_name: 'Direction Finance & Stratégie',
    avatar: '',
    category: 'Cadre'
  }
];

export const fichesEvaluationData: FicheEvaluation[] = [
  { id: 1, name: 'Grille Fiche de Poste - Chef de Projet BTP', poste_id: 1, poste_name: 'Chef de Projet BTP', description: 'Évaluation des compétences de pilotage de chantiers, sécurité BTP et gestion budgétaire.', updated_at: '2025-01-10' },
  { id: 2, name: 'Grille Fiche de Poste - Ingénieur Structure', poste_id: 2, poste_name: 'Ingénieur Calcul Structure', description: 'Calculs de résistance, modélisation BIM et conformité Eurocodes/RPS2011.', updated_at: '2025-01-10' },
  { id: 3, name: 'Grille Fiche de Poste - Technicien Maintenance', poste_id: 3, poste_name: 'Technicien Maintenance Industrielle', description: 'Diagnostics, maintenance préventive/curative des machines d\'emballage et lignes lourdes.', updated_at: '2025-01-12' },
  { id: 4, name: 'Grille Fiche de Poste - Responsable Transport', poste_id: 4, poste_name: 'Responsable Exploitation Transport', description: 'Gestion de flotte, optimisation des trajets routiers et sécurité transport.', updated_at: '2025-01-12' },
  { id: 5, name: 'Grille Fiche de Poste - Ventes Industrielles', poste_id: 5, poste_name: 'Spécialiste Ventes Industrielles', description: 'Prospections B2B, chiffrages techniques et négociation de gros matériels.', updated_at: '2025-01-15' },
];

export const competencesTemplatesData: CompetenceTemplate[] = [
  // Fiche 1: BTP
  { id: 101, fiche_id: 1, axe: 'savoir', name: 'Normes BTP & Sécurité HSE Maroc', description: 'Maîtrise des réglementations BTP (RPS2011, Code du Travail) et normes environnementales.', coefficient: 1 },
  { id: 102, fiche_id: 1, axe: 'savoir', name: 'Gestion Contractuelle & Marchés Publics', description: 'Connaissance des clauses CCAG, dossiers d\'appel d\'offres et décomptes.', coefficient: 1 },
  { id: 103, fiche_id: 1, axe: 'savoir_faire', name: 'Pilotage de Chantier & Planning MS Project', description: 'Supervision de l\'avancement des travaux, gestion des sous-traitants et délais.', coefficient: 2 },
  { id: 104, fiche_id: 1, axe: 'savoir_faire', name: 'Gestion du Budget & Suivi des Coûts', description: 'Maîtrise du budget de chantier, contrôle du coût de revient et écarts.', coefficient: 2 },
  { id: 105, fiche_id: 1, axe: 'savoir_faire', name: 'Contrôle Qualité & Réception de Travaux', description: 'Vérification de la conformité des matériaux et essais béton/acier.', coefficient: 1 },
  { id: 106, fiche_id: 1, axe: 'savoir_etre', name: 'Leadership & Animation d\'Équipe Chantier', description: 'Capacité à mobiliser les équipes terrain et maintenir la rigueur.', coefficient: 1.5 },
  { id: 107, fiche_id: 1, axe: 'savoir_etre', name: 'Gestion du Stress & Résolution de Crises', description: 'Réactivité face aux imprévus de chantier et négociations sous pression.', coefficient: 1.5 },

  // Fiche 3: Industrie
  { id: 301, fiche_id: 3, axe: 'savoir', name: 'Électromécanique & Automatisme PLC', description: 'Schémas électriques, automates Siemens/Schneider et hydraulique.', coefficient: 1 },
  { id: 302, fiche_id: 3, axe: 'savoir', name: 'Méthodologie GMAO & Diagnostic', description: 'Utilisation du logiciel de maintenance et suivi des indicateurs MTBF/MTTR.', coefficient: 1 },
  { id: 303, fiche_id: 3, axe: 'savoir_faire', name: 'Intervention Rapide Curative', description: 'Dépannage efficace des arrêts de ligne sous contraintes de production.', coefficient: 2 },
  { id: 304, fiche_id: 3, axe: 'savoir_faire', name: 'Plan de Maintenance Préventive', description: 'Exécution rigoureuse des gammes de contrôle et graissage.', coefficient: 2 },
  { id: 305, fiche_id: 3, axe: 'savoir_etre', name: 'Rigueur & Respect des Consignes Sécurité', description: 'Port des EPI, consignation LOTO et discipline atelier.', coefficient: 1.5 },
  { id: 306, fiche_id: 3, axe: 'savoir_etre', name: 'Esprit d\'Équipe & Entraide', description: 'Communication fluide avec la production et transfert de compétences.', coefficient: 1.5 }
];

export const campagnesData: Campagne[] = [
  {
    id: 1,
    name: 'Campagne Annuelle de Performance 2025',
    description: 'Évaluation annuelle de l\'ensemble des collaborateurs du Groupe Premium (Casablanca, Agadir, Tanger, Meknès, Kénitra).',
    year: 2025,
    start_date: '2025-01-15',
    auto_eval_deadline: '2025-02-15',
    manager_eval_deadline: '2025-03-15',
    dg_validation_deadline: '2025-03-25',
    end_date: '2025-03-31',
    status: 'brouillon',
    filiales: ['Casablanca (Siège)', 'Agadir', 'Meknès', 'Kénitra', 'Tanger'],
    directions: ['Direction BTP & Infrastructure', 'Direction Industrie & Équipements', 'Direction Transport & Logistique', 'Direction Fourniture Industrielle'],
    categories: ['Cadre', 'Manager', 'Technicien', 'Agent'],
    total_collaborateurs: 6,
    total_managers: 4,
    total_dgs: 1,
    progress: 45,
    regles_evaluations: '1. Évaluation factuelle basée sur les réalisations de chantiers.\n2. Respect impératif de la pondération : Savoir 20%, Savoir-faire 50%, Savoir-être 30%.\n3. Entretien individuel obligatoire d\'au moins 45 minutes.\n4. Identification systématique d\'au moins un besoin de formation ou axe de développement.',
    managers_informes: ['Nabil Idrissi', 'Youssef Chraibi', 'Salma El Amrani', 'Karim Berrada'],
    created_at: '2025-01-10'
  },
  {
    id: 2,
    name: 'Revue de Performance Groupe 2024',
    description: 'Campagne clôturée de l\'exercice 2024 avec consolidation globale des objectifs.',
    year: 2024,
    start_date: '2024-01-10',
    auto_eval_deadline: '2024-02-10',
    manager_eval_deadline: '2024-03-10',
    dg_validation_deadline: '2024-03-20',
    end_date: '2024-03-31',
    status: 'cloturee',
    filiales: ['Casablanca (Siège)', 'Agadir', 'Tanger'],
    directions: ['Direction BTP & Infrastructure', 'Direction Industrie & Équipements', 'Direction Transport & Logistique'],
    categories: ['Cadre', 'Manager', 'Technicien'],
    total_collaborateurs: 180,
    total_managers: 24,
    total_dgs: 1,
    progress: 100,
    created_at: '2024-01-05'
  },
  {
    id: 3,
    name: 'Campagne d\'Évaluation 2023',
    description: 'Campagne archivée de l\'année 2023.',
    year: 2023,
    start_date: '2023-01-10',
    auto_eval_deadline: '2023-02-10',
    manager_eval_deadline: '2023-03-10',
    dg_validation_deadline: '2023-03-20',
    end_date: '2023-03-31',
    status: 'archivee',
    filiales: ['Casablanca (Siège)', 'Agadir', 'Tanger', 'Meknès'],
    directions: ['Direction BTP & Infrastructure', 'Direction Industrie & Équipements'],
    categories: ['Cadre', 'Manager'],
    total_collaborateurs: 150,
    total_managers: 20,
    total_dgs: 1,
    progress: 100,
    created_at: '2023-01-05'
  }
];

export const evaluationsData: Evaluation[] = [
  // 1. Amine Tazi (Collaborateur Casablanca - Manager Nabil Idrissi)
  {
    id: 1,
    campagne_id: 1,
    campagne_name: 'Campagne Annuelle de Performance 2025',
    user_id: 6,
    user_name: 'Amine Tazi',
    user_avatar: '',
    user_category: 'Cadre',
    poste_name: 'Ingénieur BTP Senior',
    filiale_name: 'Casablanca (Siège)',
    direction_name: 'Direction BTP & Infrastructure',
    manager_id: 2,
    manager_name: 'Nabil Idrissi',
    interview_date: '2025-02-18',
    status: 'en_cours_manager',
    score_savoir: 85,
    score_savoir_faire: 88,
    score_savoir_etre: 80,
    score_global: 85, // (85*0.2) + (88*0.5) + (80*0.3) = 17 + 44 + 24 = 85
    summary_comment: 'Excellente maîtrise des projets BTP majeurs cette année. Très bon contrôle budgétaire sur le chantier de la Marina Casablanca.',
    competences: [
      { id: 1, evaluation_id: 1, axe: 'savoir', name: 'Normes BTP & Sécurité HSE Maroc', description: 'RPS2011 & Sécurité chantier', coefficient: 1, score: 85, comment: 'Très bien assimilé' },
      { id: 2, evaluation_id: 1, axe: 'savoir', name: 'Gestion Contractuelle CCAG', description: 'Procédures marchés', coefficient: 1, score: 85, comment: 'Bonne rigueur' },
      { id: 3, evaluation_id: 1, axe: 'savoir_faire', name: 'Pilotage de Chantier MS Project', description: 'Respect du plannification', coefficient: 2, score: 90, comment: 'Livraison dans les temps' },
      { id: 4, evaluation_id: 1, axe: 'savoir_faire', name: 'Gestion du Budget & Coûts', description: 'Marge opérationnelle', coefficient: 2, score: 86, comment: 'Écarts maîtrisés' },
      { id: 5, evaluation_id: 1, axe: 'savoir_faire', name: 'BIM & Modélisation Revit 3D', description: 'Compétence ajoutée par le manager', coefficient: 1, score: 88, comment: 'Bonne intégration' },
      { id: 6, evaluation_id: 1, axe: 'savoir_etre', name: 'Leadership & Animation d\'Équipe', description: 'Management terrain', coefficient: 1.5, score: 80, comment: 'Communication fluide' },
      { id: 7, evaluation_id: 1, axe: 'savoir_etre', name: 'Gestion de Crise Chantier', description: 'Résolution des conflits sous-traitants', coefficient: 1.5, score: 80, comment: 'À renforcer' }
    ],
    auto_evaluation: {
      id: 1,
      evaluation_id: 1,
      user_id: 6,
      balance: 'Inauguration et livraison réussie du lot Gros Œuvre pour le projet hôtelier de Casablanca.',
      achievements: 'Respect strict des coûts avec une économie de 4% sur l\'approvisionnement béton et zéro incident de travail HSE.',
      difficulties: 'Retards d\'approvisionnement d\'acier importé en Q2 nécessitant des réorganisations urgentes.',
      aspirations: 'Souhaite évoluer vers le poste de Directeur de Projet BTP et suivre une certification PMP.',
      submitted_at: '2025-02-02'
    },
    besoins_formation: [
      { id: 1, evaluation_id: 1, title: 'Certification PMP (Project Management Professional)', description: 'Perfectionnement en gestion de projet internationale et gestion des risques.', priority: 'Haute', comment: 'Indispensable pour les futurs méga-projets' },
      { id: 2, evaluation_id: 1, title: 'Formation BIM Management Niveau 2', description: 'Maîtrise complète de la coordination 3D Revit.', priority: 'Moyenne', comment: 'Demandé pour les appels d\'offres 2025' }
    ],
    axes_developpement: [
      { id: 1, evaluation_id: 1, domain: 'Management & Leadership', objective: 'Développer l\'autonomie des chefs de chantier junior.', comment: 'Organiser des réunions hebdomadaires d\'accompagnement' }
    ],
    objectifs: [
      { id: 1, evaluation_id: 1, title: 'Réduction des coûts de non-qualité de 5%', description: 'Sur le chantier BTP de Mohammedia', target_date: '2024-12-31', progress: 100, status: 'Atteint', is_next_year: false },
      { id: 2, evaluation_id: 1, title: 'Mise en place de la démarche Lean Construction', description: 'Déployer les outils Last Planner System sur 2 nouveaux chantiers BTP', target_date: '2025-11-30', progress: 15, status: 'En cours', is_next_year: true }
    ]
  },

  // 2. Hind Loudiyi (Collaborateur Casablanca - Manager Nabil Idrissi)
  {
    id: 2,
    campagne_id: 1,
    campagne_name: 'Campagne Annuelle de Performance 2025',
    user_id: 7,
    user_name: 'Hind Loudiyi',
    user_avatar: '',
    user_category: 'Cadre',
    poste_name: 'Chef de Projet BTP',
    filiale_name: 'Casablanca (Siège)',
    direction_name: 'Direction BTP & Infrastructure',
    manager_id: 2,
    manager_name: 'Nabil Idrissi',
    interview_date: '2025-02-22',
    status: 'soumis_dg',
    score_savoir: 90,
    score_savoir_faire: 92,
    score_savoir_etre: 88,
    score_global: 90.4, // (90*0.2) + (92*0.5) + (88*0.3) = 18 + 46 + 26.4 = 90.4
    summary_comment: 'Résultats exceptionnels. Leadership reconnu et gestion exemplaire du projet de Kénitra.',
    competences: [
      { id: 10, evaluation_id: 2, axe: 'savoir', name: 'Normes BTP & Sécurité HSE Maroc', description: 'Excellente maîtrise', coefficient: 1, score: 90 },
      { id: 11, evaluation_id: 2, axe: 'savoir_faire', name: 'Pilotage de Chantier MS Project', description: 'Anticipation des jalons', coefficient: 2, score: 92 },
      { id: 12, evaluation_id: 2, axe: 'savoir_etre', name: 'Leadership & Animation d\'Équipe', description: 'Excellente cohésion', coefficient: 1.5, score: 88 }
    ],
    auto_evaluation: {
      id: 2,
      evaluation_id: 2,
      user_id: 7,
      balance: 'Exécution parfaite des livrables de la phase 1 du projet infrastructure BTP.',
      achievements: 'Obtention de la certification ISO 45001 sur le chantier test.',
      difficulties: 'Complexité des autorisations administratives.',
      aspirations: 'Prendre la direction du département Qualité BTP.',
      submitted_at: '2025-02-01'
    },
    besoins_formation: [
      { id: 3, evaluation_id: 2, title: 'Audit Sécurité HSE Avancé', description: 'Certification auditeur ISO', priority: 'Haute' }
    ],
    axes_developpement: [
      { id: 2, evaluation_id: 2, domain: 'Management Stratégique', objective: 'Participer aux comités de pilotage Groupe', comment: 'Proposé par Nabil Idrissi' }
    ],
    objectifs: [
      { id: 3, evaluation_id: 2, title: 'Déploiement RSE sur chantiers', description: 'Zero déchet plastique sur site', target_date: '2025-10-15', progress: 30, status: 'En cours', is_next_year: true }
    ]
  },

  // 3. Omar Fassi (Collaborateur Agadir - Manager Youssef Chraibi)
  {
    id: 3,
    campagne_id: 1,
    campagne_name: 'Campagne Annuelle de Performance 2025',
    user_id: 8,
    user_name: 'Omar Fassi',
    user_avatar: '',
    user_category: 'Technicien',
    poste_name: 'Technicien Maintenance',
    filiale_name: 'Agadir',
    direction_name: 'Direction Industrie & Équipements',
    manager_id: 3,
    manager_name: 'Youssef Chraibi',
    interview_date: '2025-02-20',
    status: 'auto_eval_terminee',
    score_savoir: 75,
    score_savoir_faire: 78,
    score_savoir_etre: 82,
    score_global: 78.6,
    summary_comment: 'Technicien consciencieux. Entretien en cours de finalisation.',
    competences: [
      { id: 20, evaluation_id: 3, axe: 'savoir', name: 'Électromécanique & Automatisme', description: 'Dépannages usine Agadir', coefficient: 1, score: 75 },
      { id: 21, evaluation_id: 3, axe: 'savoir_faire', name: 'Intervention Rapide Curative', description: 'Temps de réponse réduit', coefficient: 2, score: 78 },
      { id: 22, evaluation_id: 3, axe: 'savoir_etre', name: 'Rigueur & Respect des Consignes', description: 'Ponctualité et sûreté', coefficient: 1.5, score: 82 }
    ],
    auto_evaluation: {
      id: 3,
      evaluation_id: 3,
      user_id: 8,
      balance: 'Réduction du taux de panne des concasseurs de 12% sur le site d\'Agadir.',
      achievements: 'Mise en place d\'une réserve de pièces d\'usure à fort roulement.',
      difficulties: 'Manque de pièces de rechange d\'origine lors de la période d\'août.',
      aspirations: 'Devenir Chef d\'Équipe Maintenance Usine.',
      submitted_at: '2025-02-05'
    },
    besoins_formation: [
      { id: 4, evaluation_id: 3, title: 'Habilitation Électrique Haute Tension (HTA)', description: 'Normes de consignation industrielle', priority: 'Haute' }
    ],
    axes_developpement: [],
    objectifs: []
  },

  // 4. Sofia Benbrahim (Collaborateur Tanger - Manager Salma El Amrani)
  {
    id: 4,
    campagne_id: 1,
    campagne_name: 'Campagne Annuelle de Performance 2025',
    user_id: 9,
    user_name: 'Sofia Benbrahim',
    user_avatar: '',
    user_category: 'Cadre',
    poste_name: 'Superviseur Flotte Transport',
    filiale_name: 'Tanger',
    direction_name: 'Direction Transport & Logistique',
    manager_id: 4,
    manager_name: 'Salma El Amrani',
    interview_date: '2025-02-25',
    status: 'valide',
    score_savoir: 92,
    score_savoir_faire: 94,
    score_savoir_etre: 90,
    score_global: 92.4,
    summary_comment: 'Évaluation validée par le Directeur Général. Bilan exceptionnel à Tanger Med.',
    validated_at_dg: '2025-02-26',
    dg_comment: 'Félicitations pour l\'optimisation de la flotte routière Nord.',
    competences: [
      { id: 30, evaluation_id: 4, axe: 'savoir', name: 'Réglementation Transport Routier & Douanes', description: 'Procédure Tanger Med', coefficient: 1, score: 92 },
      { id: 31, evaluation_id: 4, axe: 'savoir_faire', name: 'Optimisation des Rotations de Camions', description: 'Baisse consommation carburant', coefficient: 2, score: 94 },
      { id: 32, evaluation_id: 4, axe: 'savoir_etre', name: 'Réactivité & Rigueur Logistique', description: 'Gestion des imprévus portuaires', coefficient: 1.5, score: 90 }
    ],
    auto_evaluation: {
      id: 4,
      evaluation_id: 4,
      user_id: 9,
      balance: 'Augmentation du taux de remplissage des camions à 94% sur l\'axe Tanger-Casablanca.',
      achievements: 'Baisse de la facture carburant de 6.5% grâce à la télématique embarquée.',
      difficulties: 'Engorgements aux terminaux lors des pics d\'export.',
      aspirations: 'Prendre la responsabilité logistique multi-sites.',
      submitted_at: '2025-01-28'
    },
    besoins_formation: [
      { id: 5, evaluation_id: 4, title: 'Gestion de Supply Chain Internationale', description: 'Logistique multimodale maritime/routier', priority: 'Moyenne' }
    ],
    axes_developpement: [],
    objectifs: []
  },

  // 5. Mehdi Alaoui (Collaborateur Kénitra - Manager Karim Berrada)
  {
    id: 5,
    campagne_id: 1,
    campagne_name: 'Campagne Annuelle de Performance 2025',
    user_id: 10,
    user_name: 'Mehdi Alaoui',
    user_avatar: '',
    user_category: 'Cadre',
    poste_name: 'Spécialiste Technico-Commercial',
    filiale_name: 'Kénitra',
    direction_name: 'Direction Fourniture Industrielle',
    manager_id: 5,
    manager_name: 'Karim Berrada',
    status: 'en_attente',
    score_savoir: 0,
    score_savoir_faire: 0,
    score_savoir_etre: 0,
    score_global: 0,
    competences: [
      { id: 40, evaluation_id: 5, axe: 'savoir', name: 'Connaissance Produits & Gamme Groupe', description: 'Catroux, roulements, outillage', coefficient: 1, score: 0 },
      { id: 41, evaluation_id: 5, axe: 'savoir_faire', name: 'Négociation Ventes B2B', description: 'Portefeuille clients zone Kénitra-Gharb', coefficient: 2, score: 0 },
      { id: 42, evaluation_id: 5, axe: 'savoir_etre', name: 'Sens Commercial & Relation Client', description: 'Fidélisation', coefficient: 1.5, score: 0 }
    ],
    besoins_formation: [],
    axes_developpement: [],
    objectifs: []
  },

  // 6. Zineb Filali (Collaborateur Meknès - Manager Youssef Chraibi)
  {
    id: 6,
    campagne_id: 1,
    campagne_name: 'Campagne Annuelle de Performance 2025',
    user_id: 11,
    user_name: 'Zineb Filali',
    user_avatar: '',
    user_category: 'Technicien',
    poste_name: 'Technicienne Automatisme',
    filiale_name: 'Meknès',
    direction_name: 'Direction Industrie & Équipements',
    manager_id: 3,
    manager_name: 'Youssef Chraibi',
    status: 'en_attente',
    score_savoir: 0,
    score_savoir_faire: 0,
    score_savoir_etre: 0,
    score_global: 0,
    competences: [
      { id: 50, evaluation_id: 6, axe: 'savoir', name: 'Programmation Automates & Capteurs', description: 'Logiciels TIA Portal & Omron', coefficient: 1, score: 0 },
      { id: 51, evaluation_id: 6, axe: 'savoir_faire', name: 'Mise en Service des Lignes Industrielles', description: 'Usine de Meknès', coefficient: 2, score: 0 },
      { id: 52, evaluation_id: 6, axe: 'savoir_etre', name: 'Autonomie & Analyse Méthodique', description: 'Recherche de pannes', coefficient: 1.5, score: 0 }
    ],
    besoins_formation: [],
    axes_developpement: [],
    objectifs: []
  }
];

export const notificationsConfigData: NotificationConfig[] = [
  { id: '1', type: 'ouverture_campagne', label: 'Ouverture de Campagne', description: 'Notifier automatiquement les managers et collaborateurs au lancement d\'une nouvelle campagne.', enabled: true, frequency: 'Immédiat' },
  { id: '2', type: 'relances_automatiques', label: 'Relances Automatiques', description: 'Rappels automatiques par email/notification pour les retards d\'auto-évaluation et d\'entretien manager.', enabled: true, frequency: 'Tous les 3 jours' },
  { id: '3', type: 'validation_evaluations', label: 'Validation des Évaluations', description: 'Informer le manager et la RH dès la validation ou le renvoi d\'un dossier par la Direction Générale.', enabled: true, frequency: 'Immédiat' },
  { id: '4', type: 'cloture_campagne', label: 'Clôture de Campagne', description: 'Envoi d\'un rapport récapitulatif aux membres de la RH et de la DG lors de la clôture.', enabled: true, frequency: 'À la clôture' },
];

export const auditLogsData: AuditLog[] = [
  { id: 1, campagne_id: 1, campagne_name: 'Campagne Annuelle de Performance 2025', user_name: 'Meriem Benjelloun (RH)', action: 'Lancement officiel de la campagne pour toutes les filiales', timestamp: '2025-01-15 09:00:00' },
  { id: 2, campagne_id: 1, campagne_name: 'Campagne Annuelle de Performance 2025', user_name: 'Amine Tazi', action: 'Soumission de l\'auto-évaluation', timestamp: '2025-02-02 14:32:10' },
  { id: 3, campagne_id: 1, campagne_name: 'Campagne Annuelle de Performance 2025', user_name: 'Nabil Idrissi (Manager)', action: 'Évaluation manager complétée pour Hind Loudiyi', timestamp: '2025-02-22 16:15:00' },
  { id: 4, campagne_id: 1, campagne_name: 'Campagne Annuelle de Performance 2025', user_name: 'Hassan El Fassi (DG)', action: 'Validation de l\'évaluation de Sofia Benbrahim', timestamp: '2025-02-26 11:05:00' }
];

export const notificationsData: NotificationItem[] = [
  { id: 1, user_id: 2, title: 'Nouvelle Campagne Lanchée', message: 'La Campagne Annuelle de Performance 2025 est ouverte. Vous avez 2 collaborateurs à évaluer.', read: false, type: 'campaign', created_at: '2025-01-15' },
  { id: 2, user_id: 6, title: 'Rappel Auto-Évaluation', message: 'N\'oubliez pas de finaliser votre auto-évaluation avant la date limite.', read: true, type: 'reminder', created_at: '2025-01-25' },
  { id: 3, user_id: 12, title: 'Dossier à Valider', message: 'L\'évaluation de Hind Loudiyi est en attente de votre validation.', read: false, type: 'dg_validation', created_at: '2025-02-22' }
];
