import axios from 'axios';
import keycloak from '../config/keycloak';

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const auth = () => ({ headers: { Authorization: `Bearer ${keycloak.token}` } });

// ── Types ──────────────────────────────────────────────────────────────────────

export type BedType = 'SINGLE' | 'DOUBLE' | 'TWIN' | 'KING' | 'SUITE';

export type ClientProfile = {
  id?: number;
  keycloakId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  language?: string;
  bedType?: BedType;
  preferredFloor?: number;
  smokingRoom?: boolean;
  specialRequests?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DocumentType = 'PASSPORT' | 'ID_CARD' | 'VISA' | 'OTHER';

export type ClientDocument = {
  id: number;
  keycloakId: string;
  type: DocumentType;
  documentNumber?: string;
  expiryDate?: string;
  cloudinaryUrl: string;
  uploadedAt: string;
};

export type DemandeType = 'HOUSEKEEPING' | 'ROOM_SERVICE' | 'MAINTENANCE' | 'EXTRA_TOWELS' | 'WAKE_UP_CALL' | 'TRANSPORT' | 'OTHER';
export type DemandePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type DemandeStatut = 'OUVERTE' | 'EN_COURS' | 'TRAITEE' | 'FERMEE';

export type Demande = {
  id?: number;
  keycloakId: string;
  chambreId?: number;
  reservationId?: number;
  type: DemandeType;
  description?: string;
  priority?: DemandePriority;
  statut?: DemandeStatut;
  assignedTo?: string;
  dateCreation?: string;
  dateTraitement?: string;
};

export type CheckInRecord = {
  id: number;
  reservationId: number;
  keycloakId: string;
  chambreId?: number;
  type: 'CHECKIN' | 'CHECKOUT';
  actualTime: string;
  documentVerified: boolean;
  notes?: string;
  createdAt: string;
};

// ── Labels ────────────────────────────────────────────────────────────────────

export const DEMANDE_TYPE_LABELS: Record<DemandeType, string> = {
  HOUSEKEEPING: 'Ménage',
  ROOM_SERVICE: 'Room service',
  MAINTENANCE: 'Maintenance',
  EXTRA_TOWELS: 'Serviettes supplémentaires',
  WAKE_UP_CALL: 'Réveil',
  TRANSPORT: 'Transport',
  OTHER: 'Autre',
};

export const PRIORITY_COLORS: Record<DemandePriority, string> = {
  LOW: 'secondary', NORMAL: 'primary', HIGH: 'warning', URGENT: 'danger',
};

export const STATUT_COLORS: Record<DemandeStatut, string> = {
  OUVERTE: 'warning', EN_COURS: 'primary', TRAITEE: 'success', FERMEE: 'secondary',
};

export const STATUT_LABELS: Record<DemandeStatut, string> = {
  OUVERTE: 'Ouverte', EN_COURS: 'En cours', TRAITEE: 'Traitée', FERMEE: 'Fermée',
};

// ── API ───────────────────────────────────────────────────────────────────────

export const clientService = {
  // Profiles
  getAll:           ()                       => axios.get<ClientProfile[]>(`${API}/api/clients`, auth()),
  getByKeycloakId:  (id: string)             => axios.get<ClientProfile>(`${API}/api/clients/${id}`, auth()),
  getHistory:       (id: string)             => axios.get<CheckInRecord[]>(`${API}/api/clients/${id}/history`, auth()),
  createOrUpdate:   (p: ClientProfile)       => axios.post<ClientProfile>(`${API}/api/clients`, p, auth()),
  update:           (id: string, p: ClientProfile) => axios.put<ClientProfile>(`${API}/api/clients/${id}`, p, auth()),
  delete:           (id: string)             => axios.delete(`${API}/api/clients/${id}`, auth()),

  // Documents
  getDocuments: (id: string) => axios.get<ClientDocument[]>(`${API}/api/clients/${id}/documents`, auth()),
  uploadDocument: (id: string, type: DocumentType, file: File, documentNumber?: string, expiryDate?: string) => {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);
    if (documentNumber) fd.append('documentNumber', documentNumber);
    if (expiryDate)     fd.append('expiryDate', expiryDate);
    return axios.post<ClientDocument>(`${API}/api/clients/${id}/documents`, fd, auth());
  },
  deleteDocument: (clientId: string, docId: number) =>
    axios.delete(`${API}/api/clients/${clientId}/documents/${docId}`, auth()),

  // Demandes
  getAllDemandes:    (statut?: DemandeStatut) =>
    axios.get<Demande[]>(`${API}/api/demandes${statut ? `?statut=${statut}` : ''}`, auth()),
  getDemandeById:   (id: number)             => axios.get<Demande>(`${API}/api/demandes/${id}`, auth()),
  getDemandesByClient: (keycloakId: string)  => axios.get<Demande[]>(`${API}/api/demandes/client/${keycloakId}`, auth()),
  createDemande:    (d: Demande)             => axios.post<Demande>(`${API}/api/demandes`, d, auth()),
  updateStatut:     (id: number, statut: DemandeStatut) =>
    axios.put<Demande>(`${API}/api/demandes/${id}/statut`, { statut }, auth()),
  assignDemande:    (id: number, assignedTo: string) =>
    axios.put<Demande>(`${API}/api/demandes/${id}/assign`, { assignedTo }, auth()),
  deleteDemande:    (id: number)             => axios.delete(`${API}/api/demandes/${id}`, auth()),

  // Check-in / Check-out
  checkIn:  (reservationId: number, keycloakId: string, documentVerified: boolean, notes?: string) =>
    axios.post<CheckInRecord>(`${API}/api/checkinout/checkin/${reservationId}`, { keycloakId, documentVerified, notes }, auth()),
  checkOut: (reservationId: number, keycloakId: string, notes?: string) =>
    axios.post<CheckInRecord>(`${API}/api/checkinout/checkout/${reservationId}`, { keycloakId, notes }, auth()),
  getRecordsByReservation: (reservationId: number) =>
    axios.get<CheckInRecord[]>(`${API}/api/checkinout/reservation/${reservationId}`, auth()),
};
