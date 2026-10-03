import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

interface SearchProps {
    activeTab?: string;
    initialData?: {
        hebergementPays?: string;
        hebergementArrivee?: string;
        hebergementDepart?: string;
        hebergementAdults?: number;
        hebergementChildren?: number;
        hebergementBabies?: number;
        hebergementPets?: number;
    };
}

const Search: React.FC<SearchProps> = ({ initialData }) => {
    const navigate = useNavigate();

    const [pays, setPays] = useState(initialData?.hebergementPays || "Tunisie");
    const [arrivee, setArrivee] = useState(initialData?.hebergementArrivee || "");
    const [depart, setDepart] = useState(initialData?.hebergementDepart || "");
    const [adults, setAdults] = useState(initialData?.hebergementAdults ?? 1);
    const [children, setChildren] = useState(initialData?.hebergementChildren ?? 0);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams({
            hebergementPays: pays,
            hebergementArrivee: arrivee,
            hebergementDepart: depart,
            hebergementAdults: String(adults),
            hebergementChildren: String(children),
            hebergementBabies: "0",
            hebergementPets: "0",
        });
        navigate(`/hebergement?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch}>
            <div className="d-flex flex-wrap gap-2 align-items-end justify-content-center">
                <div className="d-flex flex-column">
                    <label className="small text-white mb-1">Destination</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Pays ou ville"
                        value={pays}
                        onChange={(e) => setPays(e.target.value)}
                        style={{ minWidth: "160px" }}
                    />
                </div>
                <div className="d-flex flex-column">
                    <label className="small text-white mb-1">Arrivée</label>
                    <input
                        type="date"
                        className="form-control"
                        value={arrivee}
                        onChange={(e) => {
                            setArrivee(e.target.value);
                            // keep the stay valid: departure must come after arrival
                            if (depart && e.target.value && depart <= e.target.value) setDepart("");
                        }}
                    />
                </div>
                <div className="d-flex flex-column">
                    <label className="small text-white mb-1">Départ</label>
                    <input
                        type="date"
                        className="form-control"
                        value={depart}
                        min={arrivee || undefined}
                        onChange={(e) => setDepart(e.target.value)}
                    />
                </div>
                <div className="d-flex flex-column">
                    <label className="small text-white mb-1">Adultes</label>
                    <input
                        type="number"
                        className="form-control"
                        min={1}
                        value={adults}
                        onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: "80px" }}
                    />
                </div>
                <div className="d-flex flex-column">
                    <label className="small text-white mb-1">Enfants</label>
                    <input
                        type="number"
                        className="form-control"
                        min={0}
                        value={children}
                        onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                        style={{ width: "80px" }}
                    />
                </div>
                <button type="submit" className="btn btn-primary px-4" style={{ height: "38px" }}>
                    <i className="bi bi-search me-1"></i> Rechercher
                </button>
            </div>
        </form>
    );
};

export default Search;
