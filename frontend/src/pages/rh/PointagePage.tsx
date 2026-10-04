import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogIn, LogOut, Plus, X } from 'lucide-react';
import {
  rhService, type Pointage, type Employe, type StatutPointage,
  STATUT_POINTAGE_COLORS,
} from '../../services/rhService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';
import { apiError } from '../../utils/api';

const today = () => new Date().toISOString().split('T')[0];

const STATUTS: StatutPointage[] = ['PRESENT', 'ABSENT', 'RETARD', 'EN_CONGE', 'JOUR_FERIE'];
const STATUT_LABELS: Record<StatutPointage, string> = {
  PRESENT: 'Présent', ABSENT: 'Absent', RETARD: 'Retard',
  EN_CONGE: 'En congé', JOUR_FERIE: 'Jour férié',
};

export default function PointagePage() {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const [date, setDate] = useState(today());
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Pointage>({ employeId: 0, date: today(), statut: 'PRESENT' });
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, eRes, sRes] = await Promise.all([
        rhService.getPointagesDuJour(date),
        rhService.getAllEmployes(),
        rhService.getStatsPointage(date),
      ]);
      setPointages(pRes.data);
      setEmployes(eRes.data);
      setStats(sRes.data);
    } catch {
      setError('Impossible de charger les pointages.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const handleEntree = async (employeId: number) => {
    try { await rhService.pointageEntree(employeId); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur pointage entrée.')); }
  };

  const handleSortie = async (employeId: number) => {
    try { await rhService.pointageSortie(employeId); load(); }
    catch (e: unknown) { setError(apiError(e, 'Erreur pointage sortie.')); }
  };

  const handleCreate = async () => {
    if (!form.employeId) { setFormError('Sélectionner un employé.'); return; }
    setSaving(true);
    try {
      await rhService.createPointage(form);
      setShowModal(false);
      load();
    } catch (e: unknown) {
      setFormError(apiError(e, 'Erreur.'));
    } finally { setSaving(false); }
  };

  const pointageEmploye = (empId: number) => pointages.find(p => p.employeId === empId);
  const actifs = employes.filter(e => e.statut === 'ACTIF');

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Pointage</h2>
        <div className="d-flex align-items-center gap-2">
          <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          {canManage && (
            <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => { setForm({ employeId: 0, date, statut: 'PRESENT' }); setFormError(''); setShowModal(true); }}>
              <Plus size={18} /> Pointage manuel
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        {[
          { label: 'Présents', key: 'presents', color: 'success' },
          { label: 'Retards', key: 'retards', color: 'warning' },
          { label: 'Absents', key: 'absents', color: 'danger' },
          { label: 'En congé', key: 'conges', color: 'info' },
        ].map(({ label, key, color }) => (
          <div key={key} className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-${color} bg-opacity-10 p-3 text-${color}`} style={{ fontSize: 20 }}>●</div>
                <div>
                  <div className="fs-4 fw-bold">{stats[key] ?? 0}</div>
                  <div className="text-muted small">{label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="border-bottom">
                <tr>
                  <th className="px-4 py-3">Employé</th>
                  <th>Statut</th>
                  <th>Entrée</th>
                  <th>Sortie</th>
                  <th>Retard</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {actifs.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">Aucun employé actif</td></tr>}
                {actifs.map(emp => {
                  const p = pointageEmploye(emp.id!);
                  return (
                    <tr key={emp.id}>
                      <td className="px-4 fw-semibold">{emp.prenom} {emp.nom}</td>
                      <td>
                        {p
                          ? <span className={`badge bg-${STATUT_POINTAGE_COLORS[p.statut ?? 'PRESENT']}`}>{STATUT_LABELS[p.statut ?? 'PRESENT']}</span>
                          : <span className="badge bg-secondary">Non pointé</span>}
                      </td>
                      <td className="text-muted">{p?.heureEntree ?? '—'}</td>
                      <td className="text-muted">{p?.heureSortie ?? '—'}</td>
                      <td>{p?.retardMinutes ? <span className="text-warning fw-semibold">{p.retardMinutes} min</span> : '—'}</td>
                      <td>
                        <div className="d-flex gap-2">
                          {!p && (
                            <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleEntree(emp.id!)}>
                              <LogIn size={14} /> Entrée
                            </button>
                          )}
                          {p && !p.heureSortie && (
                            <button className="btn btn-sm btn-warning d-flex align-items-center gap-1" onClick={() => handleSortie(emp.id!)}>
                              <LogOut size={14} /> Sortie
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <h5 className="modal-title fw-bold">Pointage manuel</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={16} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Employé *</label>
                    <select className="form-select" value={form.employeId} onChange={e => setForm(f => ({ ...f, employeId: Number(e.target.value) }))}>
                      <option value={0}>— Sélectionner —</option>
                      {actifs.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Date</label>
                    <input type="date" className="form-control" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Heure entrée</label>
                    <input type="time" className="form-control" value={form.heureEntree ?? ''} onChange={e => setForm(f => ({ ...f, heureEntree: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Heure sortie</label>
                    <input type="time" className="form-control" value={form.heureSortie ?? ''} onChange={e => setForm(f => ({ ...f, heureSortie: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Statut</label>
                    <select className="form-select" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutPointage }))}>
                      {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
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
                <button className="btn btn-dark" onClick={handleCreate} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null} Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
