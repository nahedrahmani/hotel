import React, { useState, useEffect } from 'react';
import { Search, LogIn, LogOut, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { clientService, type CheckInRecord } from '../../services/clientService';
import { reservationService, type Reservation, STATUS_LABELS, STATUS_COLORS, guestLabel } from '../../services/reservationService';
import { chambreService } from '../../services/chambreService';
import { apiError } from '../../utils/api';
import { formatDate, formatDT, formatStay, isoDate } from '../../utils/format';

type ConsoItem = { produitId: number; nom: string; quantite: number; prixUnitaire: number };

type Step = 'search' | 'review' | 'done';

const CheckInOutPage: React.FC = () => {
  const [mode, setMode]               = useState<'CHECKIN' | 'CHECKOUT'>('CHECKIN');
  const [reservationId, setResId]     = useState('');
  const [bookings, setBookings]       = useState<Reservation[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [records, setRecords]         = useState<CheckInRecord[]>([]);
  const [step, setStep]               = useState<Step>('search');
  const [docVerified, setDocVerified] = useState(false);
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [result, setResult]           = useState<CheckInRecord | null>(null);
  const [error, setError]             = useState('');

  // Minibar of the room, counted before the departure is confirmed (checkout only)
  const [conso, setConso]             = useState<ConsoItem[]>([]);
  const [billed, setBilled]           = useState(0);

  // The desk works from today's list; the booking number search is for anything else
  useEffect(() => {
    if (step !== 'search') return;
    reservationService.getAll().then(res => setBookings(res.data)).catch(() => setBookings([]));
  }, [step]);

  const today = isoDate(new Date());
  const candidates = mode === 'CHECKIN'
    ? bookings.filter(r => (r.status === 'CONFIRMED' || r.status === 'PENDING') && r.checkInDate <= today && r.checkOutDate > today)
    : bookings.filter(r => r.status === 'CHECKED_IN')
        .sort((a, b) => a.checkOutDate.localeCompare(b.checkOutDate));

  const open = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const [resRes, recRes] = await Promise.all([
        reservationService.getById(id),
        clientService.getRecordsByReservation(id),
      ]);
      setReservation(resRes.data);
      setRecords(recRes.data);
      setStep('review');
    } catch {
      setError('Réservation introuvable. Vérifiez le numéro.');
    } finally {
      setLoading(false); }
  };

  const search = () => { if (reservationId.trim()) open(Number(reservationId)); };

  const confirm = async () => {
    if (!reservation) return;
    setProcessing(true);
    setError('');
    try {
      if (mode === 'CHECKOUT') {
        // Extras go on the stay invoice first: the check-out then issues the final invoice
        const taken = conso.filter(c => c.quantite > 0);
        for (const c of taken) {
          await clientService.addConso(reservation.id!, { chambreId: reservation.roomId, produitId: c.produitId, quantite: c.quantite });
        }
        setBilled(taken.reduce((sum, c) => sum + c.quantite * c.prixUnitaire, 0));
        // Counted once: a retry after a failed check-out must not bill them twice
        setConso(prev => prev.map(c => ({ ...c, quantite: 0 })));
      }
      const r = mode === 'CHECKIN'
        ? await clientService.checkIn(reservation.id!, reservation.keycloakId ?? '', docVerified, notes || undefined)
        : await clientService.checkOut(reservation.id!, reservation.keycloakId ?? '', notes || undefined);
      setResult(r.data);
      setStep('done');
    } catch (e) {
      setError(apiError(e, 'Opération impossible. Vérifiez le statut de la réservation.'));
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setStep('search'); setResId(''); setReservation(null);
    setRecords([]); setResult(null); setError('');
    setDocVerified(false); setNotes('');
    setConso([]); setBilled(0);
  };

  // Products stocked in the room (minibar), all at zero until counted
  useEffect(() => {
    if (mode !== 'CHECKOUT' || !reservation?.roomId) { setConso([]); return; }
    chambreService.getProduitsByChambre(reservation.roomId).then(res => {
      const produits = (res.data ?? []) as { id: number; nom: string; prixUnitaire: number }[];
      setConso(produits.map(p => ({ produitId: p.id, nom: p.nom, quantite: 0, prixUnitaire: p.prixUnitaire ?? 0 })));
    }).catch(() => setConso([]));
  }, [mode, reservation?.roomId]);

  const updateConsoQty = (produitId: number, qty: number) =>
    setConso(prev => prev.map(c => c.produitId === produitId ? { ...c, quantite: Math.max(0, qty) } : c));

  const isCheckedIn = reservation?.status === 'CHECKED_IN';

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-4">Check-in / Check-out digital</h2>

      {/* Mode toggle */}
      <div className="btn-group mb-4 shadow-sm">
        <button
          className={`btn btn-${mode === 'CHECKIN' ? 'dark' : 'outline-dark'} d-flex align-items-center gap-2 px-4`}
          onClick={() => { setMode('CHECKIN'); reset(); }}
        >
          <LogIn size={18} /> Check-in
        </button>
        <button
          className={`btn btn-${mode === 'CHECKOUT' ? 'dark' : 'outline-dark'} d-flex align-items-center gap-2 px-4`}
          onClick={() => { setMode('CHECKOUT'); reset(); }}
        >
          <LogOut size={18} /> Check-out
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-7">

          {/* Step 1 — Search */}
          {step === 'search' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">
                  {mode === 'CHECKIN' ? "Arrivées du jour" : 'Clients en séjour'}
                </h5>
                {candidates.length === 0 ? (
                  <p className="text-muted small mb-4">
                    {mode === 'CHECKIN' ? "Aucune arrivée attendue aujourd'hui." : 'Aucun client en séjour.'}
                  </p>
                ) : (
                  <div className="list-group mb-4">
                    {candidates.map(r => (
                      <button key={r.id} type="button" onClick={() => open(r.id!)}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
                        <div>
                          <div className="fw-semibold">{guestLabel(r)}</div>
                          <small className="text-muted">
                            Ch. {r.chambre?.numero ?? r.roomId} · {formatStay(r.checkInDate, r.checkOutDate)} · {r.numberOfGuests ?? 1} pers.
                          </small>
                        </div>
                        <span className="d-flex align-items-center gap-2">
                          {mode === 'CHECKOUT' && r.checkOutDate <= today && <span className="badge text-bg-warning">Départ aujourd'hui</span>}
                          <span className="text-muted small">#{r.id}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mb-1">
                  <label className="form-label fw-semibold small text-muted">Autre réservation — numéro</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ex: 42"
                      value={reservationId}
                      onChange={e => setResId(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') search(); }}
                    />
                    <button className="btn btn-dark" onClick={search} disabled={loading || !reservationId}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : <Search size={16} />}
                    </button>
                  </div>
                </div>
                {error && <div className="alert alert-danger py-2">{error}</div>}
              </div>
            </div>
          )}

          {/* Step 2 — Review */}
          {step === 'review' && reservation && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Confirmation du {mode === 'CHECKIN' ? 'check-in' : 'check-out'}</h5>

                {/* Reservation summary */}
                <div className="p-3 bg-light rounded mb-4">
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block">Réservation</small>
                      <strong>#{reservation.id}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Statut actuel</small>
                      <span className={`badge bg-${reservation.status ? STATUS_COLORS[reservation.status] : 'secondary'}`}>
                        {reservation.status ? STATUS_LABELS[reservation.status] : '—'}
                      </span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Chambre</small>
                      <strong>{reservation.chambre?.numero ?? reservation.roomId}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Client</small>
                      <strong>{guestLabel(reservation)}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Arrivée prévue</small>
                      <strong>{formatDate(reservation.checkInDate)}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Départ prévu</small>
                      <strong>{formatDate(reservation.checkOutDate)}</strong>
                    </div>
                  </div>
                </div>

                {/* Prior records */}
                {records.length > 0 && (
                  <div className="mb-3">
                    <small className="text-muted fw-semibold d-block mb-1">Historique de cette réservation</small>
                    {records.map(r => (
                      <div key={r.id} className="d-flex gap-2 align-items-center mb-1">
                        <span className={`badge bg-${r.type === 'CHECKIN' ? 'success' : 'warning'}`}>
                          {r.type === 'CHECKIN' ? 'Arrivée' : 'Départ'}
                        </span>
                        <small className="text-muted">{new Date(r.actualTime).toLocaleString('fr-FR')}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Validation warning */}
                {mode === 'CHECKIN' && !['CONFIRMED', 'PENDING'].includes(reservation.status ?? '') && (
                  <div className="alert alert-warning py-2 small">
                    <AlertCircle size={14} className="me-1" />
                    Check-in impossible : la réservation doit être en attente ou confirmée.
                  </div>
                )}
                {mode === 'CHECKOUT' && !isCheckedIn && (
                  <div className="alert alert-warning py-2 small">
                    <AlertCircle size={14} className="me-1" />
                    Check-out impossible : le client n’est pas enregistré comme arrivé.
                  </div>
                )}

                {/* Check-in options */}
                {mode === 'CHECKIN' && (
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="docVerified"
                      checked={docVerified}
                      onChange={e => setDocVerified(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="docVerified">
                      Document d'identité vérifié ✓
                    </label>
                  </div>
                )}

                {/* Minibar count — billed on the stay invoice when the departure is confirmed */}
                {mode === 'CHECKOUT' && isCheckedIn && conso.length > 0 && (
                  <div className="border rounded-3 p-3 mb-3">
                    <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
                      <Package size={16} /> Minibar
                    </h6>
                    <p className="text-muted small mb-3">
                      Indiquez ce qui a été consommé : c’est ajouté à la facture du séjour et retiré du stock.
                    </p>
                    {conso.map(c => (
                      <div key={c.produitId} className="d-flex align-items-center gap-3 mb-2">
                        <span className="flex-grow-1 small">{c.nom}</span>
                        <span className="text-muted small text-nowrap">{formatDT(c.prixUnitaire)} / u</span>
                        <div className="input-group input-group-sm" style={{ width: 110 }}>
                          <button className="btn btn-outline-secondary px-2" aria-label={`Retirer un ${c.nom}`}
                            onClick={() => updateConsoQty(c.produitId, c.quantite - 1)}>−</button>
                          <input type="number" className="form-control text-center" min={0}
                            value={c.quantite}
                            onChange={e => updateConsoQty(c.produitId, Number(e.target.value))} />
                          <button className="btn btn-outline-secondary px-2" aria-label={`Ajouter un ${c.nom}`}
                            onClick={() => updateConsoQty(c.produitId, c.quantite + 1)}>+</button>
                        </div>
                        <span className="text-nowrap small fw-semibold" style={{ minWidth: 60, textAlign: 'right' }}>
                          {formatDT(c.quantite * c.prixUnitaire)}
                        </span>
                      </div>
                    ))}
                    <div className="border-top pt-2 mt-2 d-flex justify-content-between small fw-semibold">
                      <span>Total minibar</span>
                      <span>{formatDT(conso.reduce((sum, c) => sum + c.quantite * c.prixUnitaire, 0))}</span>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-semibold small">Notes</label>
                  <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Remarques optionnelles…" />
                </div>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <div className="d-flex gap-2">
                  <button className="btn btn-light" onClick={reset}>← Retour</button>
                  <button className="btn btn-dark flex-grow-1 d-flex align-items-center justify-content-center gap-2" onClick={confirm} disabled={processing}>
                    {processing
                      ? <span className="spinner-border spinner-border-sm" />
                      : mode === 'CHECKIN' ? <><LogIn size={16} /> Confirmer l'arrivée</> : <><LogOut size={16} /> Confirmer le départ</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Done */}
          {step === 'done' && result && (
            <>
              <div className="card border-0 shadow-sm text-center mb-4">
                <div className="card-body p-4">
                  <CheckCircle size={48} className="text-success mb-3" />
                  <h4 className="fw-bold mb-1">
                    {result.type === 'CHECKIN' ? 'Check-in effectué !' : 'Check-out effectué !'}
                  </h4>
                  <p className="text-muted mb-3">
                    {reservation ? guestLabel(reservation) : `Réservation #${result.reservationId}`} — Chambre {reservation?.chambre?.numero ?? result.chambreId ?? '—'}<br />
                    {new Date(result.actualTime).toLocaleString('fr-FR')}
                  </p>
                  {result.type === 'CHECKOUT' && (
                    <p className="small mb-3">
                      Facture du séjour émise{billed > 0 && <>, minibar inclus ({formatDT(billed)})</>}. Le règlement se fait depuis Factures.
                    </p>
                  )}
                  <button className="btn btn-outline-dark btn-sm px-4" onClick={reset}>
                    Nouvelle opération
                  </button>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInOutPage;
