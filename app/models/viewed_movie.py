from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ViewedMovie(Base):
    __tablename__ = "viewed_movies"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    movie_id = Column(
        String(255),
        nullable=False
    )

    movie_title = Column(
        String(255),
        nullable=False
    )

    poster = Column(
        String(500),
        nullable=True
    )

    genre = Column(String(100))

    imdb_rating = Column(String(50), nullable=True)

    viewed_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="viewed_movies"
    )