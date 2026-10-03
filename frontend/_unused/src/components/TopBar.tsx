export default function TopBar() {
  return (
    <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#4f46e5' }}>Hôtel Royal Luxe</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Tableau de bord administrateur</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
          <input type="text" placeholder="Rechercher..." style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#4f46e5'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
        </div>
        <button style={{ position: 'relative', width: '40px', height: '40px', border: 'none', background: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>
        </button>
        <button style={{ width: '40px', height: '40px', border: 'none', background: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path></svg>
        </button>
        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
          A
        </div>
      </div>
    </div>
  );
}
