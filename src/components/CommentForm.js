import React, { useState } from "react";
import "./CommentForm.css";

export default function CommentForm({ postId, onCommentSubmitted }) {
  const [formData, setFormData] = useState({
    author: "",
    email: "",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit comment");
      }

      setMessage("Thank you! Your comment has been submitted and is awaiting approval.");
      setFormData({ author: "", email: "", content: "" });
      if (onCommentSubmitted) {
        onCommentSubmitted();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-form-container">
      <h3 className="comment-form-title">Leave a Comment</h3>
      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-form-row">
          <label htmlFor="comment-author" className="comment-form-label">
            Name *
            <input
              id="comment-author"
              name="author"
              type="text"
              required
              value={formData.author}
              onChange={handleChange}
              className="comment-form-input"
              placeholder="Your name"
            />
          </label>
          <label htmlFor="comment-email" className="comment-form-label">
            Email *
            <input
              id="comment-email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="comment-form-input"
              placeholder="your@email.com"
            />
          </label>
        </div>
        <label htmlFor="comment-content" className="comment-form-label">
          Comment *
          <textarea
            id="comment-content"
            name="content"
            required
            rows={5}
            value={formData.content}
            onChange={handleChange}
            className="comment-form-textarea"
            placeholder="Share your thoughts..."
          />
        </label>
        {error && <div className="comment-form-error">{error}</div>}
        {message && <div className="comment-form-message">{message}</div>}
        <button
          type="submit"
          className="comment-form-submit"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Comment"}
        </button>
      </form>
    </div>
  );
}
