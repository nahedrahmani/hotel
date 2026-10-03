import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import UserLayout from "../../layouts/UserLayout.tsx";
import { useKeycloak } from '../../config/KeycloakProvider';

interface Maison {
    id: number;
    nom: string;
    description?: string;
    decritlogement?: string;
    ville?: string;
    pays?: string;
    prixParNuit: number;
    capaciteVoyageurs: number;
    nombreChambres: number;
    nombrelits: number;
    nombrewcs: number;
    images?: string[];
    equipements?: string[];
}

const MaisonDhoteDetails = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [listing, setListing] = useState<Maison | null>(null);
    const [loading, setLoading] = useState(true);
    const [reservationLoading, setReservationLoading] = useState(false);
    const [arrivalDate, setArrivalDate] = useState(searchParams.get('hebergementArrivee')?.split('-').reverse().join('/') || '17/10/2025');
    const [departureDate, setDepartureDate] = useState(searchParams.get('hebergementDepart')?.split('-').reverse().join('/') || '22/10/2025');
    const [guests, setGuests] = useState(parseInt(searchParams.get('hebergementAdults') || '1'));

    // ✅ Use Keycloak to get user info
    const { keycloak, authenticated, initialized } = useKeycloak();
    const userId = initialized && authenticated ? keycloak.tokenParsed?.sub : null;

    const equipmentIcons: Record<string, { icon: string; label: string }> = {
        // Preferred Amenities
        wifi: { icon: 'bi-wifi', label: 'Wifi' },
        tv: { icon: 'bi-tv', label: 'Télévision' },
        cuisine: { icon: 'bi-egg-fried', label: 'Cuisine' },
        linge: { icon: 'bi-droplet', label: 'Lave-linge' },
        parking_gratuit: { icon: 'bi-car-front', label: 'Parking gratuit sur place' },
        parking_payant: { icon: 'bi-p-circle', label: 'Parking payant sur place' },
        climatisation: { icon: 'bi-snow', label: 'Climatisation' },
        espace_travail: { icon: 'bi-laptop', label: 'Espace de travail dédié' },
        // Unique Amenities
        piscine: { icon: 'bi-water', label: 'Piscine' },
        jacuzzi: { icon: 'bi-droplet-half', label: 'Jacuzzi' },
        patio: { icon: 'bi-umbrella', label: 'Patio' },
        barbecue: { icon: 'bi-fire', label: 'Barbecue' },
        repas: { icon: 'bi-cup-straw', label: 'Espace repas en plein air' },
        brasero: { icon: 'bi-brightness-high', label: 'Brasero' },
        billard: { icon: 'bi-circle', label: 'Billard' },
        cheminee: { icon: 'bi-fire', label: 'Cheminée' },
        piano: { icon: 'bi-music-note', label: 'Piano' },
        fitness: { icon: 'bi-heart-pulse', label: 'Appareils de fitness' },
        lac: { icon: 'bi-tree', label: 'Accès au lac' },
        plage: { icon: 'bi-sun', label: 'Accès à la plage' },
        ski: { icon: 'bi-snow', label: 'Accessible à skis' },
        douche_ext: { icon: 'bi-droplet', label: 'Douche extérieure' },
        // Safety Items
        fumee: { icon: 'bi-exclamation-triangle', label: 'Détecteur de fumée' },
        secours: { icon: 'bi-heart-pulse', label: 'Kit de premiers secours' },
        extincteur: { icon: 'bi-fire', label: 'Extincteur' },
        monoxyde: { icon: 'bi-shield-check', label: 'Détecteur de monoxyde de carbone' }
    };

    // 🏠 Fetch maison details
    useEffect(() => {
        const fetchListing = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895'}/api/maisons/${id}`);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                setListing(data);
            } catch (error) {
                console.error('Error fetching listing:', error);
                showToast("Erreur lors du chargement des données", "error");
                setListing(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchListing();
    }, [id]);

    const calculateNights = (arrival: string, departure: string) => {
        if (!arrival || !departure) return 1;
        const [aDay, aMonth, aYear] = arrival.split('/').map(Number);
        const [dDay, dMonth, dYear] = departure.split('/').map(Number);
        const a = new Date(aYear, aMonth - 1, aDay);
        const d = new Date(dYear, dMonth - 1, dDay);
        return Math.max(1, Math.ceil((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
    };

    const totalNights = calculateNights(arrivalDate, departureDate);
    const totalPrice = listing ? listing.prixParNuit * totalNights : 0;

    // ✅ Show Bootstrap toast
    const showToast = (message: string, type: "success" | "error") => {
        const toastContainer = document.getElementById("toastContainer");
        if (!toastContainer) return;

        const toastEl = document.createElement("div");
        toastEl.className = `toast align-items-center text-bg-${
            type === "success" ? "success" : "danger"
        } border-0 show`;
        toastEl.setAttribute("role", "alert");
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toastEl);

        const toast = new window.bootstrap.Toast(toastEl, { delay: 1000 });
        toast.show();

        toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    };

    // 🧾 Handle reservation creation
    const handleReserve = async () => {
        if (!listing) return;

        if (!authenticated || !userId) {
            // Redirect to Keycloak login if token/user not found
            keycloak.login();
            return;
        }

        setReservationLoading(true);

        try {
            const [aDay, aMonth, aYear] = arrivalDate.split('/').map(Number);
            const [dDay, dMonth, dYear] = departureDate.split('/').map(Number);
            const dateDebut = `${aYear}-${String(aMonth).padStart(2, '0')}-${String(aDay).padStart(2, '0')}`;
            const dateFin = `${dYear}-${String(dMonth).padStart(2, '0')}-${String(dDay).padStart(2, '0')}`;

            const reservationData = {
                dateDebut,
                dateFin,
                nombreVoyageurs: guests,
                prixTotal: totalPrice,
                statut: 'EN_ATTENTE',
                maisonHote: { id: id },
                userId: userId, // ✅ Use Keycloak user ID here
            };

            const maisonBaseUrl = import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895';
            const response = await fetch(`${maisonBaseUrl}/api/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ✅ Optional: send token for secured endpoints
                    ...(keycloak?.token && { 'Authorization': `Bearer ${keycloak.token}` }),
                },
                body: JSON.stringify(reservationData),
            });


            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `Erreur ${response.status}`);
            }
            await response.json();
            showToast('✅ Réservation créée avec succès ! ', "success");
        } catch (error) {
            console.error('Error creating reservation:', error);
            showToast(`❌ Échec de la réservation : ${(error as Error).message}`, "error");
        } finally {
            setReservationLoading(false);
        }
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="d-flex justify-content-center align-items-center min-vh-100">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </UserLayout>
        );
    }

    if (!listing) {
        return (
            <UserLayout>
                <div className="bg-light min-vh-100">
                    <div className="container py-4">
                        <h1>Logement non trouvé</h1>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="bg-light min-vh-100">
                <div className="container py-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0">{listing.nom}</h1>
                        <div>
                            <button className="btn btn-link text-dark text-decoration-none me-3">
                                <i className="bi bi-share"></i> Partager
                            </button>
                            <button className="btn btn-link text-dark text-decoration-none">
                                <i className="bi bi-heart"></i> Enregistrer
                            </button>
                        </div>
                    </div>

                    <div className="row g-4">
                        {/* Left Column - Images and Details */}
                        <div className="col-lg-8">
                            {/* Image Gallery */}
                            <div className="row g-2 mb-4">
                                <div className="col-12">
                                    <img
                                        src={(listing.images && listing.images[0]) || 'https://via.placeholder.com/800x400'}
                                        alt="Main"
                                        className="w-100 rounded"
                                        style={{ height: '400px', objectFit: 'cover' }}
                                    />
                                </div>
                                {(listing.images || []).slice(1).map((img, idx) => (
                                    <div key={idx} className="col-6">
                                        <img
                                            src={img}
                                            alt={`Image ${idx + 2}`}
                                            className="w-100 rounded"
                                            style={{ height: '200px', objectFit: 'cover' }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Property Info */}
                            <div className="bg-white rounded p-4 mb-4">
                                <h2 className="h4 mb-3">
                                    Logement entier : {listing.decritlogement} - {listing.ville}, {listing.pays}
                                </h2>
                                <p className="text-muted">
                                    {listing.capaciteVoyageurs} voyageurs · {listing.nombreChambres} chambre ·
                                    {listing.nombrelits} lit · {listing.nombrewcs} salle de bain
                                </p>
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-star-fill text-warning me-1"></i>
                                    <span className="fw-bold">5,0</span>
                                    <span className="text-muted ms-2">· 3 commentaires</span>
                                </div>
                            </div>

                            {/* Host Info */}
                            <div className="bg-white rounded p-4 mb-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-secondary rounded-circle me-3" style={{ width: '60px', height: '60px' }}></div>
                                    <div>
                                        <h5 className="mb-0">Hôte : Daly</h5>
                                        <small className="text-muted">3 ans sur Airbnb</small>
                                    </div>
                                </div>

                                <div className="border-top pt-3">
                                    <div className="d-flex mb-3">
                                        <i className="bi bi-search text-primary me-3 fs-4"></i>
                                        <div>
                                            <h6 className="mb-1">Procédure d'arrivée exceptionnelle</h6>
                                            <p className="text-muted small mb-0">
                                                Les voyageurs récents ont attribué 5 étoiles à la procédure d'arrivée.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="d-flex mb-3">
                                        <i className="bi bi-geo-alt text-primary me-3 fs-4"></i>
                                        <div>
                                            <h6 className="mb-1">Emplacement imbattable</h6>
                                            <p className="text-muted small mb-0">
                                                Au cours de la dernière année, 100 % des voyageurs ont attribué 5 étoiles
                                                à l'emplacement du logement.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="d-flex">
                                        <i className="bi bi-p-circle text-primary me-3 fs-4"></i>
                                        <div>
                                            <h6 className="mb-1">Stationnez gratuitement</h6>
                                            <p className="text-muted small mb-0">
                                                Il s'agit de l'un des rares endroits des environs qui dispose d'un parking gratuit.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-white rounded p-4 mb-4">
                                <p>{listing.description}</p>
                                <p className="mb-0">
                                    <i className="bi bi-star"></i> Charmant S1 avec jardin privatif & parking – proche de l'aéroport <i className="bi bi-star"></i>
                                </p>
                                <p>
                                    À seulement 5 minutes de l'aéroport Tunis-Carthage, profitez d'un appartement S1
                                    moderne, climatisé et chauffé, meublé avec goût et équipé d'un Wi-Fi haut débit.
                                    Situé en rez-de-chaussée d'une résidence sécurisée, il offre un jardin privatif
                                    de 40 m² ainsi qu'une place de parking privée au sous-sol.
                                </p>
                                <p className="text-muted">
                                    Supermarché, restaurants et commerces accessibles à pied. Quartier calme et agréable.
                                    <br />
                                    <i className="bi bi-car-front"></i> Navette aéroport disponible sur demande....
                                </p>
                            </div>

                            {/* Amenities */}
                            <div className="bg-white rounded p-4 mb-4">
                                <h3 className="h5 mb-4">Ce que propose ce logement</h3>
                                <div className="row g-3">
                                    {(listing.equipements || []).map((equip, idx) => (
                                        <div key={idx} className="col-md-6">
                                            <div className="d-flex align-items-center">
                                                <i className={`${equipmentIcons[equip]?.icon || 'bi-question'} me-3 fs-5`}></i>
                                                <span>{equipmentIcons[equip]?.label || equip}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Map */}
                            <div className="bg-white rounded p-4 mb-4">
                                <h3 className="h5 mb-3">Où se situe le logement</h3>
                                <p className="text-muted">{listing.ville}, {listing.pays}</p>
                                <div className="bg-light rounded" style={{ height: '300px', position: 'relative' }}>
                                    <div className="position-absolute top-50 start-50 translate-middle">
                                        <i className="bi bi-geo-alt-fill fs-1 text-primary"></i>
                                    </div>
                                </div>
                            </div>

                            {/* Host Contact */}
                            <div className="bg-white rounded p-4">
                                <h3 className="h5 mb-4">Faites connaissance avec votre hôte</h3>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="text-center mb-4">
                                            <div className="bg-secondary rounded-circle mx-auto mb-3"
                                                 style={{ width: '120px', height: '120px' }}>
                                            </div>
                                            <h4 className="h5">Daly</h4>
                                            <p className="text-muted small">Hôte</p>
                                            <div className="mb-3">
                                                <p className="mb-1"><strong>3</strong> évaluations</p>
                                                <div className="d-flex align-items-center justify-content-center">
                                                    <i className="bi bi-star-fill text-warning me-1"></i>
                                                    <span className="fw-bold">5,0</span>
                                                </div>
                                                <p className="text-muted small">en note globale</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <button className="btn btn-outline-dark w-100 mb-3">
                                            Envoyer un message à l'hôte
                                        </button>
                                        <div className="mb-3">
                                            <p className="mb-1"><strong>Taux de réponse : 100 %</strong></p>
                                            <p className="text-muted small">Répond dans l'heure</p>
                                        </div>
                                        <div className="alert alert-light">
                                            <i className="bi bi-shield-check me-2"></i>
                                            <small>
                                                Afin de protéger votre paiement, utilisez toujours Airbnb pour envoyer
                                                de l'argent et communiquer avec les hôtes.
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Booking Card */}
                        <div className="col-lg-4">
                            <div className="card shadow-sm position-sticky" style={{ top: '100px' }}>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <h3 className="h4">
                                            {totalPrice} € <small className="text-muted fs-6">pour {totalNights} nuits</small>
                                        </h3>
                                    </div>

                                    <div className="border rounded mb-3">
                                        <div className="row g-0">
                                            <div className="col-6 border-end border-bottom p-3">
                                                <label className="form-label small fw-bold">ARRIVÉE</label>
                                                <input
                                                    type="text"
                                                    className="form-control border-0 p-0"
                                                    value={arrivalDate}
                                                    onChange={(e) => setArrivalDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="col-6 border-bottom p-3">
                                                <label className="form-label small fw-bold">DÉPART</label>
                                                <input
                                                    type="text"
                                                    className="form-control border-0 p-0"
                                                    value={departureDate}
                                                    onChange={(e) => setDepartureDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <label className="form-label small fw-bold">VOYAGEURS</label>
                                            <select
                                                className="form-select border-0 p-0"
                                                value={guests}
                                                onChange={(e) => setGuests(parseInt(e.target.value))}
                                            >
                                                {[...Array(listing.capaciteVoyageurs).keys()].map(i => (
                                                    <option key={i + 1} value={i + 1}>{i + 1} voyageur{i + 1 > 1 ? 's' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-danger w-100 mb-3 py-3 fw-bold"
                                        onClick={handleReserve}
                                        disabled={reservationLoading}
                                    >
                                        {reservationLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Réservation en cours...
                                            </>
                                        ) : (
                                            'Réserver'
                                        )}
                                    </button>

                                    <p className="text-center text-muted small">
                                        Aucun montant ne vous sera débité pour le moment
                                    </p>

                                    <hr />

                                    <button className="btn btn-link text-decoration-none text-muted w-100 text-center">
                                        <i className="bi bi-flag me-2"></i>
                                        Signaler cette annonce
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ Toast container */}
                <div
                    id="toastContainer"
                    className="toast-container position-fixed bottom-0 end-0 p-3"
                ></div>
            </div>
        </UserLayout>
    );
};

export default MaisonDhoteDetails;