from sqlalchemy import text
from app.database import engine

def add_column_if_missing(table: str, column_def: str, column_name: str):
    """Add a column to a SQLite table if it doesn't already exist.

    column_def should be a SQL fragment like "movie_id VARCHAR(255)"
    column_name is the name to check in PRAGMA table_info results.
    """
    with engine.connect() as conn:
        res = conn.execute(text(f"PRAGMA table_info('{table}')")).fetchall()
        cols = [row[1] for row in res]
        if column_name not in cols:
            print(f"[migrations] adding column {column_name} to {table}")
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_def}"))
        else:
            print(f"[migrations] column {column_name} already present on {table}")


def ensure_viewed_movies():
    # Ensure movie_id exists (was missing in older DBs)
    add_column_if_missing("viewed_movies", "movie_id VARCHAR(255)", "movie_id")
    # Ensure poster, genre, imdb_rating, viewed_at columns exist
    add_column_if_missing("viewed_movies", "poster VARCHAR(500)", "poster")
    add_column_if_missing("viewed_movies", "genre VARCHAR(100)", "genre")
    add_column_if_missing("viewed_movies", "imdb_rating VARCHAR(50)", "imdb_rating")
    add_column_if_missing("viewed_movies", "viewed_at DATETIME", "viewed_at")


def ensure_watchlist():
    # Example: ensure any additional columns on watchlist if needed in future
    add_column_if_missing("watchlist", "movie_id VARCHAR(255)", "movie_id")


def run_all():
    print("Running development migrations...")
    try:
        ensure_viewed_movies()
    except Exception as e:
        print("[migrations] ensure_viewed_movies failed:", e)

    try:
        ensure_watchlist()
    except Exception as e:
        print("[migrations] ensure_watchlist failed:", e)

    print("Migrations complete.")


if __name__ == "__main__":
    run_all()
