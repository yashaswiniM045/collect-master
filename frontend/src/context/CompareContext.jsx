import React, { createContext, useContext, useState } from "react";

const CompareContext = createContext(null);

export const CompareProvider = ({ children }) => {
  const [selectedMovies, setSelectedMovies] = useState([]);

  const addToCompare = (movie) => {
    const movieId = movie.imdbID;
    if (selectedMovies.some((item) => item.imdbID === movieId)) {
      return true;
    }

    if (selectedMovies.length >= 2) {
      return false;
    }

    setSelectedMovies((prev) => [...prev, movie]);
    return true;
  };

  const removeFromCompare = (movieId) => {
    setSelectedMovies((prev) =>
      prev.filter((movie) => movie.imdbID !== movieId)
    );
  };

  const clearCompare = () => {
    setSelectedMovies([]);
  };

  const isSelected = (movieId) => {
    return selectedMovies.some((movie) => movie.imdbID === movieId);
  };

  return (
    <CompareContext.Provider
      value={{
        selectedMovies,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isSelected,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return context;
};
