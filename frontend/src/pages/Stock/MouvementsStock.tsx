import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockService } from '../../services/stockService';
import type { Produit, MouvementStock } from '../../services/stockService';
import '../Stock/Stock.css';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';

export default function MouvementsStock() {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const navigate = useNavigate();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [formData, setFormData] = useState<MouvementStock>({
    produitId: 0,
    typeMouvement: 'ENTREE',
    quantite: 0,
    motif: '',
  });

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      const res = await stockService.getAllProduits();
      setProduits(res.data);
    } catch (error) {
      showNotification('Erreur lors du chargement des produits', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification({show: false, message: '', type}), 3000);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.produitId === 0) {
      showNotification('Veuillez sélectionner un produit.', 'error');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      if (formData.typeMouvement === 'ENTREE') {
        await stockService.entreeStock(formData);
      } else if (formData.typeMouvement === 'SORTIE') {
        await stockService.sortieStock(formData);
      } else {
        await stockService.ajustementStock(formData);
      }
      showNotification('Mouvement enregistré avec succès', 'success');
      setFormData({ produitId: 0, typeMouvement: 'ENTREE', quantite: 0, motif: '' });
    } catch (error: unknown) {
      const message = (error as any)?.response?.data?.message ?? 'Erreur lors de l\'enregistrement';
      showNotification(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stock-container" style={{ position: 'relative' }}>
      {notification.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          background: notification.type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white', padding: '16px 24px', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center',
          gap: '12px', zIndex: 9999, animation: 'slideIn 0.3s ease-out', minWidth: '300px'
        }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={notification.type === 'success' ? 'fas fa-check' : 'fas fa-times'} style={{ fontSize: '20px' }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '2px' }}>
              {notification.type === 'success' ? 'Succès' : 'Erreur'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.95 }}>{notification.message}</div>
          </div>
        </div>
      )}
      <style>{`@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      <div className="stock-header">
        <h1 className="stock-title">Mouvements de Stock</h1>
        <div className="d-flex gap-2">
          <button className="btn-modern btn-primary-modern" onClick={() => navigate('/dashboard/stock')}>Dashboard</button>
          <button className="btn-modern btn-primary-modern" onClick={() => navigate('/dashboard/stock/produits')}>Produits</button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="data-table">
            <div className="table-header">
              <h5 className="table-title">➕ Enregistrer un Mouvement</h5>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit} className="form-modern">
                <div className="mb-3">
                  <label>Type de Mouvement *</label>
                  <select
                    className="form-control"
                    value={formData.typeMouvement}
                    onChange={(e) => setFormData({ ...formData, typeMouvement: e.target.value as 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' })}
                  >
                    <option value="ENTREE">Entrée</option>
                    <option value="SORTIE">Sortie</option>
                    {canManage && <option value="AJUSTEMENT">Ajustement</option>}
                  </select>
                </div>

                <div className="mb-3">
                  <label>Produit *</label>
                  <select
                    className="form-control"
                    value={formData.produitId}
                    onChange={(e) => setFormData({ ...formData, produitId: parseInt(e.target.value) })}
                    required
                  >
                    <option value={0}>Sélectionner un produit</option>
                    {produits.map((p) => (
                      <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label>Quantité *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.quantite}
                    onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                </div>

                <div className="mb-3">
                  <label>Motif *</label>
                  <textarea
                    className="form-control"
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <button type="submit" className="btn-modern btn-success-modern w-100" disabled={submitting}>
                  {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <span>✓</span>}
                  {submitting ? 'Enregistrement...' : 'Enregistrer le Mouvement'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="data-table">
            <div className="table-header">
              <h5 className="table-title">Informations</h5>
            </div>
            <div className="p-4">
              <div className="alert alert-info alert-modern">
                <h6>Types de mouvements :</h6>
                <ul>
                  <li><strong>Entrée</strong> : Réception de marchandises</li>
                  <li><strong>Sortie</strong> : Utilisation ou vente</li>
                  <li><strong>Ajustement</strong> : Correction d'inventaire</li>
                </ul>
              </div>
              <div className="alert alert-warning alert-modern">
                <strong>Attention :</strong> Les sorties nécessitent un stock suffisant.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}