import { useState } from 'react';
import axios from 'axios';
import { stockService } from '../../services/stockService';
import type { Produit } from '../../services/stockService';
import './Stock.css';

export default function TestIntegration() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitsViaChambre, setProduitsViaChambre] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const testDirectStock = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await stockService.getAllProduits();
      setProduits(response.data);
      setSuccess('✓ Connexion directe stock-service OK');
    } catch (err: any) {
      setError(`✗ Erreur stock-service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const chambreBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

  const testViaChambre = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${chambreBase}/api/chambre/stock/produits`);
      setProduitsViaChambre(response.data);
      setSuccess('✓ Connexion chambre-service → stock-service OK');
    } catch (err: any) {
      setError(`✗ Erreur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBoth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [direct, viaChambre] = await Promise.all([
        stockService.getAllProduits(),
        axios.get(`${chambreBase}/api/chambre/stock/produits`)
      ]);
      setProduits(direct.data);
      setProduitsViaChambre(viaChambre.data);
      setSuccess('✓ Les deux services communiquent correctement !');
    } catch (err: any) {
      setError(`✗ Erreur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
        <div style={{ background: '#f8f9fa', minHeight: 'calc(100vh - 73px)', padding: '40px 20px' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '30px', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}>Test d'Intégration Microservices</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>Chambre-Service ↔ Stock-Service</p>
        </div>

        {/* Action Buttons */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '30px', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
          <h5 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Tests de Connexion</h5>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button onClick={testDirectStock} disabled={loading} style={{ flex: '1', minWidth: '200px', padding: '15px 25px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              <i className="fas fa-database" style={{ marginRight: '8px' }}></i>
              Test Direct Stock-Service
            </button>
            <button onClick={testViaChambre} disabled={loading} style={{ flex: '1', minWidth: '200px', padding: '15px 25px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              <i className="fas fa-route" style={{ marginRight: '8px' }}></i>
              Test Via Chambre-Service
            </button>
            <button onClick={testBoth} disabled={loading} style={{ flex: '1', minWidth: '200px', padding: '15px 25px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              <i className="fas fa-check-double" style={{ marginRight: '8px' }}></i>
              Test Complet
            </button>
          </div>

          {loading && <div style={{ marginTop: '20px', padding: '15px', background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '12px', color: '#1e40af', fontWeight: '500' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Chargement...</div>}
          {error && <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '12px', color: '#991b1b', fontWeight: '500' }}><i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>{error}</div>}
          {success && <div style={{ marginTop: '20px', padding: '15px', background: '#d1fae5', border: '2px solid #10b981', borderRadius: '12px', color: '#065f46', fontWeight: '500' }}><i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>{success}</div>}
        </div>

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          {/* Direct Stock Service */}
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <div style={{ background: '#3b82f6', padding: '20px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="fas fa-database" style={{ fontSize: '20px' }}></i>
                <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Stock-Service Direct</h5>
              </div>
              <small style={{ opacity: 0.9, fontSize: '13px' }}>Via Gateway • /api/stock/produits</small>
            </div>
            <div style={{ padding: '25px', maxHeight: '600px', overflowY: 'auto' }}>
              {produits.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderRadius: '8px 0 0 8px', fontSize: '15px' }}>ID</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '15px' }}>Nom</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '15px' }}>Catégorie</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderRadius: '0 8px 8px 0', fontSize: '15px' }}>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produits.map(p => (
                      <tr key={p.id} style={{ background: 'white', transition: 'all 0.2s' }}>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderRight: 'none', borderRadius: '8px 0 0 8px', fontWeight: '500', color: '#6b7280', fontSize: '14px' }}>{p.id}</td>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderRight: 'none', borderLeft: 'none', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{p.nom}</td>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderRight: 'none', borderLeft: 'none' }}><span style={{ padding: '6px 14px', background: '#dbeafe', color: '#1e40af', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}>{p.categorie}</span></td>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderLeft: 'none', borderRadius: '0 8px 8px 0', fontWeight: '600', color: '#059669', fontSize: '14px' }}>{p.prixUnitaire} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: '15px' }}>Aucun produit chargé</p>
                </div>
              )}
            </div>
          </div>

          {/* Via Chambre Service */}
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <div style={{ background: '#8b5cf6', padding: '20px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="fas fa-route" style={{ fontSize: '20px' }}></i>
                <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Via Chambre-Service</h5>
              </div>
              <small style={{ opacity: 0.9, fontSize: '13px' }}>Via Gateway • /api/chambre/stock/produits</small>
            </div>
            <div style={{ padding: '25px', maxHeight: '600px', overflowY: 'auto' }}>
              {produitsViaChambre.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderRadius: '8px 0 0 8px', fontSize: '15px' }}>ID</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '15px' }}>Nom</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '15px' }}>Catégorie</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderRadius: '0 8px 8px 0', fontSize: '15px' }}>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produitsViaChambre.map(p => (
                      <tr key={p.id} style={{ background: 'white', transition: 'all 0.2s' }}>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderRight: 'none', borderRadius: '8px 0 0 8px', fontWeight: '500', color: '#6b7280', fontSize: '14px' }}>{p.id}</td>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderRight: 'none', borderLeft: 'none', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{p.nom}</td>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderRight: 'none', borderLeft: 'none' }}><span style={{ padding: '6px 14px', background: '#ede9fe', color: '#6b21a8', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}>{p.categorie}</span></td>
                        <td style={{ padding: '16px', border: '1px solid #e5e7eb', borderLeft: 'none', borderRadius: '0 8px 8px 0', fontWeight: '600', color: '#059669', fontSize: '14px' }}>{p.prixUnitaire} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: '15px' }}>Aucun produit chargé</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Result */}
        {produits.length > 0 && produitsViaChambre.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', border: '1px solid #e5e7eb' }}>
            <h5 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              <i className="fas fa-chart-bar" style={{ marginRight: '10px', color: '#8b5cf6' }}></i>
              Résultat de la Comparaison
            </h5>
            <div style={{ padding: '20px', background: produits.length === produitsViaChambre.length ? '#d1fae5' : '#fef3c7', borderRadius: '12px', border: `2px solid ${produits.length === produitsViaChambre.length ? '#10b981' : '#f59e0b'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Stock-Service Direct</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>{produits.length} <span style={{ fontSize: '16px', fontWeight: '500', color: '#6b7280' }}>produits</span></div>
                </div>
                <div style={{ fontSize: '24px', color: '#6b7280' }}>↔</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Via Chambre-Service</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>{produitsViaChambre.length} <span style={{ fontSize: '16px', fontWeight: '500', color: '#6b7280' }}>produits</span></div>
                </div>
                {produits.length === produitsViaChambre.length && (
                  <div style={{ padding: '12px 20px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e5e7eb' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '24px', color: '#10b981' }}></i>
                    <span style={{ fontWeight: '600', color: '#065f46' }}>Identique</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
        </div>
  );
}
