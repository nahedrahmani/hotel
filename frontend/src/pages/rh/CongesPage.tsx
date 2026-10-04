import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Check, Ban } from 'lucide-react';
import {
  rhService, type Conge, type Employe, type StatutConge, type TypeConge,
  STATUT_CONGE_COLORS,
} from '../../services/rhService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';
import { useConfirm } from '../../components/useConfirm';
import { formatDate } from '../../utils/format';

const TYPE_LABELS: Record<TypeConge, string> = {
  CONGE_PAYE: 'Congé payé', MALADIE: 'Maladie', MATERNITE_PATERNITE: 'Maternité/Paternité',
  SANS_SOLDE: 'Sans solde', FORMATION: 'Formation', AUTRE: 'Autre',
};
const STATUT_LABELS: Record<StatutConge, string> = {
  EN_ATTENTE: 'En attente', APPROUVE: 'Approuvé', REFUSE: 'Refusé', ANNULE: 'Annulé',
};
const TYPES: TypeConge[] = ['CONGE_PAYE', 'MALADIE', 'MATERNITE_PATERNITE', 'SANS_SOLDE', 'FORMATION', 'AUTRE'];
const STATUTS: StatutConge[] = ['EN_ATTENTE', 'APPROUVE', 'REFUSE', 'ANNULE'];

const EMPTY: Conge = { employeId: 0, typeConge: 'CONGE_PAYE', dateDebut: '', dateFin: '' };

export default function CongesPage() {
  const [confirm, confirmDialog] = useConfirm();
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const [conges, setConges] = useState<Conge[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutConge | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Conge>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, eRes] = await Promise.all([rhService.getAllConges(), rhService.getAllEmployes()]);
      setConges(cRes.data);
      setEmployes(eRes.data);
    } catch { setError('Impossible de charger les congés.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    conges.filter(c => !filterStatut || c.statut === filterStatut),
    [conges, filterStatut]);

  const enAttente = conges.filter(c => c.statut === 'EN_ATTENTE').length;

  const handleCreate = async () => {
    if (!form.employeId || !form.dateDebut || !form.dateFin) {
      setFormError('Employé et dates sont obligatoires.'); return;
    }
    setSaving(true);
    try {
      await rhService.createConge(form);
      setShowModal(false);
      load();
    } catch (e: unknown) {
      setFormError(apiError(e, 'Erreur.'));
    } finally { setSaving(false); }
  };

  const handleApprouver = async (id: number) => {
    try { await rhService.approuverConge(id, 'manager'); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur.')); }
  };

  const handleRefuser = async (id: number) => {
    try { await rhService.refuserConge(id, 'manager'); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur.')); }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm('Supprimer cette demande ?', { danger: true }))) return;
    try { await rhService.deleteConge(id); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur.')); }
  };

  return (
    <div className="container-fluid p-4">
      {confirmDialog}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Congés</h2>
          {enAttente > 0 && <span className="badge bg-warning text-dark">{enAttente} en attente</span>}
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => { setForm(EMPTY); setFormError(''); setShowModal(true); }}>
          <Plus size={18} /> Demande de congé
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex gap-3 flex-wrap">
          <select className="form-select w-auto" value={filterStatut} onChange={e => setFilterStatut(e.target.value as typeof filterStatut)}>
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
          </select>
          <span className="align-self-center text-muted small ms-auto">{filtered.length} demande(s)</span>
        </div>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="border-bottom">
                <tr>
                  <th className="px-4 py-3">Employé</th>
                  <th>Type</th>
                  <th>Du</th>
                  <th>Au</th>
                  <th>Jours</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">Aucune demande</td></tr>}
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 fw-semibold">{c.employePrenom} {c.employeNom}</td>
                    <td><span className="badge bg-secondary bg-opacity-10 text-dark border">{TYPE_LABELS[c.typeConge]}</span></td>
                    <td className="text-nowrap">{formatDate(c.dateDebut)}</td>
                    <td className="text-nowrap">{formatDate(c.dateFin)}</td>
                    <td className="fw-semibold">{c.nombreJours}j</td>
                    <td className="text-muted small">{c.motif ?? '—'}</td>
                    <td><span className={`badge bg-${STATUT_CONGE_COLORS[c.statut ?? 'EN_ATTENTE']}`}>{STATUT_LABELS[c.statut ?? 'EN_ATTENTE']}</span></td>
                    <td>
                      <div className="d-flex gap-2">
                        {canManage && c.statut === 'EN_ATTENTE' && (
                          <>
                            <button className="btn btn-sm btn-success d-flex align-items-center gap-1" aria-label="Approuver" onClick={() => handleApprouver(c.id!)}><Check size={14} /></button>
                            <button className="btn btn-sm btn-danger d-flex align-items-center gap-1" aria-label="Refuser" onClick={() => handleRefuser(c.id!)}><Ban size={14} /></button>
                          </>
                        )}
                        {canManage && c.statut !== 'APPROUVE' && (
                          <button className="btn btn-sm btn-outline-danger" aria-label="Supprimer" onClick={() => handleDelete(c.id!)}>✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Demande de congé</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={16} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Employé *</label>
                    <select className="form-select" value={form.employeId} onChange={e => setForm(f => ({ ...f, employeId: Number(e.target.value) }))}>
                      <option value={0}>— Sélectionner —</option>
                      {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Type de congé *</label>
                    <select className="form-select" value={form.typeConge} onChange={e => setForm(f => ({ ...f, typeConge: e.target.value as TypeConge }))}>
                      {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Date début *</label>
                    <input type="date" className="form-control" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Date fin *</label>
                    <input type="date" className="form-control" value={form.dateFin} onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Motif</label>
                    <textarea className="form-control" rows={3} value={form.motif ?? ''} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowModal(false)} disabled={saving}>Annuler</button>
                <button className="btn btn-dark" onClick={handleCreate} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null} Soumettre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
