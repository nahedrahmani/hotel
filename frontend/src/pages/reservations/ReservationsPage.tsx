import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, X, Calendar, Users, LogIn, LogOut, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import {
  reservationService,
  type Reservation,
  type ReservationType,
  type ReservationStatus,
  type ReservationStats,
  type Facture,
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../services/reservationService';
import { chambreService, type Chambre } from '../../services/chambreService';
import keycloak from '../../config/keycloak';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';

/** Shows a cancellation policy warning based on hours until check-in. */
const CancellationPolicyNote: React.FC<{ reservation: Reservation }> = ({ reservation }) => {
  const msUntil = new Date(reservation.checkInDate!).setHours(14) - Date.now();
  const hoursUntil = msUntil / 3600000;
  if (hoursUntil >= 48) {
    return <div className="alert alert-success py-2 small mb-3">Annulation gratuite (plus de 48h avant l'arrivée)</div>;
  }
  if (hoursUntil <= 24) {
    return <div className="alert alert-danger py-2 small mb-3">Non remboursable — arrivée dans moins de 24h</div>;
  }
  return <div className="alert alert-warning py-2 small mb-3">Pénalité de 50% applicable — arrivée dans moins de 48h</div>;
};

const EMPTY_FORM: Reservation = {
  roomId: 0,
  checkInDate: '',
  checkOutDate: '',
  numberOfGuests: 1,
  reservationType: 'ON_SITE',
  status: 'PENDING',
  totalPrice: 0,
  depositPaid: 0,
  specialRequests: '',
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({
  label, value, icon, color,
}) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-body d-flex align-items-center gap-3">
      <div className={`rounded-circle bg-${color} bg-opacity-10 p-3 text-${color}`}>{icon}</div>
      <div>
        <div className="fs-4 fw-bold">{value}</div>
        <div className="text-muted small">{label}</div>
      </div>
    </div>
  </div>
);

const ReservationsPage: React.FC = () => {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats]               = useState<ReservationStats | null>(null);
  const [chambres, setChambres]         = useState<Chambre[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [form, setForm]             = useState<Reservation>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget]   = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason]   = useState('');
  const [cancelPenalty, setCancelPenalty] = useState<number | null>(null);

  // Factures panel
  const [factureTarget, setFactureTarget] = useState<Reservation | null>(null);
  const [factures, setFactures]           = useState<Facture[]>([]);
  const [loadingFactures, setLoadingFactures] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | ''>('');
  const [filterType, setFilterType]     = useState<ReservationType | ''>('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    // Stats are ADMIN/MANAGER only; STAFF still gets the list without the stat cards
    reservationService.getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null));
    try {
      const [resRes, chambreRes] = await Promise.all([
        reservationService.getAll(),
        chambreService.getAllChambres(),
      ]);
      setReservations(resRes.data);
      setChambres(chambreRes.data);
    } catch {
      setError('Impossible de charger les réservations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Availability check when room + dates change ───────────────────────────

  useEffect(() => {
    setAvailability(null);
    if (!form.roomId || !form.checkInDate || !form.checkOutDate || editId) return;
    setCheckingAvail(true);
    reservationService.checkAvailability(form.roomId, form.checkInDate, form.checkOutDate)
      .then(res => setAvailability(res.data.available))
      .catch(() => setAvailability(null))
      .finally(() => setCheckingAvail(false));
  }, [form.roomId, form.checkInDate, form.checkOutDate, editId]);

  // ── Price from backend (includes dynamic pricing multipliers) ────────────

  useEffect(() => {
    if (!form.roomId || !form.checkInDate || !form.checkOutDate || editId) return;
    reservationService.getPrice(form.roomId, form.checkInDate, form.checkOutDate)
      .then(res => setForm(f => ({ ...f, totalPrice: res.data.total })))
      .catch(() => {
        // Fallback: simple frontend calculation
        const chambre = chambres.find(c => c.id === form.roomId);
        if (!chambre?.prix) return;
        const nights = Math.max(0, Math.round(
          (new Date(form.checkOutDate).getTime() - new Date(form.checkInDate).getTime()) / 86400000
        ));
        if (nights > 0) setForm(f => ({ ...f, totalPrice: +(chambre.prix! * nights).toFixed(2) }));
      });
  }, [form.roomId, form.checkInDate, form.checkOutDate, editId]);

  // ── CRUD actions ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setAvailability(null);
    setShowModal(true);
  };

  const openEdit = (r: Reservation) => {
    if (r.id == null) return;
    setEditId(r.id);
    setForm({ ...r });
    setFormError('');
    setAvailability(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(''); };

  const handleSave = async () => {
    if (!form.roomId || !form.checkInDate || !form.checkOutDate) {
      setFormError('Chambre et dates sont obligatoires.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editId) {
        await reservationService.update(editId, form);
      } else {
        await reservationService.create({ ...form, keycloakId: keycloak.tokenParsed?.sub });
      }
      closeModal();
      fetchAll();
    } catch (e: unknown) {
      const msg = (e as any)?.response?.data?.message
        ?? (e as any)?.response?.data
        ?? (e instanceof Error ? e.message : null)
        ?? 'Erreur lors de la sauvegarde.';
      setFormError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (r: Reservation) => {
    try {
      await reservationService.confirm(r.id!);
      fetchAll();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Impossible de confirmer.');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelTarget) return;
    try {
      const res = await reservationService.cancel(cancelTarget.id!, cancelReason || undefined);
      setCancelPenalty(res.data.cancellationPenalty ?? null);
      setCancelTarget(null);
      setCancelReason('');
      fetchAll();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Impossible d\'annuler.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer définitivement cette réservation ?')) return;
    try { await reservationService.delete(id); fetchAll(); }
    catch { alert('Erreur lors de la suppression.'); }
  };

  const openFactures = async (r: Reservation) => {
    setFactureTarget(r);
    setLoadingFactures(true);
    try {
      const res = await reservationService.getFactures(r.id!);
      setFactures(res.data);
    } catch { setFactures([]); }
    finally { setLoadingFactures(false); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const nights = (r: Reservation) => {
    if (!r.checkInDate || !r.checkOutDate) return 0;
    return Math.round((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / 86400000);
  };

  const chambreLabel = (r: Reservation) => {
    if (r.chambre) return `${r.chambre.numero} — ${r.chambre.type}`;
    const c = chambres.find(c => c.id === r.roomId);
    return c ? `${c.numero} (${c.type})` : `#${r.roomId}`;
  };

  const filtered = useMemo(
    () => reservations.filter(r =>
      (!filterStatus || r.status === filterStatus) &&
      (!filterType   || r.reservationType === filterType)
    ),
    [reservations, filterStatus, filterType]
  );

  const canConfirm = (r: Reservation) => r.status === 'PENDING';
  const canCancel  = (r: Reservation) => r.status !== 'CANCELLED' && r.status !== 'CHECKED_OUT';

  if (loading) return <div className="text-center p-5"><div className="spinner-border" /></div>;

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Réservations</h2>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={openCreate}>
          <Plus size={18} /> Nouvelle réservation
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <StatCard label="Total"                value={stats.total}          icon={<Calendar size={20} />} color="dark" />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard label="Confirmées"           value={stats.confirmed}      icon={<Users size={20} />}    color="success" />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard label="Check-ins aujourd'hui" value={stats.todayCheckIns} icon={<LogIn size={20} />}    color="primary" />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard label="Check-outs aujourd'hui" value={stats.todayCheckOuts} icon={<LogOut size={20} />} color="warning" />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex gap-3 flex-wrap">
          <select className="form-select w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="">Tous les statuts</option>
            {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select className="form-select w-auto" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
            <option value="">Tous les types</option>
            {(Object.keys(TYPE_LABELS) as ReservationType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <span className="align-self-center text-muted small ms-auto">{filtered.length} résultat(s)</span>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="border-bottom">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="py-3">Chambre</th>
                <th className="py-3">Arrivée</th>
                <th className="py-3">Départ</th>
                <th className="py-3">Nuits</th>
                <th className="py-3">Type</th>
                <th className="py-3">Statut</th>
                <th className="py-3">Prix</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted py-4">Aucune réservation</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-muted">#{r.id}</td>
                  <td className="py-3">
                    <div className="fw-semibold">{chambreLabel(r)}</div>
                    {r.chambre && (
                      <small className="text-muted">
                        Étage {r.chambre.etage ?? '?'} · {r.chambre.capacite} pers.
                        {r.chambre.wifi && ' · WiFi'}
                      </small>
                    )}
                  </td>
                  <td className="py-3">{r.checkInDate}</td>
                  <td className="py-3">{r.checkOutDate}</td>
                  <td className="py-3">{nights(r)}</td>
                  <td className="py-3">
                    <span className="badge bg-secondary bg-opacity-10 text-dark border">
                      {r.reservationType ? TYPE_LABELS[r.reservationType] : '—'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`badge bg-${r.status ? STATUS_COLORS[r.status] : 'secondary'}`}>
                      {r.status ? STATUS_LABELS[r.status] : '—'}
                    </span>
                    {r.cancelReason && (
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>{r.cancelReason}</div>
                    )}
                  </td>
                  <td className="py-3 text-nowrap">
                    {r.totalPrice ? `${r.totalPrice} DT` : '—'}
                    {r.depositPaid ? <div className="text-muted small">Acompte: {r.depositPaid} DT</div> : null}
                  </td>
                  <td className="py-3">
                    <div className="d-flex gap-1 flex-wrap">
                      {canConfirm(r) && (
                        <button className="btn btn-sm btn-outline-success" title="Confirmer" onClick={() => handleConfirm(r)}>
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {canCancel(r) && (
                        <button className="btn btn-sm btn-outline-warning" title="Annuler" onClick={() => { setCancelTarget(r); setCancelReason(''); }}>
                          <XCircle size={13} />
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-secondary" title="Factures" onClick={() => openFactures(r)}>
                        <FileText size={13} />
                      </button>
                      <button className="btn btn-sm btn-outline-dark" title="Modifier" onClick={() => openEdit(r)}>
                        <Edit size={13} />
                      </button>
                      {canManage && (
                        <button className="btn btn-sm btn-outline-danger" title="Supprimer" onClick={() => r.id != null && handleDelete(r.id)}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  {editId ? 'Modifier la réservation' : 'Nouvelle réservation'}
                </h5>
                <button className="btn btn-sm btn-light" onClick={closeModal}><X size={16} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}

                {/* Availability indicator */}
                {!editId && form.roomId > 0 && form.checkInDate && form.checkOutDate && (
                  <div className={`alert py-2 mb-3 d-flex align-items-center gap-2 ${
                    checkingAvail ? 'alert-secondary' :
                    availability === true ? 'alert-success' :
                    availability === false ? 'alert-danger' : 'alert-secondary'
                  }`}>
                    {checkingAvail
                      ? <><span className="spinner-border spinner-border-sm" /> Vérification disponibilité…</>
                      : availability === true
                        ? <><CheckCircle size={16} /> Chambre disponible pour ces dates</>
                        : availability === false
                          ? <><AlertCircle size={16} /> Chambre déjà réservée pour ces dates</>
                          : null}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Chambre *</label>
                    <select
                      className="form-select"
                      value={form.roomId || ''}
                      onChange={e => setForm(f => ({ ...f, roomId: Number(e.target.value) }))}
                    >
                      <option value="">— Sélectionner —</option>
                      {chambres.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.numero} — {c.type} ({c.prix} DT/nuit) · {c.statut}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">ID Client</label>
                    <input type="number" className="form-control" value={form.customerId ?? ''}
                      placeholder="Optionnel"
                      onChange={e => setForm(f => ({ ...f, customerId: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Date d'arrivée *</label>
                    <input type="date" className="form-control" value={form.checkInDate}
                      onChange={e => setForm(f => ({ ...f, checkInDate: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Date de départ *</label>
                    <input type="date" className="form-control" value={form.checkOutDate}
                      onChange={e => setForm(f => ({ ...f, checkOutDate: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Type de réservation</label>
                    <select className="form-select" value={form.reservationType}
                      onChange={e => setForm(f => ({ ...f, reservationType: e.target.value as ReservationType }))}>
                      {(Object.keys(TYPE_LABELS) as ReservationType[]).map(t => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Statut</label>
                    <select className="form-select" value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as ReservationStatus }))}>
                      {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Personnes</label>
                    <input type="number" className="form-control" min={1} value={form.numberOfGuests ?? 1}
                      onChange={e => setForm(f => ({ ...f, numberOfGuests: Number(e.target.value) }))} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Prix total (DT)</label>
                    <input type="number" className="form-control" min={0} value={form.totalPrice ?? ''}
                      onChange={e => setForm(f => ({ ...f, totalPrice: Number(e.target.value) }))} />
                    <small className="text-muted">Calculé avec tarifs week-end et saisons</small>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Acompte (DT)</label>
                    <input type="number" className="form-control" min={0} value={form.depositPaid ?? ''}
                      onChange={e => setForm(f => ({ ...f, depositPaid: Number(e.target.value) }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Demandes spéciales</label>
                    <textarea className="form-control" rows={2} value={form.specialRequests ?? ''}
                      onChange={e => setForm(f => ({ ...f, specialRequests: e.target.value }))}
                      placeholder="Lit bébé, chambre calme, allergies..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={closeModal} disabled={saving}>Annuler</button>
                <button className="btn btn-dark" onClick={handleSave} disabled={saving || (!editId && availability === false)}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}
                  {editId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {cancelTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h6 className="modal-title fw-bold">Annuler la réservation #{cancelTarget.id}</h6>
                <button className="btn btn-sm btn-light" onClick={() => setCancelTarget(null)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                {cancelTarget.totalPrice != null && cancelTarget.checkInDate && (
                  <CancellationPolicyNote reservation={cancelTarget} />
                )}
                <label className="form-label small fw-semibold">Motif d'annulation</label>
                <input className="form-control" placeholder="Optionnel" value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)} autoFocus />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light btn-sm" onClick={() => setCancelTarget(null)}>Retour</button>
                <button className="btn btn-warning btn-sm" onClick={handleCancelSubmit}>Confirmer l'annulation</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Penalty Toast ── */}
      {cancelPenalty != null && cancelPenalty > 0 && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show border-0 shadow" role="alert">
            <div className="toast-header bg-warning">
              <strong className="me-auto">Pénalité d'annulation</strong>
              <button className="btn-close" onClick={() => setCancelPenalty(null)} />
            </div>
            <div className="toast-body">
              Une pénalité de <strong>{cancelPenalty} DT</strong> s'applique selon la politique d'annulation.
            </div>
          </div>
        </div>
      )}

      {/* ── Factures Panel ── */}
      {factureTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h6 className="modal-title fw-bold">Factures — Réservation #{factureTarget.id}</h6>
                <button className="btn btn-sm btn-light" onClick={() => setFactureTarget(null)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                {loadingFactures ? (
                  <div className="text-center"><div className="spinner-border spinner-border-sm" /></div>
                ) : factures.length === 0 ? (
                  <p className="text-muted text-center mb-0 small">Aucune facture liée à cette réservation</p>
                ) : (
                  factures.map((f: Facture) => (
                    <div key={f.id} className="d-flex justify-content-between align-items-start p-3 border rounded mb-2">
                      <div>
                        <div className="fw-semibold">{f.numero}</div>
                        <small className="text-muted">{f.clientNom} · {f.dateEmission}</small>
                      </div>
                      <div className="text-end">
                        <span className={`badge bg-${f.statut === 'PAYEE' ? 'success' : f.statut === 'ANNULEE' ? 'danger' : 'warning'} mb-1`}>
                          {f.statut}
                        </span>
                        <div className="small">{f.totalTTC} DT</div>
                        {Number(f.montantRestant) > 0 && (
                          <div className="text-danger small">Reste: {f.montantRestant} DT</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;