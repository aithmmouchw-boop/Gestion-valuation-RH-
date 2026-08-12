export type UserRole = 'rh' | 'manager' | 'collaborateur' | 'dg';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  poste_id: number;
  poste_name: string;
  filiale_id: number;
  filiale_name: string; // Casablanca, Agadir, Meknès, Kénitra, Tanger
  direction_id: number;
  direction_name: string; // Direction BTP, Direction Industrie, etc.
  manager_id?: number;
  manager_name?: string;
  avatar: string;
  category: 'Employé' | 'Technicien' | 'Agent' | 'Cadre' | 'Cadre dirigeant' | 'Manager';
  must_change_password?: boolean;
}

export interface Filiale {
  id: number;
  name: string;
  city: string;
}

export interface Direction {
  id: number;
  name: string;
  code: string;
}

export interface Poste {
  id: number;
  name: string;
  direction_id: number;
  fiche_id?: number;
}

export interface FicheEvaluation {
  id: number;
  name: string;
  poste_id: number;
  poste_name: string;
  description: string;
  updated_at: string;
}

export type AxeType = 'savoir' | 'savoir_faire' | 'savoir_etre';

export interface CompetenceTemplate {
  id: number;
  fiche_id: number;
  axe: AxeType;
  name: string;
  description: string;
  coefficient: number;
}

export type CampagneStatus = 'brouillon' | 'ouverte' | 'en_cours' | 'cloturee' | 'archivee';

export interface Campagne {
  id: number;
  name: string;
  description: string;
  year: number;
  start_date: string;
  auto_eval_deadline: string;
  manager_eval_deadline: string;
  dg_validation_deadline: string;
  end_date: string;
  status: CampagneStatus;
  filiales: string[];
  directions: string[];
  categories: string[];
  total_collaborateurs: number;
  total_managers: number;
  total_dgs: number;
  progress: number;
  regles_evaluations?: string;
  managers_informes?: string[];
  created_at: string;
}

export type EvaluationStatus = 
  | 'en_attente' 
  | 'auto_eval_terminee' 
  | 'en_cours_manager' 
  | 'soumis_dg' 
  | 'dg_validee'
  | 'valide' 
  | 'signee'
  | 'a_corriger'
  | 'correction_a_confirmer';

export interface EvaluationCompetence {
  id: number;
  evaluation_id: number;
  competence_id?: number;
  axe: AxeType;
  name: string;
  description: string;
  coefficient: number;
  score: number; // Score out of 10 or 100
  comment?: string;
}

export interface AutoEvaluation {
  id: number;
  evaluation_id: number;
  user_id: number;
  balance: string; // Bilan de l'année
  achievements: string; // Réalisations clés
  difficulties: string; // Difficultés rencontrées
  aspirations: string; // Aspirations professionnelles
  ratings?: Record<string, 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'C' | 'D'>;
  comments?: Record<string, string>;
  submitted_at?: string;
}

export interface BesoinFormation {
  id: number;
  evaluation_id: number;
  title: string;
  description: string;
  priority: 'Haute' | 'Moyenne' | 'Basse';
  comment?: string;
}

export interface AxeDeveloppement {
  id: number;
  evaluation_id: number;
  domain: string;
  objective: string;
  comment?: string;
}

export interface Objectif {
  id: number;
  evaluation_id: number;
  title: string;
  description: string;
  target_date: string;
  progress: number; // 0-100
  status: 'Non débuté' | 'En cours' | 'Atteint' | 'Partiellement atteint' | 'Dépassé';
  is_next_year: boolean;
}

export interface Evaluation {
  id: number;
  campagne_id: number;
  campagne_name: string;
  user_id: number;
  user_name: string;
  user_avatar: string;
  user_category: string;
  poste_name: string;
  filiale_name: string;
  direction_name: string;
  manager_id: number;
  manager_name: string;
  interview_date?: string;
  interview_message?: string;
  interview_status?: 'a_planifier' | 'planifie' | 'realise' | 'reporte' | 'annule';
  interview_followup_date?: string;
  interview_followup_comment?: string;
  status: EvaluationStatus;
  score_savoir: number; // calculated 0-100
  score_savoir_faire: number; // calculated 0-100
  score_savoir_etre: number; // calculated 0-100
  score_global: number; // weighted: 20% Savoir + 50% Savoir-faire + 30% Savoir-être
  synthesis_points_forts?: string;
  synthesis_points_ameliorer?: string;
  synthesis_developpement?: string;
  mobility_request?: string;
  summary_comment?: string;
  signed_at_user?: string;
  validated_at_dg?: string;
  dg_comment?: string;
  manager_correction_submitted_at?: string;
  correction_confirmed_at?: string;
  competences: EvaluationCompetence[];
  auto_evaluation?: AutoEvaluation;
  besoins_formation: BesoinFormation[];
  axes_developpement: AxeDeveloppement[];
  objectifs: Objectif[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: boolean;
  type: string;
  channel?: 'platform' | 'email';
  link_url?: string;
  created_at: string;
}

export interface NotificationConfig {
  id: string;
  type: string;
  label: string;
  description: string;
  enabled: boolean;
  frequency: string;
}

export interface AuditLog {
  id: number;
  campagne_id: number;
  campagne_name: string;
  user_name: string;
  action: string;
  timestamp: string;
}

export interface DashboardKPIs {
  globalProgress: number;
  totalEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  validatedEvaluations: number;
  managerDelays: { manager_name: string; direction: string; late_count: number; total_count: number }[];
  filialeAverages: { filiale: string; average: number; evaluated: number; total: number }[];
  directionAverages: { direction: string; average: number; evaluated: number; total: number }[];
  familyAverages: { family: string; average: number; evaluated: number; total: number }[];
  functionAverages: { function: string; average: number; evaluated: number; total: number }[];
  axisAverages: { axis: string; weight: string; score: number }[];
  scoreDistribution: { range: string; count: number }[];
  topCompetencies: { name: string; axe: string; score: number }[];
  weakCompetencies: { name: string; axe: string; score: number }[];
  trainingNeedsSummary: { category: string; count: number; highPriority: number }[];
}
