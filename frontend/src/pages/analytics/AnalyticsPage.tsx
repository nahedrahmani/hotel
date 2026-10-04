import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, BedDouble, DollarSign, BarChart2, RefreshCw } from 'lucide-react';
import { reservationService, type ReservationStats } from '../../services/reservationService';
import { paymentService, type Rapport } from '../../services/paymentService';
import { chambreService, type Chambre } from '../../services/chambreService';
import { formatDT } from '../../utils/format';

const firstOfYear = () => `${new Date().getFullYear()}-01-01`;
const today = () => new Date().toISOString().split('T')[0];

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`rounded-circle bg-${color} bg-opacity-10 p-3 text-${color} flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="fs-3 fw-bold text-truncate">{value}</div>
          <div className="text-muted small">{label}</div>
          {sub && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function HBar({ label, value, max, color = 'primary' }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between mb-1">
        <span className="small text-truncate me-2" style={{ maxWidth: '60%' }}>{label}</span>
        <span className="small fw-semibold text-nowrap">{formatDT(value)}</span>
      </div>
      <div className="progress" style={{ height: 8 }}>
        <div className={`progress-bar bg-${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                     'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const TYPE_COLORS: Record<string, string> = {
  ONLINE: 'primary', ON_SITE: 'success', PHONE: 'warning', AGENCY: 'info',
};
const TYPE_LABELS: Record<string, string> = {
  ONLINE: 'En ligne', ON_SITE: 'Sur place', PHONE: 'Téléphone', AGENCY: 'Agence',
};

export default function AnalyticsPage() {
  const [debut, setDebut] = useState(firstOfYear());
  const [fin, setFin] = useState(today());
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [sRes, cRes] = await Promise.all([
        reservationService.getStats(),
        chambreService.getAllChambres(),
      ]);
      setStats(sRes.data);
      setChambres(cRes.data);

      // Payment rapport is optional — service may be unavailable
      try {
        const rRes = await paymentService.getRapport(debut, fin);
        setRapport(rRes.data);
      } catch {
        setRapport(null);
      }
    } catch {
      setError('Impossible de charger les données analytiques.');
    } finally {
      setLoading(false);
    }
  }, [debut, fin]);

  useEffect(() => { load(); }, [load]);

  // ── KPI computations ────────────────────────────────────────────────────────
  const totalRooms = chambres.length;
  const revenue = rapport?.chiffreAffaires ?? 0;
  const occupancyPct = totalRooms > 0 && stats
    ? Math.round(((stats.checkedIn) / totalRooms) * 100)
    : 0;

  const daysInPeriod = Math.max(1,
    (new Date(fin).getTime() - new Date(debut).getTime()) / 86400000);
  const revPAR = totalRooms > 0 ? (revenue / (totalRooms * daysInPeriod)).toFixed(2) : '—';
  const paidFactures = rapport?.nombrePayees ?? 0;
  const adr = paidFactures > 0 ? (revenue / paidFactures).toFixed(2) : '—';

  const moisData = rapport
    ? Object.entries(rapport.revenueParMois).sort(([a], [b]) => a.localeCompare(b))
    : [];
  const maxMois = Math.max(...moisData.map(([, v]) => Number(v)), 1);

  const typeData = stats
    ? Object.entries(stats.byType).sort(([, a], [, b]) => Number(b) - Number(a))
    : [];
  const maxType = Math.max(...typeData.map(([, v]) => Number(v)), 1);

  const methodeData = rapport
    ? Object.entries(rapport.revenueParMethode).sort(([, a], [, b]) => Number(b) - Number(a))
    : [];
  const maxMethode = Math.max(...methodeData.map(([, v]) => Number(v)), 1);

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <BarChart2 size={24} /> Analytique
        </h2>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input type="date" className="form-control form-control-sm" value={debut}
            onChange={e => setDebut(e.target.value)} style={{ width: 'auto' }} />
          <span className="text-muted small">→</span>
          <input type="date" className="form-control form-control-sm" value={fin}
            onChange={e => setFin(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-sm btn-outline-dark" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <KpiCard label="Chiffre d'affaires" value={formatDT(revenue)}
                icon={<DollarSign size={20} />} color="success"
                sub={`${rapport?.nombreFactures ?? 0} factures`} />
            </div>
            <div className="col-6 col-lg-3">
              <KpiCard label="RevPAR" value={revPAR === '—' ? '—' : `${revPAR} DT`}
                icon={<TrendingUp size={20} />} color="primary"
                sub="Revenue par chambre disponible/jour" />
            </div>
            <div className="col-6 col-lg-3">
              <KpiCard label="ADR" value={adr === '—' ? '—' : `${adr} DT`}
                icon={<TrendingUp size={20} />} color="info"
                sub="Tarif journalier moyen" />
            </div>
            <div className="col-6 col-lg-3">
              <KpiCard label="Taux d'occupation" value={`${occupancyPct}%`}
                icon={<BedDouble size={20} />}
                color={occupancyPct >= 80 ? 'danger' : occupancyPct >= 50 ? 'warning' : 'success'}
                sub={`${stats?.checkedIn ?? 0} / ${totalRooms} chambres`} />
            </div>
          </div>

          {/* Second row: reservation stats */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total réservations', value: stats?.total ?? 0, color: 'dark' },
              { label: 'En attente', value: stats?.pending ?? 0, color: 'warning' },
              { label: 'Confirmées', value: stats?.confirmed ?? 0, color: 'success' },
              { label: 'Annulées', value: stats?.cancelled ?? 0, color: 'danger' },
            ].map(({ label, value, color }) => (
              <div key={label} className="col-6 col-lg-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body py-3">
                    <div className={`fs-3 fw-bold text-${color}`}>{value}</div>
                    <div className="text-muted small">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            {!rapport && (
              <div className="col-12">
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-0">
                  <span>⚠</span>
                  Le service de paiement est indisponible — les données financières ne sont pas affichées.
                </div>
              </div>
            )}

            {/* Revenue by month */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-4">Chiffre d'affaires par mois</h6>
                  {moisData.length === 0 ? (
                    <p className="text-muted small text-center">Aucune donnée pour cette période</p>
                  ) : moisData.map(([mois, val]) => {
                    const [year, month] = mois.split('-');
                    const label = `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
                    return (
                      <HBar key={mois} label={label} value={Number(val)} max={maxMois} color="primary" />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Revenue by payment method */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-4">Revenus par mode de paiement</h6>
                  {methodeData.length === 0 ? (
                    <p className="text-muted small text-center">Aucune donnée</p>
                  ) : methodeData.map(([methode, val]) => (
                    <HBar key={methode} label={methode.replace(/_/g, ' ')}
                      value={Number(val)} max={maxMethode} color="info" />
                  ))}
                </div>
              </div>
            </div>

            {/* Reservations by type */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-bold mb-4">Réservations par canal</h6>
                  {typeData.length === 0 ? (
                    <p className="text-muted small text-center">Aucune donnée</p>
                  ) : typeData.map(([type, count]) => (
                    <div key={type} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small">{TYPE_LABELS[type] ?? type}</span>
                        <span className="small fw-semibold">{count}</span>
                      </div>
                      <div className="progress" style={{ height: 8 }}>
                        <div className={`progress-bar bg-${TYPE_COLORS[type] ?? 'secondary'}`}
                          style={{ width: `${Math.round((Number(count) / maxType) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial summary */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-bold mb-4">Résumé financier</h6>
                  {rapport && (
                    <table className="table table-sm">
                      <tbody>
                        {[
                          ['CA HT', formatDT(rapport.totalHT)],
                          ['TVA collectée', formatDT(rapport.totalTva)],
                          ['CA TTC', formatDT(rapport.chiffreAffaires)],
                          ['Factures payées', rapport.nombrePayees],
                          ['Factures impayées', rapport.nombreImpayees],
                          ['Montant impayé', formatDT(rapport.montantImpaye)],
                          ['En retard', rapport.nombreEnRetard],
                        ].map(([k, v]) => (
                          <tr key={String(k)}>
                            <td className="text-muted small">{k}</td>
                            <td className="fw-semibold small text-end">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
