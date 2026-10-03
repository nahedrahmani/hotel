import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockService } from '../../services/stockService';
import type { Produit } from '../../services/stockService';
import '../Stock/Stock.css';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';

export default function GestionProduits() {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const isAdmin = hasAnyRole(['ADMIN']);
  const navigate = useNavigate();
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, id: number | null}>({show: false, id: null});
  const [formData, setFormData] = useState<Produit>({
    code: '',
    nom: '',
    description: '',
    categorie: 'LINGE',
    unite: 'pièce',
    prixUnitaire: 0,
    seuilMinimum: 0,
    seuilMaximum: 0,
    fournisseur: '',
  });

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      const res = await stockService.getAllProduits();
      setProduits(res.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du chargement des produits', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification({show: true, message, type});
    notifTimerRef.current = setTimeout(() => setNotification({show: false, message: '', type}), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduit) {
        await stockService.updateProduit(editingProduit.id!, formData);
        showNotification('Produit modifié avec succès', 'success');
      } else {
        await stockService.createProduit(formData);
        showNotification('Produit ajouté avec succès', 'success');
      }
      setShowModal(false);
      resetForm();
      loadProduits();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async () => {
    if (confirmDelete.id !== null) {
      try {
        await stockService.deleteProduit(confirmDelete.id);
        showNotification('Produit supprimé avec succès', 'success');
        loadProduits();
      } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression', 'error');
      }
      setConfirmDelete({show: false, id: null});
    }
  };

  const handleEdit = (produit: Produit) => {
    setEditingProduit(produit);
    setFormData(produit);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      nom: '',
      description: '',
      categorie: 'LINGE',
      unite: 'pièce',
      prixUnitaire: 0,
      seuilMinimum: 0,
      seuilMaximum: 0,
      fournisseur: '',
    });
    setEditingProduit(null);
  };

  return (
    <div className="stock-container" style={{ position: 'relative' }}>
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          minWidth: '300px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
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
      <style>{
        `@keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }`
      }</style>
      <div className="stock-header">
        <h1 className="stock-title">Gestion des Produits</h1>
        <div className="d-flex gap-2">
          <button className="btn-modern btn-success-modern" onClick={() => navigate('/dashboard/stock')}>
            Dashboard
          </button>
          <button className="btn-modern btn-success-modern" onClick={() => navigate('/dashboard/stock/mouvements')}>
            Mouvements
          </button>
          {canManage && (
            <button
              className="btn-modern btn-primary-modern"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <span>+</span> Nouveau Produit
            </button>
          )}
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <h5 className="table-title">Liste des Produits</h5>
        </div>
        <div className="p-0">
          <table className="table table-modern mb-0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Prix Unitaire</th>
                <th>Seuil Min</th>
                <th>Seuil Max</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {produits.map((produit) => (
                <tr key={produit.id}>
                  <td>{produit.code}</td>
                  <td>{produit.nom}</td>
                  <td>{produit.categorie}</td>
                  <td>{produit.prixUnitaire} DT</td>
                  <td>{produit.seuilMinimum}</td>
                  <td>{produit.seuilMaximum}</td>
                  <td>
                    {canManage && (
                      <button
                        className="action-btn btn-warning me-2"
                        onClick={() => handleEdit(produit)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="action-btn btn-danger"
                        onClick={() => setConfirmDelete({show: true, id: produit.id!})}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete.show && (
        <div className="modal modal-modern show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: 'none', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '24px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '32px', color: 'white' }}></i>
                </div>
                <h5 style={{ color: 'white', fontWeight: '700', fontSize: '24px', margin: 0 }}>Confirmer la suppression</h5>
              </div>
              <div className="modal-body" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
                  Êtes-vous sûr de vouloir supprimer ce produit ?<br/>
                  <strong style={{ color: '#1f2937' }}>Cette action est irréversible.</strong>
                </p>
              </div>
              <div className="modal-footer" style={{ padding: '16px 32px 32px', border: 'none', gap: '12px', display: 'flex' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setConfirmDelete({show: false, id: null})}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '15px'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleDelete}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '15px'
                  }}
                >
                  <i className="fas fa-trash" style={{ marginRight: '8px' }}></i>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal modal-modern show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5>{editingProduit ? 'Modifier' : 'Nouveau'} Produit</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit} className="form-modern">
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label>Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Nom *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Catégorie *</label>
                    <select
                      className="form-control"
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    >
                      <option value="LINGE">Linge</option>
                      <option value="AMENITIES">Amenities</option>
                      <option value="NETTOYAGE">Nettoyage</option>
                      <option value="CUISINE">Cuisine</option>
                      <option value="BOISSONS">Boissons</option>
                      <option value="EQUIPEMENT">Équipement</option>
                      <option value="MOBILIER">Mobilier</option>
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label>Prix Unitaire *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.prixUnitaire || ''}
                        onChange={(e) => setFormData({ ...formData, prixUnitaire: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label>Unité *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.unite}
                        onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label>Seuil Minimum *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.seuilMinimum || ''}
                        onChange={(e) => setFormData({ ...formData, seuilMinimum: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label>Seuil Maximum *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.seuilMaximum || ''}
                        onChange={(e) => setFormData({ ...formData, seuilMaximum: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
