import { useState, useEffect, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import {
  rhService, type Tache, type Employe, type StatutTache, type PrioriteTache,
  PRIORITE_COLORS, STATUT_TACHE_COLORS,
} from '../../services/rhService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';
import { useConfirm } from '../../components/useConfirm';
import { formatDate } from '../../utils/format';

const STATUTS: StatutTache[] = ['A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE'];
const PRIORITES: PrioriteTache[] = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'];

const STATUT_LABELS: Record<StatutTache, string> = {
  A_FAIRE: 'À faire', EN_COURS: 'En cours', TERMINE: 'Terminé', ANNULE: 'Annulé',
};
const PRIORITE_LABELS: Record<PrioriteTache, string> = {
  BASSE: 'Basse', NORMALE: 'Normale', HAUTE: 'Haute', URGENTE: 'Urgente',
};

const EMPTY_TACHE: Tache = { titre: '', description: '', priorite: 'NORMALE', statut: 'A_FAIRE' };

export default function TachesPage() {
  const [confirm, confirmDialog] = useConfirm();
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutTache | ''>('');
  const [filterPriorite, setFilterPriorite] = useState<PrioriteTache | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Tache>(EMPTY_TACHE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [tRes, eRes] = await Promise.all([rhService.getAllTaches(), rhService.getAllEmployes()]);
      setTaches(tRes.data);
      setEmployes(eRes.data);
    } catch { setError('Impossible de charger les tâches.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    taches.filter(t =>
      (!filterStatut || t.statut === filterStatut) &&
      (!filterPriorite || t.priorite === filterPriorite)
    ), [taches, filterStatut, filterPriorite]);

  const byStatut = (s: StatutTache) => filtered.filter(t => t.statut === s);

  const openCreate = () => { setEditId(null); setForm(EMPTY_TACHE); setFormError(''); setShowModal(true); };
  const openEdit = (t: Tache) => { setEditId(t.id!); setForm({ ...t }); setFormError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.titre.trim()) { setFormError('Le titre est obligatoire.'); return; }
    setSaving(true);
    try {
      if (editId) await rhService.updateTache(editId, form);
      else await rhService.createTache(form);
      setShowModal(false);
      load();
    } catch (e: unknown) {
      setFormError(apiError(e, 'Erreur.'));
    } finally { setSaving(false); }
  };

  const handleStatut = async (id: number, statut: StatutTache) => {
    try { await rhService.changerStatutTache(id, statut); load(); }
    catch { setError('Erreur lors du changement de statut.'); }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm('Supprimer cette tâche ?', { danger: true }))) return;
    try { await rhService.deleteTache(id); load(); }
    catch { setError('Erreur lors de la suppression.'); }
  };

  const KanbanColumn = ({ statut }: { statut: StatutTache }) => {
    const items = byStatut(statut);
    return (
      <div className="col">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
            <span className="fw-semibold">{STATUT_LABELS[statut]}</span>
            <span className={`badge bg-${STATUT_TACHE_COLORS[statut]}`}>{items.length}</span>
          </div>
          <div className="card-body p-2" style={{ minHeight: 300 }}>
            {items.map(t => (
              <div key={t.id} className="card border-0 shadow-sm mb-2 p-2" onClick={() => canManage && openEdit(t)} style={{ cursor: canManage ? 'pointer' : 'default' }}>
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <span className="fw-semibold small">{t.titre}</span>
                  <span className={`badge bg-${PRIORITE_COLORS[t.priorite ?? 'NORMALE']} ms-1`}>{PRIORITE_LABELS[t.priorite ?? 'NORMALE']}</span>
                </div>
                {t.description && <div className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>{t.description.substring(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
                {t.assigneANom && <div className="small text-muted"><i className="bi bi-person me-1" />{t.assigneANom}</div>}
                {t.dateEcheance && <div className="small text-muted">Échéance : {formatDate(t.dateEcheance)}</div>}
                <div className="d-flex gap-1 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  {STATUTS.filter(s => s !== t.statut).map(s => (
                    <button key={s} className={`btn btn-sm py-0 px-1 btn-outline-${STATUT_TACHE_COLORS[s]}`} style={{ fontSize: '0.7rem' }}
                      onClick={() => handleStatut(t.id!, s)}>{STATUT_LABELS[s]}</button>
                  ))}
                  {canManage && <button className="btn btn-sm py-0 px-1 btn-outline-danger" style={{ fontSize: '0.7rem' }} onClick={() => handleDelete(t.id!)}>✕</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid p-4">
      {confirmDialog}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Tâches</h2>
        {canManage && (
          <button className="btn btn-dark d-flex align-items-center gap-2" onClick={openCreate}>
            <Plus size={18} /> Nouvelle tâche
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex gap-3 flex-wrap">
          <select className="form-select w-auto" value={filterStatut} onChange={e => setFilterStatut(e.target.value as typeof filterStatut)}>
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
          </select>
          <select className="form-select w-auto" value={filterPriorite} onChange={e => setFilterPriorite(e.target.value as typeof filterPriorite)}>
            <option value="">Toutes les priorités</option>
            {PRIORITES.map(p => <option key={p} value={p}>{PRIORITE_LABELS[p]}</option>)}
          </select>
          <span className="align-self-center text-muted small ms-auto">{filtered.length} tâche(s)</span>
        </div>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
        <div className="row g-3">
          {STATUTS.map(s => <KanbanColumn key={s} statut={s} />)}
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{editId ? 'Modifier la tâche' : 'Nouvelle tâche'}</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={16} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Titre *</label>
                    <input type="text" className="form-control" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows={3} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Priorité</label>
                    <select className="form-select" value={form.priorite} onChange={e => setForm(f => ({ ...f, priorite: e.target.value as PrioriteTache }))}>
                      {PRIORITES.map(p => <option key={p} value={p}>{PRIORITE_LABELS[p]}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Assigné à</label>
                    <select className="form-select" value={form.assigneAId ?? ''} onChange={e => setForm(f => ({ ...f, assigneAId: e.target.value ? Number(e.target.value) : undefined }))}>
                      <option value="">— Non assigné —</option>
                      {employes.filter(e => e.statut === 'ACTIF').map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Date d'échéance</label>
                    <input type="date" className="form-control" value={form.dateEcheance ?? ''} onChange={e => setForm(f => ({ ...f, dateEcheance: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowModal(false)} disabled={saving}>Annuler</button>
                <button className="btn btn-dark" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  {editId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
