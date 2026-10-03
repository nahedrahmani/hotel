import { useState } from 'react';
import axios from 'axios';

export default function TestSimple() {
  const [result, setResult] = useState('');

  const test = async (url: string, name: string) => {
    setResult(`Test ${name}...`);
    try {
      const res = await axios.get(url);
      setResult(`✓ ${name} OK - ${res.data.length} produits trouvés`);
    } catch (err: any) {
      setResult(`✗ ${name} ERREUR: ${err.message}`);
    }
  };

  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

  return (
    <div className="container mt-5">
      <h2>Test Rapide</h2>
      <div className="btn-group-vertical w-100 gap-2">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => test(`${base}/api/stock/produits`, 'Stock (via Gateway)')}
        >
          Test Stock-Service (via Gateway)
        </button>
        <button
          className="btn btn-info btn-lg"
          onClick={() => test(`${base}/api/chambre/stock/produits`, 'Via Chambre')}
        >
          Test Via Chambre-Service
        </button>
      </div>
      {result && (
        <div className={`alert mt-4 ${result.includes('✓') ? 'alert-success' : result.includes('✗') ? 'alert-danger' : 'alert-info'}`}>
          {result}
        </div>
      )}
    </div>
  );
}
