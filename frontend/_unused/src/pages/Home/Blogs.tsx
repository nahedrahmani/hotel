import React from "react";
import { Link } from "react-router-dom";
import images from "../../assets";

interface Blog {
    id: number;
    image: string;
    title: string;
    author: string;
    date: string;
    likes: number;
    comments: number;
    price: string;
    excerpt: string;
}

const blogs: Blog[] = [
    {
        id: 1,
        image: images.blog1,
        title: "Discovering the Hidden Gems of Morocco",
        author: "Sarah Johnson",
        date: "June 12, 2025",
        likes: 1800,
        comments: 245,
        price: "$349.00",
        excerpt:
            "From the bustling souks of Marrakech to the tranquil Atlas Mountains, explore Morocco’s vibrant culture and stunning landscapes.",
    },
    {
        id: 2,
        image:images.blog2,
        title: "A Culinary Journey Through Italy",
        author: "Luca Rossi",
        date: "May 8, 2025",
        likes: 2300,
        comments: 312,
        price: "$299.00",
        excerpt:
            "Indulge in the best Italian cuisine—from homemade pasta in Rome to fine wines in Tuscany. A dream for every foodie traveler.",
    },
    {
        id: 3,
        image: images.blog3,
        title: "Top 10 Beaches to Visit in Tunisia",
        author: "Amina Ben Ali",
        date: "April 20, 2025",
        likes: 1500,
        comments: 198,
        price: "$199.00",
        excerpt:
            "Golden sands, turquoise waters, and warm hospitality — discover Tunisia’s most breathtaking coastal destinations.",
    },
];

const Blogs: React.FC = () => {
    return (
        <div className="container-fluid py-5 bg-light">
            <div className="container py-5">
                {/* Section Header */}
                <div className="text-center mb-5" style={{ maxWidth: "900px", margin: "0 auto" }}>
                    <h5 className="text-warning text-uppercase mb-2">Our Blog</h5>
                    <h1 className="fw-bold mb-3">Popular Travel Blogs</h1>
                    <p className="text-muted">
                        Explore inspiring travel stories, guides, and adventures from
                        travelers around the world. Get tips, recommendations, and hidden
                        gems to make your next journey unforgettable.
                    </p>
                </div>

                {/* Blog Cards */}
                <div className="row g-4 justify-content-center">
                    {blogs.map((blog) => (
                        <div className="col-lg-4 col-md-6" key={blog.id}>
                            <div className="card blog-card shadow-sm border-0 overflow-hidden h-100 position-relative">
                                {/* Image */}
                                <div className="position-relative overflow-hidden">
                                    <img
                                        src={blog.image}
                                        alt={blog.title}
                                        className="card-img-top"
                                        style={{ height: "250px", objectFit: "cover", transition: "transform 0.3s" }}
                                    />
                                    {/* Price Tag */}
                                    <span className="badge bg-primary position-absolute bottom-0 start-0 m-3 px-3 py-2 shadow-sm">
                                        {blog.price}
                                    </span>
                                    {/* Heart Icon */}
                                    <span className="position-absolute top-0 end-0 m-3">
                                        <i className="bi bi-heart-fill text-danger fs-5"></i>
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="card-body d-flex flex-column">
                                    <p className="text-muted small mb-1">
                                        <i className="fa fa-user text-primary me-2"></i>
                                        {blog.author}
                                    </p>
                                    <h5 className="card-title mb-2">{blog.title}</h5>
                                    <p className="text-secondary mb-3">{blog.excerpt}</p>

                                    <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-3">
                                        <small className="text-muted">
                                            <i className="fa fa-calendar-alt text-primary me-1"></i>
                                            {blog.date}
                                        </small>
                                        <div>
                                            <small className="me-3 text-muted">
                                                <i className="fa fa-thumbs-up text-primary me-1"></i>
                                                {blog.likes.toLocaleString()}
                                            </small>
                                            <small className="text-muted">
                                                <i className="fa fa-comments text-primary me-1"></i>
                                                {blog.comments.toLocaleString()}
                                            </small>
                                        </div>
                                    </div>

                                    <Link
                                        to="#"
                                        className="btn btn-success text-white rounded-pill mt-auto py-2"
                                    >
                                        Read More
                                    </Link>
                                </div>

                                {/* Hover Effect */}
                                <style>
                                    {`
                                    .blog-card:hover img {
                                        transform: scale(1.05);
                                    }
                                    `}
                                </style>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blogs;
