import { NavLink } from 'react-router-dom';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px',
  textDecoration: 'none', color: isActive ? 'white' : '#6b7280',
  background: isActive ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' : 'transparent',
  transition: 'all 0.2s',
  boxShadow: isActive ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
  margin: '0 12px', borderRadius: '8px',
});

const SectionTitle = ({ label }: { label: string }) => (
  <div style={{ padding: '0 16px', marginBottom: '8px', marginTop: '18px', fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
    {label}
  </div>
);


export default function Sidebar() {
  return (
    <div style={{ width: '230px', background: 'white', minHeight: '100vh', borderRight: '1px solid #e5e7eb', padding: '20px 0', boxShadow: '4px 0 15px rgba(0,0,0,0.05)', position: 'relative', overflowY: 'auto' }}>

      {/* Logo */}
      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px' }}>
            RL
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1f2937' }}>Royal Luxe</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Hôtel Premium</div>
          </div>
        </div>
      </div>

      {/* Hébergement */}
      <SectionTitle label="Hébergement" />
      <NavLink to="/dashboard/annonces" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Accueil / Annonces</span>
      </NavLink>
      <NavLink to="/dashboard/hebergement-maison" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Chambres</span>
      </NavLink>
      <NavLink to="/dashboard/reservations" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Réservations</span>
      </NavLink>
      <NavLink to="/dashboard/occupation" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M4 20V10l8-6 8 6v10"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Occupation</span>
      </NavLink>

      {/* Clients */}
      <SectionTitle label="Clients" />
      <NavLink to="/dashboard/clients" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Clients</span>
      </NavLink>
      <NavLink to="/dashboard/demandes" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Demandes</span>
      </NavLink>
      <NavLink to="/dashboard/checkinout" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Check-in / Check-out</span>
      </NavLink>

      {/* Stock */}
      <SectionTitle label="Stock" />
      <NavLink to="/dashboard/stock" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Dashboard Stock</span>
      </NavLink>
      <NavLink to="/dashboard/stock/produits" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Produits</span>
      </NavLink>
      <NavLink to="/dashboard/stock/mouvements" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Mouvements</span>
      </NavLink>

      {/* RH */}
      <SectionTitle label="Ressources Humaines" />
      <NavLink to="/dashboard/rh/personnel" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Personnel</span>
      </NavLink>
      <NavLink to="/dashboard/rh/planning" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Planning</span>
      </NavLink>
      <NavLink to="/dashboard/rh/pointage" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Pointage</span>
      </NavLink>
      <NavLink to="/dashboard/tasks" style={({ isActive }) => ({ ...linkStyle({ isActive }), position: 'relative' })}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Tâches</span>
      </NavLink>
      <NavLink to="/dashboard/rh/conges" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Congés</span>
      </NavLink>

      {/* Paiement */}
      <SectionTitle label="Paiement & Facturation" />
      <NavLink to="/dashboard/payment/factures" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Factures</span>
      </NavLink>
      <NavLink to="/dashboard/payment/rapports" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Rapports financiers</span>
      </NavLink>

      {/* Communication */}
      <SectionTitle label="Communication" />
      <NavLink to="/dashboard/messages" style={({ isActive }) => ({ ...linkStyle({ isActive }), position: 'relative' })}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Messages</span>
      </NavLink>
      <NavLink to="/dashboard/calendar" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Calendrier</span>
      </NavLink>

      {/* Footer */}
      <div style={{ margin: '24px 12px 12px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '13px' }}>
            A
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>Administrateur</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Super Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
}
