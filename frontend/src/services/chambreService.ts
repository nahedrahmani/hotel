import axios from 'axios';
import keycloak from '../config/keycloak';

const API_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/chambres`;

const auth = () => ({
  headers: { Authorization: `Bearer ${keycloak.token}` },
});

export type Chambre = {
  id?: number;
  numero: string;
  type: string;
  prix: number;
  capacite: number;
  statut: string;
  description?: string;
  photo?: string;
  etage?: number;
  balcon?: boolean;
  climatisation?: boolean;
  television?: boolean;
  wifi?: boolean;
  minibar?: boolean;
  vueMer?: boolean;
  superficie?: number;
  produitIds?: number[];
  hotelId?: number;
  // Dynamic pricing
  weekendMultiplier?: number;
  peakMonths?: string;
  peakMultiplier?: number;
  // Cancellation policy
  cancellationPolicyHours?: number;
  cancellationFeePercent?: number;
  nonRefundableHours?: number;
};

// Same codes as the guest bed preference (clientService BedType) so both stay comparable
export const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Simple', DOUBLE: 'Double', TWIN: 'Twin', SUITE: 'Suite', FAMILY: 'Familiale',
};

// Room statuses written by the reservation and housekeeping workflows
export const STATUT_LABELS: Record<string, string> = {
  disponible: 'Disponible', réservée: 'Réservée', occupée: 'Occupée', à_nettoyer: 'À nettoyer', hors_service: 'Hors service',
};
export const STATUT_COLORS: Record<string, string> = {
  disponible: 'success', réservée: 'warning', occupée: 'danger', à_nettoyer: 'info', hors_service: 'secondary',
};

export const chambreService = {
  getAllChambres: (hotelId?: number) =>
    axios.get<Chambre[]>(`${API_URL}${hotelId ? `?hotelId=${hotelId}` : ''}`),

  getChambresANettoyer: (hotelId?: number) =>
    axios.get<Chambre[]>(`${API_URL}/a-nettoyer${hotelId ? `?hotelId=${hotelId}` : ''}`, auth()),

  marquerPropre: (id: number) =>
    axios.patch<Chambre>(`${API_URL}/${id}/marquer-propre`, null, auth()),

  getChambreById: (id: number) => axios.get<Chambre>(`${API_URL}/${id}`),

  createChambre: (chambre: Chambre, photo?: File) => {
    const formData = new FormData();
    formData.append('chambre', new Blob([JSON.stringify(chambre)], { type: 'application/json' }));
    if (photo) formData.append('photo', photo);
    return axios.post<Chambre>(`${API_URL}`, formData, auth());
  },

  updateChambre: (id: number, chambre: Chambre, photo?: File) => {
    const formData = new FormData();
    formData.append('chambre', new Blob([JSON.stringify(chambre)], { type: 'application/json' }));
    if (photo) formData.append('photo', photo);
    return axios.put<Chambre>(`${API_URL}/${id}`, formData, auth());
  },

  deleteChambre: (id: number) => axios.delete(`${API_URL}/${id}`, auth()),

  addProduitToChambre: (chambreId: number, produitId: number) =>
    axios.post<Chambre>(`${API_URL}/${chambreId}/produits/${produitId}`, null, auth()),

  removeProduitFromChambre: (chambreId: number, produitId: number) =>
    axios.delete<Chambre>(`${API_URL}/${chambreId}/produits/${produitId}`, auth()),

  getProduitsByChambre: (chambreId: number) =>
    axios.get(`${API_URL}/${chambreId}/produits`),

  updatePolitique: (id: number, politique: {
    weekendMultiplier?: number; peakMonths?: string; peakMultiplier?: number;
    cancellationPolicyHours?: number; cancellationFeePercent?: number; nonRefundableHours?: number;
  }) => axios.patch<Chambre>(`${API_URL}/${id}/politique`, politique, auth()),

  getAllProduitsFromStock: () =>
    axios.get(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/chambre/stock/produits`),
};
