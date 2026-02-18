import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Comments from "../components/Comments";
import RelatedPosts from "../components/RelatedPosts";
import "./BlogPost.css";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/get-blog-post?slug=${encodeURIComponent(slug)}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Post not found");
        }
        throw new Error("Failed to load post");
      }
      const data = await response.json();
      setPost(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  // Set SEO meta tags
  useEffect(() => {
    if (post) {
      // Set document title
      document.title = `${post.metaTitle || post.title} | Between the Poles - Laska Legacy`;

      // Set or update meta tags
      const setMetaTag = (name, content, isProperty = false) => {
        const attribute = isProperty ? "property" : "name";
        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute(attribute, name);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      setMetaTag("description", post.metaDescription || post.excerpt || "");
      if (post.metaKeywords && post.metaKeywords.length > 0) {
        setMetaTag("keywords", post.metaKeywords.join(", "));
      }

      const shareUrl = window.location.href;
      setMetaTag("og:title", post.metaTitle || post.title, true);
      setMetaTag("og:description", post.metaDescription || post.excerpt || "", true);
      setMetaTag("og:type", "article", true);
      setMetaTag("og:url", shareUrl, true);
      if (post.featuredImage) {
        setMetaTag("og:image", post.featuredImage, true);
      }

      setMetaTag("twitter:card", "summary_large_image");
      setMetaTag("twitter:title", post.metaTitle || post.title);
      setMetaTag("twitter:description", post.metaDescription || post.excerpt || "");
      if (post.featuredImage) {
        setMetaTag("twitter:image", post.featuredImage);
      }

      // Set canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", shareUrl);
    }
  }, [post]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post ? post.title : "";

  if (loading) {
    return (
      <div className="blog-post-page">
        <div className="blog-post-loading">Loading post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-post-page">
        <div className="blog-post-error">Error: {error}</div>
        <Link to="/blog" className="blog-post-back-link">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-post-page">
        <div className="blog-post-error">Post not found</div>
        <Link to="/blog" className="blog-post-back-link">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="blog-post-page">
        <Link to="/blog" className="blog-post-back-link">
          ← Back to Blog
        </Link>

        <header className="blog-post-header">
          <h1 className="blog-post-title">{post.title}</h1>
          <div className="blog-post-meta">
            <span className="blog-post-author">By {post.author}</span>
            <span className="blog-post-date">{formatDate(post.publishDate)}</span>
          </div>
          {post.categories && post.categories.length > 0 && (
            <div className="blog-post-categories">
              {post.categories.map((category, index) => (
                <span key={index} className="blog-post-category">
                  {category}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.featuredImage && (
          <div className="blog-post-featured-image">
            <img src={post.featuredImage} alt={post.title} />
          </div>
        )}

        <div
          className="blog-post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="blog-post-share">
          <span>Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="blog-post-share-link"
          >
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="blog-post-share-link"
          >
            Facebook
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`}
            className="blog-post-share-link"
          >
            Email
          </a>
        </div>

        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <RelatedPosts posts={post.relatedPosts} />
        )}

        <Comments postId={post.id} />
      </article>
  );
}
