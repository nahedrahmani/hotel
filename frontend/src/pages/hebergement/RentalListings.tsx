import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Heart, Star, Plus, Minus } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserLayout from "../../layouts/UserLayout.tsx";
import Search from "../Home/Search.tsx";

interface Maison {
    id: number;
    nom: string;
    typeLogement?: string;
    decritlogement?: string;
    description?: string;
    nombreChambres: number;
    nombrelits: number;
    prixParNuit: number;
    images?: string[];
    ville?: string;
    latitude?: number;
    longitude?: number;
}

interface Listing {
    id: number;
    title: string;
    type: string;
    rating: number;
    reviews: number;
    description: string;
    bedrooms: string;
    price: number;
    originalPrice: number | null;
    image: string;
    ville?: string;
    lat?: number;
    lng?: number;
}

export default function RentalListings() {
    const [searchParams] = useSearchParams();
    const [liked, setLiked] = useState<Record<number, boolean>>({});
    const [listings, setListings] = useState<Listing[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const initialData = {
        hebergementPays: searchParams.get('hebergementPays') || 'Tunisie',
        hebergementArrivee: searchParams.get('hebergementArrivee') || '',
        hebergementDepart: searchParams.get('hebergementDepart') || '',
        hebergementAdults: parseInt(searchParams.get('hebergementAdults') ?? '') || 0,
        hebergementChildren: parseInt(searchParams.get('hebergementChildren') ?? '') || 0,
        hebergementBabies: parseInt(searchParams.get('hebergementBabies') ?? '') || 0,
        hebergementPets: parseInt(searchParams.get('hebergementPets') ?? '') || 0,
    };

    // Calculate nights
    let nights = 1;
    const arrivee = searchParams.get('hebergementArrivee');
    const depart = searchParams.get('hebergementDepart');
    if (arrivee && depart) {
        const a = new Date(arrivee);
        const d = new Date(depart);
        nights = Math.max(1, Math.ceil((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Total guests
    const totalGuests = initialData.hebergementAdults + initialData.hebergementChildren + initialData.hebergementBabies + initialData.hebergementPets;

    const mapToListing = (item: Maison): Listing => ({
        id: item.id,
        title: item.nom,
        type: item.typeLogement === 'CHAMBRE' ? 'Chambre' : item.decritlogement || 'Logement',
        rating: 4.8,
        reviews: (item.id % 20) + 10,
        description: item.description ? item.description.substring(0, 30) + '...' : '',
        bedrooms: `${item.nombreChambres} chambre${item.nombreChambres > 1 ? 's' : ''} • ${item.nombrelits} lit${item.nombrelits > 1 ? 's' : ''}`,
        price: item.prixParNuit * nights,
        originalPrice: null,
        image: (item.images && item.images.length > 0 ? item.images[0] : null) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
        ville: item.ville,
        lat: item.latitude,
        lng: item.longitude
    });

    const fetchData = async (p: number) => {
        setLoading(true);
        try {
            const apiParams = {
                pays: searchParams.get('hebergementPays') || 'Tunisie',
                dateArrivee: arrivee || '',
                dateDepart: depart || '',
                nbVoyageurs: totalGuests.toString(),
                page: p.toString(),
                size: '6'
            };
            const query = new URLSearchParams(apiParams).toString();
            const maisonBase = import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895';
            const response = await fetch(`${maisonBase}/api/maisons?${query}`);
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            const data = await response.json();
            setListings((data.content || []).map(mapToListing));
            setTotalPages(data.totalPages || 1);
            setPage(p);
        } catch (error) {
            console.error('Error fetching data:', error);
            setListings([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(0);
    }, [searchParams]);

    const toggleLike = (id: number) => {
        setLiked(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleCardClick = (id: number) => {
        navigate(`/hebergement/${id}`);
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="container-fluid vh-100 p-0">
                    <br />
                    <br />
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="container-fluid vh-100 p-0">
                <style>{`
                .no-scrollbar {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .card-pointer {
                    cursor: pointer;
                }
                .card-pointer:hover {
                    transform: translateY(-2px);
                    transition: transform 0.2s;
                }
            `}</style>
                <br/>
                <br/>
                <div className="row h-100 m-0">

                    <div className="col-8 h-100 overflow-auto p-4 no-scrollbar">
                        <Search activeTab="hebergement" initialData={initialData}/>

                        <div className="row g-4">
                            {listings.map(listing => (
                                <div key={listing.id} className="col-4">
                                    <div
                                        className="card border-0 shadow-sm rounded-4 h-100 card-pointer"
                                        onClick={() => handleCardClick(listing.id)}
                                    >
                                        {/* Image */}
                                        <div className="position-relative"
                                             style={{height: '250px', overflow: 'hidden'}}>
                                            <img
                                                src={listing.image}
                                                alt={listing.title}
                                                className="w-100 h-100"
                                                style={{objectFit: 'cover'}}
                                            />
                                            <div
                                                className="position-absolute top-0 end-0 m-3 badge bg-dark rounded-pill"
                                                style={{fontSize: '0.875rem'}}>
                                                {listing.price}€
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLike(listing.id);
                                                }}
                                                className="position-absolute top-0 start-0 m-3 btn btn-light rounded-circle p-2"
                                                style={{width: '44px', height: '44px'}}
                                            >
                                                <Heart
                                                    size={20}
                                                    className={liked[listing.id] ? 'text-danger' : 'text-secondary'}
                                                    fill={liked[listing.id] ? '#dc3545' : 'none'}
                                                />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="card-body d-flex flex-column">
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div className="flex-grow-1">
                                                        <p className="text-muted small mb-1">{listing.type}</p>
                                                        <h5 className="card-title fw-semibold mb-1">{listing.title}</h5>
                                                        <p className="text-muted small mb-2">{listing.description}</p>
                                                        <p className="text-muted small mb-2">{listing.bedrooms}</p>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-1 ms-2">
                                                        <Star size={14} className="text-warning" fill="currentColor"/>
                                                        <span className="fw-semibold small">{listing.rating}</span>
                                                        <span className="text-muted small">({listing.reviews})</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="d-flex align-items-baseline gap-2">
                                                    {listing.originalPrice && (
                                                        <span
                                                            className="text-muted small text-decoration-line-through">{listing.originalPrice}€</span>
                                                    )}
                                                    <span className="fw-semibold fs-5">{listing.price}€</span>
                                                    <span className="text-muted small">pour {nights} nuits</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="col-12 d-flex justify-content-center mt-4">
                                <nav>
                                    <ul className="pagination">
                                        <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => fetchData(page - 1)} disabled={page === 0}>
                                                Previous
                                            </button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => fetchData(i)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => fetchData(page + 1)} disabled={page === totalPages - 1}>
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </div>

                    {/* Right Section - Map */}
                    <div className="col-4 p-4">
                        <div className="h-100 position-relative rounded-4 overflow-hidden shadow-lg"
                             style={{backgroundColor: '#d3d3d3'}}>
                            {/* Placeholder for Map */}
                            <img
                                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=1000&fit=crop"
                                alt="Map"
                                className="w-100 h-100"
                                style={{objectFit: 'cover'}}
                            />

                            {/* Price Markers - Hardcoded for now */}
                            {[
                                {top: '15%', left: '70%', price: '589€'},
                                {top: '18%', left: '75%', price: '833€'},
                                {top: '22%', left: '72%', price: '691€'},
                                {top: '20%', left: '78%', price: '1067€'},
                                {top: '35%', left: '65%', price: '1406€'},
                                {top: '38%', left: '60%', price: '820€'},
                                {top: '42%', left: '62%', price: '697€'},
                                {top: '40%', left: '68%', price: '662€'},
                                {top: '55%', left: '58%', price: '786€'}
                            ].map((marker, idx) => (
                                <div
                                    key={idx}
                                    className="position-absolute badge bg-dark rounded-pill"
                                    style={{
                                        top: marker.top,
                                        left: marker.left,
                                        transform: 'translate(-50%, -50%)',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {marker.price}
                                </div>
                            ))}

                            {/* Map Controls */}
                            <div className="position-absolute bottom-0 end-0 m-4 d-flex flex-column gap-2">
                                <button className="btn btn-light rounded-circle p-2 shadow-sm">
                                    <Plus size={20} className="text-dark"/>
                                </button>
                                <button className="btn btn-light rounded-circle p-2 shadow-sm">
                                    <Minus size={20} className="text-dark"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}