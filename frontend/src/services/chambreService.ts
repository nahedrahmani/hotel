import { http } from './http';

const API_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/chambres`;


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

// Illustration per room type (public/rooms, credits in public/rooms/CREDITS.txt)
const TYPE_PHOTOS: Record<string, string> = {
  SINGLE: '/rooms/single.jpg', DOUBLE: '/rooms/double.jpg', TWIN: '/rooms/twin.jpg', FAMILY: '/rooms/family.jpg', SUITE: '/rooms/suite.jpg',
};

/** The room's own uploaded photo when there is one, otherwise the photo of its type. */
export const roomPhoto = (r: { photo?: string; type: string }) => r.photo || TYPE_PHOTOS[r.type] || TYPE_PHOTOS.DOUBLE;

// Room statuses written by the reservation and housekeeping workflows
export const STATUT_LABELS: Record<string, string> = {
  disponible: 'Disponible', réservée: 'Réservée', occupée: 'Occupée', à_nettoyer: 'À nettoyer', hors_service: 'Hors service',
};
export const STATUT_COLORS: Record<string, string> = {
  disponible: 'success', réservée: 'warning', occupée: 'danger', à_nettoyer: 'info', hors_service: 'secondary',
};

export const chambreService = {
  getAllChambres: (hotelId?: number) =>
    http.get<Chambre[]>(`${API_URL}${hotelId ? `?hotelId=${hotelId}` : ''}`),

  getChambresANettoyer: (hotelId?: number) =>
    http.get<Chambre[]>(`${API_URL}/a-nettoyer${hotelId ? `?hotelId=${hotelId}` : ''}`),

  marquerPropre: (id: number) =>
    http.patch<Chambre>(`${API_URL}/${id}/marquer-propre`, null),

  getChambreById: (id: number) => http.get<Chambre>(`${API_URL}/${id}`),

  createChambre: (chambre: Chambre, photo?: File) => {
    const formData = new FormData();
    formData.append('chambre', new Blob([JSON.stringify(chambre)], { type: 'application/json' }));
    if (photo) formData.append('photo', photo);
    return http.post<Chambre>(`${API_URL}`, formData);
  },

  updateChambre: (id: number, chambre: Chambre, photo?: File) => {
    const formData = new FormData();
    formData.append('chambre', new Blob([JSON.stringify(chambre)], { type: 'application/json' }));
    if (photo) formData.append('photo', photo);
    return http.put<Chambre>(`${API_URL}/${id}`, formData);
  },

  deleteChambre: (id: number) => http.delete(`${API_URL}/${id}`),

  addProduitToChambre: (chambreId: number, produitId: number) =>
    http.post<Chambre>(`${API_URL}/${chambreId}/produits/${produitId}`, null),

  removeProduitFromChambre: (chambreId: number, produitId: number) =>
    http.delete<Chambre>(`${API_URL}/${chambreId}/produits/${produitId}`),

  getProduitsByChambre: (chambreId: number) =>
    http.get<{ id: number; nom: string; categorie?: string; prixUnitaire: number }[]>(`${API_URL}/${chambreId}/produits`),

  updatePolitique: (id: number, politique: {
    weekendMultiplier?: number; peakMonths?: string; peakMultiplier?: number;
    cancellationPolicyHours?: number; cancellationFeePercent?: number; nonRefundableHours?: number;
  }) => http.patch<Chambre>(`${API_URL}/${id}/politique`, politique),

  // Staff-only endpoint: the token is required
  getAllProduitsFromStock: () =>
    http.get(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/chambre/stock/produits`),
};
