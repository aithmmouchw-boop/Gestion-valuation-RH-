import { 
  User, UserRole, Campagne, Evaluation, DashboardKPIs, 
  NotificationConfig, NotificationItem, AuditLog 
} from '../types';

let authToken = localStorage.getItem('gp_token');

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('gp_token', token);
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('gp_token');
};

export const getAuthToken = () => authToken;

const parseApiResponse = (text: string) => {
  const clean = text.trim();
  if (!clean) return {};
  try {
    return JSON.parse(clean);
  } catch {
    const firstObject = clean.indexOf('{');
    const firstArray = clean.indexOf('[');
    const startCandidates = [firstObject, firstArray].filter(index => index >= 0);
    const start = startCandidates.length ? Math.min(...startCandidates) : -1;
    if (start < 0) throw new Error(clean);

    for (let end = clean.length; end > start; end -= 1) {
      const candidate = clean.slice(start, end).trim();
      try {
        return JSON.parse(candidate);
      } catch {
        // Continue until the valid JSON fragment is found.
      }
    }
    throw new Error(clean);
  }
};

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(endpoint, { ...options, headers });
  const responseText = await response.text();
  const data = parseApiResponse(responseText);
  if (!response.ok) {
    throw new Error(data.error || `Erreur API: ${response.statusText}`);
  }
  return data;
};

export const apiClient = {
  // Auth
  login: async (email?: string, role?: UserRole, password?: string): Promise<{ token: string; user: User }> => {
    const res = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role, password })
    });
    setAuthToken(res.token);
    return res;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await fetchApi('/api/auth/me');
    return res.user || res;
  },

  switchRole: async (role: UserRole): Promise<User> => {
    const res = await apiClient.login(undefined, role, 'demo1234');
    return res.user;
  },

  getUsers: async (params?: Record<string, string>): Promise<User[]> => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/users${query ? `?${query}` : ''}`);
  },

  createUser: async (data: Partial<User>): Promise<{ message: string; email_sent: boolean; user: User }> => {
    return fetchApi('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string; user?: User }> => {
    return fetchApi('/api/auth/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    return fetchApi(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteUser: async (id: number) => {
    return fetchApi(`/api/users/${id}`, { method: 'DELETE' });
  },

  resendUserInvitation: async (id: number): Promise<{ message: string }> => {
    return fetchApi(`/api/users/${id}/resend-invitation`, { method: 'POST' });
  },

  getDirections: async () => {
    return fetchApi('/api/directions');
  },

  createDirection: async (data: { name: string; code?: string }) => {
    return fetchApi('/api/directions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getFiliales: async () => {
    return fetchApi('/api/filiales');
  },

  getPostes: async () => {
    return fetchApi('/api/postes');
  },

  createFiliale: async (data: { name?: string; city: string }) => {
    return fetchApi('/api/filiales', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // RH KPIs
  getKPIs: async (): Promise<DashboardKPIs> => {
    return fetchApi('/api/kpis');
  },

  // Campaigns
  getCampaigns: async (): Promise<Campagne[]> => {
    return fetchApi('/api/campaigns');
  },

  createCampaign: async (data: Partial<Campagne>): Promise<Campagne> => {
    return fetchApi('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateCampaign: async (id: number, data: Partial<Campagne>): Promise<Campagne> => {
    return fetchApi(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteCampaign: async (id: number): Promise<{ message: string }> => {
    return fetchApi(`/api/campaigns/${id}`, { method: 'DELETE' });
  },

  launchCampaign: async (id: number): Promise<{ message: string; campagne: Campagne }> => {
    return fetchApi(`/api/campaigns/${id}/launch`, { method: 'POST' });
  },

  closeCampaign: async (id: number): Promise<{ message: string; campagne: Campagne }> => {
    return fetchApi(`/api/campaigns/${id}/close`, { method: 'POST' });
  },

  archiveCampaign: async (id: number): Promise<{ message: string; campagne: Campagne }> => {
    return fetchApi(`/api/campaigns/${id}/archive`, { method: 'POST' });
  },

  relaunchCampaign: async (id: number): Promise<{ message: string; campagne: Campagne }> => {
    return fetchApi(`/api/campaigns/${id}/relaunch`, { method: 'POST' });
  },

  relaunchManager: async (managerName: string): Promise<{ message: string }> => {
    return fetchApi('/api/relaunch/manager', {
      method: 'POST',
      body: JSON.stringify({ manager_name: managerName })
    });
  },

  // Evaluations
  getEvaluations: async (params?: Record<string, string>): Promise<Evaluation[]> => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/evaluations${query ? `?${query}` : ''}`);
  },

  getEvaluationDetail: async (id: number): Promise<Evaluation> => {
    return fetchApi(`/api/evaluations/${id}`);
  },

  createEvaluation: async (data: Evaluation): Promise<Evaluation> => {
    return fetchApi('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteEvaluation: async (id: number) => {
    return fetchApi(`/api/evaluations/${id}`, { method: 'DELETE' });
  },

  updateEvaluation: async (id: number, data: Partial<Evaluation>): Promise<Evaluation> => {
    return fetchApi(`/api/evaluations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  addCompetence: async (evaluationId: number, data: { axe: string; name: string; description?: string; coefficient?: number; score?: number; comment?: string }) => {
    return fetchApi(`/api/evaluations/${evaluationId}/competences`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteCompetence: async (evaluationId: number, compId: number) => {
    return fetchApi(`/api/evaluations/${evaluationId}/competences/${compId}`, {
      method: 'DELETE'
    });
  },

  addTrainingNeed: async (evaluationId: number, data: { title: string; description?: string; priority?: string; comment?: string }) => {
    return fetchApi(`/api/evaluations/${evaluationId}/training`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteTrainingNeed: async (evaluationId: number, trainingId: number) => {
    return fetchApi(`/api/evaluations/${evaluationId}/training/${trainingId}`, {
      method: 'DELETE'
    });
  },

  addObjective: async (evaluationId: number, data: { title: string; description?: string; target_date?: string; progress?: number; status?: string }) => {
    return fetchApi(`/api/evaluations/${evaluationId}/objectives`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteObjective: async (evaluationId: number, objId: number) => {
    return fetchApi(`/api/evaluations/${evaluationId}/objectives/${objId}`, {
      method: 'DELETE'
    });
  },

  addImprovementAxis: async (evaluationId: number, data: { domain: string; objective: string; comment?: string }) => {
    return fetchApi(`/api/evaluations/${evaluationId}/improvements`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteImprovementAxis: async (evaluationId: number, axisId: number) => {
    return fetchApi(`/api/evaluations/${evaluationId}/improvements/${axisId}`, { method: 'DELETE' });
  },

  submitEvaluationToDG: async (id: number) => {
    return fetchApi(`/api/evaluations/${id}/submit`, { method: 'POST' });
  },

  submitCorrectionToCollaborator: async (id: number) => {
    return fetchApi(`/api/evaluations/${id}/submit-correction`, { method: 'POST' });
  },

  confirmCorrection: async (id: number) => {
    return fetchApi(`/api/evaluations/${id}/confirm-correction`, { method: 'POST' });
  },

  submitAutoEvaluation: async (id: number, data: { balance?: string; achievements?: string; difficulties?: string; aspirations?: string; ratings: Record<string, string>; comments?: Record<string, string> }) => {
    return fetchApi(`/api/evaluations/${id}/auto-eval`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  scheduleInterview: async (id: number, interviewDate: string, message: string, interviewStatus = 'planifie', followupDate = '', followupComment = '') => {
    return fetchApi(`/api/evaluations/${id}/interview`, {
      method: 'POST',
      body: JSON.stringify({ interview_date: interviewDate, message, interview_status: interviewStatus, interview_followup_date: followupDate, interview_followup_comment: followupComment })
    });
  },

  signEvaluation: async (id: number) => {
    return fetchApi(`/api/evaluations/${id}/sign`, { method: 'POST' });
  },

  validateDG: async (id: number, action: 'valider' | 'renvoyer', comment?: string) => {
    return fetchApi(`/api/evaluations/${id}/validate-dg`, {
      method: 'POST',
      body: JSON.stringify({ action, comment })
    });
  },

  validateEvaluationByDG: async (id: number) => {
    return apiClient.validateDG(id, 'valider');
  },

  rejectEvaluationByDG: async (id: number, comment: string) => {
    return apiClient.validateDG(id, 'renvoyer', comment);
  },

  // Drilldown
  getHistoryDrilldown: async () => {
    return fetchApi('/api/history/drilldown');
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    return fetchApi('/api/notifications');
  },

  getNotificationConfig: async (): Promise<NotificationConfig[]> => {
    return fetchApi('/api/notifications/config');
  },

  updateNotificationConfig: async (config: NotificationConfig[]) => {
    return fetchApi('/api/notifications/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  },

  sendTestEmail: async (): Promise<{ message: string }> => {
    return fetchApi('/api/mail/test', { method: 'POST' });
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    return fetchApi('/api/audit-logs');
  },

  getJobTemplates: async () => {
    return fetchApi('/api/job-templates');
  },

  importJobTemplates: async (models: Array<{ poste_name: string; criteria: Array<{ axe: string; name: string; description: string; coefficient: number }> }>) => {
    return fetchApi('/api/job-templates/import', {
      method: 'POST',
      body: JSON.stringify({ models })
    });
  },

  updateJobFiche: async (id: number, data: { name?: string; description?: string }) => {
    return fetchApi(`/api/job-templates/fiches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  addJobCompetence: async (data: { fiche_id: number; axe: string; name: string; description?: string; coefficient?: number }) => {
    return fetchApi('/api/job-templates/competences', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateJobCompetence: async (id: number, data: { axe?: string; name?: string; description?: string; coefficient?: number }) => {
    return fetchApi(`/api/job-templates/competences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteJobCompetence: async (id: number) => {
    return fetchApi(`/api/job-templates/competences/${id}`, { method: 'DELETE' });
  }
};
