import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, ConciergeBell, CreditCard, Receipt, Users, MapPin, Phone, Mail } from 'lucide-react';
import "./Headers.css";
import images from "../../assets";
import UserLayout from "../../layouts/UserLayout.tsx";
import { chambreService, type Chambre, ROOM_TYPE_LABELS, roomPhoto } from '../../services/chambreService';
import { formatDT, isoDate } from '../../utils/format';

const isoDay = (offset: number) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return isoDate(d);
};

/** Searches this hotel's rooms: hands the dates to the booking page, which runs the search. */
const StaySearch: React.FC = () => {
    const navigate = useNavigate();
    const [checkIn, setCheckIn] = useState(isoDay(1));
    const [checkOut, setCheckOut] = useState(isoDay(2));
    const [guests, setGuests] = useState(2);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/dashboard/reserver?${new URLSearchParams({ checkIn, checkOut, guests: String(guests) })}`);
    };

    return (
        <form onSubmit={submit} className="bg-white text-dark rounded-3 shadow p-3 text-start">
            <div className="row g-2 align-items-end">
                <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold mb-1" htmlFor="h-in">Arrivée</label>
                    <input id="h-in" type="date" className="form-control" value={checkIn} min={isoDay(0)}
                        onChange={e => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(''); }} required />
                </div>
                <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold mb-1" htmlFor="h-out">Départ</label>
                    <input id="h-out" type="date" className="form-control" value={checkOut} min={checkIn}
                        onChange={e => setCheckOut(e.target.value)} required />
                </div>
                <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold mb-1" htmlFor="h-guests">Personnes</label>
                    <select id="h-guests" className="form-select" value={guests} onChange={e => setGuests(Number(e.target.value))}>
                        {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g} personne{g > 1 ? 's' : ''}</option>)}
                    </select>
                </div>
                <div className="col-12 col-md-3 d-grid">
                    <button type="submit" className="btn btn-dark">Voir les disponibilités</button>
                </div>
            </div>
        </form>
    );
};

const AMENITY_LABELS: [keyof Chambre, string][] = [
    ['wifi', 'WiFi'], ['climatisation', 'Climatisation'], ['television', 'Télévision'],
    ['minibar', 'Minibar'], ['balcon', 'Balcon'], ['vueMer', 'Vue mer'],
];

type RoomType = { type: string; fromPrice: number; capacity: number; amenities: string[]; description?: string; photo: string };

/** One card per room type, built from the rooms actually in the system. */
function useRoomTypes(): RoomType[] | null {
    const [rooms, setRooms] = useState<Chambre[] | null>(null);
    useEffect(() => {
        chambreService.getAllChambres().then(r => setRooms(r.data)).catch(() => setRooms([]));
    }, []);
    return useMemo(() => {
        if (!rooms) return null;
        const byType = new Map<string, Chambre[]>();
        rooms.filter(r => r.statut !== 'hors_service')
            .forEach(r => byType.set(r.type, [...(byType.get(r.type) ?? []), r]));
        return [...byType.entries()].map(([type, list]) => ({
            type,
            fromPrice: Math.min(...list.map(r => r.prix)),
            capacity: Math.max(...list.map(r => r.capacite)),
            amenities: AMENITY_LABELS.filter(([k]) => list.some(r => r[k])).map(([, label]) => label),
            description: list[0].description,
            // A real photo of one of these rooms beats the illustration for the type
            photo: roomPhoto(list.find(r => r.photo) ?? list[0]),
        })).sort((a, b) => a.fromPrice - b.fromPrice);
    }, [rooms]);
}

const SERVICES = [
    {
        icon: <CalendarCheck size={22} />,
        title: 'Réservation en ligne',
        text: "Disponibilités en temps réel. Chaque demande est confirmée par l'hôtel et annulable selon la politique de la chambre.",
    },
    {
        icon: <ConciergeBell size={22} />,
        title: 'Demandes à la réception',
        text: 'Ménage, room service, serviettes, réveil, transport : envoyez votre demande depuis Mes réservations et suivez son traitement.',
    },
    { icon: <CreditCard size={22} />, title: 'Facture dans votre espace', text: 'Consultez votre facture en ligne et réglez-la par carte ou wallet, en dinars, ou à la réception.' },
    {
        icon: <Receipt size={22} />,
        title: 'Prix TTC',
        text: 'Le prix affiché est le prix payé : la TVA de 19 % est incluse.',
    },
];

const Home: React.FC = () => {
    const { hash } = useLocation();
    const roomTypes = useRoomTypes();

    // The router doesn't scroll to anchors on its own (e.g. the navbar's "/#contact")
    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }, [hash, roomTypes]);

    return (
        <UserLayout>
            <section
                className="d-flex align-items-center text-white"
                style={{
                    minHeight: '78vh',
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${images.hotel1})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="container">
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-9">
                            <h1 className="display-4 fw-bold mb-3">Royal Tulip Korbous Bay</h1>
                            <p className="lead mb-5">Hôtel, thalasso et sources thermales à Korbous, au Cap Bon.</p>
                            <StaySearch />
                        </div>
                    </div>
                </div>
            </section>

            {roomTypes && roomTypes.length > 0 && (
                <section id="chambres" className="py-5 bg-light">
                    <div className="container py-4">
                        <h2 className="fw-bold mb-1">Nos chambres</h2>
                        <p className="text-muted mb-4">Prix par nuit, TVA incluse. Le tarif peut varier le week-end et en haute saison.</p>
                        <div className="row g-4">
                            {roomTypes.map(t => (
                                <div key={t.type} className="col-md-6 col-lg-4">
                                    <div className="card border-0 shadow-sm h-100 overflow-hidden">
                                        <img src={t.photo} alt={`Chambre ${ROOM_TYPE_LABELS[t.type] ?? t.type}`} loading="lazy"
                                            className="card-img-top" style={{ aspectRatio: '3 / 2', objectFit: 'cover' }} />
                                        <div className="card-body d-flex flex-column p-4">
                                            <div className="d-flex justify-content-between align-items-baseline mb-1">
                                                <h3 className="h5 fw-semibold mb-0">{ROOM_TYPE_LABELS[t.type] ?? t.type}</h3>
                                                <span className="text-muted small d-flex align-items-center gap-1"><Users size={13} /> {t.capacity} pers.</span>
                                            </div>
                                            {t.description && <p className="text-muted small mb-3">{t.description}</p>}
                                            <div className="small text-muted mb-4">{t.amenities.join(' · ')}</div>
                                            <div className="mt-auto d-flex justify-content-between align-items-end">
                                                <div>
                                                    <div className="text-muted small">À partir de</div>
                                                    <div className="fw-bold fs-5">{formatDT(t.fromPrice)} <span className="fs-6 fw-normal text-muted">/ nuit</span></div>
                                                </div>
                                                <Link to="/dashboard/reserver" className="btn btn-outline-dark btn-sm">Réserver</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="py-5 bg-white">
                <div className="container py-4">
                    <h2 className="fw-bold mb-4">Pendant votre séjour</h2>
                    <div className="row g-4">
                        {SERVICES.map(s => (
                            <div key={s.title} className="col-md-6 col-lg-3">
                                <div className="d-flex flex-column gap-2">
                                    <span className="text-dark">{s.icon}</span>
                                    <h3 className="h6 fw-semibold mb-0">{s.title}</h3>
                                    <p className="text-muted small mb-0">{s.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="contact" className="py-5 bg-light">
                <div className="container py-4">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-6">
                            <h2 className="fw-bold mb-4">Contact</h2>
                            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                                <li className="d-flex gap-3"><MapPin size={18} className="mt-1 flex-shrink-0" />Royal Tulip Korbous Bay, Korbous, Nabeul, Tunisie</li>
                                <li className="d-flex gap-3"><Phone size={18} className="mt-1 flex-shrink-0" /><a href="tel:+21671000000" className="text-body">+216 71 000 000</a></li>
                                <li className="d-flex gap-3"><Mail size={18} className="mt-1 flex-shrink-0" /><a href="mailto:reservations@royaltulip.tn" className="text-body">reservations@royaltulip.tn</a></li>
                            </ul>
                        </div>
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body p-4">
                                    <h3 className="h5 fw-semibold mb-2">Déjà client ?</h3>
                                    <p className="text-muted small mb-3">
                                        Retrouvez vos réservations, vos factures et vos demandes à la réception dans votre espace.
                                    </p>
                                    <Link to="/dashboard/mes-reservations" className="btn btn-dark">Mes réservations</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-4 bg-white border-top">
                <div className="container text-muted small d-flex justify-content-between flex-wrap gap-2">
                    <span>© {new Date().getFullYear()} Royal Tulip Korbous Bay</span>
                    <a href="/rooms/CREDITS.txt" className="text-muted" target="_blank" rel="noreferrer">Crédits photos</a>
                </div>
            </footer>
        </UserLayout>
    );
};

export default Home;
