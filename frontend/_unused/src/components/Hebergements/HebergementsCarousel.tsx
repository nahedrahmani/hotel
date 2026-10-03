import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Hebergement {
    id: string;
    nom: string;
    ville: string;
    prixParNuit: number;
    images: string[];
    rating: number;
    descritlogement: string;
}

const HebergementsCarousel: React.FC = () => {
    const [hebergements, setHebergements] = useState<Hebergement[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchHebergements = async () => {
            try {
                const baseUrl = import.meta.env.VITE_MAISON_SERVICE_URL ?? 'http://localhost:8895';
                const response = await fetch(`${baseUrl}/api/maisons/allmaison`);
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setHebergements(data.slice(0, 12));
            } catch (error) {
                console.error("Error fetching hebergements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHebergements();
    }, []);

    useEffect(() => {
        if (hebergements.length === 0) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % Math.max(hebergements.length - 3, 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [hebergements.length]);

    const toggleFavorite = (id: string) => {
        setFavorites((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const nextSlide = () => {
        if (hebergements.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % Math.max(hebergements.length - 3, 1));
        }
    };

    const prevSlide = () => {
        if (hebergements.length > 0) {
            setCurrentSlide(
                (prev) =>
                    (prev - 1 + Math.max(hebergements.length - 3, 1)) %
                    Math.max(hebergements.length - 3, 1)
            );
        }
    };

    if (loading) {
        return (
            <div className="container-fluid py-5 bg-light text-center">
                <p className="text-muted">Loading accommodations...</p>
            </div>
        );
    }

    if (hebergements.length === 0) {
        return (
            <div className="container-fluid py-5 bg-light text-center">
                <p className="text-muted">No accommodations available</p>
            </div>
        );
    }

    return (
        <div className="container-fluid py-5 bg-light">
            <div className="container py-5">
                {/* Header */}
                <div className="text-center mb-5" style={{ maxWidth: "900px", margin: "auto" }}>
                    <h5 className="text-warning mb-2">Hébergements</h5>
                    <h1 className="fw-bold mb-4">Popular Accommodations</h1>
                </div>

                {/* Carousel */}
                <div className="position-relative">
                    <div className="carousel-container overflow-hidden" style={{ borderRadius: "20px" }}>
                        <div
                            className="d-flex transition-transform"
                            style={{
                                transform: `translateX(-${currentSlide * 25}%)`,
                                width: `90%`,
                                transitionDuration: "500ms",
                                transitionTimingFunction: "ease-out",
                                gap: "1.5rem",
                            }}
                        >
                            {hebergements.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/hebergements/${item.id}`}
                                    className="flex-shrink-0 text-decoration-none"
                                    style={{ width: "25%", paddingRight: "12px" }}
                                >
                                    <div
                                        className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative"
                                        style={{
                                            borderRadius: "20px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {/* Image Container */}
                                        <div
                                            className="position-relative overflow-hidden"
                                            style={{
                                                height: "180px", // smaller image height
                                                background: "#e9ecef",
                                            }}
                                        >
                                            <img
                                                src={item.images[0] || "https://via.placeholder.com/300x200"}
                                                alt={item.nom}
                                                className="w-100 h-100"
                                                style={{
                                                    objectFit: "cover",
                                                    transition: "transform 0.3s ease",
                                                }}
                                            />

                                            {/* Badge */}
                                          {/*  <div
                                                className="position-absolute"
                                                style={{
                                                    top: "10px",
                                                    left: "10px",
                                                    background: "rgba(255,255,255,0.95)",
                                                    backdropFilter: "blur(10px)",
                                                    borderRadius: "50px",
                                                    padding: "6px 14px",
                                                    zIndex: 10,
                                                }}
                                            >
                                                <p
                                                    className="text-dark fw-semibold mb-0"
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    Coup de cœur voyageurs
                                                </p>
                                            </div>*/}

                                            {/* Heart Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavorite(item.id);
                                                }}
                                                className="btn btn-light rounded-circle position-absolute p-2"
                                                style={{
                                                    top: "10px",
                                                    right: "10px",
                                                    width: "40px",
                                                    height: "40px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: "rgba(255,255,255,0.95)",
                                                    backdropFilter: "blur(10px)",
                                                    zIndex: 10,
                                                }}
                                            >
                                                <i
                                                    className={`bi ${
                                                        favorites[item.id] ? "bi-heart-fill" : "bi-heart"
                                                    }`}
                                                    style={{
                                                        color: favorites[item.id] ? "#dc3545" : "#999",
                                                        fontSize: "1.25rem",
                                                    }}
                                                ></i>
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="card-body d-flex flex-column p-4">
                                            <p className="text-muted small mb-2">
                                                {item.nom} · {item.ville}
                                            </p>

                                            <div className="d-flex justify-content-between align-items-center mt-auto">
                                                <p
                                                    className="fw-bold mb-0"
                                                    style={{ color: "#f11282", fontSize: "1.125rem" }}
                                                >
                                                    {item.prixParNuit}€{" "}
                                                    <span
                                                        className="text-secondary fw-normal"
                                                        style={{ fontSize: "0.875rem" }}
                                                    >
                            / nuit
                          </span>
                                                </p>

                                                <div className="d-flex align-items-center gap-1">
                                                    <i
                                                        className="bi bi-star-fill"
                                                        style={{ color: "#ffc107", fontSize: "0.875rem" }}
                                                    ></i>
                                                    <span className="fw-bold small">
                            {item.rating || 5.0}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Nav Buttons */}
                    <button
                        onClick={prevSlide}
                        className="btn btn-light rounded-circle position-absolute p-3 shadow-sm"
                        style={{
                            left: "-30px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                        }}
                    >
                        <i className="bi bi-chevron-left" style={{ fontSize: "1.5rem" }}></i>
                    </button>

                    <button
                        onClick={nextSlide}
                        className="btn btn-light rounded-circle position-absolute p-3 shadow-sm"
                        style={{
                            right: "-30px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                        }}
                    >
                        <i className="bi bi-chevron-right" style={{ fontSize: "1.5rem" }}></i>
                    </button>

                    {/* Indicators */}
                    <div className="d-flex gap-2 justify-content-center mt-5">
                        {Array.from({ length: Math.max(hebergements.length - 3, 1) }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className="border-0 rounded-pill"
                                style={{
                                    height: "8px",
                                    width: idx === currentSlide ? "32px" : "8px",
                                    background: idx === currentSlide ? "#ff9500" : "#d3d3d3",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        ))}
                    </div>
                </div>


            </div>
        </div>
    );
};

export default HebergementsCarousel;
