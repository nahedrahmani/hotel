import { useState } from 'react';
import axios from 'axios';

type ServiceStatus = {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  responseTime?: number;
};

export default function DiagnosticServices() {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Stock-Service', url: `${base}/api/stock/produits`, status: 'pending', message: 'Non testé' },
    { name: 'Chambre via Gateway', url: `${base}/api/chambre/stock/produits`, status: 'pending', message: 'Non testé' },
    { name: 'Stock Inventaire', url: `${base}/api/stock/inventaire`, status: 'pending', message: 'Non testé' },
    { name: 'Stock Alertes', url: `${base}/api/stock/alertes`, status: 'pending', message: 'Non testé' },
  ]);

  const testService = async (index: number) => {
    const service = services[index];
    const startTime = Date.now();
    
    setServices(prev => prev.map((s, i) => 
      i === index ? { ...s, status: 'pending', message: 'Test en cours...' } : s
    ));

    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      setServices(prev => prev.map((s, i) => 
        i === index ? {
          ...s,
          status: 'success',
          message: `✓ OK - ${Array.isArray(response.data) ? response.data.length : 'N/A'} items (${responseTime}ms)`,
          responseTime
        } : s
      ));
    } catch (error: any) {
      setServices(prev => prev.map((s, i) => 
        i === index ? {
          ...s,
          status: 'error',
          message: `✗ ${error.code || error.message}`,
          responseTime: Date.now() - startTime
        } : s
      ));
    }
  };

  const testAll = async () => {
    for (let i = 0; i < services.length; i++) {
      await testService(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">🔍 Diagnostic des Services</h4>
        </div>
        <div className="card-body">
          <button className="btn btn-primary mb-4" onClick={testAll}>
            Tester Tous les Services
          </button>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>URL</th>
                  <th>Statut</th>
                  <th>Message</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={index}>
                    <td><strong>{service.name}</strong></td>
                    <td><code className="small">{service.url}</code></td>
                    <td>
                      <span className={`badge bg-${getStatusColor(service.status)}`}>
                        {service.status === 'pending' ? '⏳' : service.status === 'success' ? '✓' : '✗'}
                      </span>
                    </td>
                    <td>{service.message}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => testService(index)}
                      >
                        Tester
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="alert alert-info mt-4">
            <h6>💡 Conseils de Dépannage:</h6>
            <ul className="mb-0">
              <li><strong>CORS Error:</strong> Ajoutez @CrossOrigin dans les controllers</li>
              <li><strong>404 Not Found:</strong> Vérifiez les routes et le Gateway</li>
              <li><strong>Connection Refused:</strong> Le service n'est pas démarré</li>
              <li><strong>Timeout:</strong> Le service est trop lent ou bloqué</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
