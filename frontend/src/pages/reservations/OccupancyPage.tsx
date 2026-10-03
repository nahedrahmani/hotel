import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, BedDouble, LogIn, LogOut, BarChart2 } from 'lucide-react';
import { reservationService, type Reservation, STATUS_LABELS, STATUS_COLORS } from '../../services/reservationService';
import { chambreService, type Chambre } from '../../services/chambreService';

type RoomOccupancy = {
  chambre: Chambre;
  reservation: Reservation | null;
  isCheckIn: boolean;
  isCheckOut: boolean;
};

const today = () => new Date().toISOString().split('T')[0];

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string }> = ({
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

const OccupancyPage: React.FC = () => {
  const [date, setDate] = useState(today());
  const [occupancy, setOccupancy] = useState<RoomOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [chambreRes, reservations] = await Promise.all([
        chambreService.getAllChambres(),
        reservationService.search(date, date).then(r => r.data),
      ]);

      const chambres: Chambre[] = chambreRes.data;

      const map: RoomOccupancy[] = chambres.map(chambre => {
        const res = reservations.find(r => r.roomId === chambre.id) ?? null;
        return {
          chambre,
          reservation: res,
          isCheckIn: res?.checkInDate === date,
          isCheckOut: res?.checkOutDate === date,
        };
      });

      setOccupancy(map);
      setLastRefresh(new Date());
    } catch {
      setError('Impossible de charger les données d\'occupation.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetch(); }, [fetch]);

  // Auto-refresh every 30 seconds when viewing today
  useEffect(() => {
    if (date !== today()) return;
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [date, fetch]);

  const occupied = occupancy.filter(o => o.reservation !== null).length;
  const total = occupancy.length;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const checkIns = occupancy.filter(o => o.isCheckIn).length;
  const checkOuts = occupancy.filter(o => o.isCheckOut).length;

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-0">Occupation</h2>
          <small className="text-muted">
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {date === today() && ' · Actualisation automatique'}
          </small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: 'auto' }}
          />
          <button className="btn btn-outline-dark" onClick={fetch} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            label="Taux d'occupation"
            value={`${occupancyRate}%`}
            icon={<BarChart2 size={20} />}
            color={occupancyRate >= 80 ? 'danger' : occupancyRate >= 50 ? 'warning' : 'success'}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label={`Occupées / ${total}`} value={occupied} icon={<BedDouble size={20} />} color="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Check-ins" value={checkIns} icon={<LogIn size={20} />} color="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Check-outs" value={checkOuts} icon={<LogOut size={20} />} color="warning" />
        </div>
      </div>

      {/* Occupancy rate bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between mb-1">
            <span className="small fw-semibold">Occupation globale</span>
            <span className="small text-muted">{occupied} / {total} chambres</span>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div
              className={`progress-bar bg-${occupancyRate >= 80 ? 'danger' : occupancyRate >= 50 ? 'warning' : 'success'}`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Room grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="border-bottom">
                <tr>
                  <th className="px-4 py-3">Chambre</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Étage</th>
                  <th className="py-3">Prix/nuit</th>
                  <th className="py-3">Occupation</th>
                  <th className="py-3">Réservation</th>
                  <th className="py-3">Arrivée</th>
                  <th className="py-3">Départ</th>
                </tr>
              </thead>
              <tbody>
                {occupancy.map(({ chambre, reservation, isCheckIn, isCheckOut }) => (
                  <tr key={chambre.id}>
                    <td className="px-4 py-3 fw-semibold">{chambre.numero}</td>
                    <td className="py-3">{chambre.type}</td>
                    <td className="py-3">{chambre.etage ?? '—'}</td>
                    <td className="py-3">{chambre.prix} DT</td>
                    <td className="py-3">
                      {reservation ? (
                        <span className="d-flex align-items-center gap-1">
                          <span className="badge bg-danger">
                            {isCheckIn && !isCheckOut ? '▶ Arrivée' : isCheckOut ? '◀ Départ' : '● Occupée'}
                          </span>
                        </span>
                      ) : (
                        <span className="badge bg-success">Libre</span>
                      )}
                    </td>
                    <td className="py-3">
                      {reservation ? (
                        <span>
                          #{reservation.id}
                          {reservation.status && (
                            <span className={`badge bg-${STATUS_COLORS[reservation.status]} ms-2`}>
                              {STATUS_LABELS[reservation.status]}
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 text-muted">{reservation?.checkInDate ?? '—'}</td>
                    <td className="py-3 text-muted">{reservation?.checkOutDate ?? '—'}</td>
                  </tr>
                ))}
                {occupancy.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">Aucune chambre trouvée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default OccupancyPage;
