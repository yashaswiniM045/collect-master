from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.search_history import SearchHistory
from app.schemas.compare import CompareResponse
from app.services.notification_service import send_notification
from app.services.movie_service import (
    fetch_omdb_movie,
    get_review_stats,
    normalize_movie_details,
    build_comparison,
)

router = APIRouter(
    prefix="/movies",
    tags=["Movies"]
)


@router.get("/search")
def search_movies(
    query: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if not query.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "Invalid request"
            }
        )

    history = SearchHistory(
        user_id=current_user.id,
        keyword=query
    )

    db.add(history)
    db.commit()

    # =========================
    # CREATE NOTIFICATION
    # =========================
    send_notification(
        db=db,
        user_id=current_user.id,
        message=f'You searched for "{query}".',
        notification_type="search"
    )

    return {
        "success": True,
        "message": "Search saved",
        "keyword": query
    }


@router.get("/compare", response_model=CompareResponse)
def compare_movies(
    movie1: str,
    movie2: str,
    db: Session = Depends(get_db)
):
    if not movie1 or not movie2:
        raise HTTPException(
            status_code=400,
            detail="Both movie1 and movie2 query parameters are required."
        )

    if movie1 == movie2:
        raise HTTPException(
            status_code=400,
            detail="movie1 and movie2 must be different."
        )

    details1 = fetch_omdb_movie(movie1)
    details2 = fetch_omdb_movie(movie2)

    average_user_rating1, total_reviews1 = get_review_stats(db, movie1)
    average_user_rating2, total_reviews2 = get_review_stats(db, movie2)

    movie1_normalized = normalize_movie_details(
        details1,
        average_user_rating1,
        total_reviews1,
    )
    movie2_normalized = normalize_movie_details(
        details2,
        average_user_rating2,
        total_reviews2,
    )

    summary = build_comparison(movie1_normalized, movie2_normalized)

    return {
        "movie1": movie1_normalized,
        "movie2": movie2_normalized,
        "summary": summary,
    }
