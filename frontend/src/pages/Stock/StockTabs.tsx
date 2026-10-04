import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/dashboard/stock', label: 'Inventaire', end: true },
  { to: '/dashboard/stock/produits', label: 'Produits' },
  { to: '/dashboard/stock/mouvements', label: 'Mouvements' },
  { to: '/dashboard/stock/chambre-manager', label: 'Minibar des chambres' },
];

/** Navigation shared by the stock pages. */
export default function StockTabs() {
  return (
    <ul className="nav nav-underline mb-4 border-bottom">
      {TABS.map(t => (
        <li key={t.to} className="nav-item">
          <NavLink to={t.to} end={t.end} className={({ isActive }) => `nav-link ${isActive ? 'active text-dark fw-semibold' : 'text-muted'}`}>
            {t.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
