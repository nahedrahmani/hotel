import axios from 'axios';
import keycloak from '../config/keycloak';

const API = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/reservations`;

const auth = () => ({
  headers: { Authorization: `Bearer ${keycloak.token}` },
});

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReservationType = 'ONLINE' | 'ON_SITE' | 'PHONE' | 'AGENCY';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';

export type ChambreInfo = {
  id: number;
  numero: string;
  type: string;
  prix: number;
  capacite: number;
  statut: string;
  etage?: number;
  photo?: string;
  wifi?: boolean;
  climatisation?: boolean;
  balcon?: boolean;
};

export type Reservation = {
  id?: number;
  customerId?: number;
  keycloakId?: string;
  hotelId?: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests?: number;
  specialRequests?: string;
  reservationType?: ReservationType;
  status?: ReservationStatus;
  cancelReason?: string;
  cancellationPenalty?: number;
  guestEmail?: string;
  lastModifiedBy?: string;
  totalPrice?: number;
  depositPaid?: number;
  chambre?: ChambreInfo;  // enriched by backend from chambre-service
};

export type ReservationStats = {
  total: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  cancelled: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  byType: Record<string, number>;
};

export type Facture = {
  id: number;
  numero: string;
  statut: string;
  totalTTC: number;
  montantPaye: number;
  montantRestant: number;
  dateEmission: string;
  clientNom: string;
};

// ── Labels ─────────────────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<ReservationType, string> = {
  ONLINE: 'En ligne',
  ON_SITE: 'Sur place',
  PHONE: 'Téléphone',
  AGENCY: 'Agence',
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING:    'En attente',
  CONFIRMED:  'Confirmée',
  CHECKED_IN: 'Arrivée',
  CHECKED_OUT:'Partie',
  CANCELLED:  'Annulée',
  NO_SHOW:    'Non présentée',
};

export const STATUS_COLORS: Record<ReservationStatus, string> = {
  PENDING:    'warning',
  CONFIRMED:  'success',
  CHECKED_IN: 'primary',
  CHECKED_OUT:'secondary',
  CANCELLED:  'danger',
  NO_SHOW:    'dark',
};

// ── API ────────────────────────────────────────────────────────────────────────

export const reservationService = {
  // CRUD
  getAll:    ()                          => axios.get<Reservation[]>(API, auth()),
  getById:   (id: number)                => axios.get<Reservation>(`${API}/${id}`, auth()),
  create:    (data: Reservation)         => axios.post<Reservation>(API, data, auth()),
  update:    (id: number, d: Reservation)=> axios.put<Reservation>(`${API}/${id}`, d, auth()),
  delete:    (id: number)                => axios.delete(`${API}/${id}`, auth()),

  // Status actions
  confirm: (id: number) =>
    axios.patch<Reservation>(`${API}/${id}/confirm`, null, auth()),
  cancel: (id: number, reason?: string) =>
    axios.patch<Reservation>(`${API}/${id}/cancel`, reason ? { reason } : {}, auth()),

  // Queries
  getByCustomer:   (customerId: number) =>
    axios.get<Reservation[]>(`${API}/customer/${customerId}`, auth()),
  getByKeycloak:   (keycloakId: string) =>
    axios.get<Reservation[]>(`${API}/keycloak/${keycloakId}`, auth()),
  getByRoom:       (roomId: number) =>
    axios.get<Reservation[]>(`${API}/room/${roomId}`, auth()),
  getPrice: (roomId: number, checkInDate: string, checkOutDate: string) =>
    axios.get<{ total: number; nights: { date: string; price: number }[]; currency: string }>(
      `${API}/price?roomId=${roomId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`, auth()),
  getToday:        ()                   =>
    axios.get<{ arrivals: Reservation[]; departures: Reservation[] }>(`${API}/today`, auth()),
  checkAvailability: (roomId: number, checkInDate: string, checkOutDate: string) =>
    axios.get<{ available: boolean }>(
      `${API}/availability?roomId=${roomId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`,
      auth()
    ),
  search: (startDate: string, endDate: string) =>
    axios.get<Reservation[]>(`${API}/search?checkInDate=${startDate}&checkOutDate=${endDate}`, auth()),

  // Stats & invoices
  getStats:   ()           => axios.get<ReservationStats>(`${API}/stats`, auth()),
  getFactures:(id: number) => axios.get<Facture[]>(`${API}/${id}/factures`, auth()),
};