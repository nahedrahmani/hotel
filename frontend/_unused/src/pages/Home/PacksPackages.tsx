import React from "react";


import packages1 from "../../assets/packages-1.jpg";
import packages2 from "../../assets/packages-2.jpg";
import packages3 from "../../assets/packages-3.jpg";
import packages4 from "../../assets/packages-4.jpg";

interface Package {
    id: number;
    image: string;
    title: string;
    location: string;
    duration: string;
    persons: number;
    price: string;
    category: string;
}

const packages: Package[] = [
    {
        id: 1,
        image: packages1,
        title: "Venice - Italy",
        location: "Venice - Italy",
        duration: "3 days",
        persons: 2,
        price: "$349.00",
        category: "Hotel Deals",
    },
    {
        id: 2,
        image: packages2,
        title: "Venice - Italy",
        location: "Venice - Italy",
        duration: "3 days",
        persons: 2,
        price: "$349.00",
        category: "Hotel Deals",
    },
    {
        id: 3,
        image: packages3,
        title: "Venice - Italy",
        location: "Venice - Italy",
        duration: "3 days",
        persons: 2,
        price: "$349.00",
        category: "Hotel Deals",
    },
    {
        id: 4,
        image: packages4,
        title: "Venice - Italy",
        location: "Venice - Italy",
        duration: "3 days",
        persons: 2,
        price: "$349.00",
        category: "Hotel Deals",
    },
];

const PacksPackages: React.FC = () => {
    return (
        <div className="container-fluid py-5" style={{ background: "#f8f9fa" }}>
            <div className="container py-5">
                <div className="text-center mb-5" style={{ maxWidth: "900px", margin: "0 auto" }}>
                    <h5 className="text-warning fw-bold mb-2">Packages</h5>
                    <h1 className="fw-bold mb-4" style={{ fontSize: "2.5rem" }}>Awesome Packages</h1>
                </div>

                <div className="row g-4">
                    {packages.map((item) => (
                        <div key={item.id} className="col-lg-3 col-md-6">
                            <div className="card border-0 shadow-sm overflow-hidden h-100 rounded-4" style={{ borderRadius: "20px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                                 onMouseEnter={(e) => {
                                     (e.currentTarget as HTMLElement).style.transform = "translateY(-10px)";
                                     (e.currentTarget as HTMLElement).style.boxShadow = "0 15px 40px rgba(0,0,0,0.15)";
                                 }}
                                 onMouseLeave={(e) => {
                                     (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                                     (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                                 }}>

                                {/* Image Section */}
                                <div className="position-relative overflow-hidden" style={{ height: "250px" }}>
                                    <img src={item.image} className="img-fluid w-100 h-100" style={{ objectFit: "cover", transition: "transform 0.3s ease" }} alt={item.title}
                                         onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.1)"}
                                         onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
                                    />

                                    {/* Heart Icon */}
                                    <div className="position-absolute top-3 end-3">
                                        <button className="btn btn-light rounded-circle p-2" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="bi bi-heart text-danger" style={{ fontSize: "1.2rem" }}></i>
                                        </button>
                                    </div>

                                    {/* Price Tag */}
                                    <div className="position-absolute bottom-0 start-0 m-3 badge bg-warning text-dark px-3 py-2 fw-bold">
                                        {item.price}
                                    </div>
                                </div>

                                {/* Info Bar */}
                                <div className="bg-light py-3 px-3 d-flex justify-content-around text-center border-top" style={{ borderColor: "#e0e0e0" }}>
                                    <small className="text-muted"><i className="fa fa-map-marker-alt me-2 text-warning"></i>{item.location}</small>
                                    <small className="text-muted"><i className="fa fa-calendar-alt me-2 text-warning"></i>{item.duration}</small>
                                    <small className="text-muted"><i className="fa fa-user me-2 text-warning"></i>{item.persons}</small>
                                </div>

                                {/* Content */}
                                <div className="card-body p-4">
                                    <h5 className="card-title fw-bold mb-1">{item.title}</h5>
                                    <small className="text-uppercase text-muted d-block mb-3">{item.category}</small>
                                    <div className="mb-3">
                                        {[...Array(5)].map((_, i) => (<i key={i} className="bi bi-star-fill text-warning" style={{ fontSize: "0.75rem" }}></i>))}
                                    </div>
                                    <button className="btn btn-warning text-dark w-100 rounded-pill fw-bold py-2">
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PacksPackages;
