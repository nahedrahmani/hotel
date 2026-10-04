import { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, Wallet } from 'lucide-react';
import { stockService, type Stock } from '../../services/stockService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';
import { formatDT } from '../../utils/format';
import StockTabs from './StockTabs';

const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) => (
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

export default function StockDashboard() {
  const canSeeValue = hasAnyRole(MANAGEMENT_ROLES);
  const [stocks, setStocks]   = useState<Stock[]>([]);
  const [valeur, setValeur]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    // The stock value is ADMIN/MANAGER only; staff still get the inventory without it
    if (canSeeValue) {
      stockService.getValeurTotale().then(r => setValeur(r.data.valeurTotale)).catch(() => setValeur(null));
    }
    try {
      setStocks((await stockService.getInventaire()).data.filter(s => s.produitNom && s.produitNom !== 'Inconnu'));
    } catch (e) {
      setError(apiError(e, 'Impossible de charger l\'inventaire.'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const ruptures = stocks.filter(s => s.enRupture);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stocks
      .filter(s => !q || s.produitNom.toLowerCase().includes(q) || (s.emplacement ?? '').toLowerCase().includes(q))
      // Shortages first, then alphabetical
      .sort((a, b) => Number(b.enRupture) - Number(a.enRupture) || a.produitNom.localeCompare(b.produitNom));
  }, [stocks, search]);

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-3">Stock</h2>
      <StockTabs />

      {error && (
        <div className="alert alert-danger py-2 d-flex justify-content-between align-items-center">
          {error}
          <button className="btn btn-sm btn-outline-danger" onClick={load}>Réessayer</button>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4"><StatCard label="Produits suivis" value={stocks.length} icon={<Package size={20} />} color="dark" /></div>
        <div className="col-md-4"><StatCard label="En rupture" value={ruptures.length} icon={<AlertTriangle size={20} />} color={ruptures.length ? 'danger' : 'success'} /></div>
        {canSeeValue && (
          <div className="col-md-4"><StatCard label="Valeur du stock" value={valeur == null ? '—' : formatDT(valeur)} icon={<Wallet size={20} />} color="primary" /></div>
        )}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body border-bottom d-flex justify-content-between align-items-center gap-3">
          <input className="form-control" style={{ maxWidth: 320 }} placeholder="Produit ou emplacement"
            value={search} onChange={e => setSearch(e.target.value)} />
          <span className="text-muted small">{shown.length} produit(s)</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="border-bottom">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="py-3">Disponible</th>
                <th className="py-3">Réservé</th>
                <th className="py-3">Emplacement</th>
                <th className="py-3">État</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">Aucun produit</td></tr>
              ) : shown.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-3 fw-semibold">{s.produitNom}</td>
                  <td className="py-3">{s.quantiteDisponible}</td>
                  <td className="py-3 text-muted">{s.quantiteReservee}</td>
                  <td className="py-3 text-muted">{s.emplacement || '—'}</td>
                  <td className="py-3">
                    <span className={`badge bg-${s.enRupture ? 'danger' : 'success'}`}>{s.enRupture ? 'Rupture' : 'Disponible'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
