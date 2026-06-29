import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import "./CompareBar.css";

function CompareBar() {
  const { selectedMovies } = useCompare();
  const navigate = useNavigate();

  const canCompare = selectedMovies.length === 2;

  const handleCompareNow = () => {
    if (!canCompare) {
      alert("Select exactly 2 movies to compare.");
      return;
    }

    const [movie1, movie2] = selectedMovies;
    navigate(`/compare?movie1=${movie1.imdbID}&movie2=${movie2.imdbID}`);
  };

  const selectedText = useMemo(() => {
    if (selectedMovies.length === 0) {
      return "No movies selected for comparison.";
    }
    if (selectedMovies.length === 1) {
      return "1 movie selected. Pick one more to compare.";
    }
    return "2 movies selected. Ready to compare.";
  }, [selectedMovies.length]);

  return (
    <div className="compare-bar">
      <p>{selectedText}</p>
      <button onClick={handleCompareNow} disabled={!canCompare}>
        Compare Now
      </button>
    </div>
  );
}

export default CompareBar;
