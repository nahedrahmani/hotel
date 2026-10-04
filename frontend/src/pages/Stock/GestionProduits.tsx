import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { stockService, type Produit, CATEGORIE_LABELS } from '../../services/stockService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { useConfirm } from '../../components/useConfirm';
import { apiError } from '../../utils/api';
import { formatDT } from '../../utils/format';
import StockTabs from './StockTabs';

const EMPTY: Produit = {
  code: '', nom: '', description: '', categorie: 'LINGE', unite: 'pièce',
  prixUnitaire: 0, seuilMinimum: 0, seuilMaximum: 0, fournisseur: '',
};

export default function GestionProduits() {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const isAdmin = hasAnyRole(['ADMIN']);
  const [confirm, confirmDialog] = useConfirm();

  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState<Produit | null>(null);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try { setProduits((await stockService.getAllProduits()).data); }
    catch (e) { setError(apiError(e, 'Impossible de charger les produits.')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = <K extends keyof Produit>(k: K, v: Produit[K]) => setForm(f => (f ? { ...f, [k]: v } : f));

  const handleSave = async () => {
    if (!form) return;
    if (!form.code.trim() || !form.nom.trim()) { setFormError('Le code et le nom sont obligatoires.'); return; }
    if (form.seuilMaximum && form.seuilMaximum < form.seuilMinimum) { setFormError('Le seuil maximum doit être supérieur au seuil minimum.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (form.id) await stockService.updateProduit(form.id, form);
      else await stockService.createProduit(form);
      setForm(null);
      load();
    } catch (e) {
      setFormError(apiError(e, 'Erreur lors de l\'enregistrement.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Produit) => {
    if (!(await confirm(`Supprimer le produit ${p.nom} ?`, { danger: true }))) return;
    try { await stockService.deleteProduit(p.id!); load(); }
    catch (e) { setError(apiError(e, 'Le produit n\'a pas pu être supprimé.')); }
  };

  return (
    <div className="container-fluid p-4">
      {confirmDialog}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Stock</h2>
        {canManage && (
          <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => { setForm({ ...EMPTY }); setFormError(''); }}>
            <Plus size={18} /> Nouveau produit
          </button>
        )}
      </div>
      <StockTabs />

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="border-bottom">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="py-3">Nom</th>
                <th className="py-3">Catégorie</th>
                <th className="py-3">Prix unitaire</th>
                <th className="py-3">Seuils</th>
                <th className="py-3">Fournisseur</th>
                {(canManage || isAdmin) && <th className="py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>
              ) : produits.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-4">Aucun produit</td></tr>
              ) : produits.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-muted">{p.code}</td>
                  <td className="py-3 fw-semibold">{p.nom}</td>
                  <td className="py-3">{CATEGORIE_LABELS[p.categorie] ?? p.categorie}</td>
                  <td className="py-3 text-nowrap">{formatDT(p.prixUnitaire)} / {p.unite}</td>
                  <td className="py-3 text-muted">{p.seuilMinimum} – {p.seuilMaximum}</td>
                  <td className="py-3 text-muted">{p.fournisseur || '—'}</td>
                  {(canManage || isAdmin) && (
                    <td className="py-3">
                      <div className="d-flex gap-1">
                        {canManage && (
                          <button className="btn btn-sm btn-outline-dark" title="Modifier" onClick={() => { setForm({ ...p }); setFormError(''); }}>
                            <Pencil size={13} />
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-sm btn-outline-danger" title="Supprimer" onClick={() => handleDelete(p)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{form.id ? `Modifier ${form.nom}` : 'Nouveau produit'}</h5>
                <button className="btn btn-sm btn-light" onClick={() => setForm(null)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="p-code">Code *</label>
                    <input id="p-code" className="form-control" value={form.code} onChange={e => set('code', e.target.value)} />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-semibold" htmlFor="p-nom">Nom *</label>
                    <input id="p-nom" className="form-control" value={form.nom} onChange={e => set('nom', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="p-cat">Catégorie</label>
                    <select id="p-cat" className="form-select" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
                      {Object.entries(CATEGORIE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="p-prix">Prix unitaire</label>
                    <div className="input-group">
                      <input id="p-prix" type="number" min={0} step="0.001" className="form-control" value={form.prixUnitaire || ''}
                        onChange={e => set('prixUnitaire', Number(e.target.value))} />
                      <span className="input-group-text">DT</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="p-unite">Unité</label>
                    <input id="p-unite" className="form-control" value={form.unite} onChange={e => set('unite', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="p-min">Seuil d'alerte</label>
                    <input id="p-min" type="number" min={0} className="form-control" value={form.seuilMinimum || ''}
                      onChange={e => set('seuilMinimum', Number(e.target.value))} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="p-max">Stock maximum</label>
                    <input id="p-max" type="number" min={0} className="form-control" value={form.seuilMaximum || ''}
                      onChange={e => set('seuilMaximum', Number(e.target.value))} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="p-fourn">Fournisseur</label>
                    <input id="p-fourn" className="form-control" value={form.fournisseur ?? ''} onChange={e => set('fournisseur', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="p-desc">Description</label>
                    <textarea id="p-desc" className="form-control" rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setForm(null)} disabled={saving}>Annuler</button>
                <button className="btn btn-dark d-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={15} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
