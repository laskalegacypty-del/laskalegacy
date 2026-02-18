import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import BlogPostCard from "../components/BlogPostCard";
import BlogSearch from "../components/BlogSearch";
import "./Blog.css";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = selectedCategory
        ? `/api/get-blog-posts?category=${encodeURIComponent(selectedCategory)}`
        : "/api/get-blog-posts";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load posts");
      const data = await response.json();
      setPosts(data);

      // Extract unique categories
      const allCategories = new Set();
      data.forEach((post) => {
        if (post.categories && post.categories.length > 0) {
          post.categories.forEach((cat) => allCategories.add(cat));
        }
      });
      setCategories(Array.from(allCategories).sort());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="blog-page">
      <div className="blog-header">
        <h1 className="blog-title">Between the Poles</h1>
        <p className="blog-subtitle">Stories and insights from Laska Legacy</p>
      </div>

      <div className="blog-controls">
        <BlogSearch />
        {categories.length > 0 && (
          <div className="blog-category-filter">
            <label htmlFor="category-select">Filter by category:</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && <div className="blog-loading">Loading posts...</div>}

      {error && <div className="blog-error">Error: {error}</div>}

      {!loading && !error && posts.length === 0 && (
        <div className="blog-empty">
          <p>No blog posts found.</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="blog-posts-grid">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <div className="blog-footer">
        <a href="/api/rss-feed" className="rss-feed-link" target="_blank" rel="noopener noreferrer">
          Subscribe to RSS Feed
        </a>
      </div>
    </div>
  );
}
