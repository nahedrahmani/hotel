import React, { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, ConciergeBell, BedDouble, Users, Wallet, UserCog, ChevronDown, LogOut, UserRound, ArrowLeft } from "lucide-react";
import keycloak from "../config/keycloak";
import { canOpen, isStaff, userRoles } from "../config/access";

type NavItem = { label: string; to: string };

type NavGroup = {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
};

// Grouped by hotel work areas, not by backend service
const STAFF_GROUPS: NavGroup[] = [
  {
    label: "Réception",
    icon: <ConciergeBell size={15} />,
    items: [
      { label: "Réservations",   to: "/dashboard/reservations" },
      { label: "Check-in / out", to: "/dashboard/checkinout" },
      { label: "Occupation",     to: "/dashboard/occupation" },
      { label: "Calendrier",     to: "/dashboard/calendar" },
    ],
  },
  {
    label: "Chambres",
    icon: <BedDouble size={15} />,
    items: [
      { label: "Chambres",       to: "/dashboard/chambres" },
      { label: "Ménage",         to: "/dashboard/menage" },
      { label: "Stock",          to: "/dashboard/stock" },
    ],
  },
  {
    label: "Clients",
    icon: <Users size={15} />,
    items: [
      { label: "Fiches clients", to: "/dashboard/clients" },
      { label: "Demandes",       to: "/dashboard/demandes" },
      { label: "Messages",       to: "/dashboard/messages" },
    ],
  },
  {
    label: "Finance",
    icon: <Wallet size={15} />,
    items: [
      { label: "Factures",       to: "/dashboard/payment/factures" },
      { label: "Rapports",       to: "/dashboard/payment/rapports" },
      { label: "Analytique",     to: "/dashboard/analytique" },
    ],
  },
  {
    label: "Personnel",
    icon: <UserCog size={15} />,
    items: [
      { label: "Équipe",         to: "/dashboard/rh/personnel" },
      { label: "Planning",       to: "/dashboard/rh/planning" },
      { label: "Pointage",       to: "/dashboard/rh/pointage" },
      { label: "Tâches",         to: "/dashboard/tasks" },
      { label: "Congés",         to: "/dashboard/rh/conges" },
    ],
  },
];

// Messages stays out until guests can reach the reception without knowing a staff member's ID
const GUEST_LINKS: NavItem[] = [
  { label: "Réserver",         to: "/dashboard/reserver" },
  { label: "Mes réservations", to: "/dashboard/mes-reservations" },
];

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrateur", MANAGER: "Manager", STAFF: "Personnel" };

const isCurrent = (pathname: string, to: string) => pathname === to || pathname.startsWith(to + "/");

/** Closes a popup when the user clicks anywhere outside it. */
function useOutsideClose<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);
  return ref;
}

function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = group.items.some(i => isCurrent(pathname, i.to));
  return (
    <li className="nav-item position-relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}>
      <button
        className={`btn btn-link nav-link px-3 py-2 d-flex align-items-center gap-1 text-decoration-none ${active ? "text-dark fw-semibold" : "text-muted"}`}
        style={{ whiteSpace: "nowrap" }}
        // Hover opens the menu; a click must not toggle it shut again right after
        onClick={() => setOpen(true)}
      >
        {group.icon}
        {group.label}
        <ChevronDown size={13} className="opacity-50" />
      </button>
      {open && (
        <ul className="list-unstyled position-absolute bg-white shadow-sm border rounded-3 p-1 mb-0"
            style={{ top: "100%", left: 0, minWidth: 190, zIndex: 1000 }}>
          {group.items.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `d-block px-3 py-2 small rounded-2 text-decoration-none ${isActive ? "fw-semibold text-dark bg-light" : "text-body"}`
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

function AccountMenu({ staff }: { staff: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  const t = keycloak.tokenParsed;
  const name = [t?.given_name, t?.family_name].filter(Boolean).join(" ") || t?.preferred_username || "Mon compte";
  const role = staff ? userRoles().map(r => ROLE_LABELS[r]).find(Boolean) : "Client";

  return (
    <div className="position-relative" ref={ref}>
      <button className="btn btn-light border-0 d-flex align-items-center gap-2 py-1 ps-1 pe-2 rounded-pill"
        onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-semibold"
          style={{ width: 32, height: 32, fontSize: 13 }}>
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="d-none d-md-block text-start lh-sm">
          <span className="d-block small fw-semibold">{name}</span>
          <span className="d-block text-muted" style={{ fontSize: "0.72rem" }}>{role}</span>
        </span>
        <ChevronDown size={14} className="opacity-50" />
      </button>
      {open && (
        <div className="position-absolute end-0 bg-white shadow-sm border rounded-3 p-1 mt-1" style={{ minWidth: 210, zIndex: 1000 }}>
          <Link to="/" className="d-flex align-items-center gap-2 px-3 py-2 small rounded-2 text-body text-decoration-none">
            <ArrowLeft size={15} /> Retour au site
          </Link>
          <Link to="/dashboard/profil" onClick={() => setOpen(false)}
            className="d-flex align-items-center gap-2 px-3 py-2 small rounded-2 text-body text-decoration-none">
            <UserRound size={15} /> Mon profil
          </Link>
          <hr className="my-1" />
          <button className="btn btn-link d-flex align-items-center gap-2 px-3 py-2 small w-100 text-danger text-decoration-none"
            onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const staff = isStaff();

  // Only show pages the user's roles can actually load
  const groups = STAFF_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => canOpen(i.to)) }))
    .filter(g => g.items.length > 0);

  const guestLink = (item: NavItem, mobile = false) => (
    <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
      className={({ isActive }) => mobile
        ? `d-block py-2 text-decoration-none ${isActive ? "fw-semibold text-dark" : "text-muted"}`
        : `nav-link px-3 py-2 ${isActive ? "fw-semibold text-dark" : "text-muted"}`}>
      {item.label}
    </NavLink>
  );

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-light bg-white border-bottom" style={{ zIndex: 100 }}>
        <div className="container-fluid px-4">
          <Link className="navbar-brand d-flex align-items-center gap-3 me-4 py-2" to="/" title="Retour au site">
            <span className="lh-sm">
              <span className="d-block fw-semibold" style={{ fontSize: "1.05rem" }}>Royal Tulip</span>
              <span className="d-block text-muted" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>KORBOUS BAY</span>
            </span>
            <span className="border-start ps-3 text-muted small d-none d-sm-inline">
              {staff ? "Gestion de l'hôtel" : "Espace client"}
            </span>
          </Link>

          <ul className="nav d-none d-xl-flex align-items-center gap-1 me-auto">
            {staff
              ? groups.map(g => <NavDropdown key={g.label} group={g} pathname={pathname} />)
              : GUEST_LINKS.map(item => <li key={item.to} className="nav-item">{guestLink(item)}</li>)}
          </ul>

          <div className="ms-auto d-flex align-items-center gap-2">
            <AccountMenu staff={staff} />
            <button className="btn btn-light d-xl-none" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="bg-white border-top px-4 py-3 d-xl-none w-100">
            {staff ? groups.map(group => (
              <div key={group.label} className="mb-3">
                <div className="d-flex align-items-center gap-2 text-muted small fw-semibold mb-1 text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                  {group.icon} {group.label}
                </div>
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to}
                    className={({ isActive }) => `d-block ps-3 py-1 small text-decoration-none ${isActive ? "fw-semibold text-dark" : "text-muted"}`}
                    onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )) : GUEST_LINKS.map(item => guestLink(item, true))}
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
