import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, FileText, AlertCircle, Clock } from 'lucide-react';
import { paymentService, type Rapport, type MethodePaiement, METHODE_LABELS, METHODE_ICONS } from '../../services/paymentService';

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const today = () => new Date().toISOString().split('T')[0];

function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`rounded-circle bg-${color} bg-opacity-10 p-3 text-${color}`}>{icon}</div>
        <div>
          <div className="fs-4 fw-bold">{value}</div>
          <div className="text-muted small">{label}</div>
          {sub && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function RapportsPage() {
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [debut, setDebut] = useState(firstOfMonth());
  const [fin, setFin] = useState(today());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setRapport((await paymentService.getRapport(debut, fin)).data); }
    catch { setError('Impossible de générer le rapport.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [debut, fin]);

  const maxMois = rapport ? Math.max(...Object.values(rapport.revenueParMois).map(Number), 1) : 1;
  const maxMethode = rapport ? Math.max(...Object.values(rapport.revenueParMethode).map(Number), 1) : 1;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Rapports financiers</h2>
        <div className="d-flex align-items-center gap-2">
          <input type="date" className="form-control" value={debut} onChange={e => setDebut(e.target.value)} style={{ width: 'auto' }} />
          <span className="text-muted">→</span>
          <input type="date" className="form-control" value={fin} onChange={e => setFin(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : rapport && (
        <>
          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard label="Chiffre d'affaires" value={`${Number(rapport.chiffreAffaires).toFixed(3)} DT`} icon={<TrendingUp size={20} />} color="success" sub={`HT: ${Number(rapport.totalHT).toFixed(3)} DT`} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="TVA collectée" value={`${Number(rapport.totalTva).toFixed(3)} DT`} icon={<FileText size={20} />} color="primary" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="Impayés" value={`${Number(rapport.montantImpaye).toFixed(3)} DT`} icon={<AlertCircle size={20} />} color="danger" sub={`${rapport.nombreImpayees} facture(s)`} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="En retard" value={rapport.nombreEnRetard} icon={<Clock size={20} />} color="warning" sub="factures" />
            </div>
          </div>

          <div className="row g-3 mb-4">
            {/* Factures breakdown */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white fw-semibold border-bottom">Statut des factures</div>
                <div className="card-body">
                  {[
                    { label: 'Total émises', val: rapport.nombreFactures, color: 'primary' },
                    { label: 'Payées', val: rapport.nombrePayees, color: 'success' },
                    { label: 'Impayées', val: rapport.nombreImpayees, color: 'danger' },
                    { label: 'En retard', val: rapport.nombreEnRetard, color: 'warning' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted small">{label}</span>
                      <span className={`badge bg-${color} fs-6`}>{val}</span>
                    </div>
                  ))}
                  <div className="progress mt-3" style={{ height: 8 }}>
                    <div className="progress-bar bg-success" style={{ width: `${rapport.nombreFactures > 0 ? (rapport.nombrePayees / rapport.nombreFactures) * 100 : 0}%` }} />
                  </div>
                  <div className="text-muted small mt-1 text-end">
                    {rapport.nombreFactures > 0 ? ((rapport.nombrePayees / rapport.nombreFactures) * 100).toFixed(0) : 0}% payées
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue par méthode */}
            <div className="col-md-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white fw-semibold border-bottom">Paiements par méthode</div>
                <div className="card-body">
                  {Object.entries(rapport.revenueParMethode).length === 0
                    ? <div className="text-center text-muted py-3">Aucun paiement sur cette période</div>
                    : Object.entries(rapport.revenueParMethode).map(([methode, montant]) => (
                      <div key={methode} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small">{METHODE_ICONS[methode as MethodePaiement]} {METHODE_LABELS[methode as MethodePaiement] ?? methode}</span>
                          <span className="fw-semibold small">{Number(montant).toFixed(3)} DT</span>
                        </div>
                        <div className="progress" style={{ height: 8 }}>
                          <div className="progress-bar bg-primary" style={{ width: `${(Number(montant) / maxMethode) * 100}%` }} />
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Revenue par mois */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold border-bottom">Évolution mensuelle du chiffre d'affaires</div>
            <div className="card-body">
              {Object.keys(rapport.revenueParMois).length === 0
                ? <div className="text-center text-muted py-3">Pas de données mensuelles</div>
                : (
                  <div className="d-flex align-items-end gap-2" style={{ height: 160, overflowX: 'auto' }}>
                    {Object.entries(rapport.revenueParMois).map(([mois, montant]) => (
                      <div key={mois} className="d-flex flex-column align-items-center flex-shrink-0" style={{ minWidth: 60 }}>
                        <div className="text-muted small mb-1">{Number(montant).toFixed(0)}</div>
                        <div className="bg-primary rounded-top" style={{ width: 40, height: `${Math.max((Number(montant) / maxMois) * 120, 4)}px` }} />
                        <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>{mois.substring(5)}</div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          {/* Revenue par type */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold border-bottom">Revenus par type de facture</div>
            <div className="card-body">
              <div className="row g-3">
                {Object.entries(rapport.revenueParType).map(([type, montant]) => (
                  <div key={type} className="col-md-3 col-6">
                    <div className="card border-0 bg-light text-center p-3">
                      <div className="fw-bold fs-5">{Number(montant).toFixed(3)} DT</div>
                      <div className="text-muted small">{type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
