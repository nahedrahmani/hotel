import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, FileText, XCircle, BedDouble, Plus } from 'lucide-react';
import {
  reservationService,
  type Reservation,
  type Facture,
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_LABELS,
} from '../../services/reservationService';
import keycloak from '../../config/keycloak';

const MyReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]     = useState(false);

  // Factures panel
  const [factureTarget, setFactureTarget]     = useState<Reservation | null>(null);
  const [factures, setFactures]               = useState<Facture[]>([]);
  const [loadingFactures, setLoadingFactures] = useState(false);

  const keycloakId = keycloak.tokenParsed?.sub;

  const load = useCallback(async () => {
    if (!keycloakId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await reservationService.getByKeycloak(keycloakId);
      setReservations(res.data);
    } catch {
      setError('Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  }, [keycloakId]);

  useEffect(() => { load(); }, [load]);

  const nights = (r: Reservation) => {
    if (!r.checkInDate || !r.checkOutDate) return 0;
    return Math.round(
      (new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / 86400000
    );
  };

  const canCancel = (r: Reservation) =>
    r.status !== 'CANCELLED' && r.status !== 'CHECKED_OUT' && r.status !== 'CHECKED_IN';

  const handleCancelSubmit = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await reservationService.cancel(cancelTarget.id!, cancelReason || undefined);
      setCancelTarget(null);
      setCancelReason('');
      load();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Impossible d\'annuler.');
    } finally {
      setCancelling(false);
    }
  };

  const openFactures = async (r: Reservation) => {
    setFactureTarget(r);
    setLoadingFactures(true);
    try {
      const res = await reservationService.getFactures(r.id!);
      setFactures(res.data);
    } catch {
      setFactures([]);
    } finally {
      setLoadingFactures(false);
    }
  };

  if (!keycloakId) {
    return (
      <div className="container p-5 text-center text-muted">
        Vous devez être connecté pour voir vos réservations.
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <BedDouble size={22} />
          <h2 className="fw-bold mb-0">Mes réservations</h2>
        </div>
        <Link to="/dashboard/reserver" className="btn btn-dark d-flex align-items-center gap-2">
          <Plus size={16} /> Réserver une chambre
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-5">
          <BedDouble size={48} className="text-muted mb-3 opacity-25" />
          <div className="text-muted mb-3">Vous n'avez aucune réservation.</div>
          <Link to="/dashboard/reserver" className="btn btn-dark d-flex align-items-center gap-2 mx-auto" style={{ width: 'fit-content' }}>
            <Plus size={16} /> Réserver une chambre
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {reservations.map(r => (
            <div key={r.id} className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="text-muted small">Réservation #{r.id}</span>
                      {r.chambre && (
                        <div className="fw-bold fs-6 mt-1">
                          Chambre {r.chambre.numero} — {r.chambre.type}
                        </div>
                      )}
                    </div>
                    <span className={`badge bg-${r.status ? STATUS_COLORS[r.status] : 'secondary'}`}>
                      {r.status ? STATUS_LABELS[r.status] : '—'}
                    </span>
                  </div>

                  <div className="row g-2 text-sm mb-3">
                    <div className="col-6">
                      <div className="text-muted small">Arrivée</div>
                      <div className="fw-semibold">{r.checkInDate}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Départ</div>
                      <div className="fw-semibold">{r.checkOutDate}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Durée</div>
                      <div>{nights(r)} nuit{nights(r) > 1 ? 's' : ''}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Type</div>
                      <div>{r.reservationType ? TYPE_LABELS[r.reservationType] : '—'}</div>
                    </div>
                    {r.totalPrice != null && (
                      <div className="col-6">
                        <div className="text-muted small">Total</div>
                        <div className="fw-semibold">{r.totalPrice} DT</div>
                      </div>
                    )}
                    {r.numberOfGuests && (
                      <div className="col-6">
                        <div className="text-muted small">Personnes</div>
                        <div>{r.numberOfGuests}</div>
                      </div>
                    )}
                  </div>

                  {r.specialRequests && (
                    <div className="text-muted small fst-italic mb-3">"{r.specialRequests}"</div>
                  )}

                  {r.cancelReason && (
                    <div className="alert alert-warning py-1 px-2 small mb-3">
                      Motif d'annulation : {r.cancelReason}
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openFactures(r)}
                    >
                      <FileText size={13} className="me-1" />Factures
                    </button>
                    {canCancel(r) && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => { setCancelTarget(r); setCancelReason(''); }}
                      >
                        <XCircle size={13} className="me-1" />Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {cancelTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h6 className="modal-title fw-bold">Annuler la réservation #{cancelTarget.id}</h6>
                <button className="btn btn-sm btn-light" onClick={() => setCancelTarget(null)}>
                  <X size={14} />
                </button>
              </div>
              <div className="modal-body">
                <label className="form-label small fw-semibold">Motif (optionnel)</label>
                <input
                  className="form-control"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light btn-sm" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                  Retour
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleCancelSubmit} disabled={cancelling}>
                  {cancelling && <span className="spinner-border spinner-border-sm me-1" />}
                  Confirmer
                </button>
              </div>
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
                <button className="btn btn-sm btn-light" onClick={() => setFactureTarget(null)}>
                  <X size={14} />
                </button>
              </div>
              <div className="modal-body">
                {loadingFactures ? (
                  <div className="text-center"><div className="spinner-border spinner-border-sm" /></div>
                ) : factures.length === 0 ? (
                  <p className="text-muted text-center mb-0 small">Aucune facture pour cette réservation.</p>
                ) : (
                  factures.map(f => (
                    <div key={f.id} className="d-flex justify-content-between align-items-start p-3 border rounded mb-2">
                      <div>
                        <div className="fw-semibold">{f.numero}</div>
                        <small className="text-muted">{f.dateEmission}</small>
                      </div>
                      <div className="text-end">
                        <span className={`badge bg-${f.statut === 'PAYEE' ? 'success' : f.statut === 'ANNULEE' ? 'danger' : 'warning'} mb-1`}>
                          {f.statut}
                        </span>
                        <div className="small">{f.totalTTC} DT</div>
                        {Number(f.montantRestant) > 0 && (
                          <div className="text-danger small">Reste : {f.montantRestant} DT</div>
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

export default MyReservationsPage;
