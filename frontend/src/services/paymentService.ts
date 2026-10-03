import axios from 'axios';
import keycloak from '../config/keycloak';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080') + '/api/payment';
const api = axios.create({ baseURL: BASE });

// Attach JWT to every payment-service request
api.interceptors.request.use(config => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

// ── Types ──────────────────────────────────────────────────────────────────

export type StatutFacture = 'BROUILLON' | 'EMISE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
export type TypeFacture = 'HEBERGEMENT' | 'RESTAURATION' | 'SERVICE' | 'TRANSPORT' | 'DIVERS';
export type MethodePaiement = 'CARTE_BANCAIRE' | 'PAYPAL' | 'ESPECES' | 'VIREMENT_BANCAIRE' | 'CHEQUE';
export type StatutPaiement = 'EN_ATTENTE' | 'CONFIRME' | 'REJETE' | 'REMBOURSE';

export interface LigneFacture {
  id?: number;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva?: number;
  montantHT?: number;
  montantTva?: number;
  montantTTC?: number;
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
  ESPECES: 'Espèces', VIREMENT_BANCAIRE: 'Virement', CHEQUE: 'Chèque',
};

export const METHODE_ICONS: Record<MethodePaiement, string> = {
  CARTE_BANCAIRE: '💳', PAYPAL: '🅿️', ESPECES: '💵', VIREMENT_BANCAIRE: '🏦', CHEQUE: '📝',
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

  // Rapports
  getRapport: (debut?: string, fin?: string) => {
    const params = new URLSearchParams();
    if (debut) params.set('debut', debut);
    if (fin) params.set('fin', fin);
    return api.get<Rapport>(`/rapports?${params.toString()}`);
  },
};
