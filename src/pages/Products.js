import React from "react";
import "./Products.css";

// Images live inside: src/pages/ProductImages/
import img1 from "./ProductImages/1.png";
import img2 from "./ProductImages/2.png";
import img3 from "./ProductImages/3.png";
import img4 from "./ProductImages/4.png";
import img5 from "./ProductImages/5.png";
import img7 from "./ProductImages/7.png";

// Define product categories
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
  "Bags": [
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
  "Cooling Range": [
    // Placeholder for future products
    // Example product below; remove or add real products as needed
    // {
    //   name: "Cooling Sheet",
    //   price: 500,
    //   image: img6, // You need to add img6 if you have a cooling product
    //   desc: "A cooling sheet to keep your horse comfortable in warm weather.",
    // },
  ],
  "Other": [
    {
      name: "Saddle Stand",
      price: 500,
      image: img7,
      desc:
        "A sturdy saddle stand designed for stability and long-term use in the tack room or stable.",
    },
  ],
};

function BackButton() {
  return (
    <button
      className="back-button"
      style={{
        background: "#f1f5f9",
        color: "#444",
        border: "none",
        borderRadius: "999px",
        padding: "8px 22px",
        fontSize: "1rem",
        fontWeight: 500,
        marginBottom: "20px",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        transition: "background 0.2s",
      }}
      onClick={() => window.location.assign("/")}
      aria-label="Back to Home"
    >
      ← Back Home
    </button>
  );
}

function CategorySection({ title, products }) {
  // Don't render section if no products in this category
  if (!products || products.length === 0) return null;
  return (
    <div style={{ marginBottom: "54px" }}>
      <h2
        style={{
          fontSize: "1.28rem",
          margin: "0 0 15px",
          color: "#0f766e",
          letterSpacing: "0.01em",
          fontWeight: 700,
        }}
      >
        {title}
      </h2>
      <div className="products-grid">
        {products.map((item) => (
          <article className="product-card" key={item.name}>
            <img
              src={item.image}
              alt={item.name}
              className="product-image"
              loading="lazy"
            />

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
  return (
    <section className="products-page">
      <div className="container">
        <BackButton />
        <h1 className="products-title">Products</h1>
        <p className="products-intro">
          Handcrafted western tack and accessories, made in South Africa. Pricing shown is base pricing. Custom options available on request.
        </p>

        {Object.entries(productsByCategory).map(([category, items]) => (
          <CategorySection key={category} title={category} products={items} />
        ))}
      </div>
    </section>
  );
}
