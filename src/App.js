import React, { useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import logo from "./images/ll 1.png";

import ProductsPage from "./pages/Products";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home logo={logo} />} />
        <Route
          path="/products"
          element={
            <>
              <Navbar logo={logo} showHomeLinks={false} />
              <ProductsPage />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function Home({ logo }) {
  const aboutRef = useRef(null);
  // const productsRef = useRef(null); // Removed product section reference
  const contactRef = useRef(null);

  const scrollTo = (ref) => {
    if (ref.current) ref.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Navbar
        logo={logo}
        showHomeLinks
        onAbout={() => scrollTo(aboutRef)}
        // Remove onProducts handler since Products section doesn't exist
        onContact={() => scrollTo(contactRef)}
      />

      <main>
        <Hero logo={logo} />

        <section ref={aboutRef} id="about">
          <About />
        </section>

        {/* Removed Products section from the homepage */}

        <section ref={contactRef} id="contact">
          <Contact />
        </section>
      </main>
    </>
  );
}

function Navbar({ logo, showHomeLinks = true, onAbout, onProducts, onContact }) {
  const navigate = useNavigate();

  const handleProductsClick = () => {
    navigate("/products");
  };

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-container container">
        <div className="navbar-left">
          <Link to="/" className="navbar-home-link" aria-label="Go to home">
            <img
              src={logo}
              alt="Laska Legacy logo"
              className="navbar-logo"
              width={44}
              height={44}
              style={{ width: "44px", height: "44px" }}
            />
          </Link>
          <span className="navbar-brand">Laska Legacy</span>
        </div>

        <div className="navbar-links">
          {showHomeLinks && (
            <>
              <button className="nav-link" onClick={onAbout}>
                Our Story
              </button>
              <button className="nav-link" onClick={handleProductsClick}>
                Products
              </button>
              <button className="nav-link" onClick={onContact}>
                Get in Touch
              </button>
            </>
          )}

          <Link to="/products" className="cta-button nav-cta">
            Shop the Collection
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero({ logo }) {
  return (
    <section className="hero section">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-inner container">
        <div className="hero-content">
          <img
            src={logo}
            alt="Laska Legacy logo"
            className="hero-logo"
            width={72}
            height={72}
            style={{ width: "72px", height: "72px" }}
          />

          <h1 className="hero-title section-title">
            Handcrafted Western Tack Made for Real Riding
          </h1>

          <p className="hero-subtitle section-intro">
            Laska Legacy is built around practical craftsmanship: tack that fits
            well, wears well, and holds up under daily use. Each piece is made in
            South Africa with careful finishing and an eye for function, comfort,
            and clean lines.
          </p>

          <div className="hero-buttons">
            <Link to="/products" className="cta-button">
              View Products
            </Link>
            <a href="#contact" className="cta-alt">
              Get in Touch
            </a>
          </div>

          <div className="trust-tags" aria-label="Highlights">
            <span className="trust-tag">Made in South Africa</span>
            <span className="trust-tag">Custom options</span>
            <span className="trust-tag">Practical finishes</span>
            <span className="trust-tag">Rider-led build</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <div className="section about-section">
      <div className="container about-container">
        <div className="about-story">
          <h2 className="section-title with-accent">The Laska Legacy Story</h2>
          <div className="section-divider" />
          <p className="section-intro">
            Laska Legacy started with a simple goal: create tack that feels right
            in the hand, sits correctly on the horse, and stays dependable through
            everyday riding and competition. We focus on fit and function first,
            then refine the details, stitching, hardware, and finish so every piece
            looks as good as it performs.
          </p>
          <p className="section-intro">
            If you are ordering for a specific horse, discipline, or preference,
            we will guide you through sizing and options and confirm lead time and
            final pricing before production.
          </p>
        </div>

        <ul className="about-list">
          <li>Handcrafted in South Africa</li>
          <li>Custom sizing and options</li>
          <li>Durable materials and clean finishing</li>
          <li>Direct communication and support</li>
        </ul>
      </div>
    </div>
  );
}

// ProductsPreview removed from homepage, so the function is removed

function Contact() {
  const [isSent, setIsSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="section contact-section">
      <div className="container">
        <h2 className="section-title with-accent">Get in Touch</h2>
        <div className="section-divider" />

        <div className="contact-inner">
          <form className="contact-form" onSubmit={handleSubmit} autoComplete="off">
            <label className="input-label" htmlFor="name">
              Name
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </label>

            <label className="input-label" htmlFor="email">
              Email
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </label>

            <label className="input-label" htmlFor="message">
              Message
              <textarea
                id="message"
                name="message"
                placeholder="Tell us what you are looking for (item, sizing, colour, and any custom details)."
                rows={4}
                value={form.message}
                onChange={handleChange}
                required
                className="form-textarea"
              />
            </label>

            <button type="submit" className="cta-button" disabled={isSent}>
              Send Message
            </button>

            <div className="contact-helper">
              We typically respond within 1–2 business days.
            </div>
          </form>

          {isSent && (
            <div className="contact-success" role="status" aria-live="polite">
              Thank you. Your message was sent successfully.
            </div>
          )}

          <div className="contact-info-block">
            <div>
              <span className="contact-label">WhatsApp:</span>{" "}
              <a
                href="https://wa.me/27725858288"
                className="contact-link"
                target="_blank"
                rel="noreferrer"
              >
                +27 72 585 8288
              </a>
            </div>
            <div>
              <span className="contact-label">Instagram:</span>{" "}
              <a
                href="https://instagram.com/laska_legacy"
                className="contact-link"
                target="_blank"
                rel="noreferrer"
              >
                @laska_legacy
              </a>
            </div>
            <div>
              <span className="contact-label">TikTok:</span>{" "}
              <a
                href="https://www.tiktok.com/@the_westerngames_rider"
                className="contact-link"
                target="_blank"
                rel="noreferrer"
              >
                @the_westerngames_rider
              </a>
            </div>
            <div>
              <span className="contact-label">Email:</span>{" "}
              <a href="mailto:laskalegacypty@gmail.com" className="contact-link">
              laskalegacypty@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
