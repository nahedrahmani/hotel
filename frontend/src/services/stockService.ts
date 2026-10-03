import axios from 'axios';
import keycloak from '../config/keycloak';

const API_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/stock`;

const auth = () => ({ headers: { Authorization: `Bearer ${keycloak.token}` } });

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

export const stockService = {
  // Produits
  getAllProduits: () => axios.get<Produit[]>(`${API_URL}/produits`, auth()),
  getProduitById: (id: number) => axios.get<Produit>(`${API_URL}/produits/${id}`, auth()),
  createProduit: (data: Produit) => axios.post<Produit>(`${API_URL}/produits`, data, auth()),
  updateProduit: (id: number, data: Produit) => axios.put<Produit>(`${API_URL}/produits/${id}`, data, auth()),
  deleteProduit: (id: number) => axios.delete(`${API_URL}/produits/${id}`, auth()),
  searchProduits: (nom: string) => axios.get<Produit[]>(`${API_URL}/produits/search?nom=${encodeURIComponent(nom)}`, auth()),

  // Stock
  getInventaire: () => axios.get<Stock[]>(`${API_URL}/inventaire`, auth()),
  getStockByProduit: (produitId: number) => axios.get<Stock>(`${API_URL}/produit/${produitId}`, auth()),
  entreeStock: (data: MouvementStock) => axios.post(`${API_URL}/entree`, data, auth()),
  sortieStock: (data: MouvementStock) => axios.post(`${API_URL}/sortie`, data, auth()),
  ajustementStock: (data: MouvementStock) => axios.post(`${API_URL}/ajustement`, data, auth()),
  getAlertes: () => axios.get<Stock[]>(`${API_URL}/alertes`, auth()),

  // Stats
  getValeurTotale: () => axios.get<{ valeurTotale: number }>(`${API_URL}/stats/valeur`, auth()),

  // Mouvements
  getAllMouvements: () => axios.get(`${API_URL}/mouvements`, auth()),
  getMouvementsByProduit: (produitId: number) => axios.get(`${API_URL}/mouvements/produit/${produitId}`, auth()),
};
