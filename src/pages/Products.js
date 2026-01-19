import React from "react";
import { Link } from "react-router-dom";
import "../App.css";
import "./Products.css";

function ProductsPage() {
  const sections = [
    {
      title: "Tack",
      items: [
        {
          name: "Stock Bridle",
          price: 650,
          desc:
            "A clean, balanced bridle built for comfort and consistent contact. Finished for daily riding and competition use.",
          bullets: ["Comfort-focused fit", "Neat stitching and finish", "Custom options available"],
        },
        {
          name: "Stock Breastplate",
          price: 600,
          desc:
            "Designed to stabilise tack movement without restricting the shoulder. Practical, secure, and made for active riding.",
          bullets: ["Stable feel in motion", "Secure, consistent fit", "Built for regular use"],
        },
        {
          name: "Paracord Reins",
          price: 450,
          desc:
            "Durable reins with dependable grip and a comfortable feel in hand. Ideal for regular riding in changing conditions.",
          bullets: ["Comfortable grip", "Abrasion resistant", "Custom lengths on request"],
        },
        {
          name: "Slobber Straps",
          price: 50,
          desc:
            "A practical connector that keeps your rein setup tidy and reliable. Simple, functional, and easy to fit.",
          bullets: ["Quick to fit", "Lightweight essential", "Pairs with a range of rein setups"],
        },
      ],
    },
    {
      title: "Bags and Storage",
      items: [
        {
          name: "Saddle Bag",
          price: 450,
          desc:
            "Protective storage for travel days and stable organisation. Keeps your saddle covered and easy to carry.",
          bullets: ["Protective storage", "Convenient carry", "Ideal for transport"],
        },
        {
          name: "Bridle Bag",
          price: 250,
          desc:
            "A neat way to store and transport your bridle without tangles or dust. Keeps tack clean and organised.",
          bullets: ["Reduces tangling", "Dust protection", "Tidy storage"],
        },
        {
          name: "Tack Bag",
          price: 200,
          desc:
            "A compact bag for small tack, tools, and essentials. A practical option for training and show days.",
          bullets: ["Compact organisation", "Easy to pack", "Useful everyday essential"],
        },
      ],
    },
    {
      title: "Accessories",
      items: [
        {
          name: "Saddle Stand",
          price: 500,
          desc:
            "A stable stand that supports your saddle and helps maintain shape between rides. Useful at home and on the road.",
          bullets: ["Stable support", "Tack-room friendly", "Protects saddle shape"],
        },
        {
          name: "Cooling Towel",
          price: 50,
          desc:
            "A simple cooling essential for warm days and post-ride recovery. Easy to keep in your kit.",
          bullets: ["Post-ride comfort", "Easy to use", "Great value item"],
        },
      ],
    },
  ];

  const formatZar = (n) => `R${n}`;

  return (
    <main className="section products-page">
      <div className="container">
        <div className="products-page-header">
          <div>
            <h1 className="section-title with-accent">Products</h1>
            <p className="section-intro">
              Pricing is listed for standard items. Custom options are available on request.
              For orders, include sizing, preferred colours, and any discipline-specific requirements.
            </p>
          </div>

          <div className="products-page-actions">
            <Link to="/" className="cta-alt products-back">
              Back to Home
            </Link>
            <a
              className="cta-button"
              href="mailto:hi@laskalegacy.co.za?subject=Laska%20Legacy%20Pricing%20Request"
            >
              Request Pricing
            </a>
          </div>
        </div>

        {sections.map((sec) => (
          <section key={sec.title} className="products-category">
            <h2 className="section-title with-accent products-category-title">{sec.title}</h2>
            <div className="section-divider" />

            <div className="grid products-grid">
              {sec.items.map((item) => (
                <article key={item.name} className="card product-item">
                  <div className="product-item-top">
                    <h3 className="product-item-name">{item.name}</h3>
                    <div className="product-item-price">{formatZar(item.price)}</div>
                  </div>

                  <p className="product-item-desc">{item.desc}</p>

                  <ul className="product-item-details">
                    {item.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>

                  <div className="product-item-actions">
                    <a
                      className="cta-button"
                      href="https://wa.me/27xxxxxxxxx"
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp Enquiry
                    </a>
                    <a
                      className="cta-alt"
                      href="mailto:hi@laskalegacy.co.za?subject=Laska%20Legacy%20Order%20Enquiry"
                    >
                      Email Enquiry
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <div className="products-footer card">
          <div className="products-footer-title">Need help choosing the right setup?</div>
          <div className="products-footer-text">
            Send a message with your horse, discipline, and sizing details. We will recommend the best option and confirm lead time.
          </div>
          <div className="products-footer-actions">
            <Link to="/" className="cta-alt">
              Contact on Home Page
            </Link>
            <a className="cta-button" href="https://wa.me/27xxxxxxxxx" target="_blank" rel="noreferrer">
              WhatsApp Enquiry
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductsPage;
