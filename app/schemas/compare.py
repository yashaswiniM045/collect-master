from pydantic import BaseModel


class MovieCompareDetail(BaseModel):
    imdb_id: str
    title: str
    year: str
    genre: str
    runtime: str
    director: str
    cast: str
    plot: str
    imdb_rating: float
    poster: str
    average_user_rating: float
    total_reviews: int


class CompareSummaryItem(BaseModel):
    metric: str
    winner_title: str
    message: str


class CompareResponse(BaseModel):
    movie1: MovieCompareDetail
    movie2: MovieCompareDetail
    summary: list[CompareSummaryItem]
