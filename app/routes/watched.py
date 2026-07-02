from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.viewed_movie import ViewedMovie
from app.models.watchlist import Watchlist

router = APIRouter(prefix="/watched", tags=["Watched"])


@router.post("")
def mark_as_watched(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    request: Request = None,
):
    # Debug: log incoming Authorization header for troubleshooting 401s
    try:
        auth_hdr = request.headers.get("authorization") if request is not None else None
        print(f"[watched.mark_as_watched] Authorization header: {auth_hdr}")
    except Exception:
        pass

    try:
        movie_id = payload.get("movieId")
        title = payload.get("title")

        if not movie_id or not title:
            raise HTTPException(status_code=400, detail="movieId and title are required")

        existing = (
            db.query(ViewedMovie)
            .filter(ViewedMovie.user_id == current_user.id, ViewedMovie.movie_id == str(movie_id))
            .first()
        )

        if existing:
            return {"success": True, "message": "Already marked as watched"}

        # Normalize genre: accept list or comma/string and store as comma-separated string
        raw_genre = payload.get("genre")
        if isinstance(raw_genre, (list, tuple)):
            genre_str = ",".join([str(g) for g in raw_genre])
        else:
            genre_str = raw_genre if raw_genre is not None else None

        watched_movie = ViewedMovie(
            user_id=current_user.id,
            movie_id=str(movie_id),
            movie_title=title,
            poster=payload.get("poster"),
            genre=genre_str,
            imdb_rating=payload.get("imdbRating"),
        )
        db.add(watched_movie)

        watchlist_item = (
            db.query(Watchlist)
            .filter(Watchlist.user_id == current_user.id, Watchlist.movie_id == str(movie_id))
            .first()
        )
        if watchlist_item:
            db.delete(watchlist_item)

        db.commit()
        db.refresh(watched_movie)

        return {
            "success": True,
            "message": "Marked as watched",
            "movieId": watched_movie.id,
        }
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def get_watched_movies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    movies = (
        db.query(ViewedMovie)
        .filter(ViewedMovie.user_id == current_user.id)
        .order_by(ViewedMovie.viewed_at.desc())
        .all()
    )

    return [
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
        for movie in movies
    ]


@router.delete("/{movie_id}")
def remove_from_watched(
    movie_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Allow deleting by DB id or by external movie_id (e.g., imdb id)
    movie = None

    # Try interpreting movie_id as DB primary key
    try:
        possible_id = int(movie_id)
    except Exception:
        possible_id = None

    if possible_id is not None:
        movie = (
            db.query(ViewedMovie)
            .filter(ViewedMovie.id == possible_id, ViewedMovie.user_id == current_user.id)
            .first()
        )

    # Fallback: try matching on the external movie_id string
    if movie is None:
        movie = (
            db.query(ViewedMovie)
            .filter(ViewedMovie.movie_id == str(movie_id), ViewedMovie.user_id == current_user.id)
            .first()
        )

    if not movie:
        raise HTTPException(status_code=404, detail="Watched movie not found")

    db.delete(movie)
    db.commit()
    return {"success": True, "message": "Removed from watched history"}


@router.get("/status/{movie_id}")
def watched_status(
    movie_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    movie = (
        db.query(ViewedMovie)
        .filter(ViewedMovie.movie_id == str(movie_id), ViewedMovie.user_id == current_user.id)
        .first()
    )

    return {"watched": bool(movie)}
