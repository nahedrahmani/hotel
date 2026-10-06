import { http } from './http';

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

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

export const BED_TYPE_LABELS: Record<BedType, string> = {
  SINGLE: 'Lit simple', DOUBLE: 'Lit double', TWIN: 'Deux lits séparés', KING: 'Grand lit', SUITE: 'Suite',
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

export const PRIORITY_LABELS: Record<DemandePriority, string> = {
  LOW: 'Basse', NORMAL: 'Normale', HIGH: 'Haute', URGENT: 'Urgente',
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
  getAll:           ()                       => http.get<ClientProfile[]>(`${API}/api/clients`),
  getByKeycloakId:  (id: string)             => http.get<ClientProfile>(`${API}/api/clients/${id}`),
  getHistory:       (id: string)             => http.get<CheckInRecord[]>(`${API}/api/clients/${id}/history`),
  createOrUpdate:   (p: ClientProfile)       => http.post<ClientProfile>(`${API}/api/clients`, p),
  update:           (id: string, p: ClientProfile) => http.put<ClientProfile>(`${API}/api/clients/${id}`, p),
  delete:           (id: string)             => http.delete(`${API}/api/clients/${id}`),

  // Documents
  getDocuments: (id: string) => http.get<ClientDocument[]>(`${API}/api/clients/${id}/documents`),
  uploadDocument: (id: string, type: DocumentType, file: File, documentNumber?: string, expiryDate?: string) => {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);
    if (documentNumber) fd.append('documentNumber', documentNumber);
    if (expiryDate)     fd.append('expiryDate', expiryDate);
    return http.post<ClientDocument>(`${API}/api/clients/${id}/documents`, fd);
  },
  deleteDocument: (clientId: string, docId: number) =>
    http.delete(`${API}/api/clients/${clientId}/documents/${docId}`),

  // Demandes
  getAllDemandes:    (statut?: DemandeStatut) =>
    http.get<Demande[]>(`${API}/api/demandes${statut ? `?statut=${statut}` : ''}`),
  getDemandeById:   (id: number)             => http.get<Demande>(`${API}/api/demandes/${id}`),
  getDemandesByClient: (keycloakId: string)  => http.get<Demande[]>(`${API}/api/demandes/client/${keycloakId}`),
  createDemande:    (d: Demande)             => http.post<Demande>(`${API}/api/demandes`, d),
  updateStatut:     (id: number, statut: DemandeStatut) =>
    http.put<Demande>(`${API}/api/demandes/${id}/statut`, { statut }),
  assignDemande:    (id: number, assignedTo: string) =>
    http.put<Demande>(`${API}/api/demandes/${id}/assign`, { assignedTo }),
  deleteDemande:    (id: number)             => http.delete(`${API}/api/demandes/${id}`),

  // Check-in / Check-out
  checkIn:  (reservationId: number, keycloakId: string, documentVerified: boolean, notes?: string) =>
    http.post<CheckInRecord>(`${API}/api/checkinout/checkin/${reservationId}`, { keycloakId, documentVerified, notes }),
  checkOut: (reservationId: number, keycloakId: string, notes?: string) =>
    http.post<CheckInRecord>(`${API}/api/checkinout/checkout/${reservationId}`, { keycloakId, notes }),
  getRecordsByReservation: (reservationId: number) =>
    http.get<CheckInRecord[]>(`${API}/api/checkinout/reservation/${reservationId}`),
  // Minibar / room consumption recorded at checkout (added to the stay's invoice)
  addConso: (reservationId: number, conso: { chambreId?: number; produitId: number; quantite: number }) =>
    http.post(`${API}/api/checkinout/conso/${reservationId}`, conso),
};
