import os

import requests
from fastapi import HTTPException

from app.models.review import Review

OMDB_API_KEY = os.getenv("OMDB_API_KEY", "8b2506ba")
OMDB_BASE_URL = "https://www.omdbapi.com/"


def fetch_omdb_movie(imdb_id: str) -> dict:
    try:
        response = requests.get(
            OMDB_BASE_URL,
            params={"apikey": OMDB_API_KEY, "i": imdb_id},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=503,
            detail="Failed to fetch movie details from OMDb"
        ) from exc

    data = response.json()
    if data.get("Response") == "False":
        raise HTTPException(
            status_code=404,
            detail=data.get("Error", "Movie not found")
        )

    return data


def get_review_stats(db, movie_id: str) -> tuple[float, int]:
    reviews = db.query(Review).filter(Review.movie_id == movie_id).all()

    if not reviews:
        return 0.0, 0

    average_rating = sum(review.rating for review in reviews) / len(reviews)
    return round(average_rating, 1), len(reviews)


def normalize_movie_details(movie_data: dict, average_user_rating: float, total_reviews: int) -> dict:
    try:
        imdb_rating = float(movie_data.get("imdbRating", "0"))
    except (ValueError, TypeError):
        imdb_rating = 0.0

    return {
        "imdb_id": movie_data.get("imdbID", ""),
        "title": movie_data.get("Title", ""),
        "year": movie_data.get("Year", ""),
        "genre": movie_data.get("Genre", ""),
        "runtime": movie_data.get("Runtime", ""),
        "director": movie_data.get("Director", ""),
        "cast": movie_data.get("Actors", ""),
        "plot": movie_data.get("Plot", ""),
        "imdb_rating": imdb_rating,
        "poster": movie_data.get("Poster", ""),
        "average_user_rating": average_user_rating,
        "total_reviews": total_reviews,
    }


def build_comparison(movie1: dict, movie2: dict) -> list[dict]:
    summary = []

    def compare_values(key, label, formatter=str):
        value1 = movie1.get(key, 0)
        value2 = movie2.get(key, 0)

        if value1 == value2:
            message = f"Both movies have the same {label}."
            winner_title = "Tie"
        elif value1 > value2:
            message = f"{movie1['title']} has a higher {label} than {movie2['title']}."
            winner_title = movie1["title"]
        else:
            message = f"{movie2['title']} has a higher {label} than {movie1['title']}."
            winner_title = movie2["title"]

        if label == "IMDb rating":
            message = message if value1 != value2 else "Both movies have the same IMDb rating."
        elif label == "user rating":
            message = message if value1 != value2 else "Both movies have the same user rating."
        elif label == "total reviews":
            message = (
                f"Both movies have the same number of reviews."
                if value1 == value2
                else message
            )

        return {
            "metric": label,
            "winner_title": winner_title,
            "message": message,
        }

    summary.append(compare_values("imdb_rating", "IMDb rating"))
    summary.append(compare_values("average_user_rating", "user rating"))
    summary.append(compare_values("total_reviews", "total reviews"))

    return summary
