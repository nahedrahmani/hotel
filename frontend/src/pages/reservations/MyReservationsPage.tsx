import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { X, FileText, BedDouble, CreditCard, ConciergeBell } from 'lucide-react';
import {
  reservationService,
  cancellationPenalty,
  type Reservation,
  type Facture,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../services/reservationService';
import { ROOM_TYPE_LABELS, roomPhoto } from '../../services/chambreService';
import {
  clientService, type Demande, type DemandeType,
  DEMANDE_TYPE_LABELS, STATUT_LABELS as DEMANDE_STATUT_LABELS, STATUT_COLORS as DEMANDE_STATUT_COLORS,
} from '../../services/clientService';
import { paymentService, STATUT_FACTURE_LABELS, STATUT_FACTURE_COLORS, type StatutFacture } from '../../services/paymentService';
import keycloak from '../../config/keycloak';
import { apiError } from '../../utils/api';
import { countNights, formatDate, formatDT, formatStay, nightsLabel } from '../../utils/format';

const ENDED = ['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'];
// A draft can be prepaid online: payment-service issues it when the money comes in
const PAYABLE: string[] = ['BROUILLON', 'EMISE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'];

const roomTitle = (r: Reservation) =>
  r.chambre ? `${ROOM_TYPE_LABELS[r.chambre.type] ?? r.chambre.type} · chambre ${r.chambre.numero}` : `Réservation n° ${r.id}`;

// Upcoming stays first (soonest at the top), then past and cancelled ones, most recent first
const byRelevance = (a: Reservation, b: Reservation) => {
  const aDone = ENDED.includes(a.status ?? ''), bDone = ENDED.includes(b.status ?? '');
  if (aDone !== bDone) return aDone ? 1 : -1;
  return aDone
    ? (b.checkInDate ?? '').localeCompare(a.checkInDate ?? '')
    : (a.checkInDate ?? '').localeCompare(b.checkInDate ?? '');
};

const MyReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]     = useState(false);
  const [cancelError, setCancelError]   = useState('');

  const [factureTarget, setFactureTarget]     = useState<Reservation | null>(null);
  const [factures, setFactures]               = useState<Facture[]>([]);
  const [loadingFactures, setLoadingFactures] = useState(false);
  const [facturesError, setFacturesError]     = useState('');
  const [paying, setPaying]                   = useState<number | null>(null);
  const [onlinePayment, setOnlinePayment]     = useState(false);
  // Konnect sends the guest back here with ?paiement=ok|echec&payment_ref=…
  const [params, setParams]                   = useSearchParams();
  const [payResult, setPayResult]             = useState<{ ok: boolean; text: string } | null>(null);

  // Requests to the reception (ménage, room service...) during a confirmed or ongoing stay
  const [demandes, setDemandes]           = useState<Demande[]>([]);
  const [demandeTarget, setDemandeTarget] = useState<Reservation | null>(null);
  const [demandeType, setDemandeType]     = useState<DemandeType>('HOUSEKEEPING');
  const [demandeText, setDemandeText]     = useState('');
  const [sending, setSending]             = useState(false);
  const [demandeError, setDemandeError]   = useState('');

  const keycloakId = keycloak.tokenParsed?.sub;

  const load = useCallback(async () => {
    if (!keycloakId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await reservationService.getByKeycloak(keycloakId);
      setReservations([...res.data].sort(byRelevance));
      // Requests are secondary: the page still works if they fail to load
      clientService.getDemandesByClient(keycloakId).then(r => setDemandes(r.data)).catch(() => setDemandes([]));
    } catch {
      setError('Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  }, [keycloakId]);

  useEffect(() => { load(); }, [load]);

  const canRequest = (r: Reservation) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN';

  const handleDemandeSubmit = async () => {
    if (!demandeTarget || !keycloakId) return;
    setSending(true);
    setDemandeError('');
    try {
      const res = await clientService.createDemande({
        keycloakId, reservationId: demandeTarget.id, chambreId: demandeTarget.roomId,
        type: demandeType, description: demandeText.trim() || undefined, priority: 'NORMAL',
      });
      setDemandes(d => [res.data, ...d]);
      setDemandeTarget(null);
    } catch (e) {
      setDemandeError(apiError(e, 'La demande n\'a pas pu être envoyée.'));
    } finally {
      setSending(false);
    }
  };

  const canCancel = (r: Reservation) => !ENDED.includes(r.status ?? '') && r.status !== 'CHECKED_IN';

  const handleCancelSubmit = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    try {
      await reservationService.cancel(cancelTarget.id!, cancelReason || undefined);
      setCancelTarget(null);
      load();
    } catch (e) {
      setCancelError(apiError(e, 'L\'annulation a échoué.'));
    } finally {
      setCancelling(false);
    }
  };

  const loadFactures = useCallback(async (r: Reservation) => {
    setLoadingFactures(true);
    setFacturesError('');
    try {
      setFactures((await reservationService.getFactures(r.id!)).data);
    } catch (e) {
      setFactures([]);
      setFacturesError(apiError(e, 'Impossible de charger les factures.'));
    } finally {
      setLoadingFactures(false);
    }
  }, []);

  const openFactures = (r: Reservation) => { setFactureTarget(r); loadFactures(r); };

  // Online payment is offered only when the hotel has set up its Konnect keys
  useEffect(() => {
    paymentService.onlinePaymentStatus().then(r => setOnlinePayment(r.data.enabled)).catch(() => setOnlinePayment(false));
  }, []);

  const payOnline = async (factureId: number) => {
    setPaying(factureId);
    setFacturesError('');
    try {
      const res = await paymentService.startOnlinePayment(factureId);
      window.location.assign(res.data.payUrl);
    } catch (e) {
      setFacturesError(apiError(e, 'Le paiement en ligne n\'a pas pu démarrer.'));
      setPaying(null);
    }
  };

  // Back from Konnect: the payment counts only once Konnect confirms it to payment-service
  useEffect(() => {
    const result = params.get('paiement');
    const ref = params.get('payment_ref');
    if (!result) return;
    setParams({}, { replace: true });
    if (result !== 'ok' || !ref) {
      setPayResult({ ok: false, text: 'Le paiement n\'a pas abouti. Aucun montant n\'a été débité.' });
      return;
    }
    paymentService.confirmOnlinePayment(ref)
      .then(r => setPayResult({ ok: true, text: `Paiement de ${formatDT(r.data.montant)} reçu, merci. Votre facture est à jour.` }))
      .catch(e => setPayResult({ ok: false, text: apiError(e, 'Le paiement n\'a pas pu être confirmé.') }));
  }, [params, setParams]);

  if (!keycloakId) {
    return <div className="container p-5 text-center text-muted">Connectez-vous pour voir vos réservations.</div>;
  }

  const penalty = cancelTarget ? cancellationPenalty(cancelTarget) : 0;

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Mes réservations</h2>
        {reservations.length > 0 && (
          <Link to="/dashboard/reserver" className="btn btn-dark">Réserver une chambre</Link>
        )}
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {payResult && (
        <div className={`alert ${payResult.ok ? 'alert-success' : 'alert-danger'} py-2 d-flex justify-content-between align-items-center`}>
          <span>{payResult.text}</span>
          <button className="btn btn-sm btn-light" onClick={() => setPayResult(null)} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : reservations.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <BedDouble size={40} className="text-muted opacity-50 mb-3" />
            <div className="fw-semibold mb-1">Aucune réservation pour l'instant</div>
            <div className="text-muted small mb-3">Vos séjours apparaîtront ici dès votre première demande.</div>
            <Link to="/dashboard/reserver" className="btn btn-dark">Réserver une chambre</Link>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {reservations.map(r => {
            const n = countNights(r.checkInDate, r.checkOutDate);
            const ended = ENDED.includes(r.status ?? '');
            return (
              <div key={r.id} className="col-12 col-lg-6">
                <div className={`card border-0 shadow-sm h-100 overflow-hidden ${ended ? 'opacity-75' : ''}`}>
                  {r.chambre && (
                    <img src={roomPhoto(r.chambre)} alt="" loading="lazy" className="card-img-top"
                      style={{ height: 140, objectFit: 'cover' }} />
                  )}
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="fw-semibold">{roomTitle(r)}</div>
                        <div className="text-muted small">Réservation n° {r.id}</div>
                      </div>
                      <span className={`badge bg-${r.status ? STATUS_COLORS[r.status] : 'secondary'}`}>
                        {r.status ? STATUS_LABELS[r.status] : '—'}
                      </span>
                    </div>

                    <dl className="row small mb-3 g-0">
                      <dt className="col-4 text-muted fw-normal">Séjour</dt>
                      <dd className="col-8 mb-1">{formatStay(r.checkInDate, r.checkOutDate)} · {nightsLabel(n)}</dd>
                      {r.numberOfGuests != null && <>
                        <dt className="col-4 text-muted fw-normal">Personnes</dt>
                        <dd className="col-8 mb-1">{r.numberOfGuests}</dd>
                      </>}
                      <dt className="col-4 text-muted fw-normal">Total</dt>
                      <dd className="col-8 mb-1 fw-semibold">{formatDT(r.totalPrice)}</dd>
                      {r.specialRequests && <>
                        <dt className="col-4 text-muted fw-normal">Demandes</dt>
                        <dd className="col-8 mb-1">{r.specialRequests}</dd>
                      </>}
                      {r.cancelReason && <>
                        <dt className="col-4 text-muted fw-normal">Motif</dt>
                        <dd className="col-8 mb-1">{r.cancelReason}</dd>
                      </>}
                    </dl>

                    {demandes.some(d => d.reservationId === r.id) && (
                      <ul className="list-unstyled small border-top pt-2 mb-3">
                        {demandes.filter(d => d.reservationId === r.id).map(d => (
                          <li key={d.id} className="d-flex justify-content-between align-items-center py-1">
                            <span>{DEMANDE_TYPE_LABELS[d.type]}{d.description ? ` — ${d.description}` : ''}</span>
                            <span className={`badge bg-${DEMANDE_STATUT_COLORS[d.statut ?? 'OUVERTE']}`}>{DEMANDE_STATUT_LABELS[d.statut ?? 'OUVERTE']}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="d-flex gap-2 mt-auto flex-wrap">
                      {canRequest(r) && (
                        <button className="btn btn-sm btn-dark d-flex align-items-center gap-1"
                          onClick={() => { setDemandeTarget(r); setDemandeType('HOUSEKEEPING'); setDemandeText(''); setDemandeError(''); }}>
                          <ConciergeBell size={13} /> Faire une demande
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1" onClick={() => openFactures(r)}>
                        <FileText size={13} /> Factures
                      </button>
                      {canCancel(r) && (
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={() => { setCancelTarget(r); setCancelReason(''); setCancelError(''); }}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {demandeTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h6 className="modal-title fw-bold">Demande à la réception — {roomTitle(demandeTarget)}</h6>
                <button className="btn btn-sm btn-light" onClick={() => setDemandeTarget(null)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                {demandeError && <div className="alert alert-danger py-2">{demandeError}</div>}
                <label className="form-label small fw-semibold" htmlFor="d-type">Type</label>
                <select id="d-type" className="form-select mb-3" value={demandeType}
                  onChange={e => setDemandeType(e.target.value as DemandeType)}>
                  {(Object.keys(DEMANDE_TYPE_LABELS) as DemandeType[]).map(t => (
                    <option key={t} value={t}>{DEMANDE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <label className="form-label small fw-semibold" htmlFor="d-text">Précisions <span className="text-muted fw-normal">(facultatif)</span></label>
                <textarea id="d-text" className="form-control" rows={3} value={demandeText}
                  onChange={e => setDemandeText(e.target.value)} placeholder="Heure souhaitée, nombre de serviettes, destination…" />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setDemandeTarget(null)} disabled={sending}>Annuler</button>
                <button className="btn btn-dark d-flex align-items-center gap-2" onClick={handleDemandeSubmit} disabled={sending}>
                  {sending && <span className="spinner-border spinner-border-sm" />}
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h6 className="modal-title fw-bold">Annuler la réservation n° {cancelTarget.id}</h6>
                <button className="btn btn-sm btn-light" onClick={() => setCancelTarget(null)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                {cancelError && <div className="alert alert-danger py-2">{cancelError}</div>}
                <div className={`alert py-2 small ${penalty === 0 ? 'alert-success' : 'alert-warning'}`}>
                  {penalty === 0
                    ? 'Annulation gratuite.'
                    : penalty >= (cancelTarget.totalPrice ?? 0)
                      ? `Arrivée trop proche : le séjour n'est plus remboursable (${formatDT(penalty)}).`
                      : `Une pénalité de ${formatDT(penalty)} s'applique selon la politique de la chambre.`}
                </div>
                <label className="form-label small fw-semibold" htmlFor="cancel-reason">Motif <span className="text-muted fw-normal">(facultatif)</span></label>
                <input id="cancel-reason" className="form-control" value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)} />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setCancelTarget(null)} disabled={cancelling}>Garder la réservation</button>
                <button className="btn btn-danger d-flex align-items-center gap-2" onClick={handleCancelSubmit} disabled={cancelling}>
                  {cancelling && <span className="spinner-border spinner-border-sm" />}
                  Annuler la réservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {factureTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h6 className="modal-title fw-bold">Factures — réservation n° {factureTarget.id}</h6>
                <button className="btn btn-sm btn-light" onClick={() => setFactureTarget(null)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                {facturesError && <div className="alert alert-danger py-2">{facturesError}</div>}
                {loadingFactures ? (
                  <div className="text-center"><div className="spinner-border spinner-border-sm" /></div>
                ) : factures.length === 0 && !facturesError ? (
                  <p className="text-muted small mb-0">
                    Pas encore de facture. Elle est établie par l'hôtel une fois la réservation confirmée.
                  </p>
                ) : (
                  factures.map(f => {
                    const statut = f.statut as StatutFacture;
                    return (
                      <div key={f.id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 mb-2">
                        <div>
                          <div className="fw-semibold">{f.numero}</div>
                          <small className="text-muted">Émise le {formatDate(f.dateEmission)}</small>
                        </div>
                        <div className="text-end">
                          <span className={`badge bg-${STATUT_FACTURE_COLORS[statut] ?? 'secondary'} mb-1`}>
                            {STATUT_FACTURE_LABELS[statut] ?? f.statut}
                          </span>
                          <div className="small">{formatDT(f.totalTTC)}</div>
                          {PAYABLE.includes(f.statut) && Number(f.montantRestant) > 0 && (onlinePayment ? (
                            <button className="btn btn-sm btn-dark mt-2 d-flex align-items-center gap-1 ms-auto"
                              onClick={() => payOnline(f.id)} disabled={paying !== null}>
                              {paying === f.id ? <span className="spinner-border spinner-border-sm" /> : <CreditCard size={13} />}
                              Payer en ligne {formatDT(f.montantRestant)}
                            </button>
                          ) : (
                            <div className="text-muted small mt-1">Reste {formatDT(f.montantRestant)}, à régler à la réception</div>
                          ))}
                        </div>
                      </div>
                    );
                  })
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
