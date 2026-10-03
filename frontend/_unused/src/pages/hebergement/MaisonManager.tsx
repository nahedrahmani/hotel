import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import iconPositionMaison from "../../assets/maison_dhote/icon-position_maison.png";
import images from "../../assets";
import UserLayout from "../../layouts/UserLayout.tsx";

interface MaisonHote {
    id: number;
    nom: string;
    ville?: string;
    capacite?: number;
    nbChambres?: number;
    prixParNuit?: number;
    description?: string;
    images?: string[];
}

interface ApiResponse {
    content?: MaisonHote[];
    totalPages?: number;
}

const MaisonHoteList: React.FC = () => {
    const [countries, setCountries] = useState<string[]>([]);
    const [governorates, setGovernorates] = useState<Record<string, string[]>>({});

    const [selectedCountry, setSelectedCountry] = useState<string>("");
    const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [maisons, setMaisons] = useState<MaisonHote[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ Fetch countries.json
    useEffect(() => {
        fetch("/countries.json")
            .then((res) => res.json())
            .then((data) => {
                setGovernorates(data);
                setCountries(Object.keys(data));
            })
            .catch(() => console.error("Error loading countries.json"));
    }, []);

    // ✅ Fetch maisons
    useEffect(() => {
        const fetchMaisons = async () => {
            setLoading(true);
            setError(null);
            try {
                const baseUrl = import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895';
                const response = await axios.get<ApiResponse>(
                    `${baseUrl}/api/maisons/paged?page=${currentPage}&size=9`
                );
                const data = response.data;
                setMaisons(data.content || []);
                setTotalPages(data.totalPages || 1);
            } catch {
                setError("Erreur lors du chargement des maisons");
            } finally {
                setLoading(false);
            }
        };

        fetchMaisons();
    }, [currentPage]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCountry(e.target.value);
        setSelectedGovernorate("");
        setCurrentPage(1);
    };

    const handleGovernorateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGovernorate(e.target.value);
        setCurrentPage(1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const filteredGovernorates = governorates[selectedCountry] || [];

    // 🔍 Filter maisons
    const filteredMaisons = maisons.filter((m) => {
        const matchGov =
            !selectedGovernorate ||
            m.ville?.toLowerCase().includes(selectedGovernorate.toLowerCase());
        const matchSearch =
            !searchQuery || m.nom?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchGov && matchSearch;
    });

    return (
        <UserLayout>
        <div className="container py-5">
            {/* Header */}
            <div className="text-center mb-5">
                <h1 className="display-6">Etnafes Libre</h1>
                <hr
                    className="mx-auto"
                    style={{ borderTop: "3px solid rgb(255,147,31)", width: "20%" }}
                />
                <h2 className="text-warning my-3" style={{ letterSpacing: "2px" }}>
                    Hébergement et Maison d'hôte selon votre destination
                </h2>
            </div>

            {/* Filters */}
            <div className="row mb-4 justify-content-center">
                <div className="col-md-3">
                    <label className="fw-bold">Pays</label>
                    <select
                        className="form-control"
                        value={selectedCountry}
                        onChange={handleCountryChange}
                    >
                        <option value="">Choisissez votre pays</option>
                        {countries.map((country) => (
                            <option key={country} value={country}>
                                {country}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-md-3">
                    <label className="fw-bold">Gouvernorat</label>
                    <select
                        className="form-control"
                        value={selectedGovernorate}
                        onChange={handleGovernorateChange}
                        disabled={!selectedCountry}
                    >
                        <option value="">Choisissez votre destination</option>
                        {filteredGovernorates.map((gov) => (
                            <option key={gov} value={gov}>
                                {gov}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-md-4">
                    <label className="fw-bold">Recherche</label>
                    <input
                        className="form-control"
                        type="text"
                        placeholder="Chercher..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Maison cards in 3 columns */}
            <div className="row">
                {loading ? (
                    <p className="text-center text-muted">Chargement...</p>
                ) : error ? (
                    <p className="text-center text-danger">{error}</p>
                ) : filteredMaisons.length === 0 ? (
                    <p className="text-center text-muted">Aucune maison trouvée</p>
                ) : (
                    filteredMaisons.map((maison) => (
                        <div key={maison.id} className="col-6 mb-4">
                            <div className="border rounded shadow-sm">
                                <div className="card border-0">
                                    <div className="row mx-2 mt-3">
                                        {/* Image & info */}
                                        <div className="col-md-4">
                                            <img
                                                src={maison.images && maison.images.length > 0 ? maison.images[0] : "/placeholder.jpg"}
                                                className="img-fluid"
                                                alt={maison.nom}
                                            />
                                            <hr />
                                            <small className="text-muted">
                                                <i className="bi bi-person"></i> {maison.capacite || 2} Voyageurs
                                                <span className="ms-3">
              <i className="bi bi-lightbulb"></i> {maison.nbChambres || 1} chambre(s)
            </span>
                                                <br />
                                                <img
                                                    loading="lazy"
                                                    className="my-2"
                                                    src={images.typeHoteIcon}
                                                    alt="type-maison-hote"
                                                />{" "}
                                                Logement entier
                                                <i className="bi bi-tag text-dark ms-2">{maison.prixParNuit || 0} DT</i>
                                            </small>
                                            <br />
                                            <span>
            <img
                loading="lazy"
                src={iconPositionMaison}
                alt="Ville"
                style={{ width: "12px", marginRight: "4px" }}
            />
                                                {maison.ville || "Inconnue"}
          </span>
                                        </div>

                                        {/* Body */}
                                        <div className="col-md-8 col-sm-12">
                                            <div className="card-body">
                                                <p className="text-dark fw-light mb-3 d-flex justify-content-between align-items-center">
                                                    <span className="fw-bold">{maison.nom}</span>
                                                    <Link
                                                        to={`/hebergement-maison-hote/${maison.id}`}
                                                        className="btn btn-success btn-sm"
                                                    >
                                                        + De détails
                                                    </Link>
                                                </p>
                                                <hr />

                                                {/* Description */}
                                                <div className="my-2">
                                                    <p className="small text-muted">
                                                        {maison.description?.slice(0, 150) + (maison.description && maison.description.length > 150 ? "..." : "")}
                                                    </p>
                                                </div>
                                                <hr />

                                                <p>
                                                    <img src={images.bath} title="Salle de bain" alt="Salle de bain" />
                                                    <span className="ms-3">
                <img src={images.tumbleDry} title="Lave linge" alt="Lave linge" />
              </span>
                                                    <span className="ms-3">
                <img src={images.heating} title="Chauffage" alt="Chauffage" />
              </span>
                                                    <span className="ms-3">
                <img src={images.airConditioner} title="Climatisation" alt="Climatisation" />
              </span>
                                                    <span className="ms-3">
                <img src={images.waterHeater} title="Eau chaude" alt="Eau chaude" />
              </span>
                                                    <span className="ms-3">
                <img src={images.computer} title="Espace de travail" alt="Espace de travail" />
              </span>
                                                    <span className="ms-3">
                <img src={images.espaceEnfant} title="Espace enfant" alt="Espace enfant" />
              </span>
                                                    <span className="ms-3">
                <img src={images.wifi} title="wifi" alt="wifi" />
              </span>
                                                    <span className="ms-3">
                <img src={images.kitchen} title="Cuisine" alt="Cuisine" />
              </span>
                                                    <span className="ms-3">
                <img src={images.visible} title="Nombre des vues" alt="Nombre des vues" width="35px" /> 0
              </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <ul className="pagination justify-content-center mt-4">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        >
                            «
                        </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <li
                            key={i}
                            className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                        >
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                            </button>
                        </li>
                    ))}

                    <li
                        className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                        }`}
                    >
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        >
                            »
                        </button>
                    </li>
                </ul>
            )}
        </div>
        </UserLayout>
    );
};

export default MaisonHoteList;
