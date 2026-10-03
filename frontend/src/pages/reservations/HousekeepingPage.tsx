import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, BedDouble } from 'lucide-react';
import { chambreService, type Chambre } from '../../services/chambreService';

const HousekeepingPage: React.FC = () => {
  const [rooms, setRooms] = useState<Chambre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await chambreService.getChambresANettoyer();
      setRooms(res.data);
      setLastRefresh(new Date());
    } catch {
      setError('Impossible de charger les chambres à nettoyer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const marquerPropre = async (chambre: Chambre) => {
    if (!chambre.id) return;
    setMarking(chambre.id);
    try {
      await chambreService.marquerPropre(chambre.id);
      setRooms(prev => prev.filter(r => r.id !== chambre.id));
    } catch {
      alert('Erreur lors de la mise à jour du statut.');
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <BedDouble size={24} /> Ménage
          </h2>
          <small className="text-muted">
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {' · Actualisation automatique'}
          </small>
        </div>
        <button className="btn btn-outline-dark" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : rooms.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-success">
            <CheckCircle size={48} className="mb-3" />
            <div className="fs-5 fw-semibold">Toutes les chambres sont propres</div>
            <div className="text-muted small mt-1">Aucune chambre en attente de nettoyage</div>
          </div>
        </div>
      ) : (
        <>
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
            <BedDouble size={18} />
            <span><strong>{rooms.length}</strong> chambre{rooms.length > 1 ? 's' : ''} à nettoyer</span>
          </div>

          <div className="row g-3">
            {rooms.map(room => (
              <div key={room.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="fw-bold fs-5">Chambre {room.numero}</div>
                        <div className="text-muted small">{room.type}{room.etage != null ? ` · Étage ${room.etage}` : ''}</div>
                      </div>
                      <span className="badge bg-warning text-dark">À nettoyer</span>
                    </div>

                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {room.wifi && <span className="badge bg-light text-dark border">WiFi</span>}
                      {room.climatisation && <span className="badge bg-light text-dark border">Clim</span>}
                      {room.balcon && <span className="badge bg-light text-dark border">Balcon</span>}
                      {room.minibar && <span className="badge bg-light text-dark border">Minibar</span>}
                    </div>

                    <button
                      className="btn btn-success mt-auto d-flex align-items-center justify-content-center gap-2"
                      onClick={() => marquerPropre(room)}
                      disabled={marking === room.id}
                    >
                      {marking === room.id
                        ? <><span className="spinner-border spinner-border-sm" /> Traitement…</>
                        : <><CheckCircle size={16} /> Marquer propre</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HousekeepingPage;
