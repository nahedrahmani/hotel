import React, { useState, type PropsWithChildren } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, BedDouble, Users, DollarSign, UserCog, Package } from "lucide-react";
import keycloak from "../config/keycloak";
import { canOpen } from "../config/access";

type NavItem = { label: string; to: string };

type NavGroup = {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Hébergement",
    icon: <BedDouble size={15} />,
    items: [
      { label: "Réservations",    to: "/dashboard/reservations" },
      { label: "Réserver",        to: "/dashboard/reserver" },
      { label: "Mes réservations",to: "/dashboard/mes-reservations" },
      { label: "Occupation",      to: "/dashboard/occupation" },
      { label: "Ménage",          to: "/dashboard/menage" },
      { label: "Chambres",         to: "/dashboard/chambres" },
      { label: "Calendrier",      to: "/dashboard/calendar" },
    ],
  },
  {
    label: "Clients",
    icon: <Users size={15} />,
    items: [
      { label: "Fiches clients",  to: "/dashboard/clients" },
      { label: "Demandes",        to: "/dashboard/demandes" },
      { label: "Check-in / out",  to: "/dashboard/checkinout" },
    ],
  },
  {
    label: "Finance",
    icon: <DollarSign size={15} />,
    items: [
      { label: "Factures",        to: "/dashboard/payment/factures" },
      { label: "Rapports",        to: "/dashboard/payment/rapports" },
      { label: "Analytique",      to: "/dashboard/analytique" },
    ],
  },
  {
    label: "RH",
    icon: <UserCog size={15} />,
    items: [
      { label: "Personnel",       to: "/dashboard/rh/personnel" },
      { label: "Planning",        to: "/dashboard/rh/planning" },
      { label: "Pointage",        to: "/dashboard/rh/pointage" },
      { label: "Tâches",          to: "/dashboard/tasks" },
      { label: "Congés",          to: "/dashboard/rh/conges" },
    ],
  },
  {
    label: "Opérations",
    icon: <Package size={15} />,
    items: [
      { label: "Stock",           to: "/dashboard/stock" },
      { label: "Annonces",        to: "/dashboard/annonces" },
      { label: "Messages",        to: "/dashboard/messages" },
    ],
  },
];

function NavDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="nav-item position-relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}>
      <button
        className="btn btn-link nav-link px-3 py-2 text-muted d-flex align-items-center gap-1"
        style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
        // Hover opens the menu; a click must not toggle it shut again right after
        onClick={() => setOpen(true)}
      >
        {group.icon}
        {group.label}
        <span style={{ fontSize: '0.65rem', marginLeft: 2 }}>▾</span>
      </button>
      {open && (
        <ul className="list-unstyled position-absolute bg-white shadow rounded-3 py-1 mb-0"
            style={{ top: '100%', left: 0, minWidth: 180, zIndex: 1000 }}>
          {group.items.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `d-block px-3 py-2 small text-decoration-none ${isActive ? 'fw-semibold text-dark bg-light rounded-2' : 'text-muted'}`
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Only show pages the user's roles can actually load
  const navGroups = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => canOpen(i.to)) }))
    .filter(g => g.items.length > 0);

  const userName = keycloak.tokenParsed?.preferred_username
    ?? keycloak.tokenParsed?.given_name
    ?? 'U';
  const initials = userName.slice(0, 1).toUpperCase();

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-light bg-white shadow-sm" style={{ zIndex: 100 }}>
        <div className="container-fluid px-4">
          {/* Brand */}
          <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/" title="Retour au site">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF5A5F">
              <circle cx="12" cy="12" r="10" />
            </svg>
            HotelMS
          </Link>

          {/* Desktop nav groups */}
          <ul className="nav d-none d-xl-flex align-items-center mx-auto gap-1" role="tablist">
            {navGroups.map(g => <NavDropdown key={g.label} group={g} />)}
          </ul>

          {/* Right side */}
          <div className="ms-auto d-flex align-items-center gap-3">
            <div
              className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center fw-bold"
              style={{ width: 36, height: 36, fontSize: 13, cursor: 'pointer' }}
              title={userName}
              onClick={() => keycloak.logout()}
            >
              {initials}
            </div>
            {/* Mobile hamburger */}
            <button className="btn btn-light d-xl-none" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="bg-white border-top px-4 py-3 d-xl-none">
            {navGroups.map(group => (
              <div key={group.label} className="mb-3">
                <div className="d-flex align-items-center gap-2 text-muted small fw-semibold mb-1 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  {group.icon} {group.label}
                </div>
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to}
                    className={({ isActive }) =>
                      `d-block ps-3 py-1 small text-decoration-none ${isActive ? 'fw-semibold text-dark' : 'text-muted'}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow-1 bg-light">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
