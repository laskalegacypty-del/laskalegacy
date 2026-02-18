import React, { useEffect, useState, useCallback } from "react";
import CommentForm from "./CommentForm";
import "./Comments.css";

export default function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/get-comments?postId=${encodeURIComponent(postId)}`);
      if (!response.ok) throw new Error("Failed to load comments");
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="comments-section">
      <h2 className="comments-title">Comments</h2>

      <CommentForm postId={postId} onCommentSubmitted={loadComments} />

      {loading && <div className="comments-loading">Loading comments...</div>}

      {error && <div className="comments-error">Error: {error}</div>}

      {!loading && !error && comments.length === 0 && (
        <div className="comments-empty">No comments yet. Be the first to comment!</div>
      )}

      {!loading && !error && comments.length > 0 && (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.author}</span>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              <div className="comment-content">{comment.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
