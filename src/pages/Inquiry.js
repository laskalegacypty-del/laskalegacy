import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./Inquiry.css";

const SIZE_ORDER = { XS: 0, S: 1, M: 2, L: 3, XL: 4 };

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      className="back-button"
      onClick={() => navigate("/")}
      aria-label="Back to Home"
    >
      ← Back Home
    </button>
  );
}

export default function InquiryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [shipping, setShipping] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    shippingRoute: "locker-locker",
  });

  const [selectedProducts, setSelectedProducts] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, shippingRes] = await Promise.all([
          fetch("/api/get-products"),
          fetch("/api/get-shipping"),
        ]);

        if (!productsRes.ok || !shippingRes.ok) {
          throw new Error("Failed to load data");
        }

        const productsData = await productsRes.json();
        const shippingData = await shippingRes.json();

        setProducts(productsData);
        setShipping(shippingData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load products. Please refresh the page.");
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductChange = (productName, quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty > 0) {
      setSelectedProducts({ ...selectedProducts, [productName]: qty });
    } else {
      const updated = { ...selectedProducts };
      delete updated[productName];
      setSelectedProducts(updated);
    }
  };

  const getLargestSize = () => {
    if (Object.keys(selectedProducts).length === 0) return null;

    let largest = "XS";
    Object.keys(selectedProducts).forEach((productName) => {
      const product = products.find((p) => p.name === productName);
      if (product && SIZE_ORDER[product.pudoSize] > SIZE_ORDER[largest]) {
        largest = product.pudoSize;
      }
    });
    return largest;
  };

  const calculateShipping = () => {
    const largestSize = getLargestSize();
    if (!largestSize || !shipping[formData.shippingRoute]) return 0;
    return shipping[formData.shippingRoute][largestSize] || 0;
  };

  const calculateProductTotal = () => {
    let total = 0;
    Object.entries(selectedProducts).forEach(([productName, qty]) => {
      const product = products.find((p) => p.name === productName);
      if (product) {
        total += product.price * qty;
      }
    });
    return total;
  };

  const calculateTotal = () => {
    return calculateProductTotal() + calculateShipping();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Object.keys(selectedProducts).length === 0) {
      setError("Please select at least one product");
      return;
    }

    setSubmitting(true);

    try {
      const items = Object.entries(selectedProducts).map(([name, qty]) => ({
        name,
        qty,
      }));

      const response = await fetch("/api/submit-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      setSubmitted(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError("Failed to submit inquiry. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="inquiry-page">
        <div className="container">
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="inquiry-page">
        <div className="container">
          <BackButton />
          <div className="inquiry-success">
            <h2>Thank You!</h2>
            <p>Your inquiry has been submitted successfully.</p>
            <p>We'll review your request and get back to you soon.</p>
          </div>
        </div>
      </section>
    );
  }

  const largestSize = getLargestSize();
  const shippingCost = calculateShipping();
  const productTotal = calculateProductTotal();
  const grandTotal = calculateTotal();

  return (
    <section className="inquiry-page">
      <div className="container">
        <BackButton />
        <h1 className="inquiry-title">Place Your Order</h1>
        <p className="inquiry-intro">
          Fill in your details and select the products you'd like to order. We'll
          review your inquiry and send you an invoice.
        </p>

        {error && <div className="inquiry-error">{error}</div>}

        <form className="inquiry-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="form-section-title">Your Details</h2>
            <div className="form-grid">
              <label className="input-label">
                Full Name *
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="John Doe"
                />
              </label>

              <label className="input-label">
                Email *
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="you@email.com"
                />
              </label>

              <label className="input-label">
                Phone *
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="+27 12 345 6789"
                />
              </label>

              <label className="input-label" style={{ gridColumn: "1 / -1" }}>
                Shipping Address *
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="form-textarea"
                  rows="3"
                  placeholder="Street address, City, Postal Code"
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">Products</h2>
            <div className="products-select-grid">
              {products.map((product) => (
                <div key={product.name} className="product-select-item">
                  <div className="product-select-info">
                    <span className="product-select-name">{product.name}</span>
                    <span className="product-select-price">R{product.price.toFixed(2)}</span>
                    <span className="product-select-size">Size: {product.pudoSize}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={selectedProducts[product.name] || ""}
                    onChange={(e) => handleProductChange(product.name, e.target.value)}
                    className="product-select-qty"
                    placeholder="Qty"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">Shipping</h2>
            <label className="input-label">
              Shipping Route *
              <select
                name="shippingRoute"
                value={formData.shippingRoute}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="locker-locker">Locker → Locker</option>
                <option value="locker-door">Locker → Door</option>
                <option value="locker-kiosk">Locker → Kiosk</option>
                <option value="kiosk-door">Kiosk → Door</option>
              </select>
            </label>
            {largestSize && (
              <div className="shipping-info">
                <p>
                  Largest product size: <strong>{largestSize}</strong>
                </p>
                <p>
                  Shipping cost: <strong>R{shippingCost.toFixed(2)}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="order-summary">
              <h2 className="form-section-title">Order Summary</h2>
              <div className="summary-row">
                <span>Products:</span>
                <span>R{productTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>R{shippingCost.toFixed(2)}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total:</span>
                <span>R{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="cta-button inquiry-submit"
            disabled={submitting || Object.keys(selectedProducts).length === 0}
          >
            {submitting ? "Submitting..." : "Submit Inquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}
