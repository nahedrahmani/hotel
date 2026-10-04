import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { reservationService, type Reservation, STATUS_LABELS, STATUS_COLORS, TYPE_LABELS } from './services/reservationService';
import { formatDT, formatStay } from './utils/format';

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type DayInfo = {
  hasCheckIn: boolean;
  hasCheckOut: boolean;
  hasStay: boolean;
  reservations: Reservation[];
};

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayMap, setDayMap] = useState<Map<string, DayInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstOfMonth = toDateStr(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const lastOfMonth = toDateStr(year, month, lastDay);

  useEffect(() => {
    setLoading(true);
    reservationService.search(firstOfMonth, lastOfMonth)
      .then(res => {
        const map = new Map<string, DayInfo>();

        const ensure = (d: string) => {
          if (!map.has(d)) map.set(d, { hasCheckIn: false, hasCheckOut: false, hasStay: false, reservations: [] });
          return map.get(d)!;
        };

        for (const r of res.data) {
          if (!r.checkInDate || !r.checkOutDate) continue;

          // Mark every day the guest stays
          const start = new Date(r.checkInDate);
          const end = new Date(r.checkOutDate);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const ds = d.toISOString().split('T')[0];
            const info = ensure(ds);
            if (ds === r.checkInDate) info.hasCheckIn = true;
            else if (ds === r.checkOutDate) info.hasCheckOut = true;
            else info.hasStay = true;
            info.reservations.push(r);
          }
        }

        setDayMap(new Map(map));
      })
      .catch(() => {/* silent — calendar shows empty on auth failure */})
      .finally(() => setLoading(false));
  }, [firstOfMonth, lastOfMonth]);

  const daysInMonth = lastDay;
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1; // Monday-first

  const todayStr = new Date().toISOString().split('T')[0];

  const selectedInfo = selectedDay ? dayMap.get(selectedDay) : null;

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <h2 className="fw-bold mb-0">{MONTH_NAMES[month]} {year}</h2>
          {loading && <div className="spinner-border spinner-border-sm text-muted" />}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light" onClick={prev}><ChevronLeft size={20} /></button>
          <button className="btn btn-outline-dark btn-sm px-3" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
          <button className="btn btn-light" onClick={next}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="row g-4">
        {/* Calendar grid */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-3">
            {/* Day headers */}
            <div className="row g-1 mb-2">
              {DAY_NAMES.map(d => (
                <div key={d} className="col text-center">
                  <small className="text-muted fw-semibold">{d}</small>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="row g-1">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`e${i}`} className="col" style={{ minHeight: 70 }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const ds = toDateStr(year, month, day);
                const info = dayMap.get(ds);
                const isToday = ds === todayStr;
                const isSelected = ds === selectedDay;

                let bg = 'bg-white';
                if (info?.hasCheckIn) bg = 'bg-success bg-opacity-10';
                else if (info?.hasCheckOut) bg = 'bg-warning bg-opacity-10';
                else if (info?.hasStay) bg = 'bg-primary bg-opacity-10';

                return (
                  <div key={day} className="col" style={{ minHeight: 70 }}>
                    <div
                      className={`rounded p-2 h-100 cursor-pointer ${bg} ${isSelected ? 'border border-dark border-2' : 'border'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDay(isSelected ? null : ds)}
                    >
                      <div className={`fw-bold small ${isToday ? 'text-danger' : ''}`}>{day}</div>
                      {info && (
                        <div className="mt-1 d-flex flex-column gap-1">
                          {info.hasCheckIn && <span className="badge bg-success" style={{ fontSize: '0.6rem' }}>▶ Arrivée</span>}
                          {info.hasCheckOut && <span className="badge bg-warning text-dark" style={{ fontSize: '0.6rem' }}>◀ Départ</span>}
                          {info.hasStay && !info.hasCheckIn && !info.hasCheckOut && (
                            <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>● Séjour</span>
                          )}
                          <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                            {info.reservations.length} rés.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="d-flex gap-3 mt-3 flex-wrap">
            <span className="d-flex align-items-center gap-1 small text-muted">
              <span className="badge bg-success">▶</span> Arrivée
            </span>
            <span className="d-flex align-items-center gap-1 small text-muted">
              <span className="badge bg-warning text-dark">◀</span> Départ
            </span>
            <span className="d-flex align-items-center gap-1 small text-muted">
              <span className="badge bg-primary">●</span> Séjour en cours
            </span>
          </div>
        </div>

        {/* Side panel */}
        <div className="col-lg-4">
          {selectedDay && selectedInfo ? (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h6>
                <button className="btn btn-sm btn-light" onClick={() => setSelectedDay(null)}><X size={14} /></button>
              </div>
              <div className="card-body p-0">
                {[...new Map(selectedInfo.reservations.map(r => [r.id, r])).values()].map(r => (
                  <div key={r.id} className="p-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="fw-semibold small">Réservation #{r.id}</span>
                      <span className={`badge bg-${r.status ? STATUS_COLORS[r.status] : 'secondary'}`}>
                        {r.status ? STATUS_LABELS[r.status] : '—'}
                      </span>
                    </div>
                    <div className="text-muted small">Chambre {r.roomId}</div>
                    <div className="text-muted small">{formatStay(r.checkInDate, r.checkOutDate)}</div>
                    {r.reservationType && (
                      <div className="text-muted small">Type: {TYPE_LABELS[r.reservationType]}</div>
                    )}
                    {r.totalPrice && (
                      <div className="text-muted small">Prix : {formatDT(r.totalPrice)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center text-muted py-5">
                <Calendar size={32} className="mb-2 opacity-50" />
                <p className="mb-0 small">Cliquez sur un jour pour voir les réservations</p>
              </div>
            </div>
          )}

          {/* Month summary */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Résumé du mois</h6>
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Jours avec arrivées</span>
                <strong>{[...dayMap.values()].filter(d => d.hasCheckIn).length}</strong>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Jours avec départs</span>
                <strong>{[...dayMap.values()].filter(d => d.hasCheckOut).length}</strong>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Jours occupés</span>
                <strong>{dayMap.size}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// needed for the empty-state icon inside JSX
function Calendar({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
