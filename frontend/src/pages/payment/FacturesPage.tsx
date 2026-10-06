import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Search, Send, Ban, Trash2, CreditCard } from 'lucide-react';
import {
  paymentService, type Facture, type LigneFacture, type StatutFacture,
  type TypeFacture, type MethodePaiement,
  STATUT_FACTURE_COLORS, STATUT_FACTURE_LABELS, TYPE_FACTURE_LABELS, METHODE_LABELS, montantsLigne,
} from '../../services/paymentService';
import MethodeIcon from '../../components/MethodeIcon';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';
import { formatDate, formatDT, isoDate } from '../../utils/format';
import { useConfirm } from '../../components/useConfirm';

const TYPES: TypeFacture[] = ['HEBERGEMENT', 'RESTAURATION', 'SERVICE', 'TRANSPORT', 'DIVERS'];
const STATUTS: StatutFacture[] = ['BROUILLON', 'EMISE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE'];
// Payments taken at the desk; guests pay online themselves from their bookings (Konnect)
const METHODES_MANUELLES: MethodePaiement[] = ['CARTE_BANCAIRE', 'ESPECES', 'VIREMENT_BANCAIRE', 'CHEQUE'];

const EMPTY_LIGNE: LigneFacture = { description: '', quantite: 1, prixUnitaire: 0, tauxTva: 19 };
const EMPTY_FACTURE: Facture = {
  clientNom: '', clientEmail: '', typeFacture: 'HEBERGEMENT',
  dateEmission: isoDate(new Date()), lignes: [{ ...EMPTY_LIGNE }],
};

export default function FacturesPage() {
  const [confirm, confirmDialog] = useConfirm();
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const isAdmin = hasAnyRole(['ADMIN']);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutFacture | ''>('');

  // Invoice create/edit
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Facture>(EMPTY_FACTURE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Payment flow
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [showMethodChooser, setShowMethodChooser] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [paiementForm, setPaiementForm] = useState<{
    montant: number; methodePaiement: MethodePaiement; note: string;
  }>({ montant: 0, methodePaiement: 'ESPECES', note: '' });

  // ── Data ─────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true); setError('');
    try { setFactures((await paymentService.getAllFactures()).data); }
    catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status ?? 0;
      if (status >= 500) setError('Le service de paiement est indisponible. Réessayez dans quelques instants.');
      else if (status === 403) setError('Accès refusé — vérifiez vos permissions.');
      else if (status === 401) setError('Session expirée — reconnectez-vous.');
      else setError('Impossible de charger les factures.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    factures.filter(f =>
      (!filterStatut || f.statut === filterStatut) &&
      (!search || `${f.numero} ${f.clientNom}`.toLowerCase().includes(search.toLowerCase()))
    ), [factures, filterStatut, search]);

  // ── Invoice helpers ───────────────────────────────────────────────────────

  const addLigne = () => setForm(f => ({ ...f, lignes: [...f.lignes, { ...EMPTY_LIGNE }] }));
  const removeLigne = (i: number) => setForm(f => ({ ...f, lignes: f.lignes.filter((_, idx) => idx !== i) }));
  const updateLigne = (i: number, field: keyof LigneFacture, val: unknown) =>
    setForm(f => ({ ...f, lignes: f.lignes.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }));

  // Stay lines carry a VAT-inclusive price; montantsLigne applies the same rule as the backend
  const sousTotal = form.lignes.reduce((s, l) => s + montantsLigne(l).ht, 0);
  const totalTva  = form.lignes.reduce((s, l) => s + montantsLigne(l).tva, 0);
  const totalTTC  = form.lignes.reduce((s, l) => s + montantsLigne(l).ttc, 0);

  const handleSave = async () => {
    if (!form.clientNom || !form.dateEmission || form.lignes.length === 0) {
      setFormError('Client, date et au moins une ligne sont obligatoires.'); return;
    }
    setSaving(true);
    try {
      if (editId) await paymentService.updateFacture(editId, form);
      else await paymentService.createFacture(form);
      setShowModal(false); load();
    } catch (e: unknown) {
      setFormError(apiError(e, 'Erreur lors de la sauvegarde.'));
    } finally { setSaving(false); }
  };

  const handleEmettre = async (id: number) => {
    try { await paymentService.emettreFacture(id); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur.')); }
  };

  const handleAnnuler = async (id: number) => {
    if (!(await confirm('Annuler cette facture ?', { danger: true, confirmLabel: 'Annuler la facture' }))) return;
    try { await paymentService.annulerFacture(id); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur.')); }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm('Supprimer cette facture ?', { danger: true }))) return;
    try { await paymentService.deleteFacture(id); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur.')); }
  };

  // ── Payment helpers ───────────────────────────────────────────────────────

  const openPaiement = (f: Facture) => {
    setSelectedFacture(f);
    setPaiementForm({ montant: Number(f.montantRestant ?? 0), methodePaiement: 'ESPECES', note: '' });
    setFormError('');
    setShowMethodChooser(true);
  };

  const pickMethod = (m: MethodePaiement) => {
    setShowMethodChooser(false);
    setPaiementForm(p => ({ ...p, methodePaiement: m }));
    setShowManualModal(true);
  };

  const handlePaiementManuel = async () => {
    if (!selectedFacture?.id || !paiementForm.montant) { setFormError('Montant obligatoire.'); return; }
    setSaving(true);
    try {
      await paymentService.enregistrerPaiement({ factureId: selectedFacture.id, ...paiementForm });
      setShowManualModal(false); load();
    } catch (e: unknown) {
      setFormError(apiError(e, 'Erreur.'));
    } finally { setSaving(false); }
  };

  // A draft can take a deposit: payment-service issues it when the payment is recorded
  const isPairable = (f: Facture) =>
    f.statut === 'BROUILLON' || f.statut === 'EMISE' || f.statut === 'PARTIELLEMENT_PAYEE' || f.statut === 'EN_RETARD';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container-fluid p-4">
      {confirmDialog}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Factures</h2>
          <small className="text-muted">{filtered.length} facture(s)</small>
        </div>
        {canManage && (
          <button className="btn btn-dark d-flex align-items-center gap-2"
            onClick={() => { setEditId(null); setForm(EMPTY_FACTURE); setFormError(''); setShowModal(true); }}>
            <Plus size={18} /> Nouvelle facture
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex gap-3 flex-wrap align-items-center">
          <div className="input-group" style={{ maxWidth: 260 }}>
            <span className="input-group-text bg-white"><Search size={16} /></span>
            <input className="form-control border-start-0" placeholder="N° facture, client…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-auto" value={filterStatut}
            onChange={e => setFilterStatut(e.target.value as StatutFacture | '')}>
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{STATUT_FACTURE_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="border-bottom">
                <tr>
                  <th className="px-4 py-3">Numéro</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Échéance</th>
                  <th>Total TTC</th>
                  <th>Payé</th>
                  <th>Restant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="text-center text-muted py-4">Aucune facture</td></tr>
                )}
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td className="px-4 fw-semibold text-muted">{f.numero}</td>
                    <td className="fw-semibold">{f.clientNom}</td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-10 text-dark border">
                        {TYPE_FACTURE_LABELS[f.typeFacture ?? 'DIVERS']}
                      </span>
                    </td>
                    <td className="text-muted text-nowrap">{formatDate(f.dateEmission)}</td>
                    <td className={f.statut === 'EN_RETARD' ? 'text-danger fw-semibold' : 'text-muted'}>
                      {f.dateEcheance ?? '—'}
                    </td>
                    <td className="fw-semibold text-nowrap">{formatDT(f.totalTTC ?? 0)}</td>
                    <td className="text-success text-nowrap">{formatDT(f.montantPaye ?? 0)}</td>
                    <td className={Number(f.montantRestant) > 0 ? 'text-danger fw-semibold' : 'text-muted'}>
                      {formatDT(f.montantRestant ?? 0)}
                    </td>
                    <td>
                      <span className={`badge bg-${STATUT_FACTURE_COLORS[f.statut ?? 'BROUILLON']}`}>
                        {STATUT_FACTURE_LABELS[f.statut ?? 'BROUILLON']}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {f.statut === 'BROUILLON' && (
                          <button className="btn btn-sm btn-success" title="Émettre" onClick={() => handleEmettre(f.id!)}>
                            <Send size={13} />
                          </button>
                        )}
                        {isPairable(f) && (
                          <button className="btn btn-sm btn-primary" title="Payer" onClick={() => openPaiement(f)}>
                            <CreditCard size={13} />
                          </button>
                        )}
                        {canManage && f.statut !== 'PAYEE' && f.statut !== 'ANNULEE' && (
                          <button className="btn btn-sm btn-outline-warning" title="Annuler" onClick={() => handleAnnuler(f.id!)}>
                            <Ban size={13} />
                          </button>
                        )}
                        {isAdmin && f.statut === 'BROUILLON' && (
                          <button className="btn btn-sm btn-outline-danger" title="Supprimer" onClick={() => handleDelete(f.id!)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Invoice create / edit modal ─────────────────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{editId ? 'Modifier la facture' : 'Nouvelle facture'}</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)} aria-label="Fermer">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3 mb-4">
                  {([['clientNom','Client *'],['clientEmail','Email'],['clientTelephone','Téléphone'],['clientAdresse','Adresse']] as [keyof Facture, string][]).map(([field, label]) => (
                    <div key={field} className="col-md-3">
                      <label className="form-label fw-semibold small">{label}</label>
                      <input type={field === 'clientEmail' ? 'email' : 'text'} className="form-control"
                        value={(form[field] as string) ?? ''}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Type</label>
                    <select className="form-select" value={form.typeFacture}
                      onChange={e => setForm(f => ({ ...f, typeFacture: e.target.value as TypeFacture }))}>
                      {TYPES.map(t => <option key={t} value={t}>{TYPE_FACTURE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Date d'émission *</label>
                    <input type="date" className="form-control" value={form.dateEmission}
                      onChange={e => setForm(f => ({ ...f, dateEmission: e.target.value }))} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Date d'échéance</label>
                    <input type="date" className="form-control" value={form.dateEcheance ?? ''}
                      onChange={e => setForm(f => ({ ...f, dateEcheance: e.target.value }))} />
                  </div>
                </div>

                <h6 className="fw-bold mb-3">Lignes de facturation</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr><th>Description</th><th style={{width:80}}>Qté</th><th style={{width:130}}>Prix unitaire</th><th style={{width:90}}>TVA %</th><th style={{width:120}}>Total TTC</th><th style={{width:40}}></th></tr>
                    </thead>
                    <tbody>
                      {form.lignes.map((l, i) => (
                        <tr key={i}>
                          <td><input className="form-control form-control-sm" value={l.description}
                              onChange={e => updateLigne(i, 'description', e.target.value)} /></td>
                          <td><input type="number" min={1} className="form-control form-control-sm" value={l.quantite}
                              onChange={e => updateLigne(i, 'quantite', Number(e.target.value))} /></td>
                          <td><input type="number" min={0} step="0.001" className="form-control form-control-sm" value={l.prixUnitaire}
                              onChange={e => updateLigne(i, 'prixUnitaire', Number(e.target.value))} />
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{l.prixTtc ? 'TTC' : 'HT'}</div></td>
                          <td><input type="number" min={0} max={100} className="form-control form-control-sm" value={l.tauxTva ?? 19}
                              onChange={e => updateLigne(i, 'tauxTva', Number(e.target.value))} /></td>
                          <td className="fw-semibold">
                            {formatDT(montantsLigne(l).ttc)}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-danger py-0" onClick={() => removeLigne(i)} disabled={form.lignes.length === 1}>
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-outline-secondary btn-sm mb-4" onClick={addLigne}>
                  <Plus size={14} className="me-1" />Ajouter une ligne
                </button>

                <div className="d-flex justify-content-end mb-3">
                  <table className="table table-sm w-auto mb-0">
                    <tbody>
                      <tr><td className="text-muted pe-4">Sous-total HT</td><td className="text-end fw-semibold">{formatDT(sousTotal)}</td></tr>
                      <tr><td className="text-muted pe-4">TVA</td><td className="text-end">{formatDT(totalTva)}</td></tr>
                      <tr className="table-active"><td className="fw-bold pe-4">Total TTC</td><td className="text-end fw-bold fs-5">{formatDT(totalTTC)}</td></tr>
                    </tbody>
                  </table>
                </div>

                <label className="form-label fw-semibold small">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowModal(false)} disabled={saving}>Annuler</button>
                <button className="btn btn-dark" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  {editId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Method chooser ──────────────────────────────────────── */}
      {showMethodChooser && selectedFacture && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Choisir le mode de paiement</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowMethodChooser(false)} aria-label="Fermer">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2 small mb-4">
                  Facture <strong>{selectedFacture.numero}</strong> — Restant dû :&nbsp;
                  <strong>{formatDT(selectedFacture.montantRestant ?? 0)}</strong>
                </div>

                {/* Manual methods */}
                <div className="row g-2">
                  {METHODES_MANUELLES.map(m => (
                    <div key={m} className="col-6">
                      <button
                        className="btn btn-outline-secondary w-100 d-flex flex-column align-items-center py-3 gap-1"
                        onClick={() => pickMethod(m)}
                      >
                        <MethodeIcon methode={m} size={20} />
                        <span className="small fw-semibold">{METHODE_LABELS[m]}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2b: Manual payment modal ──────────────────────────────── */}
      {showManualModal && selectedFacture && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <MethodeIcon methode={paiementForm.methodePaiement} size={18} />
                  {METHODE_LABELS[paiementForm.methodePaiement]}
                </h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowManualModal(false)} aria-label="Fermer">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="alert alert-info py-2 small mb-4">
                  Facture <strong>{selectedFacture.numero}</strong> — Restant dû :&nbsp;
                  <strong>{formatDT(selectedFacture.montantRestant ?? 0)}</strong>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Montant (DT) *</label>
                  <input type="number" className="form-control" step="0.001" min={0.001}
                    max={Number(selectedFacture.montantRestant)}
                    value={paiementForm.montant}
                    onChange={e => setPaiementForm(p => ({ ...p, montant: Number(e.target.value) }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Note / Référence</label>
                  <input className="form-control" value={paiementForm.note}
                    onChange={e => setPaiementForm(p => ({ ...p, note: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowManualModal(false)} disabled={saving}>Annuler</button>
                <button className="btn btn-success" onClick={handlePaiementManuel} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Confirmer le paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}