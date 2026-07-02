import React, { useEffect, useState } from "react";
import { getWatchedStatus, markAsWatched, removeFromWatched } from "../services/watchedApi";

const MarkAsWatchedButton = ({ movie, onWatchedChange }) => {
  const [watched, setWatched] = useState(movie?.isWatched || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      const movieId = movie?.movie_id || movie?.imdbID || movie?.id || movie?._id;
      if (!movieId) return;

      try {
        const res = await getWatchedStatus(movieId);
        setWatched(res.data?.watched ?? false);
      } catch (err) {
        console.warn("Unable to load watched status", err);
      }
    };

    loadStatus();
  }, [movie]);

  const handleClick = async () => {
    setLoading(true);
    const movieId = movie?.movie_id || movie?.imdbID || movie?.id || movie?._id;
    const title = movie?.title || movie?.movie_title;

    if (!movieId || !title) {
      setLoading(false);
      alert("Unable to mark this movie as watched because it lacks a valid ID or title.");
      return;
    }

    try {
      if (!watched) {
        await markAsWatched({
          movieId,
          title,
          poster: movie?.poster,
          genre: movie?.genre,
          imdbRating: movie?.imdbRating,
          watchedDate: new Date().toISOString(),
        });
        setWatched(true);
      } else {
        await removeFromWatched(movieId);
        setWatched(false);
      }

      if (typeof onWatchedChange === "function") {
        onWatchedChange();
      }
    } catch (err) {
      console.error("Failed to update watched status:", err);
      const status = err.response?.status;
      const data = err.response?.data;
      const msg = data?.message || data?.detail || data || err.message || "Something went wrong. Please try again.";
      // Show more details to help debug API failures
      alert(`Error (${status || "network"}): ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        width: "100%",
        padding: "12px",
        marginTop: "10px",
        borderRadius: "8px",
        border: "none",
        fontWeight: "bold",
        fontSize: "15px",
        cursor: loading ? "not-allowed" : "pointer",
        backgroundColor: watched ? "#16a34a" : "#f59e0b",
        color: "#fff",
      }}
    >
      {loading ? "Saving..." : watched ? "✓ Watched" : "👁 Mark as Watched"}
    </button>
  );
};

export default MarkAsWatchedButton;
