import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MarkAsWatchedButton = ({ movie }) => {
  const [watched, setWatched] = useState(movie.isWatched || false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      if (!watched) {
        // Mark as watched
        await axios.post(
          `${API_BASE_URL}/watched`,
          {
            movieId: movie.id || movie._id,
            title: movie.title,
            poster: movie.poster,
            genre: movie.genre,
            imdbRating: movie.imdbRating,
            watchedDate: new Date().toISOString(),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWatched(true);
      } else {
        // Unmark / remove from watched history
        await axios.delete(`${API_BASE_URL}/watched/${movie.id || movie._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWatched(false);
      }
    } catch (err) {
      console.error('Failed to update watched status:', err);
      alert(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%',
        padding: '12px',
        marginTop: '10px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '15px',
        cursor: loading ? 'not-allowed' : 'pointer',
        backgroundColor: watched ? '#16a34a' : '#f59e0b',
        color: '#fff',
      }}
    >
      {loading ? 'Saving...' : watched ? '✓ Watched' : '👁 Mark as Watched'}
    </button>
  );
};

