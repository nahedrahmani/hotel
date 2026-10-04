import { useEffect, useState } from 'react';
import { KeyRound, Save } from 'lucide-react';
import keycloak from '../../config/keycloak';
import { isStaff, userRoles } from '../../config/access';
import { clientService, type ClientProfile, type BedType, BED_TYPE_LABELS } from '../../services/clientService';
import { apiError } from '../../utils/api';
import { userService, type Account } from '../../services/userService';

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Administrateur', MANAGER: 'Manager', STAFF: 'Personnel' };

/**
 * The user's own profile. Name and e-mail are edited here and saved to the login account
 * by user-service; the password is changed on the (branded) Keycloak form so the app never
 * handles it. Stay preferences are the hotel's client profile, read by the reception.
 */
export default function ProfilePage() {
  const token = keycloak.tokenParsed;
  const keycloakId = token?.sub ?? '';
  const staff = isStaff();
  const role = staff ? userRoles().map(r => ROLE_LABELS[r]).find(Boolean) : 'Client';

  const [profile, setProfile] = useState<ClientProfile>({ keycloakId });
  const [loading, setLoading] = useState(!staff);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  const [account, setAccount] = useState<Account>({
    firstName: token?.given_name ?? '', lastName: token?.family_name ?? '', email: token?.email ?? '',
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const emailVerified = token?.email_verified !== false;

  const saveAccount = async () => {
    setSavingAccount(true);
    setAccountMsg(null);
    try {
      const res = await userService.updateMe({
        firstName: account.firstName.trim(), lastName: account.lastName.trim(), email: account.email.trim(),
      });
      // Get a new token now so the new name shows everywhere without logging in again
      await keycloak.updateToken(-1);
      setAccountMsg({
        ok: true,
        text: res.data.verificationSent
          ? `Compte mis à jour. Un lien de confirmation a été envoyé à ${res.data.email}.`
          : 'Compte mis à jour.',
      });
    } catch (e) {
      setAccountMsg({ ok: false, text: apiError(e, "Le compte n'a pas pu être mis à jour.") });
    } finally {
      setSavingAccount(false);
    }
  };

  useEffect(() => {
    if (staff || !keycloakId) return;
    clientService.getByKeycloakId(keycloakId)
      .then(r => setProfile(r.data))
      .catch(e => {
        // No profile yet is normal for a new account: the form starts empty
        if ((e as { response?: { status?: number } })?.response?.status !== 404) setError(apiError(e, 'Impossible de charger votre profil.'));
      })
      .finally(() => setLoading(false));
  }, [staff, keycloakId]);

  const set = <K extends keyof ClientProfile>(k: K, v: ClientProfile[K]) => { setSaved(false); setProfile(p => ({ ...p, [k]: v })); };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      // Identity fields come from the login so the reception sees the same name and e-mail
      const res = await clientService.createOrUpdate({
        ...profile, keycloakId,
        firstName: token?.given_name, lastName: token?.family_name, email: token?.email,
      });
      setProfile(res.data);
      setSaved(true);
    } catch (e) {
      setError(apiError(e, 'Le profil n\'a pas pu être enregistré.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 960 }}>
      <h2 className="fw-bold mb-4">Mon profil</h2>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <span className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-semibold flex-shrink-0"
              style={{ width: 56, height: 56, fontSize: 20 }}>
              {(token?.given_name ?? token?.preferred_username ?? '?').slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div className="fw-semibold fs-5">{[token?.given_name, token?.family_name].filter(Boolean).join(' ') || token?.preferred_username}</div>
              <div className="text-muted small">{role}</div>
            </div>
          </div>

          {accountMsg && <div className={`alert py-2 ${accountMsg.ok ? 'alert-success' : 'alert-danger'}`}>{accountMsg.text}</div>}

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold" htmlFor="ac-first">Prénom</label>
              <input id="ac-first" className="form-control" value={account.firstName}
                onChange={e => setAccount(a => ({ ...a, firstName: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold" htmlFor="ac-last">Nom</label>
              <input id="ac-last" className="form-control" value={account.lastName}
                onChange={e => setAccount(a => ({ ...a, lastName: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold d-flex align-items-center gap-2" htmlFor="ac-email">
                E-mail {!emailVerified && <span className="badge bg-warning text-dark fw-normal">non vérifiée</span>}
              </label>
              <input id="ac-email" type="email" className="form-control" value={account.email}
                onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} />
              <div className="form-text">Une nouvelle adresse doit être confirmée par e-mail.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Identifiant</label>
              <input className="form-control bg-light" value={token?.preferred_username ?? ''} readOnly />
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-between gap-2">
            <button className="btn btn-outline-dark d-flex align-items-center gap-2"
              onClick={() => keycloak.login({ action: 'UPDATE_PASSWORD' })}>
              <KeyRound size={15} /> Changer le mot de passe
            </button>
            <button className="btn btn-dark d-flex align-items-center gap-2" onClick={saveAccount}
              disabled={savingAccount || !account.firstName.trim() || !account.lastName.trim() || !account.email.trim()}>
              {savingAccount ? <span className="spinner-border spinner-border-sm" /> : <Save size={15} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {!staff && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Préférences de séjour</h5>
            <p className="text-muted small mb-4">La réception les consulte à votre arrivée.</p>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {saved && <div className="alert alert-success py-2">Profil enregistré.</div>}

            {loading ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /></div>
            ) : (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold" htmlFor="pf-phone">Téléphone</label>
                  <input id="pf-phone" type="tel" className="form-control" value={profile.phone ?? ''} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" htmlFor="pf-nat">Nationalité</label>
                  <input id="pf-nat" className="form-control" value={profile.nationality ?? ''} onChange={e => set('nationality', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" htmlFor="pf-lang">Langue</label>
                  <select id="pf-lang" className="form-select" value={profile.language ?? ''} onChange={e => set('language', e.target.value)}>
                    <option value="">—</option>
                    {['Français', 'Arabe', 'Anglais', 'Allemand', 'Italien'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold" htmlFor="pf-bed">Literie</label>
                  <select id="pf-bed" className="form-select" value={profile.bedType ?? ''} onChange={e => set('bedType', (e.target.value || undefined) as BedType | undefined)}>
                    <option value="">Sans préférence</option>
                    {(Object.keys(BED_TYPE_LABELS) as BedType[]).filter(b => b !== 'SUITE').map(b => <option key={b} value={b}>{BED_TYPE_LABELS[b]}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold" htmlFor="pf-floor">Étage préféré</label>
                  <select id="pf-floor" className="form-select" value={profile.preferredFloor ?? ''}
                    onChange={e => set('preferredFloor', e.target.value ? Number(e.target.value) : undefined)}>
                    <option value="">Sans préférence</option>
                    {[1, 2, 3].map(f => <option key={f} value={f}>{f}{f === 1 ? 'er' : 'e'} étage</option>)}
                  </select>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="form-check mb-2">
                    <input id="pf-smoke" type="checkbox" className="form-check-input" checked={profile.smokingRoom === false}
                      onChange={e => set('smokingRoom', e.target.checked ? false : undefined)} />
                    <label className="form-check-label" htmlFor="pf-smoke">Chambre non-fumeur</label>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold" htmlFor="pf-req">Demandes particulières</label>
                  <textarea id="pf-req" className="form-control" rows={3} value={profile.specialRequests ?? ''}
                    onChange={e => set('specialRequests', e.target.value)} placeholder="Allergies, lit bébé, chambre calme…" />
                </div>
                <div className="col-12 d-flex justify-content-end">
                  <button className="btn btn-dark d-flex align-items-center gap-2" onClick={save} disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={15} />}
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
