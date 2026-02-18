import React from "react";
import { Link } from "react-router-dom";
import "./BlogPostCard.css";

export default function BlogPostCard({ post }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <article className="blog-post-card">
      <Link to={`/blog/${post.slug}`} className="blog-post-card-link">
        {post.featuredImage && (
          <div className="blog-post-card-image">
            <img src={post.featuredImage} alt={post.title} />
          </div>
        )}
        <div className="blog-post-card-content">
          <h3 className="blog-post-card-title">{post.title}</h3>
          {post.excerpt && (
            <p className="blog-post-card-excerpt">{post.excerpt}</p>
          )}
          <div className="blog-post-card-meta">
            <span className="blog-post-card-author">{post.author}</span>
            <span className="blog-post-card-date">
              {formatDate(post.publishDate)}
            </span>
          </div>
          {post.categories && post.categories.length > 0 && (
            <div className="blog-post-card-categories">
              {post.categories.map((category, index) => (
                <span key={index} className="blog-post-card-category">
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
