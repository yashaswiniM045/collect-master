from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.viewed_movie import ViewedMovie
from app.models.watchlist import Watchlist

router = APIRouter(prefix="/watched-history", tags=["Watched History"])


@router.get("")
def get_watched_history(
    genre: str | None = Query(default=None),
    sortBy: str = "watchedDate",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(ViewedMovie).filter(ViewedMovie.user_id == current_user.id)

    if genre:
        query = query.filter(ViewedMovie.genre == genre)

    if sortBy == "title":
        order_column = ViewedMovie.movie_title
    else:
        order_column = ViewedMovie.viewed_at

    if order == "asc":
        query = query.order_by(order_column.asc())
    else:
        query = query.order_by(order_column.desc())

    movies = query.all()
    payload = []
    for movie in movies:
        payload.append(
            {
                "id": movie.id,
                "movieId": movie.movie_id,
                "title": movie.movie_title,
                "poster": movie.poster,
                "genre": movie.genre.split(",") if movie.genre else [],
                "imdbRating": movie.imdb_rating,
                "watchedDate": movie.viewed_at.isoformat() if movie.viewed_at else None,
                "userId": current_user.id,
            }
        )

    return payload


@router.delete("/{movie_id}")
def remove_from_watched_history(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    movie = (
        db.query(ViewedMovie)
        .filter(ViewedMovie.id == movie_id, ViewedMovie.user_id == current_user.id)
        .first()
    )
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found in watched history")

    db.delete(movie)
    db.commit()
    return {"success": True, "message": "Removed from watched history"}


@router.post("/{movie_id}/move-back")
def move_back_to_watchlist(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    movie = (
        db.query(ViewedMovie)
        .filter(ViewedMovie.id == movie_id, ViewedMovie.user_id == current_user.id)
        .first()
    )
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found in watched history")

    existing = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id, Watchlist.movie_id == movie.movie_id)
        .first()
    )
    if not existing:
        db.add(
            Watchlist(
                user_id=current_user.id,
                movie_id=movie.movie_id,
                movie_title=movie.movie_title,
                genre=movie.genre,
                poster=movie.poster,
            )
        )

    db.delete(movie)
    db.commit()
    return {"success": True, "message": "Moved to watchlist"}
