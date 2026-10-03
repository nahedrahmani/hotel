import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import "./Headers.css";
import Search from './Search.tsx';
import images from "../../assets";
import UserLayout from "../../layouts/UserLayout.tsx";

// Reusable Hover Card
const HoverCard: React.FC<{ title: string; img: string; children: React.ReactNode }> = ({ title, img, children }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="position-relative overflow-hidden rounded-3 shadow-lg"
            style={{ height: "380px" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img src={img} alt={title} className="w-100 h-100" style={{ objectFit: "cover", transition: "0.5s" }} />
            <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center p-4 text-center text-white"
                style={{
                    background: isHovered ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.3)",
                    transition: "background 0.4s ease",
                }}
            >
                <h3 className="fw-bold mb-3">{title}</h3>
                <p className={`mb-0 ${isHovered ? "opacity-100" : "opacity-0"}`} style={{ transition: "opacity 0.4s" }}>
                    {children}
                </p>
            </div>
        </div>
    );
};

const Home: React.FC = () => {
    const { hash } = useLocation();

    // The router doesn't scroll to anchors on its own (e.g. the navbar's "/#contact")
    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }, [hash]);

    return (
        <UserLayout>
            {/* HERO - hotel1.jpg */}
            <section
                className="d-flex align-items-center min-vh-100 text-white"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${images.hotel1})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="container">
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-8">
                            <h1 className="display-3 fw-bold mb-4">Find Your Perfect Stay</h1>
                            <p className="lead mb-5">Luxury hotels, boutique stays & exclusive experiences worldwide.</p>
                            <div className="d-inline-block"><Search></Search></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP INTO OUR CHARACTERFUL WORLD */}
            <section className="py-5 bg-light">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h5 className="text-primary text-uppercase fw-bold">Step Into</h5>
                        <h2 className="display-5 fw-bold">Our Characterful World</h2>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100 overflow-hidden">
                                <img src={images.hotel2} className="card-img-top" alt="Gift Card" style={{ height: "240px", objectFit: "cover" }} />
                                <div className="card-body">
                                    <h5 className="card-title fw-bold">Take the Gift</h5>
                                    <p className="card-text text-muted">
                                        Surprise your loved one with a <strong>Royal Gift Card</strong> — perfect for a birthday celebration.
                                        Choose the amount, add a personal message, and let us prepare a magical stay with cake, flowers, and champagne.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100 overflow-hidden">
                                <img src={images.hotel3} className="card-img-top" alt="Partners" style={{ height: "240px", objectFit: "cover" }} />
                                <div className="card-body">
                                    <h5 className="card-title fw-bold">Characterful Partners</h5>
                                    <p className="card-text text-muted">
                                        Over <strong>150 unique hotels</strong> in 90+ countries. No two stays are the same — intimate, authentic, and unforgettable.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100 overflow-hidden bg-primary text-white">
                                <div className="card-body d-flex flex-column justify-content-center text-center p-5">
                                    <i className="fas fa-crown fa-3x mb-3"></i>
                                    <h5 className="fw-bold">Your Journey, Your Way</h5>
                                    <p>Tailor every detail — from room preferences to private dining. We make it happen.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* OVER 50 ACTIVITIES — BIGGER IMAGES */}
            <section className="py-5 bg-white">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h5 className="text-primary text-uppercase fw-bold">Relax & Recharge</h5>
                        <h2 className="display-5 fw-bold">Over 50 Activities You Can Enjoy</h2>
                    </div>

                    <div className="row g-5 text-center">
                        <div className="col-md-4">
                            <div className="shadow-sm rounded overflow-hidden">
                                <img src={images.hammam} alt="Hammam" className="img-fluid w-100" style={{ height: "280px", objectFit: "cover" }} />
                            </div>
                            <h5 className="mt-3 fw-bold">Traditional Hammam</h5>
                            <p className="text-muted small">Steam, scrub, and total relaxation</p>
                        </div>
                        <div className="col-md-4">
                            <div className="shadow-sm rounded overflow-hidden">
                                <img src={images.spa} alt="Spa" className="img-fluid w-100" style={{ height: "280px", objectFit: "cover" }} />
                            </div>
                            <h5 className="mt-3 fw-bold">Luxury Spa</h5>
                            <p className="text-muted small">Massages, facials, and wellness</p>
                        </div>
                        <div className="col-md-4">
                            <div className="shadow-sm rounded overflow-hidden">
                                <img src={images.salle} alt="Gym" className="img-fluid w-100" style={{ height: "280px", objectFit: "cover" }} />
                            </div>
                            <h5 className="mt-3 fw-bold">Fitness Center</h5>
                            <p className="text-muted small">State-of-the-art gym & classes</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* REAL GUEST STORIES — REPLACES "Popular Travel Blogs" */}
            <section className="py-5 bg-light">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h5 className="text-primary text-uppercase fw-bold">Guest Stories</h5>
                        <h2 className="display-5 fw-bold">Real Experiences from Our Visitors</h2>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <img src={images.testimonial1} alt="Sarah" className="rounded-circle me-3" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                                        <div>
                                            <h6 className="mb-0 fw-bold">Sarah & Ahmed</h6>
                                            <small className="text-muted">Tunis, March 2025</small>
                                        </div>
                                    </div>
                                    <p className="text-muted fst-italic">
                                        "We celebrated our 10th anniversary here. The staff surprised us with a private dinner on the terrace — unforgettable!"
                                    </p>
                                    <div className="text-warning">★★★★★</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <img src={images.testimonial2} alt="Lucas" className="rounded-circle me-3" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                                        <div>
                                            <h6 className="mb-0 fw-bold">Lucas M.</h6>
                                            <small className="text-muted">Paris, June 2025</small>
                                        </div>
                                    </div>
                                    <p className="text-muted fst-italic">
                                        "The hammam and spa were world-class. I left feeling completely renewed. Highly recommend!"
                                    </p>
                                    <div className="text-warning">★★★★★</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <img src={images.testimonial3} alt="Amina" className="rounded-circle me-3" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                                        <div>
                                            <h6 className="mb-0 fw-bold">Amina K.</h6>
                                            <small className="text-muted">Sfax, August 2025</small>
                                        </div>
                                    </div>
                                    <p className="text-muted fst-italic">
                                        "Took my kids to the sports park — they didn’t want to leave! Perfect family getaway."
                                    </p>
                                    <div className="text-warning">★★★★★</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* EXCLUSIVE OFFERS */}
            <section className="py-5 bg-dark text-white">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h5 className="text-warning text-uppercase fw-bold">Exclusive Deals</h5>
                        <h2 className="display-5 fw-bold">Unlock Offers Across All Royal Hotels</h2>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-4"><HoverCard title="Save 20% on Suites" img={images.suite}>Upgrade to luxury with 20% off all suite bookings. Limited time only.</HoverCard></div>
                        <div className="col-md-4"><HoverCard title="Spa Treatment – Save 15%" img={images.spa2}>Indulge in a full-day spa journey with 15% off treatments and experiences.</HoverCard></div>
                        <div className="col-md-4"><HoverCard title="Complimentary Golf" img={images.golf}>Play all day on our championship course — free with any 3+ night stay.</HoverCard></div>
                    </div>
                </div>
            </section>

            {/* ADVENTURE ACTIVITIES */}
            <section className="py-5 bg-light">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h5 className="text-primary text-uppercase fw-bold">Adventure Awaits</h5>
                        <h2 className="display-5 fw-bold">Thrills & Fun for Everyone</h2>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6 col-lg-4">
                            <img src={images.jetski} alt="Jet Ski" className="img-fluid rounded shadow" />
                            <h6 className="mt-3 fw-bold text-center">Jet Ski Adventures</h6>
                        </div>
                        <div className="col-md-6 col-lg-4">
                            <img src={images.catamaran} alt="Catamaran" className="img-fluid rounded shadow" />
                            <h6 className="mt-3 fw-bold text-center">Private Catamaran Trips</h6>
                        </div>
                        <div className="col-md-6 col-lg-4">
                            <img src={images.park} alt="Kids Park" className="img-fluid rounded shadow" />
                            <h6 className="mt-3 fw-bold text-center">Kids Sports Park</h6>
                            <p className="text-muted small text-center">Football, Basketball, Tennis & More</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* BECOME A PARTNER + TOUR GUIDE */}
            <section className="py-5 bg-white">
                <div className="container py-5">
                    <div className="row g-5">
                        {/* Become a Partner */}
                        <div className="col-lg-6">
                            <div className="text-center p-5 bg-primary text-white rounded-3 shadow">
                                <i className="fas fa-handshake fa-3x mb-4"></i>
                                <h3 className="fw-bold">Become a Partner</h3>
                                <p className="mb-4">
                                    Join our network of premium collaborators. List your hotel, activity, or service and reach thousands of travelers.
                                </p>
                                <a href="#" className="btn btn-light btn-lg">Apply Now</a>
                            </div>
                        </div>
                        {/* Become a Tour Guide */}
                        <div className="col-lg-6">
                            <div className="text-center p-5 bg-success text-white rounded-3 shadow">
                                <i className="fas fa-map-signs fa-3x mb-4"></i>
                                <h3 className="fw-bold">Become a Tour Guide</h3>
                                <p className="mb-4">
                                    We have <strong>over 50 opportunities</strong> across Tunisia. Share your passion for culture, history, and adventure.
                                </p>
                                <a href="#" className="btn btn-light btn-lg">Join Our Team</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="py-5 bg-white">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h5 className="text-primary text-uppercase fw-bold">Contact</h5>
                        <h2 className="display-6 fw-bold">Book Your Stay</h2>
                        <p className="text-muted">We’re available 24/7 to assist you</p>
                    </div>
                    <div className="row g-4 align-items-stretch">
                        {/* Contact Info */}
                        <div className="col-lg-5">
                            <div className="h-100 p-4 p-lg-5 rounded-3 text-white" style={{ background: '#8B5CF6' }}>
                                <h4 className="fw-bold mb-4"><i className="fas fa-address-book me-2"></i>Contact Information</h4>
                                <div className="d-flex mb-3">
                                    <i className="fas fa-map-marker-alt mt-1 me-2"></i>
                                    <div>
                                        <div className="small">Royal Tulip Korbous Bay Hotel</div>
                                        <div className="small">Korbous, Nabeul, Tunisia</div>
                                    </div>
                                </div>
                                <div className="d-flex mb-3">
                                    <i className="fas fa-phone-alt mt-1 me-2"></i>
                                    <div className="small">+216 71 000 000</div>
                                </div>
                                <div className="d-flex mb-4">
                                    <i className="fas fa-envelope mt-1 me-2"></i>
                                    <div className="small">reservations@royaltulip.tn</div>
                                </div>
                                <div className="d-flex gap-3">
                                    <a href="#" className="text-white"><i className="fab fa-facebook-f"></i></a>
                                    <a href="#" className="text-white"><i className="fab fa-instagram"></i></a>
                                    <a href="#" className="text-white"><i className="fab fa-twitter"></i></a>
                                </div>
                            </div>
                        </div>
                        {/* Contact Form */}
                        <div className="col-lg-7">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4 p-lg-5">
                                    <form onSubmit={(e) => e.preventDefault()}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small">Full Name</label>
                                                <input className="form-control" placeholder="Foulen Ben Foulen" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">Email</label>
                                                <input type="email" className="form-control" placeholder="you@example.com" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">Phone</label>
                                                <input className="form-control" placeholder="(+216) 00 000 000" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">Room Type</label>
                                                <select className="form-select">
                                                    <option>Deluxe Room</option>
                                                    <option>Executive Room</option>
                                                    <option>Family Suite</option>
                                                </select>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small">Special Requests</label>
                                                <textarea rows={3} className="form-control" placeholder="Let us know any details..." />
                                            </div>
                                            <div className="col-12 d-grid d-sm-flex justify-content-sm-end">
                                                <button className="btn btn-primary px-4">
                                                    <i className="fas fa-paper-plane me-2"></i>Submit Request
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* NEWSLETTER */}
            <section className="py-5 text-white" style={{ background: '#8B5CF6' }}>
                <div className="container py-4">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <h3 className="fw-bold mb-2">Stay Updated</h3>
                            <p className="text-white-50 mb-4">Subscribe for special offers, travel inspiration and hotel news.</p>
                            <form className="row g-2 justify-content-center" onSubmit={(e) => e.preventDefault()}>
                                <div className="col-12 col-sm-7">
                                    <input type="email" className="form-control form-control-lg" placeholder="Your email address" />
                                </div>
                                <div className="col-12 col-sm-auto d-grid">
                                    <button className="btn btn-dark btn-lg">Subscribe</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            



            {/* Keep original sections if needed */}
        </UserLayout>
    );
};

export default Home;