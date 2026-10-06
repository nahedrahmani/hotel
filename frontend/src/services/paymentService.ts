import axios from 'axios';
import { withAuth } from './http';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080') + '/api/payment';
// Token attached and refreshed by the shared interceptor
const api = withAuth(axios.create({ baseURL: BASE }));


// ── Types ──────────────────────────────────────────────────────────────────

export type StatutFacture = 'BROUILLON' | 'EMISE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
export type TypeFacture = 'HEBERGEMENT' | 'RESTAURATION' | 'SERVICE' | 'TRANSPORT' | 'DIVERS';
export type MethodePaiement = 'CARTE_BANCAIRE' | 'PAYPAL' | 'ESPECES' | 'VIREMENT_BANCAIRE' | 'CHEQUE' | 'KONNECT';
export type StatutPaiement = 'EN_ATTENTE' | 'CONFIRME' | 'REJETE' | 'REMBOURSE';

export interface LigneFacture {
  id?: number;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva?: number;
  /** prixUnitaire includes VAT (stay lines created from a booking) */
  prixTtc?: boolean;
  montantHT?: number;
  montantTva?: number;
  montantTTC?: number;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** HT / TVA / TTC of a line — same rule as payment-service LigneFacture, keep both in sync. */
export function montantsLigne(l: LigneFacture) {
  const base = round3((l.quantite || 0) * (l.prixUnitaire || 0));
  const taux = l.tauxTva ?? 19;
  if (l.prixTtc) {
    const ht = round3(base * 100 / (100 + taux));
    return { ht, tva: round3(base - ht), ttc: base };
  }
  const tva = round3(base * taux / 100);
  return { ht: base, tva, ttc: round3(base + tva) };
}

export interface Paiement {
  id?: number;
  factureId: number;
  factureNumero?: string;
  montant: number;
  methodePaiement: MethodePaiement;
  statut?: StatutPaiement;
  reference?: string;
  datePaiement?: string;
  note?: string;
}

export interface Facture {
  id?: number;
  numero?: string;
  reservationId?: number;
  clientId?: number;
  clientNom: string;
  clientEmail?: string;
  clientTelephone?: string;
  clientAdresse?: string;
  typeFacture?: TypeFacture;
  dateEmission: string;
  dateEcheance?: string;
  lignes: LigneFacture[];
  paiements?: Paiement[];
  statut?: StatutFacture;
  notes?: string;
  sousTotal?: number;
  totalTva?: number;
  totalTTC?: number;
  montantPaye?: number;
  montantRestant?: number;
  dateCreation?: string;
}

export interface Rapport {
  periode: string;
  chiffreAffaires: number;
  totalTva: number;
  totalHT: number;
  nombreFactures: number;
  nombrePayees: number;
  nombreImpayees: number;
  nombreEnRetard: number;
  montantImpaye: number;
  revenueParMethode: Record<string, number>;
  revenueParType: Record<string, number>;
  revenueParMois: Record<string, number>;
}

// ── Labels & Colors ─────────────────────────────────────────────────────────

export const STATUT_FACTURE_COLORS: Record<StatutFacture, string> = {
  BROUILLON: 'secondary', EMISE: 'primary', PARTIELLEMENT_PAYEE: 'warning',
  PAYEE: 'success', EN_RETARD: 'danger', ANNULEE: 'dark',
};

export const STATUT_FACTURE_LABELS: Record<StatutFacture, string> = {
  BROUILLON: 'Brouillon', EMISE: 'Émise', PARTIELLEMENT_PAYEE: 'Part. payée',
  PAYEE: 'Payée', EN_RETARD: 'En retard', ANNULEE: 'Annulée',
};

export const TYPE_FACTURE_LABELS: Record<TypeFacture, string> = {
  HEBERGEMENT: 'Hébergement', RESTAURATION: 'Restauration',
  SERVICE: 'Service', TRANSPORT: 'Transport', DIVERS: 'Divers',
};

export const METHODE_LABELS: Record<MethodePaiement, string> = {
  CARTE_BANCAIRE: 'Carte bancaire', PAYPAL: 'PayPal',
  ESPECES: 'Espèces', VIREMENT_BANCAIRE: 'Virement', CHEQUE: 'Chèque', KONNECT: 'En ligne (Konnect)',
};

// ── API calls ──────────────────────────────────────────────────────────────

export const paymentService = {
  // Factures
  getAllFactures: () => api.get<Facture[]>('/factures'),
  getFactureById: (id: number) => api.get<Facture>(`/factures/${id}`),
  getFacturesByStatut: (statut: StatutFacture) => api.get<Facture[]>(`/factures/statut/${statut}`),
  getFacturesByPeriode: (debut: string, fin: string) =>
    api.get<Facture[]>(`/factures/periode?debut=${debut}&fin=${fin}`),
  searchFactures: (q: string) => api.get<Facture[]>(`/factures/search?q=${q}`),
  createFacture: (dto: Facture) => api.post<Facture>('/factures', dto),
  updateFacture: (id: number, dto: Facture) => api.put<Facture>(`/factures/${id}`, dto),
  emettreFacture: (id: number) => api.patch<Facture>(`/factures/${id}/emettre`),
  annulerFacture: (id: number) => api.patch<Facture>(`/factures/${id}/annuler`),
  deleteFacture: (id: number) => api.delete(`/factures/${id}`),

  // Paiements
  getAllPaiements: () => api.get<Paiement[]>('/paiements'),
  getPaiementsByFacture: (factureId: number) => api.get<Paiement[]>(`/paiements/facture/${factureId}`),
  enregistrerPaiement: (dto: Paiement) => api.post<Paiement>('/paiements', dto),
  rembourserPaiement: (id: number) => api.patch<Paiement>(`/paiements/${id}/rembourser`),

  // Online payment with Konnect: the guest pays on Konnect's page, then the payment is
  // confirmed with Konnect by payment-service before the invoice counts it
  onlinePaymentStatus: () => api.get<{ enabled: boolean; simulation: boolean }>('/konnect/status'),
  // Demo mode only: the app's own stand-in for Konnect's payment page
  getSimulatedPayment: (paymentRef: string) =>
    api.get<{ status: string; amount: number; description: string }>(`/konnect/simulation/${paymentRef}`),
  finishSimulatedPayment: (paymentRef: string, paid: boolean) =>
    api.post<{ redirectUrl: string }>(`/konnect/simulation/${paymentRef}`, { paid }),
  startOnlinePayment: (factureId: number) =>
    api.post<{ payUrl: string; paymentRef: string }>('/konnect/init', { factureId }),
  confirmOnlinePayment: (paymentRef: string) => api.post<Paiement>('/konnect/confirm', { paymentRef }),

  // Rapports
  getRapport: (debut?: string, fin?: string) => {
    const params = new URLSearchParams();
    if (debut) params.set('debut', debut);
    if (fin) params.set('fin', fin);
    return api.get<Rapport>(`/rapports?${params.toString()}`);
  },
};
