import React, { useEffect, useState } from "react";
import API from "../services/api";
import MarkAsWatchedButton from "../components/MarkAsWatchedButton";
import { getWatchedMovies } from "../services/watchedApi";
import "./Watchlist.css";

function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [view, setView] = useState("watchlist");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [watchlistRes, watchedRes] = await Promise.all([
        API.get("/watchlist/"),
        getWatchedMovies(),
      ]);

      setMovies(watchlistRes.data.watchlist || []);
      setWatchedMovies(watchedRes.data || []);
    } catch (err) {
      console.log(err);
      setError("Failed to load watchlist or watched movies.");
    } finally {
      setLoading(false);
    }
  };

  const removeMovie = async (id) => {
    try {
      await API.delete(`/watchlist/${id}`);
      fetchData();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || "Failed to remove movie.");
    }
  };

  const handleMoveBack = async (movieId) => {
    try {
      await API.post(`/watched-history/${movieId}/move-back`);
      fetchData();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || "Failed to move movie back.");
    }
  };

  const handleRemoveWatched = async (movieId) => {
    try {
      await API.delete(`/watched-history/${movieId}`);
      fetchData();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || "Failed to remove watched movie.");
    }
  };

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <h1>🎬 My Watchlist</h1>
        <div className="view-toggle">
          <button
            type="button"
            className={view === "watchlist" ? "active" : ""}
            onClick={() => setView("watchlist")}
          >
            Watchlist
          </button>
          <button
            type="button"
            className={view === "watched" ? "active" : ""}
            onClick={() => setView("watched")}
          >
            Watched
          </button>
        </div>
      </div>

      {loading && <div className="state-message">Loading...</div>}
      {error && <div className="state-message state-error">{error}</div>}

      {!loading && !error && view === "watchlist" && (
        <>
          {movies.length === 0 ? (
            <div className="empty-watchlist">
              Your watchlist is empty.
              <br />
              Start adding movies to watch later.
            </div>
          ) : (
            <div className="watchlist-grid">
              {movies.map((movie) => (
                <div className="watchlist-card" key={movie.id}>
                  <img
                    src={
                      movie.poster && movie.poster !== "N/A"
                        ? movie.poster
                        : "https://via.placeholder.com/300x450?text=No+Image"
                    }
                    alt={movie.movie_title}
                  />
                  <div className="watchlist-info">
                    <h3>{movie.movie_title}</h3>
                    <p>{movie.genre}</p>
                    <div className="watchlist-actions">
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeMovie(movie.id)}
                      >
                        ❌ Remove
                      </button>
                      <MarkAsWatchedButton movie={movie} onWatchedChange={fetchData} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !error && view === "watched" && (
        <>
          {watchedMovies.length === 0 ? (
            <div className="empty-watchlist">
              You haven't watched any movies yet.
              <br />
              Mark movies as watched to see them here.
            </div>
          ) : (
            <div className="watched-grid">
              {watchedMovies.map((movie) => (
                <div className="watched-card" key={movie.id}>
                  <img
                    src={
                      movie.poster && movie.poster !== "N/A"
                        ? movie.poster
                        : "https://via.placeholder.com/300x450?text=No+Image"
                    }
                    alt={movie.title}
                  />
                  <div className="watched-info">
                    <h3>{movie.title}</h3>
                    <p>{Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}</p>
                    <p>IMDb: {movie.imdbRating || "N/A"}</p>
                    <p>
                      Watched: {movie.watchedDate ? new Date(movie.watchedDate).toLocaleDateString() : "N/A"}
                    </p>
                    <div className="watched-actions">
                      <button type="button" onClick={() => handleMoveBack(movie.id)}>
                        ↩️ Move to Watchlist
                      </button>
                      <button type="button" className="remove-btn" onClick={() => handleRemoveWatched(movie.id)}>
                        ❌ Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Watchlist;
