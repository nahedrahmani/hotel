import React, { useState, useEffect } from "react";
import { Plus, LayoutGrid, List, MapPin, Edit, Trash2, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useKeycloak } from "../../config/KeycloakProvider.tsx";

interface Listing {
    id: number;
    nom: string;
    images: string[];
    typeLogement: string;
    ville: string;
    disponible: boolean;
    decritlogement: string;
    createdDate: string; // Added for creation date
}

interface PageData<T> {
    content: T[];
    totalPages: number;
    number: number; // current page (0-indexed)
    size: number;
    totalElements: number;
}

// Simple auto-rotating image carousel
const AutoImageCarousel: React.FC<{ images: string[]; alt?: string; interval?: number }> = ({
                                                                                                images,
                                                                                                alt = "",
                                                                                                interval = 5000,
                                                                                            }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images, interval]);

    return (
        <img
            src={images[currentIndex]}
            alt={alt}
            className="w-100 h-100 object-fit-cover"
            style={{ transition: "opacity 0.5s ease-in-out" }}
        />
    );
};

// Modal Component
const ListingModal: React.FC<{
    listing: Listing;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (id: number) => void;
}> = ({ listing, isOpen, onClose, onDelete }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleEdit = () => {
        navigate(`/dashboard/hebergement-maison/${listing.id}`);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
            onDelete(listing.id);
        }
    };

    const formattedDate = listing.createdDate
        ? (() => {
              const date = new Date(listing.createdDate);
              const day = date.toLocaleDateString('fr-FR', { day: 'numeric' });
              const month = date.toLocaleDateString('fr-FR', { month: 'long' });
              const year = date.getFullYear();
              return `le ${day} ${month} ${year}`;
          })()
        : '';

    return (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow rounded">
                    <div className="position-relative">
                        <button
                            type="button"
                            className="position-absolute top-0 end-0 m-3 btn-close"
                            onClick={onClose}
                            aria-label="Fermer"
                            style={{ zIndex: 10 }}
                        >
                            <X size={20} />
                        </button>
                        <div className="text-center p-3">
                            {listing.images && listing.images.length > 0 ? (
                                <div style={{ width: '150px', height: '150px', margin: '0 auto' }}>
                                    <img
                                        src={listing.images[0]}
                                        alt={listing.nom}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                    />
                                </div>
                            ) : (
                                <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '150px', height: '150px', margin: '0 auto', borderRadius: '8px' }}>
                                    <span className="text-muted">Aucune image</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h5 className="fw-bold mb-2">{listing.nom}</h5>
                            <p className="text-muted mb-3">{listing.ville}</p>
                            <p className="text-muted small mb-0">
                                Cette annonce a été créée {formattedDate}
                            </p>
                        </div>
                        <div className="p-4 pb-2">
                            <button
                                className="btn btn-dark w-100 mb-2 d-flex align-items-center justify-content-center gap-1"
                                onClick={handleEdit}
                                style={{ height: "48px" }}
                            >
                                <Edit size={16} />
                                Modifier l'annonce
                            </button>
                            <button
                                className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-1"
                                onClick={handleDelete}
                                style={{ height: "48px" }}
                            >
                                <Trash2 size={16} />
                                Supprimer l'annonce
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AnnoncesPage: React.FC = () => {
    const { keycloak, authenticated, initialized } = useKeycloak();
    const userId = initialized && authenticated ? keycloak.tokenParsed?.sub : null;

    const [view, setView] = useState<"list" | "grid">("list");
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(0); // 0-indexed
    const [totalPages, setTotalPages] = useState<number>(1);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const size = 10;

    const fetchAnnonces = async (pageNumber: number) => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await axios.get<PageData<Listing>>(
                `${import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895'}/api/maisons/user/${userId}?page=${pageNumber}&size=${size}`
            );
            setListings(response.data.content);
            setTotalPages(response.data.totalPages);
            setPage(pageNumber);
        } catch (error) {
            console.error("Error fetching annonces:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895'}/api/maisons/${id}`);
            // Refresh the list
            fetchAnnonces(page);
        } catch (error) {
            console.error("Error deleting annonce:", error);
            alert("Erreur lors de la suppression de l'annonce.");
        }
    };

    useEffect(() => {
        if (userId) fetchAnnonces(page);
    }, [userId, page]);

    const handlePrevious = () => setPage((prev) => Math.max(prev - 1, 0));
    const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages - 1));

    const openModal = (listing: Listing) => setSelectedListing(listing);
    const closeModal = () => setSelectedListing(null);

    if (loading) return <div className="text-center p-4">Loading...</div>;

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Mes annonces</h2>

                <div className="d-flex align-items-center gap-2">
                    {/* Toggle view */}
                    <button
                        onClick={() => setView(view === "list" ? "grid" : "list")}
                        className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "40px", height: "40px" }}
                        aria-label="Changer la vue"
                    >
                        {view === "list" ? <LayoutGrid size={18} /> : <List size={18} />}
                    </button>

                    {/* Add button */}
                    <NavLink
                        to="/dashboard/hebergement-maison"
                        className="btn btn-outline-dark rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "40px", height: "40px" }}
                        aria-label="Ajouter une annonce"
                    >
                        <Plus size={20} />
                    </NavLink>
                </div>
            </div>

            {/* List or Grid view */}
            {view === "list" ? (
                <div className="table-responsive bg-white rounded shadow-sm">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="border-bottom">
                        <tr>
                            <th className="text-dark fw-bold px-4 py-3">Image</th>
                            <th className="text-dark fw-bold py-3">Annonce</th>
                            <th className="text-dark fw-bold py-3">Type</th>
                            <th className="text-dark fw-bold py-3">Emplacement</th>
                            <th className="text-dark fw-bold py-3">Statut</th>
                        </tr>
                        </thead>
                        <tbody>
                        {listings.map((listing) => (
                            <tr key={listing.id} className="cursor-pointer" onClick={() => openModal(listing)}>
                                {/* Image carousel */}
                                <td className="px-2 py-2" style={{ width: "60px", height: "60px" }}>
                                    {listing.images && listing.images.length > 0 ? (
                                        <AutoImageCarousel images={listing.images} alt={listing.nom} interval={5000} />
                                    ) : (
                                        <div className="bg-light rounded w-100 h-100"></div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-dark">{listing.nom}</span>
                                </td>
                                <td className="py-3 text-muted">{listing.typeLogement}</td>
                                <td className="py-3 d-flex align-items-center text-muted">
                                    <MapPin size={16} className="me-1" />
                                    {listing.ville}
                                </td>
                                <td className="py-3">
                                    <span
                                        className={`badge rounded-pill px-3 py-2 ${
                                            listing.disponible ? "bg-success" : "bg-danger"
                                        }`}
                                    >
                                        {listing.disponible ? "Disponible" : "Indisponible"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="row g-4">
                    {listings.map((listing) => (
                        <div className="col-md-6 col-lg-4 col-xl-3" key={listing.id}>
                            <div className="card shadow-sm border-0 cursor-pointer" onClick={() => openModal(listing)}>
                                <div className="bg-light rounded-top" style={{ height: "150px", overflow: "hidden" }}>
                                    {listing.images && listing.images.length > 0 ? (
                                        <AutoImageCarousel images={listing.images} alt={listing.nom} interval={5000} />
                                    ) : (
                                        <div className="bg-light w-100 h-100"></div>
                                    )}
                                </div>
                                <div className="card-body">
                                    <h6 className="fw-bold text-dark mb-1">{listing.nom}</h6>
                                    <p className="text-muted mb-1 d-flex align-items-center">
                                        <MapPin size={14} className="me-1" />
                                        {listing.ville}
                                    </p>
                                    <p className="small text-secondary mb-2">{listing.typeLogement}</p>
                                    <span
                                        className={`badge rounded-pill px-3 py-2 ${
                                            listing.disponible ? "bg-success" : "bg-danger"
                                        }`}
                                    >
                                        {listing.disponible ? "Disponible" : "Indisponible"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="d-flex justify-content-center mt-4 gap-2">
                <button className="btn btn-outline-secondary" onClick={handlePrevious} disabled={page === 0}>
                    Précédent
                </button>
                <span className="align-self-center">
                    Page {page + 1} / {totalPages}
                </span>
                <button
                    className="btn btn-outline-secondary"
                    onClick={handleNext}
                    disabled={page === totalPages - 1}
                >
                    Suivant
                </button>
            </div>

            {/* Modal */}
            {selectedListing && (
                <ListingModal
                    listing={selectedListing}
                    isOpen={!!selectedListing}
                    onClose={closeModal}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};