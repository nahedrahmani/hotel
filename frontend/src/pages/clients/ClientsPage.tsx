import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Upload, FileText, History, ChevronDown, ChevronUp } from 'lucide-react';
import {
  clientService,
  type ClientProfile,
  type ClientDocument,
  type CheckInRecord,
  type BedType,
  type DocumentType,
} from '../../services/clientService';
import keycloak from '../../config/keycloak';
import { hasAnyRole } from '../../config/access';

const BED_LABELS: Record<BedType, string> = {
  SINGLE: 'Lit simple', DOUBLE: 'Lit double', TWIN: 'Lits jumeaux', KING: 'Lit King', SUITE: 'Suite',
};

const DOC_LABELS: Record<DocumentType, string> = {
  PASSPORT: 'Passeport', ID_CARD: "Carte d'identité", VISA: 'Visa', OTHER: 'Autre',
};

const EMPTY_PROFILE: ClientProfile = {
  keycloakId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  nationality: '',
  language: 'fr',
  smokingRoom: false,
};

const ClientsPage: React.FC = () => {
  const isAdmin = hasAnyRole(['ADMIN']);
  const [clients, setClients]         = useState<ClientProfile[]>([]);
  const [selected, setSelected]       = useState<ClientProfile | null>(null);
  const [documents, setDocuments]     = useState<ClientDocument[]>([]);
  const [history, setHistory]         = useState<CheckInRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState<ClientProfile>(EMPTY_PROFILE);
  const [saving, setSaving]           = useState(false);
  const [showDocs, setShowDocs]       = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [docFile, setDocFile]         = useState<File | null>(null);
  const [docType, setDocType]         = useState<DocumentType>('PASSPORT');
  const [docNumber, setDocNumber]     = useState('');
  const [docExpiry, setDocExpiry]     = useState('');
  const [uploading, setUploading]     = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await clientService.getAll();
      setClients(res.data);
    } catch {
      setError('Impossible de charger les clients.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const selectClient = async (c: ClientProfile) => {
    setSelected(c);
    setShowDocs(false);
    setShowHistory(false);
    const [docsRes, histRes] = await Promise.allSettled([
      clientService.getDocuments(c.keycloakId),
      clientService.getHistory(c.keycloakId),
    ]);
    setDocuments(docsRes.status === 'fulfilled' ? docsRes.value.data : []);
    setHistory(histRes.status === 'fulfilled' ? histRes.value.data : []);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_PROFILE, keycloakId: keycloak.tokenParsed?.sub ?? '' });
    setShowForm(true);
  };

  const openEdit = (c: ClientProfile) => {
    setForm({ ...c });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.keycloakId) return;
    setSaving(true);
    try {
      await clientService.createOrUpdate(form);
      setShowForm(false);
      fetchClients();
      if (selected?.keycloakId === form.keycloakId) selectClient(form);
    } catch (e: any) {
      alert(e?.response?.data ?? 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (c: ClientProfile) => {
    if (!window.confirm(`Supprimer le profil de ${c.firstName} ${c.lastName} ?`)) return;
    try {
      await clientService.delete(c.keycloakId);
      if (selected?.keycloakId === c.keycloakId) setSelected(null);
      fetchClients();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  const uploadDoc = async () => {
    if (!docFile || !selected) return;
    setUploading(true);
    try {
      const res = await clientService.uploadDocument(
        selected.keycloakId, docType, docFile, docNumber || undefined, docExpiry || undefined,
      );
      setDocuments(prev => [...prev, res.data]);
      setDocFile(null); setDocNumber(''); setDocExpiry('');
    } catch {
      alert('Erreur lors du téléversement du document.');
    } finally { setUploading(false); }
  };

  const deleteDoc = async (docId: number) => {
    if (!selected) return;
    try {
      await clientService.deleteDocument(selected.keycloakId, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch {
      alert('Erreur lors de la suppression du document.');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Fiches clients</h2>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={openCreate}>
          <Plus size={18} /> Nouveau client
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        {/* Client list */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            {loading ? (
              <div className="text-center p-4"><div className="spinner-border spinner-border-sm" /></div>
            ) : clients.length === 0 ? (
              <div className="text-center text-muted p-4 small">Aucun client enregistré</div>
            ) : (
              <div className="list-group list-group-flush rounded">
                {clients.map(c => (
                  <button
                    key={c.keycloakId}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected?.keycloakId === c.keycloakId ? 'active' : ''}`}
                    onClick={() => selectClient(c)}
                  >
                    <div>
                      <div className="fw-semibold">{c.firstName} {c.lastName}</div>
                      <small className={selected?.keycloakId === c.keycloakId ? 'text-white-50' : 'text-muted'}>
                        {c.email || c.nationality || c.keycloakId.slice(0, 12) + '…'}
                      </small>
                    </div>
                    {isAdmin && (
                      <button
                        className={`btn btn-sm ${selected?.keycloakId === c.keycloakId ? 'btn-outline-light' : 'btn-outline-danger'}`}
                        onClick={e => { e.stopPropagation(); handleDelete(c); }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile detail */}
        <div className="col-lg-8">
          {!selected ? (
            <div className="card border-0 shadow-sm text-center text-muted p-5">
              <p className="mb-0">Sélectionnez un client pour voir sa fiche</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {/* Profile card */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
                  <h6 className="fw-bold mb-0">{selected.firstName} {selected.lastName}</h6>
                  <button className="btn btn-sm btn-outline-dark" onClick={() => openEdit(selected)}>
                    Modifier
                  </button>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {[
                      ['Email', selected.email], ['Téléphone', selected.phone],
                      ['Nationalité', selected.nationality], ['Langue', selected.language],
                      ['Type de lit', selected.bedType ? BED_LABELS[selected.bedType] : '—'],
                      ['Étage préféré', selected.preferredFloor ?? '—'],
                      ['Chambre fumeur', selected.smokingRoom ? 'Oui' : 'Non'],
                    ].map(([label, value]) => (
                      <div className="col-md-6" key={label as string}>
                        <small className="text-muted d-block">{label}</small>
                        <span className="fw-semibold">{value || '—'}</span>
                      </div>
                    ))}
                    {selected.specialRequests && (
                      <div className="col-12">
                        <small className="text-muted d-block">Demandes spéciales</small>
                        <span>{selected.specialRequests}</span>
                      </div>
                    )}
                    {selected.notes && (
                      <div className="col-12">
                        <small className="text-muted d-block">Notes internes</small>
                        <span className="fst-italic text-secondary">{selected.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="card border-0 shadow-sm">
                <button
                  className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3 w-100 text-start"
                  onClick={() => setShowDocs(v => !v)}
                >
                  <span className="fw-semibold d-flex align-items-center gap-2">
                    <FileText size={16} /> Documents ({documents.length})
                  </span>
                  {showDocs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showDocs && (
                  <div className="card-body">
                    {documents.map(doc => (
                      <div key={doc.id} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                        <div>
                          <span className="badge bg-secondary me-2">{DOC_LABELS[doc.type]}</span>
                          {doc.documentNumber && <small className="text-muted me-2">{doc.documentNumber}</small>}
                          {doc.expiryDate && <small className="text-muted">Exp: {doc.expiryDate}</small>}
                        </div>
                        <div className="d-flex gap-2">
                          <a href={doc.cloudinaryUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                            Voir
                          </a>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteDoc(doc.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 p-3 border rounded">
                      <div className="row g-2">
                        <div className="col-md-4">
                          <select className="form-select form-select-sm" value={docType} onChange={e => setDocType(e.target.value as DocumentType)}>
                            {(Object.entries(DOC_LABELS) as [DocumentType, string][]).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <input className="form-control form-control-sm" placeholder="N° document" value={docNumber} onChange={e => setDocNumber(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <input type="date" className="form-control form-control-sm" value={docExpiry} onChange={e => setDocExpiry(e.target.value)} />
                        </div>
                        <div className="col-12">
                          <input type="file" className="form-control form-control-sm" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                        </div>
                        <div className="col-12">
                          <button className="btn btn-sm btn-dark d-flex align-items-center gap-1" onClick={uploadDoc} disabled={!docFile || uploading}>
                            {uploading ? <span className="spinner-border spinner-border-sm" /> : <Upload size={13} />}
                            Téléverser
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stay history */}
              <div className="card border-0 shadow-sm">
                <button
                  className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3 w-100 text-start"
                  onClick={() => setShowHistory(v => !v)}
                >
                  <span className="fw-semibold d-flex align-items-center gap-2">
                    <History size={16} /> Historique des séjours ({history.length})
                  </span>
                  {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showHistory && (
                  <div className="card-body p-0">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="border-bottom">
                        <tr>
                          <th className="px-3">Réservation</th>
                          <th>Chambre</th>
                          <th>Type</th>
                          <th>Date</th>
                          <th>Documents vérifiés</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.length === 0 && (
                          <tr><td colSpan={5} className="text-center text-muted py-3">Aucun séjour enregistré</td></tr>
                        )}
                        {history.map(r => (
                          <tr key={r.id}>
                            <td className="px-3">#{r.reservationId}</td>
                            <td>{r.chambreId ?? '—'}</td>
                            <td>
                              <span className={`badge bg-${r.type === 'CHECKIN' ? 'success' : 'warning'}`}>
                                {r.type === 'CHECKIN' ? '▶ Arrivée' : '◀ Départ'}
                              </span>
                            </td>
                            <td className="text-muted small">
                              {r.actualTime ? new Date(r.actualTime).toLocaleString('fr-FR') : '—'}
                            </td>
                            <td>{r.documentVerified ? '✓' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{form.id ? 'Modifier le client' : 'Nouveau client'}</h5>
                <button className="btn btn-sm btn-light" onClick={() => setShowForm(false)}><X size={14} /></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {[
                    ['keycloakId', 'ID Keycloak *', 'text', !form.id],
                    ['firstName', 'Prénom', 'text', false],
                    ['lastName', 'Nom', 'text', false],
                    ['email', 'Email', 'email', false],
                    ['phone', 'Téléphone', 'text', false],
                    ['nationality', 'Nationalité', 'text', false],
                    ['language', 'Langue', 'text', false],
                    ['preferredFloor', 'Étage préféré', 'number', false],
                  ].map(([field, label, type, readOnly]) => (
                    <div className="col-md-6" key={field as string}>
                      <label className="form-label fw-semibold small">{label as string}</label>
                      <input
                        type={type as string}
                        className="form-control"
                        value={(form as any)[field as string] ?? ''}
                        onChange={e => setForm(f => ({ ...f, [field as string]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                        readOnly={readOnly as boolean}
                      />
                    </div>
                  ))}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Type de lit</label>
                    <select className="form-select" value={form.bedType ?? ''} onChange={e => setForm(f => ({ ...f, bedType: e.target.value as BedType || undefined }))}>
                      <option value="">— Aucune préférence —</option>
                      {(Object.entries(BED_LABELS) as [BedType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Chambre fumeur</label>
                    <select className="form-select" value={form.smokingRoom ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, smokingRoom: e.target.value === 'true' }))}>
                      <option value="false">Non</option>
                      <option value="true">Oui</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Demandes spéciales</label>
                    <textarea className="form-control" rows={2} value={form.specialRequests ?? ''} onChange={e => setForm(f => ({ ...f, specialRequests: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Notes internes (staff uniquement)</label>
                    <textarea className="form-control" rows={2} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setShowForm(false)}>Annuler</button>
                <button className="btn btn-dark" onClick={handleSave} disabled={saving || !form.keycloakId}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
