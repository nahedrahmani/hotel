import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Settings, Plus, Pencil, Trash2, X } from 'lucide-react';
import { chambreService, type Chambre, ROOM_TYPE_LABELS, STATUT_LABELS, STATUT_COLORS, roomPhoto } from '../../services/chambreService';
import { reservationService, type ReservationStatus } from '../../services/reservationService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';
import { formatDT } from '../../utils/format';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function PolitiqueModal({ chambre, onClose, onSaved }: {
  chambre: Chambre; onClose: () => void; onSaved: (c: Chambre) => void;
}) {
  const [weekendMultiplier,       setWeekendMultiplier]       = useState(chambre.weekendMultiplier ?? 1.0);
  const [peakMultiplier,          setPeakMultiplier]          = useState(chambre.peakMultiplier ?? 1.0);
  const [peakMonthsSet,           setPeakMonthsSet]           = useState<Set<number>>(
    new Set((chambre.peakMonths ?? '').split(',').filter(Boolean).map(Number))
  );
  const [cancellationPolicyHours, setCancellationPolicyHours] = useState(chambre.cancellationPolicyHours ?? 48);
  const [cancellationFeePercent,  setCancellationFeePercent]  = useState(chambre.cancellationFeePercent ?? 50);
  const [nonRefundableHours,      setNonRefundableHours]      = useState(chambre.nonRefundableHours ?? 24);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const toggleMonth = (m: number) =>
    setPeakMonthsSet(prev => {
      const s = new Set(prev);
      if (s.has(m)) s.delete(m); else s.add(m);
      return s;
    });

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await chambreService.updatePolitique(chambre.id!, {
        weekendMultiplier,
        peakMultiplier,
        peakMonths: [...peakMonthsSet].sort((a, b) => a - b).join(','),
        cancellationPolicyHours,
        cancellationFeePercent,
        nonRefundableHours,
      });
      onSaved(res.data);
      onClose();
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">
              <Settings size={18} className="me-2" />
              Politique — Chambre {chambre.numero}
            </h5>
            <button className="btn btn-sm btn-light" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <h6 className="fw-semibold mb-3 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Tarification dynamique</h6>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Multiplicateur week-end</label>
                <div className="d-flex align-items-center gap-3">
                  <input type="range" className="form-range flex-grow-1" min={1} max={3} step={0.05}
                    value={weekendMultiplier} onChange={e => setWeekendMultiplier(Number(e.target.value))} />
                  <span className="badge bg-dark" style={{ minWidth: 48 }}>×{weekendMultiplier.toFixed(2)}</span>
                </div>
                <small className="text-muted">Sam & Dim — {weekendMultiplier === 1 ? 'Pas de surcharge' : `+${((weekendMultiplier - 1) * 100).toFixed(0)}%`}</small>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Multiplicateur haute saison</label>
                <div className="d-flex align-items-center gap-3">
                  <input type="range" className="form-range flex-grow-1" min={1} max={3} step={0.05}
                    value={peakMultiplier} onChange={e => setPeakMultiplier(Number(e.target.value))} />
                  <span className="badge bg-dark" style={{ minWidth: 48 }}>×{peakMultiplier.toFixed(2)}</span>
                </div>
                <small className="text-muted">{peakMultiplier === 1 ? 'Pas de surcharge' : `+${((peakMultiplier - 1) * 100).toFixed(0)}%`}</small>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Mois de haute saison</label>
                <div className="d-flex flex-wrap gap-2">
                  {MONTHS.map((name, i) => {
                    const m = i + 1;
                    const active = peakMonthsSet.has(m);
                    return (
                      <button key={m} type="button"
                        className={`btn btn-sm ${active ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => toggleMonth(m)}>
                        {name}
                      </button>
                    );
                  })}
                </div>
                <small className="text-muted">
                  {peakMonthsSet.size === 0 ? 'Aucun mois sélectionné' : `${peakMonthsSet.size} mois sélectionné${peakMonthsSet.size > 1 ? 's' : ''}`}
                </small>
              </div>
            </div>

            <h6 className="fw-semibold mb-3 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Politique d'annulation</h6>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Annulation gratuite avant</label>
                <div className="input-group">
                  <input type="number" className="form-control" min={0} value={cancellationPolicyHours}
                    onChange={e => setCancellationPolicyHours(Number(e.target.value))} />
                  <span className="input-group-text">h</span>
                </div>
                <small className="text-muted">Avant l'arrivée</small>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Pénalité après délai</label>
                <div className="input-group">
                  <input type="number" className="form-control" min={0} max={100} value={cancellationFeePercent}
                    onChange={e => setCancellationFeePercent(Number(e.target.value))} />
                  <span className="input-group-text">%</span>
                </div>
                <small className="text-muted">Du montant total</small>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Non remboursable avant</label>
                <div className="input-group">
                  <input type="number" className="form-control" min={0} value={nonRefundableHours}
                    onChange={e => setNonRefundableHours(Number(e.target.value))} />
                  <span className="input-group-text">h</span>
                </div>
                <small className="text-muted">100% de pénalité</small>
              </div>
              <div className="col-12">
                <div className="alert alert-info py-2 small mb-0">
                  Résumé : annulation gratuite jusqu'à <strong>{cancellationPolicyHours}h</strong> avant l'arrivée,
                  pénalité de <strong>{cancellationFeePercent}%</strong> entre {cancellationPolicyHours}h et {nonRefundableHours}h,
                  non remboursable dans les <strong>{nonRefundableHours}h</strong>.
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button className="btn btn-light" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="btn btn-dark d-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={15} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const AMENITIES: { key: 'wifi' | 'climatisation' | 'television' | 'minibar' | 'balcon' | 'vueMer'; label: string }[] = [
  { key: 'wifi', label: 'WiFi' },
  { key: 'climatisation', label: 'Climatisation' },
  { key: 'television', label: 'Télévision' },
  { key: 'minibar', label: 'Minibar' },
  { key: 'balcon', label: 'Balcon' },
  { key: 'vueMer', label: 'Vue mer' },
];

// Only these two are set by hand; the others follow reservations and housekeeping
const MANUAL_STATUTS = ['disponible', 'hors_service'];

const EMPTY_CHAMBRE: Chambre = { numero: '', type: 'DOUBLE', prix: 0, capacite: 2, statut: 'disponible' };

function ChambreModal({ chambre, numerosPris, onClose, onSaved }: {
  chambre: Chambre | null; numerosPris: string[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm]     = useState<Chambre>(chambre ?? EMPTY_CHAMBRE);
  const [photo, setPhoto]   = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const statutManuel = MANUAL_STATUTS.includes(form.statut);

  const set = <K extends keyof Chambre>(key: K, value: Chambre[K]) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const numero = form.numero.trim();
    if (!numero) return setError('Le numéro est obligatoire.');
    if (numerosPris.some(n => n.toLowerCase() === numero.toLowerCase())) return setError(`La chambre ${numero} existe déjà.`);
    if (!(form.prix > 0)) return setError('Le prix par nuit doit être supérieur à 0.');
    if (!(form.capacite >= 1)) return setError('La capacité doit être d\'au moins 1 personne.');

    setSaving(true); setError('');
    try {
      const data = { ...form, numero };
      if (chambre?.id) await chambreService.updateChambre(chambre.id, data, photo);
      else await chambreService.createChambre(data, photo);
      onSaved();
      onClose();
    } catch (e) {
      setError(apiError(e, 'Erreur lors de l\'enregistrement.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">{chambre ? `Modifier la chambre ${chambre.numero}` : 'Nouvelle chambre'}</h5>
            <button className="btn btn-sm btn-light" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Numéro *</label>
                <input className="form-control" value={form.numero} onChange={e => set('numero', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Type *</label>
                <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  {Object.entries(ROOM_TYPE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  {!ROOM_TYPE_LABELS[form.type] && <option value={form.type}>{form.type}</option>}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Statut</label>
                {statutManuel ? (
                  <select className="form-select" value={form.statut} onChange={e => set('statut', e.target.value)}>
                    {MANUAL_STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                  </select>
                ) : (
                  <div className="form-control bg-light text-muted">{STATUT_LABELS[form.statut] ?? form.statut} — suit les réservations</div>
                )}
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Prix / nuit *</label>
                <div className="input-group">
                  <input type="number" className="form-control" min={0} step="0.5" value={form.prix || ''}
                    onChange={e => set('prix', Number(e.target.value))} />
                  <span className="input-group-text">DT</span>
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Capacité *</label>
                <input type="number" className="form-control" min={1} value={form.capacite || ''}
                  onChange={e => set('capacite', Number(e.target.value))} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Étage</label>
                <input type="number" className="form-control" value={form.etage ?? ''}
                  onChange={e => set('etage', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Superficie</label>
                <div className="input-group">
                  <input type="number" className="form-control" min={0} value={form.superficie ?? ''}
                    onChange={e => set('superficie', e.target.value === '' ? undefined : Number(e.target.value))} />
                  <span className="input-group-text">m²</span>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Équipements</label>
                <div className="d-flex flex-wrap gap-3">
                  {AMENITIES.map(a => (
                    <div key={a.key} className="form-check">
                      <input className="form-check-input" type="checkbox" id={`eq-${a.key}`}
                        checked={!!form[a.key]} onChange={e => set(a.key, e.target.checked)} />
                      <label className="form-check-label" htmlFor={`eq-${a.key}`}>{a.label}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea className="form-control" rows={2} value={form.description ?? ''}
                  onChange={e => set('description', e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Photo</label>
                <input type="file" className="form-control" accept="image/*"
                  onChange={e => setPhoto(e.target.files?.[0])} />
                {form.photo && !photo && <small className="text-muted">Une photo est déjà enregistrée ; en choisir une autre la remplace.</small>}
              </div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button className="btn btn-light" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="btn btn-dark d-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={15} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ENDED: ReservationStatus[] = ['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'];

function SuppressionModal({ chambre, onClose, onDone }: {
  chambre: Chambre; onClose: () => void; onDone: () => void;
}) {
  const [aVenir, setAVenir]   = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    reservationService.getByRoom(chambre.id!)
      .then(res => setAVenir(res.data.filter(r => !ENDED.includes(r.status!) && (r.checkOutDate ?? '') >= today).length))
      .catch(() => setError('Impossible de vérifier les réservations de cette chambre.'));
  }, [chambre.id]);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setWorking(true); setError('');
    try { await action(); onDone(); onClose(); }
    catch (e) { setError(apiError(e, fallback)); }
    finally { setWorking(false); }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0">
            <h6 className="modal-title fw-bold">Supprimer la chambre {chambre.numero}</h6>
            <button className="btn btn-sm btn-light" onClick={onClose}><X size={14} /></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {aVenir === null && !error && <div className="text-center"><div className="spinner-border spinner-border-sm" /></div>}
            {aVenir !== null && aVenir > 0 && (
              <div className="alert alert-warning py-2 mb-0">
                {aVenir} réservation{aVenir > 1 ? 's' : ''} en cours ou à venir sur cette chambre.
                Annulez-les avant de la supprimer, ou passez-la hors service pour bloquer les nouvelles réservations.
              </div>
            )}
            {aVenir === 0 && (
              <p className="mb-0">
                La chambre sera supprimée définitivement. Pour la retirer temporairement de la vente,
                passez-la plutôt hors service.
              </p>
            )}
          </div>
          <div className="modal-footer border-0">
            <button className="btn btn-light" onClick={onClose} disabled={working}>Annuler</button>
            {aVenir !== null && chambre.statut !== 'hors_service' && (
              <button className="btn btn-outline-dark" disabled={working}
                onClick={() => run(() => chambreService.updateChambre(chambre.id!, { ...chambre, statut: 'hors_service' }), 'Erreur lors de la mise hors service.')}>
                Passer hors service
              </button>
            )}
            {aVenir === 0 && (
              <button className="btn btn-danger" disabled={working}
                onClick={() => run(() => chambreService.deleteChambre(chambre.id!), 'Erreur lors de la suppression.')}>
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChambresPage() {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const isAdmin = hasAnyRole(['ADMIN']);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editing, setEditing]   = useState<Chambre | null>(null);
  // undefined = closed, null = new room, Chambre = edit
  const [form, setForm]         = useState<Chambre | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Chambre | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setChambres((await chambreService.getAllChambres()).data); }
    catch { setError('Impossible de charger les chambres.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSaved = (updated: Chambre) =>
    setChambres(prev => prev.map(c => c.id === updated.id ? updated : c));

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Chambres</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-dark btn-sm d-flex align-items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualiser
          </button>
          {canManage && (
            <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => setForm(null)}>
              <Plus size={18} /> Nouvelle chambre
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="border-bottom">
                <tr>
                  <th className="px-4 py-3">Chambre</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Étage</th>
                  <th className="py-3">Prix/nuit</th>
                  <th className="py-3">Tarifs</th>
                  <th className="py-3">Annulation</th>
                  <th className="py-3">Statut</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chambres.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">Aucune chambre</td></tr>
                )}
                {chambres.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 fw-semibold">
                      <div className="d-flex align-items-center gap-3">
                        <img src={roomPhoto(c)} alt="" loading="lazy" className="rounded-2" style={{ width: 56, height: 38, objectFit: 'cover' }} />
                        {c.numero}
                      </div>
                    </td>
                    <td className="py-3">{ROOM_TYPE_LABELS[c.type] ?? c.type} <span className="text-muted small">· {c.capacite} pers.</span></td>
                    <td className="py-3">{c.etage ?? '—'}</td>
                    <td className="py-3">{formatDT(c.prix)}</td>
                    <td className="py-3 small">
                      {(c.weekendMultiplier ?? 1) > 1 || ((c.peakMultiplier ?? 1) > 1 && c.peakMonths)
                        ? [
                            (c.weekendMultiplier ?? 1) > 1 && `Week-end ×${c.weekendMultiplier?.toFixed(2)}`,
                            (c.peakMultiplier ?? 1) > 1 && c.peakMonths && `Saison ×${c.peakMultiplier?.toFixed(2)}`,
                          ].filter(Boolean).join(' · ')
                        : <span className="text-muted">Standard</span>}
                    </td>
                    <td className="py-3 small text-muted">
                      Gratuit {c.cancellationPolicyHours ?? 48}h · {c.cancellationFeePercent ?? 50}%
                    </td>
                    <td className="py-3">
                      <span className={`badge bg-${STATUT_COLORS[c.statut] ?? 'secondary'}`}>{STATUT_LABELS[c.statut] ?? c.statut}</span>
                    </td>
                    <td className="py-3">
                      <div className="d-flex gap-1">
                        {canManage && (
                          <>
                            <button className="btn btn-sm btn-outline-dark" title="Modifier" onClick={() => setForm(c)}>
                              <Pencil size={13} />
                            </button>
                            <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1" title="Tarifs et annulation"
                              onClick={() => setEditing(c)}>
                              <Settings size={13} /> Politique
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button className="btn btn-sm btn-outline-danger" title="Supprimer" onClick={() => setToDelete(c)}>
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

      {editing && (
        <PolitiqueModal chambre={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}

      {form !== undefined && (
        <ChambreModal
          chambre={form}
          numerosPris={chambres.filter(c => c.id !== form?.id).map(c => c.numero)}
          onClose={() => setForm(undefined)}
          onSaved={load}
        />
      )}

      {toDelete && (
        <SuppressionModal chambre={toDelete} onClose={() => setToDelete(null)} onDone={load} />
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
