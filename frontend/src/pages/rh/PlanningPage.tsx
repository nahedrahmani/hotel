import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { rhService, type Shift, type Employe, type TypeShift } from '../../services/rhService';
import { reservationService, type ReservationStats } from '../../services/reservationService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';

const TYPE_COLORS: Record<TypeShift, string> = {
  MATIN: 'warning', APRES_MIDI: 'primary', NUIT: 'dark', JOURNEE_COMPLETE: 'success',
};

const TYPE_LABELS: Record<TypeShift, string> = {
  MATIN: 'Matin', APRES_MIDI: 'Après-midi', NUIT: 'Nuit', JOURNEE_COMPLETE: 'Journée complète',
};

function getWeekDates(base: Date): Date[] {
  const day = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmt(d: Date) { return d.toISOString().split('T')[0]; }

export default function PlanningPage() {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const [weekBase, setWeekBase] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [occupancyStats, setOccupancyStats] = useState<ReservationStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<Shift>({
    employeId: 0, date: fmt(new Date()), heureDebut: '08:00', heureFin: '16:00', typeShift: 'MATIN',
  });

  const week = getWeekDates(weekBase);
  const debut = fmt(week[0]);
  const fin = fmt(week[6]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [shiftRes, empRes, statsRes] = await Promise.all([
        rhService.getPlanning(debut, fin),
        rhService.getAllEmployes(),
        reservationService.getStats(),
      ]);
      setShifts(shiftRes.data);
      setEmployes(empRes.data);
      setOccupancyStats(statsRes.data);
    } catch {
      setError('Impossible de charger le planning.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [debut]);

  const shiftsForDay = (date: Date) => shifts.filter(s => s.date === fmt(date));

  const handleSave = async () => {
    if (!form.employeId || !form.date) { setFormError('Employé et date sont obligatoires.'); return; }
    setSaving(true);
    try {
      await rhService.createShift(form);
      setShowModal(false);
      load();
    } catch (e: unknown) {
      setFormError((e as any)?.response?.data?.message ?? 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce shift ?')) return;
    try { await rhService.deleteShift(id); load(); }
    catch { alert('Erreur lors de la suppression.'); }
  };

  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const checkedIn = occupancyStats?.checkedIn ?? 0;
  const occupancyColor = checkedIn > 20 ? 'danger' : checkedIn > 10 ? 'warning' : 'success';

  return (
    <div className="container-fluid p-4">
      {occupancyStats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-3">
                <div className={`fs-3 fw-bold text-${occupancyColor}`}>{checkedIn}</div>
                <div className="text-muted small">Chambres occupées</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-3">
                <div className="fs-3 fw-bold text-success">{occupancyStats.todayCheckIns}</div>
                <div className="text-muted small">Arrivées aujourd'hui</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-3">
                <div className="fs-3 fw-bold text-warning">{occupancyStats.todayCheckOuts}</div>
                <div className="text-muted small">Départs aujourd'hui</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-3">
                <div className="fs-3 fw-bold text-primary">{occupancyStats.confirmed}</div>
                <div className="text-muted small">Confirmées (à venir)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Planning</h2>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}>
              <ChevronLeft size={16} />
            </button>
            <span className="fw-semibold small">{week[0].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – {week[6].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}>
              <ChevronRight size={16} />
            </button>
          </div>
          {canManage && (
            <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => { setForm({ employeId: 0, date: fmt(new Date()), heureDebut: '08:00', heureFin: '16:00', typeShift: 'MATIN' }); setFormError(''); setShowModal(true); }}>
              <Plus size={18} /> Ajouter shift
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0" style={{ minWidth: 900 }}>
              <thead className="table-light">
                <tr>
                  {week.map((d, i) => (
                    <th key={i} className="text-center py-3" style={{ minWidth: 120 }}>
                      <div className="fw-bold">{DAY_NAMES[i]}</div>
                      <div className="small text-muted">{d.getDate()}/{d.getMonth() + 1}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {week.map((d, i) => (
                    <td key={i} className="p-2 align-top" style={{ minHeight: 120 }}>
                      {shiftsForDay(d).length === 0
                        ? <div className="text-muted small text-center mt-3">—</div>
                        : shiftsForDay(d).map(s => (
                          <div key={s.id} className={`bg-${TYPE_COLORS[s.typeShift ?? 'MATIN']} bg-opacity-10 border border-${TYPE_COLORS[s.typeShift ?? 'MATIN']} rounded p-2 mb-2 small position-relative`}>
                            <div className="fw-semibold">{s.employePrenom} {s.employeNom}</div>
                            <div className="text-muted">{s.heureDebut} – {s.heureFin}</div>
                            <span className={`badge bg-${TYPE_COLORS[s.typeShift ?? 'MATIN']}`}>{TYPE_LABELS[s.typeShift ?? 'MATIN']}</span>
                            {canManage && <button className="btn btn-sm p-0 position-absolute top-0 end-0 m-1 text-danger border-0 bg-transparent" onClick={() => handleDelete(s.id!)} aria-label="Supprimer"><Trash2 size={12} /></button>}
                          </div>
                        ))
                      }
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Nouveau shift</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={16} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Employé *</label>
                    <select className="form-select" value={form.employeId} onChange={e => setForm(f => ({ ...f, employeId: Number(e.target.value) }))}>
                      <option value={0}>— Sélectionner —</option>
                      {employes.filter(e => e.statut === 'ACTIF').map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Date *</label>
                    <input type="date" className="form-control" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Heure début</label>
                    <input type="time" className="form-control" value={form.heureDebut} onChange={e => setForm(f => ({ ...f, heureDebut: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Heure fin</label>
                    <input type="time" className="form-control" value={form.heureFin} onChange={e => setForm(f => ({ ...f, heureFin: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Type</label>
                    <select className="form-select" value={form.typeShift} onChange={e => setForm(f => ({ ...f, typeShift: e.target.value as TypeShift }))}>
                      {(Object.keys(TYPE_LABELS) as TypeShift[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Note</label>
                    <input type="text" className="form-control" value={form.note ?? ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowModal(false)} disabled={saving}>Annuler</button>
                <button className="btn btn-dark" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null} Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
