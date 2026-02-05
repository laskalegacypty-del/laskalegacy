import React, { useCallback, useEffect, useState } from "react";
import "./Gallery.css";

// Put your photos in: src/images/gallery/
// Then import them here (add more as you add photos)
import g1 from "../images/gallery/1.jpeg";
import g2 from "../images/gallery/2.jpeg";
import g3 from "../images/gallery/3.jpeg";
import g4 from "../images/gallery/4.jpeg";
import g5 from "../images/gallery/5.jpeg";
import g6 from "../images/gallery/6.jpeg";
import g7 from "../images/gallery/7.jpeg";
import g8 from "../images/gallery/8.jpeg";
import g9 from "../images/gallery/9.jpeg";
import g10 from "../images/gallery/10.jpeg";
import g11 from "../images/gallery/11.jpeg";
import g12 from "../images/gallery/12.jpeg";
import g13 from "../images/gallery/13.jpeg";
import g14 from "../images/gallery/14.jpeg";
import g15 from "../images/gallery/15.jpeg";
import g16 from "../images/gallery/16.jpeg";
import g17 from "../images/gallery/17.jpeg";
import g18 from "../images/gallery/18.jpeg";
import g19 from "../images/gallery/19.jpeg";
import g20 from "../images/gallery/20.jpeg";
import g22 from "../images/gallery/22.jpeg";
import g23 from "../images/gallery/23.jpeg";
import g24 from "../images/gallery/24.jpeg";
import g25 from "../images/gallery/25.jpeg";
import g26 from "../images/gallery/26.jpeg";
import g27 from "../images/gallery/27.jpeg";


const galleryItems = [
  { src: g1, alt: "Laska Legacy gallery photo 1" },
  { src: g2, alt: "Laska Legacy gallery photo 2" },
  { src: g3, alt: "Laska Legacy gallery photo 3" },
  { src: g4, alt: "Laska Legacy gallery photo 4" },
  { src: g5, alt: "Laska Legacy gallery photo 5" },
  { src: g6, alt: "Laska Legacy gallery photo 6" },
  { src: g7, alt: "Laska Legacy gallery photo 7" },
  { src: g8, alt: "Laska Legacy gallery photo 8" },
  { src: g9, alt: "Laska Legacy gallery photo 9" },
  { src: g10, alt: "Laska Legacy gallery photo 10" },
  { src: g11, alt: "Laska Legacy gallery photo 11" },
  { src: g12, alt: "Laska Legacy gallery photo 12" },
  { src: g13, alt: "Laska Legacy gallery photo 13" },
  { src: g14, alt: "Laska Legacy gallery photo 14" },
  { src: g15, alt: "Laska Legacy gallery photo 15" },
  { src: g16, alt: "Laska Legacy gallery photo 16" },
  { src: g17, alt: "Laska Legacy gallery photo 17" },
  { src: g18, alt: "Laska Legacy gallery photo 18" },
  { src: g19, alt: "Laska Legacy gallery photo 19" },
  { src: g20, alt: "Laska Legacy gallery photo 20" },
  { src: g22, alt: "Laska Legacy gallery photo 22" },
  { src: g23, alt: "Laska Legacy gallery photo 23" },
  { src: g24, alt: "Laska Legacy gallery photo 24" },
  { src: g25, alt: "Laska Legacy gallery photo 25" },
  { src: g26, alt: "Laska Legacy gallery photo 26" },
  { src: g27, alt: "Laska Legacy gallery photo 27" },
];

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
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

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
    width: "min(1100px, 96vw)",
    maxHeight: "92vh",
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  };

  const imgStyle = {
    display: "block",
    width: "100%",
    height: "auto",
    maxHeight: "92vh",
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
      <div
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged gallery image"
      >
        <button style={closeStyle} onClick={onClose} aria-label="Close">
          ×
        </button>
        <img style={imgStyle} src={src} alt={alt} />
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [selected, setSelected] = useState(null);
  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <section className="gallery-page">
      <div className="container">
        <BackButton />

        <h1 className="gallery-title">Gallery</h1>
        <p className="gallery-intro">
          A look at the horses, the work, and the gear. Real photos from rides, events, and builds.
        </p>

        <div className="gallery-grid">
          {galleryItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="gallery-tile"
              onClick={() => setSelected(item)}
              aria-label="Open photo"
            >
              <img className="gallery-img" src={item.src} alt={item.alt} loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <ImageModal
        open={!!selected}
        src={selected?.src}
        alt={selected?.alt || "Gallery image"}
        onClose={closeModal}
      />
    </section>
  );
}
