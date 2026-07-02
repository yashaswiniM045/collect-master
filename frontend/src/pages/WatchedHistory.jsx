import React, { useEffect, useState, useCallback } from "react";
import { getWatchedHistory, removeFromWatched, moveBackToWatchlist } from "../services/watchedApi";
import { useToast } from "../context/ToastContext";
import "../components/MovieCard.css";

const WatchedHistoryPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [genreFilter, setGenreFilter] = useState("");
  const [sortBy, setSortBy] = useState("watchedDate");
  const [order, setOrder] = useState("desc");
  const { showToast } = useToast();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWatchedHistory({ genre: genreFilter || undefined, sortBy, order });
      setMovies(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load watched history.");
    } finally {
      setLoading(false);
    }
  }, [genreFilter, sortBy, order]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRemove = async (movieId) => {
    try {
      await removeFromWatched(movieId);
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
      showToast("Removed from watched history.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove movie.", "error");
    }
  };

  const handleMoveBack = async (movieId) => {
    try {
      await moveBackToWatchlist(movieId);
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
      showToast("Moved back to watchlist.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to move movie.", "error");
    }
  };

  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre || [])));

  return (
    <div className="watched-history-page">
      <div className="watched-history-header">
        <h1>Watched History</h1>
        <p className="watched-count">Total watched: {movies.length}</p>
      </div>

      <div className="watched-history-controls">
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="">All Genres</option>
          {allGenres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="watchedDate">Sort by Watched Date</option>
          <option value="title">Sort by Title</option>
        </select>

        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {loading && <p className="state-message">Loading watched history...</p>}
      {!loading && error && <p className="state-message state-error">{error}</p>}
      {!loading && !error && movies.length === 0 && (
        <p className="state-message">You haven't watched any movies yet.</p>
      )}

      {!loading && !error && movies.length > 0 && (
        <div className="movie-grid">
          {movies.map((movie) => (
            <div className="movie-card" key={movie.id}>
              <div className="movie-card-poster-wrap">
                <img
                  src={movie.poster || "/placeholder-poster.png"}
                  alt={movie.title}
                  className="movie-card-poster"
                />
                <span className="watched-badge">Watched</span>
              </div>
              <div className="movie-card-body">
                <h3 className="movie-card-title">{movie.title}</h3>
                <p className="movie-card-genre">
                  {Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}
                </p>
                <p className="movie-card-rating">IMDb: {movie.imdbRating ?? "N/A"}</p>
                <p className="movie-card-date">
                  Watched on {new Date(movie.watchedDate).toLocaleDateString()}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => handleMoveBack(movie.id)}>
                    Move to Watchlist
                  </button>
                  <button className="btn btn-danger" onClick={() => handleRemove(movie.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchedHistoryPage;
