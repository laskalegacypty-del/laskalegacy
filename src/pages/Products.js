import React, { useEffect, useState, useCallback } from "react";
import "./Products.css";

// Images live inside: src/pages/ProductImages/
import img1 from "./ProductImages/1.png";
import img2 from "./ProductImages/2.png";
import img3 from "./ProductImages/3.png";
import img4 from "./ProductImages/4.png";
import img5 from "./ProductImages/5.png";

// Saddle Stand image (lives in src/images/)
import saddleStandImg from "../images/Saddle stand.png";

const productsByCategory = {
  "Leather Goods": [
    {
      name: "Stock Bridle",
      price: 650,
      image: img4,
      desc:
        "A balanced, clean-finished bridle built for everyday riding and competition. Designed for comfort, durability, and a consistent fit.",
    },
    {
      name: "Stock Breastplate",
      price: 600,
      image: img3,
      desc:
        "Reliable saddle stability without restricting movement. Strong construction with a tidy, practical finish.",
    },
    {
      name: "Paracord Reins",
      price: 450,
      image: img5,
      desc:
        "Lightweight reins with consistent grip in all conditions. Comfortable in hand and built for daily use.",
    },
  ],
  Bags: [
    {
      name: "Saddle Bag",
      price: 450,
      image: img2,
      desc:
        "Practical storage for rides and events. Designed to sit securely without shifting or bulk.",
    },
    {
      name: "Bridle Bag",
      price: 250,
      image: img1,
      desc:
        "Protects your bridle during transport and storage. Keeps tack clean, neat, and organised.",
    },
    {
      name: "Tack Bag",
      price: 200,
      image: img2,
      desc:
        "Compact and practical for everyday accessories. Easy to pack, easy to find what you need.",
    },
  ],
  "Cooling Range": [],
  Other: [
    {
      name: "Saddle Stand",
      price: 500,
      image: saddleStandImg,
      desc:
        "A sturdy saddle stand designed for stability and long-term use in the tack room or stable.",
    },
  ],
};

function BackButton() {
  return (
    <button
      className="back-button"
      onClick={() => window.location.assign("/")}
      aria-label="Back to Home"
    >
      ← Back Home
    </button>
  );
}

function ImageModal({ open, src, alt, onClose }) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Inline styles so it works even if CSS didn't load
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "grid",
    placeItems: "center",
    zIndex: 99999,
    padding: 16,
  };

  const modalStyle = {
    position: "relative",
    width: "min(980px, 96vw)",
    maxHeight: "90vh",
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  };

  const imgStyle = {
    display: "block",
    width: "100%",
    height: "auto",
    maxHeight: "90vh",
    objectFit: "contain",
  };

  const closeStyle = {
    position: "absolute",
    top: 10,
    right: 10,
    width: 42,
    height: 42,
    border: 0,
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 26,
    lineHeight: 1,
    background: "rgba(255,255,255,0.95)",
  };

  return (
    <div style={overlayStyle} onClick={onClose} role="presentation">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button style={closeStyle} onClick={onClose} aria-label="Close">
          ×
        </button>
        <img style={imgStyle} src={src} alt={alt} />
      </div>
    </div>
  );
}

function CategorySection({ title, products, onImageClick }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="category-section">
      <h2 className="category-title">{title}</h2>
      <div className="products-grid">
        {products.map((item) => (
          <article className="product-card" key={item.name}>
            {/* Make image clickable */}
            <button
              type="button"
              className="product-image-button"
              onClick={() => onImageClick(item)}
              aria-label={`Enlarge image of ${item.name}`}
              style={{ padding: 0, border: 0, background: "transparent", cursor: "zoom-in", width: "100%" }}
            >
              <img
                src={item.image}
                alt={item.name}
                className="product-image"
                loading="lazy"
              />
            </button>

            <h3 className="product-name">{item.name}</h3>
            <p className="product-desc">{item.desc}</p>

            <div className="product-footer">
              <span className="product-price">R{item.price}</span>
              <a
                href={`https://wa.me/27725858288?text=${encodeURIComponent(
                  `Hi! I’m interested in the ${item.name}. Please can you share availability, colours, and lead time?`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="product-button"
              >
                Enquire
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [selected, setSelected] = useState(null);
  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <section className="products-page">
      <div className="container">
        <BackButton />
        <h1 className="products-title">Products</h1>
        <p className="products-intro">
          Handcrafted western tack and accessories, made in South Africa. Pricing shown is base pricing. Custom options available on request.
        </p>

        {Object.entries(productsByCategory).map(([category, items]) => (
          <CategorySection
            key={category}
            title={category}
            products={items}
            onImageClick={setSelected}
          />
        ))}
      </div>

      <ImageModal
        open={!!selected}
        src={selected?.image}
        alt={selected?.name || "Product image"}
        onClose={closeModal}
      />
    </section>
  );
}
