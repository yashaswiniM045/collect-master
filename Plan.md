# Movie Comparison Feature — Implementation Guide

This document describes **what already exists** in the Collect repo and **exactly what you need to build** to complete the Movie Comparison assignment within the 2-day deadline.

---

## Table of Contents

1. [Current Codebase Snapshot](#1-current-codebase-snapshot)
2. [Feature Overview](#2-feature-overview)
3. [Architecture Decision](#3-architecture-decision)
4. [Day 1 — Backend + Selection UX](#4-day-1--backend--selection-ux)
5. [Day 2 — Compare Page + Polish + Submission](#5-day-2--compare-page--polish--submission)
6. [File Checklist](#6-file-checklist)
7. [API Contract](#7-api-contract)
8. [Testing Checklist](#8-testing-checklist)
9. [Submission Checklist](#9-submission-checklist)
10. [Optional Bonus Features](#10-optional-bonus-features)

---

## 1. Current Codebase Snapshot

| Area | What exists today | Gap for this task |
|------|-------------------|-------------------|
| **Backend** | FastAPI at `app/`, SQLite DB, routes under `/auth`, `/favorites`, `/reviews`, etc. | No `/movies/compare` endpoint |
| **Reviews** | `Review` model + `GET /reviews/average/{movie_id}` | Reuse for user rating + review count |
| **Movie data** | OMDb search called from **browser** in `Home.jsx` (title, year, poster only) | Full details (director, cast, plot, IMDb rating) need OMDb **detail** API |
| **Frontend** | React + Vite + React Router in `frontend/` | No compare state, button, or page |
| **Movie cards** | `MovieCard.jsx` used on Home + RecommendedMovies | No Compare button |
| **Routing** | `App.jsx` with protected routes via `ProtectedRoute` | No `/compare` route |
| **Styling** | Dark theme in `styles/global.css`, grid layout for cards | Need compare page responsive layout |

### Key files you will touch

```
app/
  routes/movies.py          ← add compare endpoint (currently only has /search)
  schemas/compare.py        ← NEW: response models
  services/movie_service.py ← NEW: OMDb fetch + review aggregation

frontend/src/
  App.jsx                   ← add /compare route
  components/MovieCard.jsx  ← add Compare button + selection callback
  pages/CompareMovies.jsx   ← NEW: comparison page
  pages/CompareMovies.css   ← NEW: responsive layout
  context/CompareContext.jsx← NEW: shared selection state (max 2)
  services/movieService.js  ← NEW: API call to /movies/compare
  components/CompareBar.jsx ← NEW (optional): sticky bar when 2 selected
  components/Sidebar.jsx    ← add Compare link (optional)
```

### Local dev setup

Follow [LOCAL_DEV.md](./LOCAL_DEV.md) to run:

- Backend: `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
- Frontend: `npm run dev` in `frontend/`
- Sample login: `karthik@gmail.com` / `123456`

---

## 2. Feature Overview

### User flow

```
Search/browse movies
       ↓
Click "Compare" on movie card (max 2)
       ↓
Navigate to /compare?movie1=tt123&movie2=tt456
       ↓
Page calls GET /movies/compare?movie1=...&movie2=...
       ↓
Side-by-side details + comparison summary
```

### Required comparison fields

| Field | Source |
|-------|--------|
| Poster, Title, Year, Genre, Runtime, Director, Cast, Plot, IMDb Rating | OMDb detail API (`i=<imdbID>`) |
| User Average Rating | Backend: average of `reviews.rating` |
| Total Reviews | Backend: count of rows in `reviews` for `movie_id` |

### Comparison summary rules

For each metric, highlight the better movie and show a message:

| Metric | Winner rule | Example message |
|--------|-------------|-----------------|
| IMDb rating | Higher numeric value | `"The Shawshank Redemption has a higher IMDb rating than The Godfather."` |
| User rating | Higher average | `"Movie A has a higher user rating than Movie B."` |
| Reviews | More total reviews | `"Movie A has more reviews than Movie B."` |

Handle ties explicitly (e.g. `"Both movies have the same IMDb rating."`).

---

## 3. Architecture Decision

### Where to fetch OMDb movie details?

**Recommended: backend fetches OMDb** inside `/movies/compare`.

Reasons:

- Assignment requires a backend API that returns full movie details.
- Keeps the OMDb API key off multiple frontend call sites.
- `requests` is already in `app/requirements.txt`.

The frontend search flow can stay as-is; only the compare page uses the new endpoint.

### Where to store selected movies?

**Recommended: React Context + URL query params.**

- Context (`CompareContext`) holds up to 2 selected movies while browsing.
- When navigating to `/compare`, pass IDs in the URL so the page is bookmarkable/shareable.
- Enforce the 2-movie limit in context before adding a third.

---

## 4. Day 1 — Backend + Selection UX

### Step 1 — Create Pydantic schemas

**File:** `app/schemas/compare.py`

Define models for:

- `MovieCompareDetail` — one movie with all display fields + `average_user_rating` + `total_reviews`
- `CompareSummaryItem` — `metric`, `winner_title`, `message`
- `CompareResponse` — `movie1`, `movie2`, `summary: list[CompareSummaryItem]`

Map OMDb field names to your schema:

| OMDb field | Your field |
|------------|------------|
| `Title` | `title` |
| `Year` | `year` |
| `Genre` | `genre` |
| `Runtime` | `runtime` |
| `Director` | `director` |
| `Actors` | `cast` |
| `imdbRating` | `imdb_rating` |
| `Plot` | `plot` |
| `Poster` | `poster` |

### Step 2 — Create movie service

**File:** `app/services/movie_service.py`

Implement:

```python
def fetch_omdb_movie(imdb_id: str) -> dict:
    # GET https://www.omdbapi.com/?apikey=...&i={imdb_id}
    # Raise HTTPException 404 if Response == "False"

def get_review_stats(db, movie_id: str) -> tuple[float, int]:
    # Query Review model — same logic as reviews.py average endpoint
    # Return (average_rating, total_count)

def build_comparison(movie1, movie2) -> list[dict]:
    # Compare imdb_rating, average_user_rating, total_reviews
    # Return summary messages
```

**Note:** Store the OMDb API key in an environment variable (e.g. `OMDB_API_KEY`) rather than hardcoding. The frontend currently uses key `8b2506ba` in `Home.jsx` — use the same key via env for local dev.

### Step 3 — Add compare endpoint

**File:** `app/routes/movies.py`

Add:

```
GET /movies/compare?movie1=<imdbID>&movie2=<imdbID>
```

Implementation steps:

1. Validate both query params are present and different.
2. Fetch OMDb details for each ID via `movie_service`.
3. Load review stats from DB for each ID.
4. Build comparison summary.
5. Return JSON (auth optional — existing `/reviews/average` is public; match that pattern).

Register nothing extra in `main.py` — `movies.router` is already included.

### Step 4 — Test backend

1. Start backend: `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
2. Open http://127.0.0.1:8000/docs
3. Test with real IMDb IDs, e.g. `tt0111161` (Shawshank) vs `tt0068646` (Godfather)
4. Add a few reviews via `POST /reviews/` first so user ratings are non-zero
5. Screenshot the Swagger response for submission

### Step 5 — Frontend compare context

**File:** `frontend/src/context/CompareContext.jsx`

Create a provider with:

```javascript
// State: selectedMovies (array, max length 2)
// Methods:
//   addToCompare(movie)   — reject if already 2 selected
//   removeFromCompare(id)
//   isSelected(id)
//   clearCompare()
```

Wrap the app in `CompareProvider` inside `App.jsx` (inside `BrowserRouter`).

Each movie object stored should include at minimum: `imdbID`, `title`, `poster`.

### Step 6 — Add Compare button to MovieCard

**File:** `frontend/src/components/MovieCard.jsx`

1. Import `useCompare` from context.
2. Add a **Compare** button next to existing actions.
3. On click:
   - If already selected → remove from compare.
   - If not selected and `< 2` movies → add.
   - If not selected and `=== 2` → show alert/toast: *"You can only compare 2 movies at a time."*
4. Visual state: add CSS class `compare-selected` when `isSelected(movieId)`.

**Props change:** MovieCard may need `imdbID` consistently — today it uses `movie.imdbID || movie.movie_id || movie.title`. Prefer always passing `imdbID` from parent pages.

### Step 7 — Compare navigation affordance

Choose one (or both):

**Option A — CompareBar component**

- Fixed bar at bottom: `"2 movies selected — Compare Now"`
- Button navigates to `/compare?movie1=X&movie2=Y`

**Option B — Sidebar link**

- Add `Link to="/compare"` in `Sidebar.jsx`
- Disable or show message if fewer than 2 selected

---

## 5. Day 2 — Compare Page + Polish + Submission

### Step 8 — Create movie service (frontend)

**File:** `frontend/src/services/movieService.js`

```javascript
import API from "./api";

export const compareMovies = async (movie1, movie2) => {
  const { data } = await API.get("/movies/compare", {
    params: { movie1, movie2 },
  });
  return data;
};
```

Ensure `api.js` uses `VITE_API_URL` per [LOCAL_DEV.md](./LOCAL_DEV.md) for local testing.

### Step 9 — Create Compare Movies page

**File:** `frontend/src/pages/CompareMovies.jsx`

1. Read `movie1` and `movie2` from URL: `useSearchParams()`.
2. If missing IDs → show empty state with link back to Home.
3. `useEffect` → call `compareMovies(movie1, movie2)`.
4. Loading / error states.
5. Layout:

```
┌─────────────────────────────────────────────┐
│  Compare Movies                             │
├──────────────────┬──────────────────────────┤
│  Movie 1 column  │  Movie 2 column        │  ← desktop: 2 columns
│  (poster, fields)│  (poster, fields)      │
├──────────────────┴──────────────────────────┤
│  Comparison Summary (bullet messages)       │
└─────────────────────────────────────────────┘
```

6. Highlight winning values (bold, green border, or badge — see bonus section).

**File:** `frontend/src/pages/CompareMovies.css`

Responsive rules:

```css
/* Desktop: two columns */
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* Mobile: stack */
@media (max-width: 768px) {
  .compare-grid {
    grid-template-columns: 1fr;
  }
}
```

Match existing dark theme colors from `global.css` (`#0f172a`, `#38bdf8`, `#111827`).

### Step 10 — Register route

**File:** `frontend/src/App.jsx`

```jsx
import CompareMovies from "./pages/CompareMovies";

<Route
  path="/compare"
  element={
    <ProtectedRoute>
      <CompareMovies />
    </ProtectedRoute>
  }
/>
```

Use the same layout pattern as Home (Sidebar + Navbar) for consistency.

### Step 11 — Comparison summary UI

Render the `summary` array from the API (or compute on frontend if API returns raw data only).

For each item, show:

- Metric label (IMDb Rating / User Rating / Total Reviews)
- Message string
- Optional: icon or color for winner

Example frontend-only summary (if backend returns movies only):

```javascript
function buildSummary(m1, m2) {
  const messages = [];
  // parse imdb_rating as float, compare, push message
  // compare average_user_rating
  // compare total_reviews
  return messages;
}
```

Either approach is fine; **backend-generated summary** is cleaner and easier to test via API screenshots.

### Step 12 — End-to-end manual test

1. Log in locally.
2. Search for two movies on Home.
3. Click Compare on each (verify 3rd is blocked).
4. Open `/compare` — verify all fields render.
5. Add reviews for one movie — verify user rating updates on refresh.
6. Resize browser — verify mobile stacked layout.
7. Capture screenshots for submission.

### Step 13 — Write implementation summary

Create a short `COMPARISON_FEATURE_SUMMARY.md` (or section in your PR description) covering:

- API endpoint design
- State management approach (Context)
- Comparison logic location (backend vs frontend)
- Responsive layout approach
- Known limitations (e.g. OMDb rate limits, N/A ratings)

---

## 6. File Checklist

Use this as a tick list while implementing.

### Backend

- [ ] `app/schemas/compare.py` — response models
- [ ] `app/services/movie_service.py` — OMDb + review stats + summary
- [ ] `app/routes/movies.py` — `GET /compare` endpoint
- [ ] Env var for OMDb key (optional `.env` + document in LOCAL_DEV.md)
- [ ] Tested in Swagger `/docs`

### Frontend

- [ ] `frontend/src/context/CompareContext.jsx`
- [ ] `App.jsx` — wrap provider + add route
- [ ] `MovieCard.jsx` — Compare button + 2-movie limit
- [ ] `CompareMovies.jsx` + `CompareMovies.css`
- [ ] `services/movieService.js`
- [ ] `CompareBar.jsx` or Sidebar link (navigation to compare page)
- [ ] Optional: update `Home.jsx` / `RecommendedMovies.jsx` if prop shape changes

---

## 7. API Contract

### Request

```
GET /movies/compare?movie1=tt0111161&movie2=tt0068646
```

| Param | Required | Description |
|-------|----------|-------------|
| `movie1` | Yes | IMDb ID (e.g. `tt0111161`) |
| `movie2` | Yes | IMDb ID |

### Success response (example shape)

```json
{
  "movie1": {
    "movie_id": "tt0111161",
    "title": "The Shawshank Redemption",
    "year": "1994",
    "genre": "Drama",
    "runtime": "142 min",
    "director": "Frank Darabont",
    "cast": "Tim Robbins, Morgan Freeman, ...",
    "imdb_rating": "9.3",
    "plot": "...",
    "poster": "https://...",
    "average_user_rating": 4.5,
    "total_reviews": 12
  },
  "movie2": {
    "movie_id": "tt0068646",
    "title": "The Godfather",
    "year": "1972",
    "genre": "Crime, Drama",
    "runtime": "175 min",
    "director": "Francis Ford Coppola",
    "cast": "Marlon Brando, Al Pacino, ...",
    "imdb_rating": "9.2",
    "plot": "...",
    "poster": "https://...",
    "average_user_rating": 4.8,
    "total_reviews": 20
  },
  "summary": [
    {
      "metric": "imdb_rating",
      "winner": "The Shawshank Redemption",
      "message": "The Shawshank Redemption has a higher IMDb rating than The Godfather."
    },
    {
      "metric": "user_rating",
      "winner": "The Godfather",
      "message": "The Godfather has a higher user rating than The Shawshank Redemption."
    },
    {
      "metric": "total_reviews",
      "winner": "The Godfather",
      "message": "The Godfather has more reviews than The Shawshank Redemption."
    }
  ]
}
```

### Error responses

| Status | When |
|--------|------|
| `400` | Missing `movie1`/`movie2`, same ID twice, invalid ID format |
| `404` | OMDb returns no movie for an ID |
| `502` | OMDb API unreachable (optional) |

---

## 8. Testing Checklist

### API testing (screenshot these)

- [ ] Valid compare request in Swagger — full JSON response
- [ ] Missing parameter — 400 error
- [ ] Invalid IMDb ID — 404 error
- [ ] Movies with zero reviews — `average_user_rating: 0`, `total_reviews: 0`

### UI testing (screenshot these)

- [ ] Movie card with Compare button
- [ ] Alert when selecting a 3rd movie
- [ ] Compare page desktop (two columns)
- [ ] Compare page mobile (stacked) — use DevTools device mode
- [ ] Comparison summary section with messages

### Regression

- [ ] Home search still works
- [ ] Favorites / watchlist / reviews still work
- [ ] Login flow unaffected

---

## 9. Submission Checklist

Deliverables from the assignment brief:

| Deliverable | How to produce |
|-------------|----------------|
| **GitHub repository link** | Push branch, open PR or share repo URL |
| **Screenshots of comparison page** | Desktop + mobile from Step 12 |
| **API testing screenshots** | Swagger `/docs` from Step 4 |
| **Brief implementation summary** | `COMPARISON_FEATURE_SUMMARY.md` or PR description |

### Evaluation alignment

| Criterion | What reviewers look for | Your implementation |
|-----------|-------------------------|---------------------|
| API Integration | Working `/movies/compare`, correct data | Backend OMDb + DB reviews |
| UI Design | Clean compare page, clear buttons | Match existing dark theme |
| Comparison Logic | Correct winner + messages | Backend `summary` array |
| Responsive Layout | 2-col desktop, stack mobile | CSS grid + media query |
| Code Quality | Separated service/context/page | Files listed in Section 6 |

---

## 10. Optional Bonus Features

Implement only after core requirements pass all tests.

### Compare up to 3 movies

- Change context limit to 3.
- Extend API: `movie3` query param or `ids=tt1,tt2,tt3`.
- Compare page: 3-column grid (collapse to 1 column on mobile).

### Highlight differences with colors

- Add CSS classes `.winner` (green) and `.loser` (muted) on rating cells.
- Apply when summary identifies a winner for that field.

### Export comparison as PDF

- Frontend: `jspdf` + `html2canvas`, or
- Backend: `fpdf2` (already present in local venv) — new endpoint `GET /movies/compare/pdf?...`

### Share comparison link

- URL already supports this if you use query params: `/compare?movie1=tt0111161&movie2=tt0068646`
- Add a **Copy Link** button on the compare page using `navigator.clipboard.writeText(window.location.href)`.

---

## Quick Reference — OMDb Detail API

The search API used in `Home.jsx` only returns brief results. For compare, fetch full details:

```
GET https://www.omdbapi.com/?apikey=YOUR_KEY&i=tt0111161
```

Relevant response fields: `Title`, `Year`, `Genre`, `Runtime`, `Director`, `Actors`, `imdbRating`, `Plot`, `Poster`.

Parse `imdbRating` as float for comparisons; treat `"N/A"` as `0` or exclude from winner logic with a tie message.

---

## Suggested 2-Day Schedule

| Day | Focus | Exit criteria |
|-----|-------|---------------|
| **Day 1 AM** | Backend schema, service, endpoint | Swagger test passes |
| **Day 1 PM** | CompareContext + MovieCard button + nav bar | Can select 2 movies, blocked at 3 |
| **Day 2 AM** | CompareMovies page + routing + API integration | Full page renders with real data |
| **Day 2 PM** | Responsive polish, screenshots, summary doc, push to GitHub | Submission ready |

---

*Generated for the Collect (`collect-master`) movie library project. See [LOCAL_DEV.md](./LOCAL_DEV.md) for environment setup.*
