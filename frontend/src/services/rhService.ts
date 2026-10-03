import axios from 'axios';
import keycloak from '../config/keycloak';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080') + '/api/rh';
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  if (keycloak.token) config.headers.Authorization = `Bearer ${keycloak.token}`;
  return config;
});

// ── Types ──────────────────────────────────────────────────────────────────

export type Poste = 'RECEPTIONNISTE' | 'FEMME_DE_CHAMBRE' | 'CHEF_CUISINE' | 'CUISINIER' |
  'SERVEUR' | 'TECHNICIEN_MAINTENANCE' | 'AGENT_SECURITE' | 'MANAGER' | 'DIRECTEUR' |
  'RESPONSABLE_RH' | 'COMPTABLE' | 'CONCIERGE';

export type Departement = 'HEBERGEMENT' | 'RESTAURATION' | 'MAINTENANCE' |
  'SECURITE' | 'ADMINISTRATION' | 'RESSOURCES_HUMAINES' | 'FINANCE';

export type StatutEmploye = 'ACTIF' | 'INACTIF' | 'EN_CONGE' | 'SUSPENDU';
export type TypeShift = 'MATIN' | 'APRES_MIDI' | 'NUIT' | 'JOURNEE_COMPLETE';
export type StatutPointage = 'PRESENT' | 'ABSENT' | 'RETARD' | 'EN_CONGE' | 'JOUR_FERIE';
export type StatutTache = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
export type PrioriteTache = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
export type TypeConge = 'CONGE_PAYE' | 'MALADIE' | 'MATERNITE_PATERNITE' | 'SANS_SOLDE' | 'FORMATION' | 'AUTRE';
export type StatutConge = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'ANNULE';

export interface Employe {
  id?: number;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  poste: Poste;
  departement: Departement;
  dateEmbauche: string;
  dateNaissance?: string;
  salaire?: number;
  statut?: StatutEmploye;
  keycloakId?: string;
}

export interface Shift {
  id?: number;
  employeId: number;
  employeNom?: string;
  employePrenom?: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  typeShift?: TypeShift;
  note?: string;
}

export interface Pointage {
  id?: number;
  employeId: number;
  employeNom?: string;
  employePrenom?: string;
  date: string;
  heureEntree?: string;
  heureSortie?: string;
  statut?: StatutPointage;
  retardMinutes?: number;
  note?: string;
}

export interface Tache {
  id?: number;
  titre: string;
  description?: string;
  assigneAId?: number;
  assigneANom?: string;
  assignePar?: string;
  priorite?: PrioriteTache;
  statut?: StatutTache;
  dateEcheance?: string;
  dateCompletion?: string;
  chambreId?: number;
  dateCreation?: string;
}

export interface Conge {
  id?: number;
  employeId: number;
  employeNom?: string;
  employePrenom?: string;
  typeConge: TypeConge;
  dateDebut: string;
  dateFin: string;
  motif?: string;
  statut?: StatutConge;
  approvePar?: string;
  dateDecision?: string;
  dateDemande?: string;
  nombreJours?: number;
}

// ── Labels ─────────────────────────────────────────────────────────────────

export const POSTE_LABELS: Record<Poste, string> = {
  RECEPTIONNISTE: 'Réceptionniste', FEMME_DE_CHAMBRE: 'Femme de chambre',
  CHEF_CUISINE: 'Chef cuisinier', CUISINIER: 'Cuisinier', SERVEUR: 'Serveur',
  TECHNICIEN_MAINTENANCE: 'Technicien maintenance', AGENT_SECURITE: 'Agent de sécurité',
  MANAGER: 'Manager', DIRECTEUR: 'Directeur', RESPONSABLE_RH: 'Responsable RH',
  COMPTABLE: 'Comptable', CONCIERGE: 'Concierge',
};

export const DEPT_LABELS: Record<Departement, string> = {
  HEBERGEMENT: 'Hébergement', RESTAURATION: 'Restauration', MAINTENANCE: 'Maintenance',
  SECURITE: 'Sécurité', ADMINISTRATION: 'Administration',
  RESSOURCES_HUMAINES: 'Ressources Humaines', FINANCE: 'Finance',
};

export const STATUT_EMPLOYE_COLORS: Record<StatutEmploye, string> = {
  ACTIF: 'success', INACTIF: 'secondary', EN_CONGE: 'warning', SUSPENDU: 'danger',
};

export const PRIORITE_COLORS: Record<PrioriteTache, string> = {
  BASSE: 'secondary', NORMALE: 'primary', HAUTE: 'warning', URGENTE: 'danger',
};

export const STATUT_TACHE_COLORS: Record<StatutTache, string> = {
  A_FAIRE: 'secondary', EN_COURS: 'primary', TERMINE: 'success', ANNULE: 'dark',
};

export const STATUT_CONGE_COLORS: Record<StatutConge, string> = {
  EN_ATTENTE: 'warning', APPROUVE: 'success', REFUSE: 'danger', ANNULE: 'secondary',
};

export const STATUT_POINTAGE_COLORS: Record<StatutPointage, string> = {
  PRESENT: 'success', ABSENT: 'danger', RETARD: 'warning', EN_CONGE: 'info', JOUR_FERIE: 'secondary',
};

// ── API calls ──────────────────────────────────────────────────────────────

export const rhService = {
  // Employés
  getAllEmployes: () => api.get<Employe[]>('/employes'),
  getEmployeById: (id: number) => api.get<Employe>(`/employes/${id}`),
  searchEmployes: (q: string) => api.get<Employe[]>(`/employes/search?q=${q}`),
  createEmploye: (dto: Employe) => api.post<Employe>('/employes', dto),
  updateEmploye: (id: number, dto: Employe) => api.put<Employe>(`/employes/${id}`, dto),
  changerStatutEmploye: (id: number, statut: StatutEmploye) =>
    api.patch<Employe>(`/employes/${id}/statut?statut=${statut}`),
  deleteEmploye: (id: number) => api.delete(`/employes/${id}`),

  // Planning
  getPlanning: (debut: string, fin: string) =>
    api.get<Shift[]>(`/planning?debut=${debut}&fin=${fin}`),
  getShiftsByDate: (date: string) => api.get<Shift[]>(`/planning/jour?date=${date}`),
  createShift: (dto: Shift) => api.post<Shift>('/planning', dto),
  updateShift: (id: number, dto: Shift) => api.put<Shift>(`/planning/${id}`, dto),
  deleteShift: (id: number) => api.delete(`/planning/${id}`),

  // Pointage
  getPointagesDuJour: (date?: string) =>
    api.get<Pointage[]>(`/pointages/jour${date ? `?date=${date}` : ''}`),
  getPointagesEmploye: (id: number, debut: string, fin: string) =>
    api.get<Pointage[]>(`/pointages/employe/${id}?debut=${debut}&fin=${fin}`),
  getStatsPointage: (date?: string) =>
    api.get<Record<string, number>>(`/pointages/stats${date ? `?date=${date}` : ''}`),
  pointageEntree: (employeId: number) => api.post<Pointage>(`/pointages/entree/${employeId}`),
  pointageSortie: (employeId: number) => api.patch<Pointage>(`/pointages/sortie/${employeId}`),
  createPointage: (dto: Pointage) => api.post<Pointage>('/pointages', dto),
  updatePointage: (id: number, dto: Pointage) => api.put<Pointage>(`/pointages/${id}`, dto),

  // Tâches
  getAllTaches: () => api.get<Tache[]>('/taches'),
  getTachesByEmploye: (id: number) => api.get<Tache[]>(`/taches/employe/${id}`),
  createTache: (dto: Tache) => api.post<Tache>('/taches', dto),
  updateTache: (id: number, dto: Tache) => api.put<Tache>(`/taches/${id}`, dto),
  changerStatutTache: (id: number, statut: StatutTache) =>
    api.patch<Tache>(`/taches/${id}/statut?statut=${statut}`),
  deleteTache: (id: number) => api.delete(`/taches/${id}`),

  // Congés
  getAllConges: () => api.get<Conge[]>('/conges'),
  getCongesByEmploye: (id: number) => api.get<Conge[]>(`/conges/employe/${id}`),
  getCongesByStatut: (statut: StatutConge) => api.get<Conge[]>(`/conges/statut/${statut}`),
  createConge: (dto: Conge) => api.post<Conge>('/conges', dto),
  approuverConge: (id: number, approvePar: string) =>
    api.patch<Conge>(`/conges/${id}/approuver?approvePar=${approvePar}`),
  refuserConge: (id: number, approvePar: string) =>
    api.patch<Conge>(`/conges/${id}/refuser?approvePar=${approvePar}`),
  deleteConge: (id: number) => api.delete(`/conges/${id}`),
};
