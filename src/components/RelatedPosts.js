import React from "react";
import { Link } from "react-router-dom";
import "./RelatedPosts.css";

export default function RelatedPosts({ posts }) {
  if (!posts || posts.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="related-posts">
      <h2 className="related-posts-title">Related Posts</h2>
      <div className="related-posts-grid">
        {posts.map((post) => (
          <article key={post.id} className="related-post-card">
            <Link to={`/blog/${post.slug}`} className="related-post-link">
              {post.featuredImage && (
                <div className="related-post-image">
                  <img src={post.featuredImage} alt={post.title} />
                </div>
              )}
              <div className="related-post-content">
                <h3 className="related-post-title">{post.title}</h3>
                {post.excerpt && (
                  <p className="related-post-excerpt">{post.excerpt}</p>
                )}
                <div className="related-post-meta">
                  <span className="related-post-author">{post.author}</span>
                  <span className="related-post-date">
                    {formatDate(post.publishDate)}
                  </span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
