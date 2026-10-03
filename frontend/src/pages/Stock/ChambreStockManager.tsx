import { useState, useEffect } from 'react';
import axios from 'axios';
import keycloak from '../../config/keycloak';
import { chambreService, type Chambre } from '../../services/chambreService';

const STOCK_API = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/chambre/stock`;
const auth = () => ({ headers: { Authorization: `Bearer ${keycloak.token}` } });

type Produit = { id: number; nom: string; categorie: string; prixUnitaire: number };
type Stats   = { totalProduits?: number; categories?: number; valeurTotale?: number };

export default function ChambreStockManager() {
  const [produits, setProduits]           = useState<Produit[]>([]);
  const [stats, setStats]                 = useState<Stats>({});
  const [chambres, setChambres]           = useState<Chambre[]>([]);
  const [selectedChambreId, setSelectedChambreId] = useState<number | ''>('');
  const [loading, setLoading]             = useState(false);
  const [loadError, setLoadError]         = useState('');
  const [notification, setNotification]   = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const notify = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
    chambreService.getAllChambres().then(r => setChambres(r.data)).catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [produitsRes, statsRes] = await Promise.all([
        axios.get<Produit[]>(`${STOCK_API}/disponibles`, auth()),
        axios.get<Stats>(`${STOCK_API}/stats`, auth()),
      ]);
      setProduits(produitsRes.data);
      setStats(statsRes.data);
    } catch {
      setLoadError('Impossible de charger les produits. Vérifiez que le service stock est disponible.');
    } finally {
      setLoading(false);
    }
  };

  const assignProduit = async (produitId: number) => {
    if (!selectedChambreId) {
      notify('Veuillez sélectionner une chambre d\'abord.', 'error');
      return;
    }
    try {
      await axios.post(`${STOCK_API}/assign`, {
        chambreId: selectedChambreId,
        produitId,
        quantite: 1,
      }, auth());
      notify('Produit assigné avec succès', 'success');
      loadData();
    } catch {
      notify('Erreur lors de l\'assignation', 'error');
    }
  };

  const selectedChambre = chambres.find(c => c.id === selectedChambreId);

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 20px', position: 'relative' }}>

      {notification.show && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: notification.type === 'success'
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white', padding: '16px 24px', borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', minWidth: 300,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <strong>{notification.type === 'success' ? 'Succès' : 'Erreur'}</strong>
          {notification.message}
        </div>
      )}

      <style>{`@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {loadError && (
          <div className="alert alert-danger mb-4">{loadError}</div>
        )}

        {/* Header */}
        <div style={{ background: 'white', borderRadius: 12, padding: 30, marginBottom: 30, border: '1px solid #e5e7eb' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            Gestion Dynamique Stock-Chambre
          </h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Assignation des produits aux chambres</p>
        </div>

        {/* Room selector */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 30, border: '1px solid #e5e7eb' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>
            Chambre cible *
          </label>
          <select
            className="form-select"
            style={{ maxWidth: 400 }}
            value={selectedChambreId}
            onChange={e => setSelectedChambreId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">— Sélectionner une chambre —</option>
            {chambres.map(c => (
              <option key={c.id} value={c.id}>
                Chambre {c.numero} — {c.type}{c.etage != null ? ` (Étage ${c.etage})` : ''}
              </option>
            ))}
          </select>
          {selectedChambre && (
            <p className="text-muted small mt-2 mb-0">
              Statut : {selectedChambre.statut} · Capacité : {selectedChambre.capacite} pers. · {selectedChambre.prix} DT/nuit
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 30 }}>
          {[
            { icon: 'fa-box', color: '#3b82f6', value: stats.totalProduits ?? 0, label: 'Produits Disponibles' },
            { icon: 'fa-tags', color: '#10b981', value: stats.categories ?? 0, label: 'Catégories' },
            { icon: 'fa-dollar-sign', color: '#f59e0b', value: `${(stats.valeurTotale ?? 0).toFixed(2)} DT`, label: 'Valeur Totale' },
          ].map(({ icon, color, value, label }) => (
            <div key={label} style={{ background: 'white', borderRadius: 12, padding: 25, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 50, height: 50, background: color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fas ${icon}`} style={{ color: 'white', fontSize: 22 }} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937' }}>{value}</div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, color: '#3b82f6', marginBottom: 16 }} />
            <p style={{ color: '#6b7280' }}>Chargement des produits…</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {produits.map(p => (
              <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: 25, border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: 12 }}>
                  <h5 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#1f2937', marginBottom: 6 }}>{p.nom}</h5>
                  <span style={{ padding: '3px 10px', background: '#e0e7ff', color: '#4f46e5', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{p.categorie}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981', marginBottom: 16 }}>{p.prixUnitaire} DT</div>
                <button
                  onClick={() => assignProduit(p.id)}
                  disabled={!selectedChambreId}
                  style={{
                    width: '100%', padding: '11px', border: 'none', borderRadius: 8,
                    fontSize: 14, fontWeight: 600, cursor: selectedChambreId ? 'pointer' : 'not-allowed',
                    background: selectedChambreId ? '#3b82f6' : '#e5e7eb',
                    color: selectedChambreId ? 'white' : '#9ca3af',
                  }}
                >
                  <i className="fas fa-plus-circle" style={{ marginRight: 8 }} />
                  {selectedChambreId ? `Assigner à ${selectedChambre?.numero ?? '…'}` : 'Sélectionner une chambre'}
                </button>
              </div>
            ))}
            {produits.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', color: '#9ca3af' }}>
                Aucun produit disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
