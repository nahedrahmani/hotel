import React from "react";
import images from "../../assets";

const Guides: React.FC = () => {
    return (
        <>
            <style>{`
        .overflowed-bg {
          position: relative;
          width: 100%;
          min-height: 500px;
          background: linear-gradient(45deg, #1a1a2e 0%, #16213e 59%, #0f3460 100%);
          clip-path: polygon(0 7%, 14% 6%, 21% 12%, 51% 4%, 57% 10%, 87% 10%, 93% 18%, 100% 16%, 100% 84%, 0% 100%);
          padding: 80px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .gradient {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,20,147,0.15) 100%);
          z-index: 1;
          animation: pulse 8s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        #box6 {
          position: relative;
          z-index: 2;
          color: white;
          display: flex;
          align-items: center;
          gap: 60px;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 50px 20px;
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        #box6 img {
          width: 480px;
          max-width: 100%;
          height: 380px;
          object-fit: cover;
          border-radius: 24px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
          transition: transform 0.4s ease;
        }

        #box6 img:hover {
          transform: translateY(-10px) scale(1.02);
        }

        .text-container {
          max-width: 680px;
        }

        .text-container h1 {
          font-size: 3.2rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          background: linear-gradient(90deg, #FFD700, #FF6B6B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: none;
        }

        .text-container p {
          font-size: 1.2rem;
          line-height: 1.8;
          margin-bottom: 2rem;
          opacity: 0.95;
          color: #f0f0f0;
        }

        .text-container .btn {
          font-weight: bold;
          padding: 14px 36px;
          border-radius: 50px;
          background: #FFD700;
          color: #1a1a2e;
          border: none;
          transition: all 0.3s ease;
          font-size: 1.1rem;
          box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
        }

        .text-container .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(255, 215, 0, 0.4);
          background: #FF6B6B;
          color: white;
        }

        .partner-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 0.9rem;
          margin-top: 1rem;
          backdrop-filter: blur(5px);
        }

        @media (max-width: 768px) {
          #box6 {
            flex-direction: column;
            text-align: center;
            gap: 30px;
          }
          #box6 img {
            width: 100%;
            max-width: 380px;
            height: 300px;
          }
          .text-container h1 {
            font-size: 2.3rem;
          }
          .text-container p {
            font-size: 1rem;
          }
        }
      `}</style>

            {/* PARTNERSHIP BANNER */}
            <div id="bannerOverflowBG-1561" className="overflowed-bg">
                <div className="gradient"></div>
                <div id="box6">
                    {/* Image */}
                    <div style={{ flex: "0 0 auto" }}>
                        <img src={images.man} alt="Luxury Partner Hotel" />
                    </div>

                    {/* Text Content */}
                    <div className="text-container">
                        <h1>Partner with Royal Hotels</h1>
                        <p>
                            Join an exclusive network of <strong>characterful stays, boutique hotels, and premium experiences</strong> across Tunisia and beyond.
                            List your property, reach thousands of luxury travelers, and grow your bookings — with zero upfront costs and full brand control.
                        </p>
                        <p>
                            Whether you own a <em>riad in the medina</em>, a <em>seaside villa</em>, or a <em>desert camp</em> —
                            we help you shine on a global stage.
                        </p>

                        <button className="btn">
                            List Your Property
                        </button>

                        <div className="partner-badge">
                            <i className="fas fa-check-circle text-success"></i>
                            <span>150+ Partners | Instant Booking | 24/7 Support</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTACT & PARTNERS — AT THE END */}
            <section className="py-5 bg-dark text-white">
                <div className="container py-5">
                    <div className="row justify-content-between align-items-center">
                        <div className="col-md-5">
                            <h3 className="fw-bold mb-4">Get in Touch</h3>
                            <p className="mb-2"><i className="fas fa-envelope text-warning me-2"></i> contact@royal.com</p>
                            <p className="mb-2"><i className="fas fa-phone text-warning me-2"></i> +216 70 000 001</p>
                            <p className="mb-0"><i className="fas fa-map-marker-alt text-warning me-2"></i> Tunis, Tunisia</p>
                        </div>

                        <div className="col-md-5 text-md-end">
                            <h5 className="fw-bold mb-4">Our Trusted Partners</h5>
                            <div className="d-flex justify-content-md-end gap-4 flex-wrap">
                                <img src={images.logo} alt="Logo" className="img-fluid" style={{ height: "50px" }} />
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-5 pt-4 border-top border-secondary">
                        <h5 className="fw-bold mb-3">Follow Us</h5>
                        <div className="d-flex justify-content-center gap-4 fs-3">
                            <a href="#" className="text-white"><i className="fab fa-facebook"></i></a>
                            <a href="#" className="text-white"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="text-white"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="text-white"><i className="fab fa-linkedin"></i></a>
                        </div>
                        <p className="mt-4 text-muted small">© 2025 Royal Hotels. All rights reserved.</p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Guides;
