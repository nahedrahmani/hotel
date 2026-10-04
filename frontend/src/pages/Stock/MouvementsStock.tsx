import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { stockService, type Produit, type MouvementStock, type MouvementHistorique, TYPE_MOUVEMENT_LABELS } from '../../services/stockService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';
import { formatDateTime } from '../../utils/format';
import StockTabs from './StockTabs';

const EMPTY: MouvementStock = { produitId: 0, typeMouvement: 'ENTREE', quantite: 1, motif: '' };
const TYPE_COLORS: Record<MouvementStock['typeMouvement'], string> = { ENTREE: 'success', SORTIE: 'warning', AJUSTEMENT: 'secondary' };

export default function MouvementsStock() {
  // Adjustments are ADMIN/MANAGER only; any staff can record entries and exits
  const canAdjust = hasAnyRole(MANAGEMENT_ROLES);
  const [produits, setProduits]     = useState<Produit[]>([]);
  const [historique, setHistorique] = useState<MouvementHistorique[]>([]);
  const [form, setForm]             = useState<MouvementStock>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError]           = useState('');

  const loadHistorique = () =>
    stockService.getAllMouvements().then(r => setHistorique(r.data)).catch(e => setError(apiError(e, 'Impossible de charger l\'historique.')));

  useEffect(() => {
    stockService.getAllProduits().then(r => setProduits(r.data)).catch(e => setError(apiError(e, 'Impossible de charger les produits.')));
    loadHistorique();
  }, []);

  const nomProduit = useMemo(() => new Map(produits.map(p => [p.id, p.nom])), [produits]);
  const recents = useMemo(() => [...historique].sort((a, b) => b.dateCreation.localeCompare(a.dateCreation)).slice(0, 50), [historique]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.produitId) { setResult({ ok: false, text: 'Choisissez un produit.' }); return; }
    if (!(form.quantite > 0)) { setResult({ ok: false, text: 'La quantité doit être positive.' }); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const send = form.typeMouvement === 'ENTREE' ? stockService.entreeStock
        : form.typeMouvement === 'SORTIE' ? stockService.sortieStock : stockService.ajustementStock;
      await send(form);
      setResult({ ok: true, text: `${TYPE_MOUVEMENT_LABELS[form.typeMouvement]} de ${form.quantite} « ${nomProduit.get(form.produitId)} » enregistrée.` });
      setForm({ ...EMPTY, typeMouvement: form.typeMouvement });
      loadHistorique();
    } catch (err) {
      setResult({ ok: false, text: apiError(err, 'Le mouvement n\'a pas pu être enregistré.') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-3">Stock</h2>
      <StockTabs />
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <form className="card-body" onSubmit={handleSubmit}>
              <h5 className="fw-bold mb-3">Enregistrer un mouvement</h5>
              {result && <div className={`alert py-2 small ${result.ok ? 'alert-success' : 'alert-danger'}`}>{result.text}</div>}

              <label className="form-label fw-semibold small" htmlFor="m-type">Type</label>
              <select id="m-type" className="form-select mb-3" value={form.typeMouvement}
                onChange={e => setForm({ ...form, typeMouvement: e.target.value as MouvementStock['typeMouvement'] })}>
                <option value="ENTREE">Entrée — réception de marchandise</option>
                <option value="SORTIE">Sortie — utilisation</option>
                {canAdjust && <option value="AJUSTEMENT">Ajustement — correction d'inventaire</option>}
              </select>

              <label className="form-label fw-semibold small" htmlFor="m-produit">Produit</label>
              <select id="m-produit" className="form-select mb-3" value={form.produitId}
                onChange={e => setForm({ ...form, produitId: Number(e.target.value) })}>
                <option value={0}>— Choisir —</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>)}
              </select>

              <label className="form-label fw-semibold small" htmlFor="m-qte">Quantité</label>
              <input id="m-qte" type="number" min={1} className="form-control mb-3" value={form.quantite || ''}
                onChange={e => setForm({ ...form, quantite: Number(e.target.value) })} />

              <label className="form-label fw-semibold small" htmlFor="m-motif">Motif</label>
              <textarea id="m-motif" className="form-control mb-3" rows={2} value={form.motif}
                onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Livraison fournisseur, chambre 204…" />

              <button type="submit" className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2" disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm" />}
                Enregistrer
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body border-bottom"><h5 className="fw-bold mb-0">Derniers mouvements</h5></div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="border-bottom">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="py-3">Produit</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Qté</th>
                    <th className="py-3">Motif</th>
                    <th className="py-3">Par</th>
                  </tr>
                </thead>
                <tbody>
                  {recents.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-muted py-4">Aucun mouvement</td></tr>
                  ) : recents.map(m => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-nowrap text-muted small">{formatDateTime(m.dateCreation)}</td>
                      <td className="py-3">{nomProduit.get(m.produitId) ?? `#${m.produitId}`}</td>
                      <td className="py-3"><span className={`badge bg-${TYPE_COLORS[m.typeMouvement]}`}>{TYPE_MOUVEMENT_LABELS[m.typeMouvement]}</span></td>
                      <td className="py-3">{m.quantite}</td>
                      <td className="py-3 text-muted small">{m.motif || '—'}</td>
                      <td className="py-3 text-muted small">{m.utilisateurId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
