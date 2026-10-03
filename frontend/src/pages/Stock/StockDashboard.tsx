import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockService } from '../../services/stockService';
import type { Stock } from '../../services/stockService';
import '../Stock/Stock.css';

export default function StockDashboard() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [alertes, setAlertes] = useState<Stock[]>([]);
  const [valeurTotale, setValeurTotale] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError('');
    try {
      const [stockRes, alertesRes, valeurRes] = await Promise.all([
        stockService.getInventaire(),
        stockService.getAlertes(),
        stockService.getValeurTotale(),
      ]);
      setStocks(stockRes.data.filter((s: Stock) => s.produitNom && s.produitNom !== 'Inconnu'));
      setAlertes(alertesRes.data.filter((s: Stock) => s.produitNom && s.produitNom !== 'Inconnu'));
      setValeurTotale(valeurRes.data.valeurTotale);
    } catch (err) {
      console.error('Erreur lors du chargement du stock:', err);
      setError('Impossible de charger les données du stock. Vérifiez que le service est disponible.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-5">Chargement...</div>;

  return (
        <div className="stock-container" style={{ padding: '20px' }}>
          <div className="stock-header">
            <div>
              <h1 className="stock-title">Dashboard Stock</h1>
              <div className="d-flex gap-2 mt-3">
                <button className="btn-modern btn-info-modern" onClick={() => navigate('/dashboard/stock/test-integration')}>
                  Test Intégration
                </button>
                <button className="btn-modern btn-warning-modern" onClick={() => navigate('/dashboard/stock/chambre-manager')}>
                  Chambre Manager
                </button>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn-modern btn-primary-modern" onClick={() => navigate('/dashboard/stock/produits')}>
                Gérer Produits
              </button>
              <button className="btn-modern btn-success-modern" onClick={() => navigate('/dashboard/stock/mouvements')}>
                Mouvements
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mb-4">
              {error}
              <button className="btn btn-sm btn-outline-danger ms-3" onClick={loadData}>Réessayer</button>
            </div>
          )}

          <div className="mb-4" style={{ width: '100%', height: '1000px' }}>
            <iframe
              title="Power BI Dashboard Stock"
              width="100%"
              height="100%"
              src="https://app.powerbi.com/reportEmbed?reportId=a49d4118-47e1-42fd-a21c-a865ba1479a4&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730"
              frameBorder="0"
              allowFullScreen
            />
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="stat-card primary">
                <div className="stat-icon"></div>
                <div className="stat-value">{stocks.length}</div>
                <div className="stat-label">Produits en Stock</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card danger">
                <div className="stat-icon"></div>
                <div className="stat-value">{alertes.length}</div>
                <div className="stat-label">Alertes Rupture</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card success">
                <div className="stat-icon"></div>
                <div className="stat-value">{valeurTotale.toFixed(2)} DT</div>
                <div className="stat-label">Valeur Totale</div>
              </div>
            </div>
          </div>

          {alertes.length > 0 && (
            <div className="alert alert-warning alert-modern mb-4">
              <h5 className="mb-3"><strong>Produits en rupture de stock</strong></h5>
              <ul className="mb-0">
                {alertes.map((stock) => (
                  <li key={stock.id}>
                    <strong>{stock.produitNom}</strong> - Quantité: {stock.quantiteDisponible}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="data-table">
            <div className="table-header">
              <h5 className="table-title">Inventaire Complet</h5>
            </div>
            <div className="p-0">
              <table className="table table-modern mb-0">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité Disponible</th>
                    <th>Quantité Réservée</th>
                    <th>Emplacement</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr key={stock.id}>
                      <td>{stock.produitNom}</td>
                      <td>{stock.quantiteDisponible}</td>
                      <td>{stock.quantiteReservee}</td>
                      <td>{stock.emplacement}</td>
                      <td>
                        {stock.enRupture ? (
                          <span className="badge badge-modern bg-danger">Rupture</span>
                        ) : (
                          <span className="badge badge-modern bg-success">✓ OK</span>
                        )}
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