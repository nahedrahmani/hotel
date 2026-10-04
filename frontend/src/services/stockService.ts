import { http } from './http';

const API_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/stock`;


export type Produit = {
  id?: number;
  code: string;
  nom: string;
  description?: string;
  categorie: string;
  unite: string;
  prixUnitaire: number;
  seuilMinimum: number;
  seuilMaximum: number;
  fournisseur?: string;
};

export type Stock = {
  id: number;
  produitId: number;
  produitNom: string;
  quantiteDisponible: number;
  quantiteReservee: number;
  emplacement: string;
  enRupture: boolean;
};

export type MouvementStock = {
  produitId: number;
  typeMouvement: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  quantite: number;
  motif: string;
  utilisateurId?: string;
};

export type MouvementHistorique = MouvementStock & {
  id: number;
  dateCreation: string;
};

export const CATEGORIE_LABELS: Record<string, string> = {
  LINGE: 'Linge', AMENITIES: "Produits d'accueil", NETTOYAGE: 'Nettoyage', CUISINE: 'Cuisine',
  BOISSONS: 'Boissons', EQUIPEMENT: 'Équipement', MOBILIER: 'Mobilier',
};

export const TYPE_MOUVEMENT_LABELS: Record<MouvementStock['typeMouvement'], string> = {
  ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Ajustement',
};

export const stockService = {
  // Produits
  getAllProduits: () => http.get<Produit[]>(`${API_URL}/produits`),
  getProduitById: (id: number) => http.get<Produit>(`${API_URL}/produits/${id}`),
  createProduit: (data: Produit) => http.post<Produit>(`${API_URL}/produits`, data),
  updateProduit: (id: number, data: Produit) => http.put<Produit>(`${API_URL}/produits/${id}`, data),
  deleteProduit: (id: number) => http.delete(`${API_URL}/produits/${id}`),
  searchProduits: (nom: string) => http.get<Produit[]>(`${API_URL}/produits/search?nom=${encodeURIComponent(nom)}`),

  // Stock
  getInventaire: () => http.get<Stock[]>(`${API_URL}/inventaire`),
  getStockByProduit: (produitId: number) => http.get<Stock>(`${API_URL}/produit/${produitId}`),
  entreeStock: (data: MouvementStock) => http.post(`${API_URL}/entree`, data),
  sortieStock: (data: MouvementStock) => http.post(`${API_URL}/sortie`, data),
  ajustementStock: (data: MouvementStock) => http.post(`${API_URL}/ajustement`, data),
  getAlertes: () => http.get<Stock[]>(`${API_URL}/alertes`),

  // Stats
  getValeurTotale: () => http.get<{ valeurTotale: number }>(`${API_URL}/stats/valeur`),

  // Mouvements
  getAllMouvements: () => http.get<MouvementHistorique[]>(`${API_URL}/mouvements`),
  getMouvementsByProduit: (produitId: number) => http.get(`${API_URL}/mouvements/produit/${produitId}`),
};
