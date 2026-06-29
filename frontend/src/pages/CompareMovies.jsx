import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { compareMovies } from "../services/movieService";
import "./CompareMovies.css";

function CompareMovies() {
  const [searchParams] = useSearchParams();
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const movie1 = searchParams.get("movie1");
  const movie2 = searchParams.get("movie2");

  useEffect(() => {
    if (!movie1 || !movie2) {
      return;
    }

    const fetchCompare = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await compareMovies(movie1, movie2);
        setCompareData(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load comparison data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompare();
  }, [movie1, movie2]);

  if (!movie1 || !movie2) {
    return (
      <div className="compare-page">
        <div className="compare-empty">
          <h2>Compare Movies</h2>
          <p>Please select two movies to compare from the home page.</p>
          <Link to="/">Go back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-page">
      <div className="compare-header">
        <h2>Compare Movies</h2>
      </div>

      {loading && <p>Loading comparison...</p>}
      {error && <p className="compare-error">{error}</p>}

      {compareData && (
        <>
          <div className="compare-grid">
            {[compareData.movie1, compareData.movie2].map((movie) => (
              <div key={movie.imdb_id} className="compare-card">
                <img
                  src={
                    movie.poster && movie.poster !== "N/A"
                      ? movie.poster
                      : "https://via.placeholder.com/300x450?text=No+Image"
                  }
                  alt={movie.title}
                />
                <div className="compare-details">
                  <h3>{movie.title}</h3>
                  <p><strong>Year:</strong> {movie.year}</p>
                  <p><strong>Genre:</strong> {movie.genre}</p>
                  <p><strong>Runtime:</strong> {movie.runtime}</p>
                  <p><strong>Director:</strong> {movie.director}</p>
                  <p><strong>Cast:</strong> {movie.cast}</p>
                  <p><strong>IMDb Rating:</strong> {movie.imdb_rating}</p>
                  <p><strong>User Rating:</strong> {movie.average_user_rating}</p>
                  <p><strong>Total Reviews:</strong> {movie.total_reviews}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="compare-summary">
            <h3>Comparison Summary</h3>
            <ul>
              {compareData.summary.map((item) => (
                <li key={item.metric}>{item.message}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default CompareMovies;
