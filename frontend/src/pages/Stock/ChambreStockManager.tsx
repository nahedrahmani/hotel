import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { chambreService, type Chambre, ROOM_TYPE_LABELS } from '../../services/chambreService';
import { stockService, type Produit, CATEGORIE_LABELS } from '../../services/stockService';
import { apiError } from '../../utils/api';
import { formatDT } from '../../utils/format';
import StockTabs from './StockTabs';

type ProduitChambre = { id: number; nom: string; categorie?: string; prixUnitaire: number };

/** Products placed in each room (minibar, amenities); they are billed at checkout. */
export default function ChambreStockManager() {
  const [chambres, setChambres]   = useState<Chambre[]>([]);
  const [produits, setProduits]   = useState<Produit[]>([]);
  const [chambreId, setChambreId] = useState<number | ''>('');
  const [contenu, setContenu]     = useState<ProduitChambre[]>([]);
  const [aAjouter, setAAjouter]   = useState<number | ''>('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    chambreService.getAllChambres().then(r => setChambres(r.data)).catch(e => setError(apiError(e, 'Impossible de charger les chambres.')));
    stockService.getAllProduits().then(r => setProduits(r.data)).catch(e => setError(apiError(e, 'Impossible de charger les produits.')));
  }, []);

  const loadContenu = async (id: number) => {
    setLoading(true);
    try { setContenu((await chambreService.getProduitsByChambre(id)).data); }
    catch (e) { setError(apiError(e, 'Impossible de charger le contenu de la chambre.')); }
    finally { setLoading(false); }
  };

  const selectChambre = (id: number | '') => {
    setChambreId(id);
    setAAjouter('');
    setError('');
    if (id) loadContenu(id); else setContenu([]);
  };

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    if (!chambreId) return;
    setError('');
    try { await action(); await loadContenu(chambreId); }
    catch (e) { setError(apiError(e, fallback)); }
  };

  const disponibles = produits.filter(p => !contenu.some(c => c.id === p.id));
  const chambre = chambres.find(c => c.id === chambreId);

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-3">Stock</h2>
      <StockTabs />
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-wrap align-items-end gap-3">
          <div style={{ minWidth: 280 }}>
            <label className="form-label fw-semibold small" htmlFor="sc-chambre">Chambre</label>
            <select id="sc-chambre" className="form-select" value={chambreId}
              onChange={e => selectChambre(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Choisir une chambre —</option>
              {chambres.map(c => (
                <option key={c.id} value={c.id}>
                  {c.numero} · {ROOM_TYPE_LABELS[c.type] ?? c.type}{c.etage != null ? ` · étage ${c.etage}` : ''}
                </option>
              ))}
            </select>
          </div>
          {chambreId && (
            <>
              <div style={{ minWidth: 280 }}>
                <label className="form-label fw-semibold small" htmlFor="sc-produit">Ajouter un produit</label>
                <select id="sc-produit" className="form-select" value={aAjouter}
                  onChange={e => setAAjouter(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— Choisir un produit —</option>
                  {disponibles.map(p => <option key={p.id} value={p.id}>{p.nom} · {formatDT(p.prixUnitaire)}</option>)}
                </select>
              </div>
              <button className="btn btn-dark d-flex align-items-center gap-2" disabled={!aAjouter}
                onClick={() => run(async () => { await chambreService.addProduitToChambre(chambreId, Number(aAjouter)); setAAjouter(''); }, 'Le produit n\'a pas pu être ajouté.')}>
                <Plus size={16} /> Ajouter
              </button>
            </>
          )}
        </div>
      </div>

      {chambreId && (
        <div className="card border-0 shadow-sm">
          <div className="card-body border-bottom">
            <h5 className="fw-bold mb-0">Contenu de la chambre {chambre?.numero}</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="border-bottom">
                <tr>
                  <th className="px-4 py-3">Produit</th>
                  <th className="py-3">Catégorie</th>
                  <th className="py-3">Prix facturé</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>
                ) : contenu.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted py-4">Aucun produit dans cette chambre</td></tr>
                ) : contenu.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 fw-semibold">{p.nom}</td>
                    <td className="py-3 text-muted">{p.categorie ? CATEGORIE_LABELS[p.categorie] ?? p.categorie : '—'}</td>
                    <td className="py-3">{formatDT(p.prixUnitaire)}</td>
                    <td className="py-3 text-end pe-4">
                      <button className="btn btn-sm btn-outline-danger" title="Retirer de la chambre"
                        onClick={() => run(() => chambreService.removeProduitFromChambre(chambreId, p.id), 'Le produit n\'a pas pu être retiré.')}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
