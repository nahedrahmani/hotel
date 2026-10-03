import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import {
  rhService, type Employe, type Poste, type Departement, type StatutEmploye,
  POSTE_LABELS, DEPT_LABELS, STATUT_EMPLOYE_COLORS,
} from '../../services/rhService';
import { hasAnyRole, MANAGEMENT_ROLES } from '../../config/access';

const POSTES = Object.keys(POSTE_LABELS) as Poste[];
const DEPARTEMENTS = Object.keys(DEPT_LABELS) as Departement[];
const STATUTS: StatutEmploye[] = ['ACTIF', 'INACTIF', 'EN_CONGE', 'SUSPENDU'];

const EMPTY: Employe = {
  matricule: '', prenom: '', nom: '', email: '', telephone: '',
  poste: 'RECEPTIONNISTE', departement: 'HEBERGEMENT',
  dateEmbauche: '', salaire: undefined,
};

export default function PersonnelPage() {
  // Hide actions the backend refuses for this role (ADMIN/MANAGER only)
  const canManage = hasAnyRole(MANAGEMENT_ROLES);
  const isAdmin = hasAnyRole(['ADMIN']);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<Departement | ''>('');
  const [filterStatut, setFilterStatut] = useState<StatutEmploye | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Employe>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rhService.getAllEmployes();
      setEmployes(res.data);
    } catch {
      setError('Impossible de charger le personnel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    employes.filter(e =>
      (!search || `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase())) &&
      (!filterDept || e.departement === filterDept) &&
      (!filterStatut || e.statut === filterStatut)
    ), [employes, search, filterDept, filterStatut]);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setFormError(''); setShowModal(true); };
  const openEdit = (e: Employe) => { setEditId(e.id!); setForm({ ...e }); setFormError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.matricule || !form.nom || !form.prenom || !form.email) {
      setFormError('Matricule, nom, prénom et email sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      if (editId) await rhService.updateEmploye(editId, form);
      else await rhService.createEmploye(form);
      setShowModal(false);
      load();
    } catch (e: unknown) {
      setFormError((e as any)?.response?.data?.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    try { await rhService.deleteEmploye(id); load(); }
    catch { alert('Erreur lors de la suppression.'); }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Personnel</h2>
          <small className="text-muted">{filtered.length} employé(s)</small>
        </div>
        {canManage && (
          <button className="btn btn-dark d-flex align-items-center gap-2" onClick={openCreate}>
            <Plus size={18} /> Nouvel employé
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex gap-3 flex-wrap align-items-center">
          <div className="input-group" style={{ maxWidth: 260 }}>
            <span className="input-group-text bg-white"><Search size={16} /></span>
            <input className="form-control border-start-0" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value as any)}>
            <option value="">Tous les départements</option>
            {DEPARTEMENTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d]}</option>)}
          </select>
          <select className="form-select w-auto" value={filterStatut} onChange={e => setFilterStatut(e.target.value as any)}>
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="border-bottom">
                <tr>
                  <th className="px-4 py-3">Matricule</th>
                  <th>Nom</th>
                  <th>Poste</th>
                  <th>Département</th>
                  <th>Email</th>
                  <th>Tél</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">Aucun employé trouvé</td></tr>}
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 fw-mono text-muted">{e.matricule}</td>
                    <td className="fw-semibold">{e.prenom} {e.nom}</td>
                    <td><span className="badge bg-secondary bg-opacity-10 text-dark border">{POSTE_LABELS[e.poste]}</span></td>
                    <td>{DEPT_LABELS[e.departement]}</td>
                    <td className="text-muted small">{e.email}</td>
                    <td className="text-muted small">{e.telephone ?? '—'}</td>
                    <td><span className={`badge bg-${STATUT_EMPLOYE_COLORS[e.statut ?? 'ACTIF']}`}>{e.statut ?? 'ACTIF'}</span></td>
                    <td>
                      <div className="d-flex gap-2">
                        {canManage && <button className="btn btn-sm btn-outline-dark" aria-label="Modifier" onClick={() => openEdit(e)}><Edit size={14} /></button>}
                        {isAdmin && <button className="btn btn-sm btn-outline-danger" aria-label="Supprimer" onClick={() => handleDelete(e.id!)}><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{editId ? 'Modifier l\'employé' : 'Nouvel employé'}</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={16} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  {[['matricule','Matricule *'],['prenom','Prénom *'],['nom','Nom *'],['email','Email *'],['telephone','Téléphone']].map(([field, label]) => (
                    <div key={field} className="col-md-6">
                      <label className="form-label fw-semibold">{label}</label>
                      <input type={field === 'email' ? 'email' : 'text'} className="form-control"
                        value={(form as any)[field] ?? ''}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Poste *</label>
                    <select className="form-select" value={form.poste} onChange={e => setForm(f => ({ ...f, poste: e.target.value as Poste }))}>
                      {POSTES.map(p => <option key={p} value={p}>{POSTE_LABELS[p]}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Département *</label>
                    <select className="form-select" value={form.departement} onChange={e => setForm(f => ({ ...f, departement: e.target.value as Departement }))}>
                      {DEPARTEMENTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d]}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Date d'embauche *</label>
                    <input type="date" className="form-control" value={form.dateEmbauche}
                      onChange={e => setForm(f => ({ ...f, dateEmbauche: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Date de naissance</label>
                    <input type="date" className="form-control" value={form.dateNaissance ?? ''}
                      onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Salaire (DT)</label>
                    <input type="number" className="form-control" min={0} value={form.salaire ?? ''}
                      onChange={e => setForm(f => ({ ...f, salaire: Number(e.target.value) }))} />
                  </div>
                </div>
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
    </div>
  );
}
