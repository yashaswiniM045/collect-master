import API from "./api";

export const compareMovies = async (movie1, movie2) => {
  const response = await API.get("/movies/compare", {
    params: { movie1, movie2 },
  });
  return response.data;
};
