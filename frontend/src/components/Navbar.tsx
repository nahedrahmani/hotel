import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import images from "../assets";
import { useKeycloak } from "../config/KeycloakProvider";
import { isStaff as hasStaffRole } from "../config/access";

const Navbar: React.FC = () => {
    const { keycloak, authenticated } = useKeycloak();

    const isStaff = authenticated && hasStaffRole();

    /* ────── SCROLL LOGIC ────── */
    const [isHidden, setIsHidden] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;

            // Show at the very top (< 80px) or when scrolling up
            if (current < 80) {
                setIsHidden(false);
            } else if (current > lastScrollY.current) {
                // scrolling DOWN → hide
                setIsHidden(true);
            } else {
                // scrolling UP → show
                setIsHidden(false);
            }

            lastScrollY.current = current;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    /* ────── RENDER ────── */
    return (
        <nav
            className={`navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 fixed-top navbar-scroll ${
                isHidden ? "hidden" : ""
            }`}
            style={{ borderBottom: "2px solid #f3f3f3", zIndex: 1030 }}
        >
            <div className="container-fluid px-4">
                {/* LOGO */}
                <Link to="/" className="navbar-brand d-flex align-items-center">
                    <img
                        src={images.logoroyal}
                        alt="Royal Hotels"
                        className="img-fluid me-2"
                        style={{ width: "140px", height: "auto" }}
                    />
                </Link>

                {/* TOGGLER */}
                <button
                    className="navbar-toggler border-0"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarCollapse"
                    aria-controls="navbarCollapse"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <i className="bi bi-list" style={{ fontSize: "1.5rem" }}></i>
                </button>

                {/* LINKS */}
                <div className="collapse navbar-collapse" id="navbarCollapse">
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0 fw-semibold">
                        <li className="nav-item mx-2">
                            <Link className="nav-link text-dark" to="/dashboard/reserver">
                                Réserver
                            </Link>
                        </li>
                        <li className="nav-item mx-2">
                            <Link className="nav-link text-dark" to="/dashboard/mes-reservations">
                                Mes réservations
                            </Link>
                        </li>
                        <li className="nav-item mx-2">
                            <Link className="nav-link text-dark" to="/#contact">
                                Contact
                            </Link>
                        </li>

                        {/* STAFF DROPDOWN — visible only to hotel staff roles */}
                        {isStaff && (
                        <li className="nav-item dropdown mx-2">
                            <button
                                type="button"
                                className="nav-link dropdown-toggle text-dark bg-transparent border-0"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                Gestion
                            </button>
                            <ul className="dropdown-menu shadow-sm border-0">
                                <li>
                                    <Link className="dropdown-item d-flex align-items-center" to="/dashboard/reservations">
                                        <i className="fas fa-calendar-check me-2 text-dark"></i> Réservations
                                    </Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item d-flex align-items-center" to="/dashboard/rh/personnel">
                                        <i className="fas fa-users me-2 text-primary"></i> Personnel
                                    </Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item d-flex align-items-center" to="/dashboard/stock">
                                        <i className="fas fa-boxes me-2 text-success"></i> Stock
                                    </Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item d-flex align-items-center" to="/dashboard/chambres">
                                        <i className="fas fa-bed me-2 text-warning"></i> Chambres
                                    </Link>
                                </li>
                            </ul>
                        </li>
                        )}
                    </ul>

                    {/* USER MENU */}
                    <div className="d-flex align-items-center gap-3">
                        <div className="dropdown">
                            <button
                                type="button"
                                className="btn btn-outline-secondary rounded-pill px-3 dropdown-toggle d-flex align-items-center"
                                id="userDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                style={{ borderColor: "#ddd" }}
                            >
                                <i className="bi bi-person-circle me-2" style={{ fontSize: "1.4rem" }}></i>
                                {authenticated ? "Mon compte" : "Compte"}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                {!authenticated ? (
                                    <>
                                        <li>
                                            <button className="dropdown-item d-flex align-items-center" onClick={() => keycloak?.register()}>
                                                <i className="bi bi-person-plus me-2"></i> Inscription
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item d-flex align-items-center" onClick={() => keycloak?.login()}>
                                                <i className="bi bi-box-arrow-in-right me-2"></i> Connexion
                                            </button>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            <Link to="/dashboard" className="dropdown-item d-flex align-items-center">
                                                <i className="bi bi-speedometer2 me-2"></i> Mon espace
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/dashboard/profil" className="dropdown-item d-flex align-items-center">
                                                <i className="bi bi-person-lines-fill me-2"></i> Mon profil
                                            </Link>
                                        </li>
                                        <li>
                                            <button className="dropdown-item d-flex align-items-center text-danger" onClick={() => keycloak?.logout()}>
                                                <i className="bi bi-box-arrow-right me-2"></i> Déconnexion
                                            </button>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
