import { useState } from 'react';
import { stockService } from '../../services/stockService';
import type { Produit } from '../../services/stockService';

export default function TestStock() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Test en cours...');
    
    try {
      const response = await stockService.getAllProduits();
      setResult(`✅ Connexion réussie! ${response.data.length} produits trouvés`);
    } catch (error: any) {
      setResult(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestProduct = async () => {
    setLoading(true);
    setResult('Création produit test...');
    
    const testProduct: Produit = {
      code: 'TEST001',
      nom: 'Produit Test',
      categorie: 'LINGE',
      unite: 'pièce',
      prixUnitaire: 10.0,
      seuilMinimum: 5,
      seuilMaximum: 50,
      description: 'Produit de test'
    };

    try {
      const response = await stockService.createProduit(testProduct);
      setResult(`✅ Produit créé! ID: ${response.data.id}`);
    } catch (error: any) {
      setResult(`❌ Erreur création: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2>Test Stock Service</h2>
      
      <div className="card mt-4">
        <div className="card-body">
          <h5>Tests de Connexion</h5>
          
          <div className="d-flex gap-2 mb-3">
            <button 
              className="btn btn-primary" 
              onClick={testConnection}
              disabled={loading}
            >
              Tester Connexion
            </button>
            
            <button 
              className="btn btn-success" 
              onClick={createTestProduct}
              disabled={loading}
            >
              Créer Produit Test
            </button>
          </div>

          <div className="alert alert-info">
            <strong>Résultat:</strong>
            <pre>{result}</pre>
          </div>

          <div className="alert alert-warning">
            <strong>Prérequis:</strong>
            <ul>
              <li>Stock Service démarré (port 8080)</li>
              <li>Gateway démarré</li>
              <li>Base de données accessible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}