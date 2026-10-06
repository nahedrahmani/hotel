import React, { useState, useEffect } from 'react';
import { Plus, X, User, BedDouble } from 'lucide-react';
import {
  clientService,
  type Demande,
  type DemandeType,
  type DemandePriority,
  type DemandeStatut,
  DEMANDE_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUT_COLORS,
  STATUT_LABELS,
} from '../../services/clientService';
import { reservationService, guestLabel, type Reservation } from '../../services/reservationService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';

const COLUMNS: DemandeStatut[] = ['OUVERTE', 'EN_COURS', 'TRAITEE', 'FERMEE'];

const NEXT_STATUT: Partial<Record<DemandeStatut, DemandeStatut>> = {
  OUVERTE: 'EN_COURS',
  EN_COURS: 'TRAITEE',
  TRAITEE: 'FERMEE',
};

const EMPTY_FORM: Demande = {
  keycloakId: '',
  type: 'OTHER',
  description: '',
  priority: 'NORMAL',
};

const DemandesPage: React.FC = () => {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const [demandes, setDemandes]   = useState<Demande[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<Demande>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [assignModal, setAssignModal] = useState<{ id: number; current?: string } | null>(null);
  const [assignTo, setAssignTo]   = useState('');

  // Bookings give each request a guest name and a room number
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const stayOf = (d: Demande) => reservations.find(r => r.id === d.reservationId);
  const inHouse = reservations.filter(r => r.status === 'CHECKED_IN' || r.status === 'CONFIRMED');

  const fetchDemandes = async () => {
    setLoading(true);
    setError('');
    try {
      const [res, resas] = await Promise.all([clientService.getAllDemandes(), reservationService.getAll()]);
      setDemandes(res.data);
      setReservations(resas.data);
    } catch {
      setError('Impossible de charger les demandes.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDemandes(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const pickStay = (id: number) => {
    const r = reservations.find(x => x.id === id);
    // A desk booking has no guest account; the request is then tied to the stay only
    setForm(f => ({ ...f, reservationId: r?.id, chambreId: r?.roomId, keycloakId: r?.keycloakId ?? '' }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await clientService.createDemande(form);
      setShowForm(false);
      fetchDemandes();
    } catch (e) {
      setError(apiError(e, 'Erreur lors de la création.'));
    } finally { setSaving(false); }
  };

  const advance = async (d: Demande) => {
    const next = NEXT_STATUT[d.statut!];
    if (!next) return;
    try {
      await clientService.updateStatut(d.id!, next);
      fetchDemandes();
    } catch {
      setError('Erreur lors de la mise à jour du statut.');
    }
  };

  const close = async (d: Demande) => {
    try {
      await clientService.updateStatut(d.id!, 'FERMEE');
      fetchDemandes();
    } catch {
      setError('Erreur lors de la clôture.');
    }
  };

  const handleAssign = async () => {
    if (!assignModal) return;
    try {
      await clientService.assignDemande(assignModal.id, assignTo);
      setAssignModal(null);
      setAssignTo('');
      fetchDemandes();
    } catch {
      setError('Erreur lors de l\'assignation.');
    }
  };

  const byStatut = (s: DemandeStatut) => demandes.filter(d => d.statut === s);

  if (loading) return <div className="text-center p-5"><div className="spinner-border" /></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Demandes & Réclamations</h2>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={openCreate}>
          <Plus size={18} /> Nouvelle demande
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {COLUMNS.map(s => (
          <div className="col-6 col-lg-3" key={s}>
            <div className="card border-0 shadow-sm">
              <div className="card-body py-3">
                <div className={`fs-3 fw-bold text-${STATUT_COLORS[s]}`}>{byStatut(s).length}</div>
                <div className="text-muted small">{STATUT_LABELS[s]}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="row g-3">
        {COLUMNS.map(col => (
          <div className="col-lg-3 col-md-6" key={col}>
            <div className="card border-0 shadow-sm h-100">
              <div className={`card-header border-0 bg-${STATUT_COLORS[col]} bg-opacity-10`}>
                <span className={`fw-semibold text-${STATUT_COLORS[col]}`}>
                  {STATUT_LABELS[col]} ({byStatut(col).length})
                </span>
              </div>
              <div className="card-body p-2" style={{ minHeight: 200 }}>
                {byStatut(col).map(d => (
                  <div key={d.id} className="card border-0 shadow-sm mb-2">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-dark">{DEMANDE_TYPE_LABELS[d.type]}</span>
                        <span className={`badge bg-${PRIORITY_COLORS[d.priority!]}`}>
                          {PRIORITY_LABELS[d.priority!] ?? d.priority}
                        </span>
                      </div>
                      {d.description && (
                        <p className="small text-dark mb-2" style={{ lineClamp: 2 }}>{d.description}</p>
                      )}
                      {(() => {
                        const stay = stayOf(d);
                        return (
                          <div className="d-flex flex-wrap gap-2 text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                            <span className="d-flex align-items-center gap-1"><User size={11} />{stay ? guestLabel(stay) : 'Client'}</span>
                            {(stay?.chambre?.numero || d.chambreId) && (
                              <span className="d-flex align-items-center gap-1">
                                <BedDouble size={11} />Ch. {stay?.chambre?.numero ?? d.chambreId}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      {d.assignedTo && (
                        <div className="small text-muted mb-2">👤 {d.assignedTo}</div>
                      )}
                      <div className="d-flex gap-1 flex-wrap">
                        {NEXT_STATUT[d.statut!] && (
                          <button className="btn btn-xs btn-outline-dark px-2 py-0" style={{ fontSize: '0.72rem' }} onClick={() => advance(d)}>
                            → {STATUT_LABELS[NEXT_STATUT[d.statut!]!]}
                          </button>
                        )}
                        {canManage && d.statut !== 'FERMEE' && (
                          <button
                            className="btn btn-xs btn-outline-secondary px-2 py-0"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => { setAssignModal({ id: d.id!, current: d.assignedTo }); setAssignTo(d.assignedTo ?? ''); }}
                          >
                            Assigner
                          </button>
                        )}
                        {d.statut !== 'FERMEE' && (
                          <button className="btn btn-xs btn-outline-danger px-2 py-0" style={{ fontSize: '0.72rem' }} onClick={() => close(d)}>
                            Fermer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Nouvelle demande</h5>
                <button className="btn btn-sm btn-light" onClick={() => setShowForm(false)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Séjour *</label>
                    <select className="form-select" value={form.reservationId ?? ''} onChange={e => pickStay(Number(e.target.value))}>
                      <option value="">— Client et chambre —</option>
                      {inHouse.map(r => (
                        <option key={r.id} value={r.id}>
                          {guestLabel(r)} · Ch. {r.chambre?.numero ?? r.roomId} · {r.status === 'CHECKED_IN' ? 'en séjour' : 'arrivée prévue'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DemandeType }))}>
                      {(Object.entries(DEMANDE_TYPE_LABELS) as [DemandeType, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Priorité</label>
                    <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as DemandePriority }))}>
                      {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as DemandePriority[]).map(p => (
                        <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea className="form-control" rows={3} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowForm(false)}>Annuler</button>
                <button className="btn btn-dark" onClick={handleSave} disabled={saving || !form.reservationId}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h6 className="modal-title fw-bold">Assigner à</h6>
                <button className="btn btn-sm btn-light" onClick={() => setAssignModal(null)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                <input className="form-control" placeholder="Nom du responsable" value={assignTo} onChange={e => setAssignTo(e.target.value)} autoFocus />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light btn-sm" onClick={() => setAssignModal(null)}>Annuler</button>
                <button className="btn btn-dark btn-sm" onClick={handleAssign} disabled={!assignTo.trim()}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandesPage;
