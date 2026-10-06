import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BedDouble, Check, ChevronLeft, Wifi, Wind, Tv, Waves, Sun, Wine, Users } from 'lucide-react';
import { chambreService, type Chambre, ROOM_TYPE_LABELS, roomPhoto } from '../../services/chambreService';
import { reservationService } from '../../services/reservationService';
import keycloak from '../../config/keycloak';
import { apiError } from '../../utils/api';
import { countNights, formatDT, formatStay, isoDate, nightsLabel } from '../../utils/format';

type Step = 'search' | 'rooms' | 'confirm' | 'done';

const isoDay = (offset = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return isoDate(d);
};

/** Rooms a guest would see as the same offer: same type, price and view. */
type Offer = { key: string; rooms: Chambre[]; room: Chambre; total: number };

const offerKey = (r: Chambre) => [r.type, r.prix, !!r.vueMer, !!r.balcon].join('|');

const offerTitle = (r: Chambre) => {
  const extras = [r.vueMer && 'vue mer', r.balcon && 'balcon'].filter(Boolean).join(', ');
  return `${ROOM_TYPE_LABELS[r.type] ?? r.type}${extras ? ` · ${extras}` : ''}`;
};

const AMENITIES: { key: keyof Chambre; label: string; icon: React.ReactNode }[] = [
  { key: 'wifi', label: 'WiFi', icon: <Wifi size={13} /> },
  { key: 'climatisation', label: 'Climatisation', icon: <Wind size={13} /> },
  { key: 'television', label: 'Télévision', icon: <Tv size={13} /> },
  { key: 'minibar', label: 'Minibar', icon: <Wine size={13} /> },
  { key: 'balcon', label: 'Balcon', icon: <Sun size={13} /> },
  { key: 'vueMer', label: 'Vue mer', icon: <Waves size={13} /> },
];

const STEPS: { id: Step; label: string }[] = [
  { id: 'search', label: 'Dates' },
  { id: 'rooms', label: 'Chambre' },
  { id: 'confirm', label: 'Confirmation' },
];

export default function BookingPage() {
  const [params] = useSearchParams();
  const [step, setStep]         = useState<Step>('search');
  const [checkIn, setCheckIn]   = useState(params.get('checkIn') ?? isoDay(0));
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? isoDay(1));
  const [guests, setGuests]     = useState(Number(params.get('guests')) || 1);

  const [allRooms, setAllRooms]       = useState<Chambre[] | null>(null);
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [searching, setSearching]     = useState(false);
  const [searchError, setSearchError] = useState('');

  const [selected, setSelected] = useState<Offer | null>(null);
  const [special, setSpecial]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [doneId, setDoneId]     = useState<number | null>(null);

  const n = countNights(checkIn, checkOut);

  useEffect(() => {
    chambreService.getAllChambres().then(r => setAllRooms(r.data)).catch(() => setAllRooms([]));
  }, []);

  const handleSearch = useCallback(async () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setSearchError('La date de départ doit être après la date d\'arrivée.');
      return;
    }
    if (!allRooms) return;
    setSearching(true);
    setSearchError('');
    try {
      // A room's statut is its state today (occupied, being cleaned...), not its calendar:
      // only out-of-service rooms are excluded, the per-date availability check decides the rest.
      const candidates = allRooms.filter(r => r.statut !== 'hors_service' && (r.capacite ?? 1) >= guests);
      const checks = await Promise.allSettled(
        candidates.map(r => reservationService.checkAvailability(r.id!, checkIn, checkOut)
          .then(res => (res.data.available ? r : null))),
      );
      const free = checks.flatMap(c => (c.status === 'fulfilled' && c.value ? [c.value] : []));

      const groups = new Map<string, Chambre[]>();
      free.forEach(r => groups.set(offerKey(r), [...(groups.get(offerKey(r)) ?? []), r]));

      // Price of one room per offer; the backend applies weekend and season rates
      const priced = await Promise.all([...groups.entries()].map(async ([key, rooms]) => {
        const room = rooms[0];
        const total = await reservationService.getPrice(room.id!, checkIn, checkOut)
          .then(res => Number(res.data.total))
          .catch(() => room.prix * n);
        return { key, rooms, room, total };
      }));
      setOffers(priced.sort((a, b) => a.total - b.total));
      setSelected(null);
      setStep('rooms');
    } catch {
      setSearchError('La recherche a échoué. Réessayez dans un instant.');
    } finally {
      setSearching(false);
    }
  }, [allRooms, checkIn, checkOut, guests, n]);

  // Coming from the home page with dates: search straight away
  const autoSearch = params.has('checkIn') && params.has('checkOut');
  useEffect(() => {
    if (autoSearch && allRooms) handleSearch();
    // run once, when the room list is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRooms]);

  const handleBook = async () => {
    if (!selected || !keycloak.tokenParsed?.sub) return;
    setSaving(true);
    setSaveError('');
    try {
      // The backend computes the price itself; only the stay details are sent
      const res = await reservationService.create({
        roomId: selected.room.id!,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: guests,
        specialRequests: special || undefined,
        reservationType: 'ONLINE',
        keycloakId: keycloak.tokenParsed.sub,
      });
      setDoneId(res.data.id ?? null);
      setStep('done');
    } catch (e) {
      setSaveError(apiError(e, 'La réservation n\'a pas pu être enregistrée.'));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('search'); setSelected(null); setSpecial(''); setSaveError(''); setOffers([]); setDoneId(null);
  };

  const policy = useMemo(() => {
    const r = selected?.room;
    if (!r) return '';
    const free = r.cancellationPolicyHours ?? 48;
    const fee = r.cancellationFeePercent ?? 50;
    const none = r.nonRefundableHours ?? 24;
    return `Annulation gratuite jusqu'à ${free} h avant l'arrivée, ${fee} % du montant ensuite, non remboursable dans les ${none} dernières heures.`;
  }, [selected]);

  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="container py-5" style={{ maxWidth: 820 }}>
      {step !== 'done' && (
        <ol className="list-unstyled d-flex align-items-center gap-3 mb-5 small">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <li className="flex-grow-1 border-top" aria-hidden />}
              <li className={`d-flex align-items-center gap-2 ${i === stepIndex ? 'fw-semibold' : 'text-muted'}`}>
                <span className={`rounded-circle d-inline-flex align-items-center justify-content-center
                  ${i < stepIndex ? 'bg-dark text-white' : i === stepIndex ? 'border border-dark text-dark' : 'border text-muted'}`}
                  style={{ width: 26, height: 26 }}>
                  {i < stepIndex ? <Check size={14} /> : i + 1}
                </span>
                {s.label}
              </li>
            </React.Fragment>
          ))}
        </ol>
      )}

      {step === 'search' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-lg-5">
            <h2 className="fw-bold mb-4">Réserver une chambre</h2>

            {searchError && <div className="alert alert-danger py-2">{searchError}</div>}

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="b-in">Arrivée</label>
                <input id="b-in" type="date" className="form-control" value={checkIn} min={isoDay(0)}
                  onChange={e => setCheckIn(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="b-out">Départ</label>
                <input id="b-out" type="date" className="form-control" value={checkOut} min={checkIn}
                  onChange={e => setCheckOut(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor="b-guests">Personnes</label>
                <select id="b-guests" className="form-select" value={guests} onChange={e => setGuests(Number(e.target.value))}>
                  {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g} personne{g > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4">
              <span className="text-muted small">
                {n > 0 ? `${nightsLabel(n)} · ${formatStay(checkIn, checkOut)}` : ''}
              </span>
              <button className="btn btn-dark d-flex align-items-center gap-2"
                onClick={handleSearch} disabled={searching || !allRooms}>
                {searching ? <span className="spinner-border spinner-border-sm" /> : <Search size={16} />}
                Voir les chambres disponibles
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'rooms' && (
        <div>
          <div className="d-flex justify-content-between align-items-end mb-3">
            <div>
              <h2 className="fw-bold mb-1">Choisissez votre chambre</h2>
              <div className="text-muted small">{formatStay(checkIn, checkOut)} · {nightsLabel(n)} · {guests} pers.</div>
            </div>
            <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1" onClick={() => setStep('search')}>
              <ChevronLeft size={14} /> Modifier
            </button>
          </div>

          {offers.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <BedDouble size={40} className="text-muted opacity-50 mb-3" />
                <div className="fw-semibold">Aucune chambre libre pour ces dates</div>
                <div className="text-muted small mb-3">
                  {allRooms?.length === 0 ? 'Aucune chambre n\'est encore enregistrée.' : `Essayez d'autres dates ou moins de ${guests} personnes par chambre.`}
                </div>
                <button className="btn btn-dark" onClick={() => setStep('search')}>Changer les dates</button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {offers.map(offer => {
                const r = offer.room;
                const isSel = selected?.key === offer.key;
                return (
                  <button key={offer.key} type="button" onClick={() => setSelected(offer)}
                    className={`card shadow-sm text-start p-0 ${isSel ? 'border-dark' : 'border-0'}`}
                    style={{ outline: isSel ? '1px solid var(--bs-dark)' : undefined }}>
                    <div className="card-body d-flex gap-3 align-items-start">
                      <img src={roomPhoto(r)} alt="" loading="lazy" className="rounded-2 flex-shrink-0 d-none d-sm-block"
                        style={{ width: 200, height: 133, objectFit: 'cover' }} />
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{offerTitle(r)}</div>
                        <div className="text-muted small d-flex align-items-center gap-1 mb-2">
                          <Users size={13} /> Jusqu'à {r.capacite} pers.
                          {r.superficie ? ` · ${r.superficie} m²` : ''}
                        </div>
                        {r.description && <div className="small mb-2">{r.description}</div>}
                        <div className="d-flex flex-wrap gap-3 text-muted small">
                          {AMENITIES.filter(a => r[a.key]).map(a => (
                            <span key={a.key} className="d-flex align-items-center gap-1">{a.icon}{a.label}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div className="fw-bold fs-5">{formatDT(offer.total)}</div>
                        <div className="text-muted small">{nightsLabel(n)}</div>
                        <div className={`small mt-1 ${offer.rooms.length === 1 ? 'text-danger' : 'text-muted'}`}>
                          {offer.rooms.length === 1 ? 'Dernière chambre' : `${offer.rooms.length} disponibles`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selected && (
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-dark" onClick={() => setStep('confirm')}>Continuer</button>
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && selected && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <h2 className="fw-bold mb-0">Vérifiez votre séjour</h2>
              <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1" onClick={() => setStep('rooms')}>
                <ChevronLeft size={14} /> Retour
              </button>
            </div>

            {saveError && <div className="alert alert-danger py-2">{saveError}</div>}

            <dl className="row mb-0">
              <dt className="col-sm-4 text-muted fw-normal">Chambre</dt>
              <dd className="col-sm-8 fw-semibold">{offerTitle(selected.room)}</dd>
              <dt className="col-sm-4 text-muted fw-normal">Séjour</dt>
              <dd className="col-sm-8">{formatStay(checkIn, checkOut)} · {nightsLabel(n)}</dd>
              <dt className="col-sm-4 text-muted fw-normal">Personnes</dt>
              <dd className="col-sm-8">{guests}</dd>
              <dt className="col-sm-4 text-muted fw-normal border-top pt-3">Total</dt>
              <dd className="col-sm-8 fw-bold fs-5 border-top pt-3">{formatDT(selected.total)}</dd>
            </dl>

            <div className="mb-3 mt-3">
              <label className="form-label fw-semibold" htmlFor="b-special">
                Demandes particulières <span className="text-muted small fw-normal">(facultatif)</span>
              </label>
              <textarea id="b-special" className="form-control" rows={2} value={special}
                onChange={e => setSpecial(e.target.value)} placeholder="Lit bébé, étage élevé, allergies…" />
            </div>

            <p className="text-muted small">{policy}</p>

            <button className="btn btn-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              onClick={handleBook} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm" />}
              Envoyer la demande de réservation
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5 text-center">
            <div className="rounded-circle bg-success-subtle text-success d-inline-flex p-3 mb-3">
              <Check size={28} />
            </div>
            <h2 className="fw-bold mb-2">Demande enregistrée</h2>
            {doneId && <p className="mb-1">Réservation n° {doneId}</p>}
            <p className="text-muted mb-4">
              L'hôtel doit encore la confirmer. Suivez son statut et réglez votre facture depuis Mes réservations.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Link to="/dashboard/mes-reservations" className="btn btn-dark">Mes réservations</Link>
              <button className="btn btn-light" onClick={reset}>Autre réservation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
