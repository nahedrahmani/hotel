import React, { useState, useEffect } from 'react';
import { Search, LogIn, LogOut, CheckCircle, AlertCircle, Package, Plus } from 'lucide-react';
import { clientService, type CheckInRecord } from '../../services/clientService';
import { reservationService, type Reservation, STATUS_LABELS, STATUS_COLORS } from '../../services/reservationService';
import { chambreService } from '../../services/chambreService';
import keycloak from '../../config/keycloak';
import { apiError } from '../../utils/api';
import { formatDate, formatDT } from '../../utils/format';

type ConsoItem = { produitId: number; nom: string; quantite: number; prixUnitaire: number };

type Step = 'search' | 'review' | 'done';

const CheckInOutPage: React.FC = () => {
  const [mode, setMode]               = useState<'CHECKIN' | 'CHECKOUT'>('CHECKIN');
  const [reservationId, setResId]     = useState('');
  const [keycloakId, setKeycloakId]   = useState(keycloak.tokenParsed?.sub ?? '');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [records, setRecords]         = useState<CheckInRecord[]>([]);
  const [step, setStep]               = useState<Step>('search');
  const [docVerified, setDocVerified] = useState(false);
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [result, setResult]           = useState<CheckInRecord | null>(null);
  const [error, setError]             = useState('');

  // Minibar/conso state (checkout only)
  const [, setRoomProduits] = useState<{ id: number; nom: string; prixUnitaire: number }[]>([]);
  const [conso, setConso]               = useState<ConsoItem[]>([]);
  const [savingConso, setSavingConso]   = useState(false);
  const [consoResult, setConsoResult]   = useState<{ ok: boolean; text: string } | null>(null);

  const search = async () => {
    if (!reservationId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const [resRes, recRes] = await Promise.all([
        reservationService.getById(Number(reservationId)),
        clientService.getRecordsByReservation(Number(reservationId)),
      ]);
      setReservation(resRes.data);
      setRecords(recRes.data);
      setStep('review');
    } catch {
      setError('Réservation introuvable. Vérifiez le numéro.');
    } finally {
      setLoading(false); }
  };

  const confirm = async () => {
    if (!reservation) return;
    setProcessing(true);
    setError('');
    try {
      const r = mode === 'CHECKIN'
        ? await clientService.checkIn(reservation.id!, keycloakId, docVerified, notes || undefined)
        : await clientService.checkOut(reservation.id!, keycloakId, notes || undefined);
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
    setConso([]); setRoomProduits([]);
  };

  // Load room's assigned products when a checkout reservation is found
  useEffect(() => {
    if (mode !== 'CHECKOUT' || !reservation?.roomId) { setRoomProduits([]); setConso([]); return; }
    chambreService.getProduitsByChambre(reservation.roomId).then(res => {
      const produits = (res.data ?? []) as { id: number; nom: string; prixUnitaire: number }[];
      setRoomProduits(produits);
      // Pre-fill one entry per room product with quantity 0
      setConso(produits.map(p => ({ produitId: p.id, nom: p.nom, quantite: 0, prixUnitaire: p.prixUnitaire ?? 0 })));
    }).catch(() => { setRoomProduits([]); setConso([]); });
  }, [mode, reservation?.roomId]);

  const updateConsoQty = (produitId: number, qty: number) =>
    setConso(prev => prev.map(c => c.produitId === produitId ? { ...c, quantite: Math.max(0, qty) } : c));

  const submitConso = async () => {
    if (!result) return;
    const toRecord = conso.filter(c => c.quantite > 0);
    if (toRecord.length === 0) return;
    setSavingConso(true);
    setConsoResult(null);
    try {
      await Promise.all(toRecord.map(c =>
        clientService.addConso(result.reservationId!, { chambreId: result.chambreId, produitId: c.produitId, quantite: c.quantite })
      ));
      setConso(prev => prev.map(c => ({ ...c, quantite: 0 })));
      const n = toRecord.length;
      setConsoResult({ ok: true, text: `${n} consommation${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''}.` });
    } catch (e) {
      setConsoResult({ ok: false, text: apiError(e, 'Les consommations n\'ont pas pu être enregistrées.') });
    } finally {
      setSavingConso(false);
    }
  };

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
                <h5 className="fw-bold mb-4">
                  {mode === 'CHECKIN' ? 'Check-in — rechercher la réservation' : 'Check-out — rechercher la réservation'}
                </h5>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Numéro de réservation</label>
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
                <div className="mb-3">
                  <label className="form-label fw-semibold">ID Client (Keycloak)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={keycloakId}
                    onChange={e => setKeycloakId(e.target.value)}
                    placeholder="ID Keycloak du client"
                  />
                  <small className="text-muted">Pré-rempli avec votre propre ID. Modifiez pour un autre client.</small>
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
                      <strong>{reservation.roomId}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Client</small>
                      <strong>{reservation.customerId}</strong>
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
                    Ce check-in sera refusé — la réservation doit être CONFIRMED ou PENDING.
                  </div>
                )}
                {mode === 'CHECKOUT' && !isCheckedIn && (
                  <div className="alert alert-warning py-2 small">
                    <AlertCircle size={14} className="me-1" />
                    Ce check-out sera refusé — la réservation doit être CHECKED_IN.
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
                    Réservation #{result.reservationId} — Chambre {result.chambreId ?? '—'}<br />
                    {new Date(result.actualTime).toLocaleString('fr-FR')}
                  </p>
                  <button className="btn btn-outline-dark btn-sm px-4" onClick={reset}>
                    Nouvelle opération
                  </button>
                </div>
              </div>

              {/* Minibar / conso panel — checkout only */}
              {result.type === 'CHECKOUT' && conso.length > 0 && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <Package size={16} /> Consommation minibar / extras
                    </h6>
                    <p className="text-muted small mb-3">
                      Enregistrez les articles consommés pendant le séjour. Seuls les articles avec une quantité &gt; 0 sont facturés.
                    </p>
                    {conso.map(c => (
                      <div key={c.produitId} className="d-flex align-items-center gap-3 mb-2">
                        <span className="flex-grow-1 small">{c.nom}</span>
                        <span className="text-muted small text-nowrap">{formatDT(c.prixUnitaire)} / u</span>
                        <div className="input-group" style={{ width: 110 }}>
                          <button className="btn btn-sm btn-outline-secondary px-2"
                            onClick={() => updateConsoQty(c.produitId, c.quantite - 1)}>−</button>
                          <input type="number" className="form-control form-control-sm text-center" min={0}
                            value={c.quantite}
                            onChange={e => updateConsoQty(c.produitId, Number(e.target.value))} />
                          <button className="btn btn-sm btn-outline-secondary px-2"
                            onClick={() => updateConsoQty(c.produitId, c.quantite + 1)}>+</button>
                        </div>
                        <span className="text-nowrap small fw-semibold" style={{ minWidth: 60, textAlign: 'right' }}>
                          {formatDT(c.quantite * c.prixUnitaire)}
                        </span>
                      </div>
                    ))}
                    <div className="border-top pt-3 mt-3 d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        Total : {formatDT(conso.reduce((s, c) => s + c.quantite * c.prixUnitaire, 0))}
                      </span>
                      <button className="btn btn-dark btn-sm d-flex align-items-center gap-2"
                        onClick={submitConso} disabled={savingConso || conso.every(c => c.quantite === 0)}>
                        {savingConso ? <span className="spinner-border spinner-border-sm" /> : <Plus size={14} />}
                        Enregistrer la consommation
                      </button>
                    </div>
                    {consoResult && (
                      <div className={`alert py-2 small mt-3 mb-0 ${consoResult.ok ? 'alert-success' : 'alert-danger'}`}>{consoResult.text}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInOutPage;
