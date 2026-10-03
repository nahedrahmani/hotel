import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BedDouble, CheckCircle, ChevronRight, Wifi, Wind, Sunset } from 'lucide-react';
import { chambreService, type Chambre } from '../../services/chambreService';
import { reservationService } from '../../services/reservationService';
import keycloak from '../../config/keycloak';

type Step = 'search' | 'rooms' | 'confirm' | 'done';

const today = () => new Date().toISOString().split('T')[0];
const tomorrow = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

function nights(checkIn: string, checkOut: string) {
  return Math.max(0, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>('search');
  const [checkIn, setCheckIn]   = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [guests, setGuests]     = useState(1);

  const [allRooms, setAllRooms]     = useState<Chambre[]>([]);
  const [available, setAvailable]   = useState<Chambre[]>([]);
  const [prices, setPrices]         = useState<Record<number, number>>({});
  const [searching, setSearching]   = useState(false);
  const [searchError, setSearchError] = useState('');

  const [selected, setSelected]     = useState<Chambre | null>(null);
  const [special, setSpecial]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [doneId, setDoneId]         = useState<number | null>(null);

  useEffect(() => {
    chambreService.getAllChambres().then(r => setAllRooms(r.data)).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setSearchError('Sélectionnez des dates valides.');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      // A room's statut is its state today (occupied, being cleaned...), not its calendar:
      // only out-of-service rooms are excluded, the per-date availability check decides the rest.
      const disponible = allRooms.filter(r => r.statut !== 'hors_service' && (r.capacite ?? 1) >= guests);
      const checks = await Promise.allSettled(
        disponible.map(r =>
          reservationService.checkAvailability(r.id!, checkIn, checkOut)
            .then(res => ({ room: r, available: res.data.available }))
        )
      );
      const avail = checks
        .filter((c): c is PromiseFulfilledResult<{ room: Chambre; available: boolean }> =>
          c.status === 'fulfilled' && c.value.available)
        .map(c => c.value.room);

      setAvailable(avail);

      // Fetch dynamic prices in parallel
      const priceResults = await Promise.allSettled(
        avail.map(r =>
          reservationService.getPrice(r.id!, checkIn, checkOut)
            .then(res => ({ id: r.id!, total: Number(res.data.total) }))
        )
      );
      const priceMap: Record<number, number> = {};
      priceResults.forEach(p => {
        if (p.status === 'fulfilled') priceMap[p.value.id] = p.value.total;
      });
      setPrices(priceMap);
      setStep('rooms');
    } catch {
      setSearchError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setSearching(false);
    }
  };

  const handleBook = async () => {
    if (!selected || !keycloak.tokenParsed?.sub) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await reservationService.create({
        roomId: selected.id!,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: guests,
        specialRequests: special || undefined,
        reservationType: 'ONLINE',
        totalPrice: prices[selected.id!],
        keycloakId: keycloak.tokenParsed.sub,
      });
      setDoneId(res.data.id ?? null);
      setStep('done');
    } catch (e: any) {
      setSaveError(e?.response?.data ?? 'Erreur lors de la réservation.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('search');
    setSelected(null);
    setSpecial('');
    setSaveError('');
    setAvailable([]);
    setPrices({});
    setDoneId(null);
  };

  const n = nights(checkIn, checkOut);

  if (!keycloak.authenticated) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: 500 }}>
        <BedDouble size={48} className="text-muted mb-3 opacity-50" />
        <h4 className="fw-bold mb-2">Connectez-vous pour réserver</h4>
        <p className="text-muted mb-4">Vous devez être connecté pour effectuer une réservation.</p>
        <button className="btn btn-dark" onClick={() => keycloak.login()}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 860 }}>
      {/* Progress bar */}
      {step !== 'done' && (
        <div className="d-flex align-items-center gap-2 mb-5 justify-content-center">
          {(['search', 'rooms', 'confirm'] as Step[]).map((s, i) => {
            const labels = ['Dates', 'Chambres', 'Confirmation'];
            const stepIdx = ['search', 'rooms', 'confirm'].indexOf(step);
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <React.Fragment key={s}>
                {i > 0 && <div className={`flex-grow-1 border-top ${done ? 'border-dark' : 'border-secondary'}`} style={{ height: 1 }} />}
                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold small
                  ${active ? 'bg-dark text-white' : done ? 'bg-success text-white' : 'bg-light text-muted'}`}
                  style={{ width: 32, height: 32, flexShrink: 0 }}>
                  {done ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`small ${active ? 'fw-semibold' : 'text-muted'}`}>{labels[i]}</span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Step 1: Search ── */}
      {step === 'search' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-lg-5">
            <h3 className="fw-bold mb-1">Réserver une chambre</h3>
            <p className="text-muted mb-4">Choisissez vos dates et nous vous montrons ce qui est disponible.</p>

            {searchError && <div className="alert alert-danger">{searchError}</div>}

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Arrivée</label>
                <input type="date" className="form-control" value={checkIn} min={today()}
                  onChange={e => setCheckIn(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Départ</label>
                <input type="date" className="form-control" value={checkOut} min={checkIn}
                  onChange={e => setCheckOut(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Personnes</label>
                <select className="form-select" value={guests} onChange={e => setGuests(Number(e.target.value))}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>

            {checkIn && checkOut && checkOut > checkIn && (
              <div className="mt-3 text-muted small">
                {n} nuit{n > 1 ? 's' : ''} · {checkIn} → {checkOut}
              </div>
            )}

            <button className="btn btn-dark d-flex align-items-center gap-2 mt-4"
              onClick={handleSearch} disabled={searching}>
              {searching
                ? <><span className="spinner-border spinner-border-sm" /> Recherche…</>
                : <><Search size={16} /> Rechercher les disponibilités</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Room selection ── */}
      {step === 'rooms' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold mb-0">{available.length} chambre{available.length !== 1 ? 's' : ''} disponible{available.length !== 1 ? 's' : ''}</h4>
              <small className="text-muted">{checkIn} → {checkOut} · {n} nuit{n > 1 ? 's' : ''} · {guests} pers.</small>
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setStep('search')}>
              ← Modifier
            </button>
          </div>

          {available.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5 text-muted">
                <BedDouble size={48} className="mb-3 opacity-25" />
                <div className="fs-5">Aucune chambre disponible pour ces dates</div>
                <button className="btn btn-dark mt-3" onClick={() => setStep('search')}>Modifier les dates</button>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {available.map(room => (
                <div key={room.id} className="col-12">
                  <div className={`card border-0 shadow-sm ${selected?.id === room.id ? 'border border-dark' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(room)}>
                    <div className="card-body">
                      <div className="row align-items-center g-3">
                        {room.photo && (
                          <div className="col-auto">
                            <img src={room.photo} alt={room.numero}
                              style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8 }} />
                          </div>
                        )}
                        <div className="col">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-bold">Chambre {room.numero} — {room.type}</div>
                              <div className="text-muted small">
                                Étage {room.etage ?? '?'} · {room.capacite} pers. max
                              </div>
                              <div className="d-flex gap-2 mt-1 flex-wrap">
                                {room.wifi && <span className="text-muted small d-flex align-items-center gap-1"><Wifi size={12} />WiFi</span>}
                                {room.climatisation && <span className="text-muted small d-flex align-items-center gap-1"><Wind size={12} />Clim</span>}
                                {room.balcon && <span className="text-muted small d-flex align-items-center gap-1"><Sunset size={12} />Balcon</span>}
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold fs-5">
                                {prices[room.id!] != null ? `${prices[room.id!]} DT` : `${(room.prix * n).toFixed(0)} DT`}
                              </div>
                              <div className="text-muted small">pour {n} nuit{n > 1 ? 's' : ''}</div>
                              <div className="text-muted small">{room.prix} DT/nuit</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-auto">
                          {selected?.id === room.id
                            ? <CheckCircle size={24} className="text-success" />
                            : <ChevronRight size={24} className="text-muted" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-dark d-flex align-items-center gap-2"
                onClick={() => setStep('confirm')}>
                Continuer <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 'confirm' && selected && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <h4 className="fw-bold mb-0">Confirmer la réservation</h4>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setStep('rooms')}>← Retour</button>
            </div>

            {saveError && <div className="alert alert-danger">{saveError}</div>}

            {/* Summary */}
            <div className="card bg-light border-0 rounded-3 p-3 mb-4">
              <div className="row g-2">
                <div className="col-6"><div className="text-muted small">Chambre</div><div className="fw-semibold">{selected.numero} — {selected.type}</div></div>
                <div className="col-6"><div className="text-muted small">Étage</div><div className="fw-semibold">{selected.etage ?? '—'}</div></div>
                <div className="col-6"><div className="text-muted small">Arrivée</div><div className="fw-semibold">{checkIn}</div></div>
                <div className="col-6"><div className="text-muted small">Départ</div><div className="fw-semibold">{checkOut}</div></div>
                <div className="col-6"><div className="text-muted small">Durée</div><div className="fw-semibold">{n} nuit{n > 1 ? 's' : ''}</div></div>
                <div className="col-6"><div className="text-muted small">Personnes</div><div className="fw-semibold">{guests}</div></div>
                <div className="col-12 border-top mt-2 pt-2">
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Total</span>
                    <span className="fw-bold fs-5">
                      {prices[selected.id!] != null ? `${prices[selected.id!]} DT` : `${(selected.prix * n).toFixed(2)} DT`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Demandes spéciales <span className="text-muted small fw-normal">(optionnel)</span></label>
              <textarea className="form-control" rows={3} value={special}
                onChange={e => setSpecial(e.target.value)}
                placeholder="Lit bébé, chambre calme, allergies alimentaires…" />
            </div>

            <div className="alert alert-info small mb-4">
              Annulation gratuite jusqu'à 48h avant l'arrivée. Une pénalité peut s'appliquer après ce délai.
            </div>

            <button className="btn btn-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              onClick={handleBook} disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm" /> Réservation en cours…</>
                : <><CheckCircle size={18} /> Confirmer la réservation</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && (
        <div className="card border-0 shadow-sm text-center">
          <div className="card-body p-5">
            <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-4 mb-4">
              <CheckCircle size={48} className="text-success" />
            </div>
            <h3 className="fw-bold mb-2">Réservation confirmée !</h3>
            {doneId && <p className="text-muted mb-1">Numéro de réservation : <strong>#{doneId}</strong></p>}
            <p className="text-muted small mb-4">
              Un email de confirmation vous sera envoyé. Vous pouvez consulter vos réservations dans <em>Mes réservations</em>.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button className="btn btn-dark" onClick={reset}>Nouvelle réservation</button>
              <Link to="/dashboard/mes-reservations" className="btn btn-outline-dark">Mes réservations</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
