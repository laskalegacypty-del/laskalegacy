import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./BlogSearch.css";

export default function BlogSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, []);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults(null);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/search-blog-posts?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ query: searchQuery, results: [], count: 0, error: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        performSearch(query);
        setSearchParams({ q: query });
      } else {
        setResults(null);
        setSearchParams({});
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, performSearch, setSearchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      navigate(`/blog?q=${encodeURIComponent(query)}`);
    }
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery || !text) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="blog-search-container">
      <form className="blog-search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="blog-search-input"
          placeholder="Search blog posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="blog-search-button">
          Search
        </button>
      </form>

      {loading && <div className="blog-search-loading">Searching...</div>}

      {results && !loading && (
        <div className="blog-search-results">
          <div className="blog-search-results-header">
            Found {results.count} result{results.count !== 1 ? "s" : ""} for "{results.query}"
          </div>
          {results.error && (
            <div className="blog-search-error">Error: {results.error}</div>
          )}
          {results.results && results.results.length > 0 && (
            <div className="blog-search-results-list">
              {results.results.map((post) => (
                <div
                  key={post.id}
                  className="blog-search-result-item"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <h4 className="blog-search-result-title">
                    {highlightText(post.title, results.query)}
                  </h4>
                  {post.excerpt && (
                    <p className="blog-search-result-excerpt">
                      {highlightText(post.excerpt, results.query)}
                    </p>
                  )}
                  <div className="blog-search-result-meta">
                    <span>{post.author}</span>
                    <span>
                      {new Date(post.publishDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {results.results && results.results.length === 0 && !results.error && (
            <div className="blog-search-no-results">
              No posts found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
