import { http } from './http';

const API = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/reservations`;


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
  // Cancellation policy of the room (sent by reservation-service with each booking)
  cancellationPolicyHours?: number;
  cancellationFeePercent?: number;
  nonRefundableHours?: number;
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

/**
 * Penalty the guest would pay if they cancelled now. Same rule as
 * ReservationService.calculateCancellationPenalty in reservation-service — keep both in sync.
 */
export function cancellationPenalty(r: Reservation, now = new Date()): number {
  if (r.totalPrice == null || !r.checkInDate) return 0;
  const freeBefore = r.chambre?.cancellationPolicyHours ?? 48;
  const feePercent = r.chambre?.cancellationFeePercent ?? 50;
  const nonRefundable = r.chambre?.nonRefundableHours ?? 24;
  const hoursUntil = Math.floor((new Date(`${r.checkInDate}T14:00:00`).getTime() - now.getTime()) / 3600000);
  if (hoursUntil >= freeBefore) return 0;
  if (hoursUntil <= nonRefundable) return r.totalPrice;
  return Math.round(r.totalPrice * feePercent) / 100;
}

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
  getAll:    ()                          => http.get<Reservation[]>(API),
  getById:   (id: number)                => http.get<Reservation>(`${API}/${id}`),
  create:    (data: Reservation)         => http.post<Reservation>(API, data),
  update:    (id: number, d: Reservation)=> http.put<Reservation>(`${API}/${id}`, d),
  delete:    (id: number)                => http.delete(`${API}/${id}`),

  // Status actions
  confirm: (id: number) =>
    http.patch<Reservation>(`${API}/${id}/confirm`, null),
  cancel: (id: number, reason?: string) =>
    http.patch<Reservation>(`${API}/${id}/cancel`, reason ? { reason } : {}),

  // Queries
  getByCustomer:   (customerId: number) =>
    http.get<Reservation[]>(`${API}/customer/${customerId}`),
  getByKeycloak:   (keycloakId: string) =>
    http.get<Reservation[]>(`${API}/keycloak/${keycloakId}`),
  getByRoom:       (roomId: number) =>
    http.get<Reservation[]>(`${API}/room/${roomId}`),
  getPrice: (roomId: number, checkInDate: string, checkOutDate: string) =>
    http.get<{ total: number; nights: { date: string; price: number }[]; currency: string }>(
      `${API}/price?roomId=${roomId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`),
  getToday:        ()                   =>
    http.get<{ arrivals: Reservation[]; departures: Reservation[] }>(`${API}/today`),
  checkAvailability: (roomId: number, checkInDate: string, checkOutDate: string) =>
    http.get<{ available: boolean }>(
      `${API}/availability?roomId=${roomId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`),
  search: (startDate: string, endDate: string) =>
    http.get<Reservation[]>(`${API}/search?checkInDate=${startDate}&checkOutDate=${endDate}`),

  // Stats & invoices
  getStats:   ()           => http.get<ReservationStats>(`${API}/stats`),
  getFactures:(id: number) => http.get<Facture[]>(`${API}/${id}/factures`),
};