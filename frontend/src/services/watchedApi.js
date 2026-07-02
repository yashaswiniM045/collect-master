import API from "./api";

export const getWatchedHistory = async (params = {}) => {
  return API.get("/watched-history", { params });
};

export const getWatchedMovies = async () => {
  return API.get("/watched");
};

export const markAsWatched = async (payload) => {
  return API.post("/watched", payload);
};

export const getWatchedStatus = async (movieId) => {
  return API.get(`/watched/status/${movieId}`);
};

export const removeFromWatched = async (movieId) => {
  return API.delete(`/watched/${movieId}`);
};

export const moveBackToWatchlist = async (movieId) => {
  return API.post(`/watched-history/${movieId}/move-back`);
};
