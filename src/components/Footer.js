import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-title">Laska Legacy</div>
          <div className="footer-subtitle">Handcrafted Western tack and accessories made in South Africa.</div>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/products" className="footer-link">Products</Link>
          <a href="/#about" className="footer-link">Our Story</a>
          <a href="/#contact" className="footer-link">Get in Touch</a>
        </nav>

        <div className="footer-social">
          <a className="footer-link" href="https://instagram.com/laska_legacy" target="_blank" rel="noreferrer">Instagram</a>
          <a className="footer-link" href="https://wa.me/27725858288" target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="footer-link" href="mailto:laskalegacypty@gmail.com">Email</a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <div>© {new Date().getFullYear()} Laska Legacy</div>
          <div className="footer-note">Custom orders available on request.</div>
        </div>
      </div>
    </footer>
  );
}
