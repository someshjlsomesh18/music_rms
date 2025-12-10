from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import csv
from pathlib import Path

app = FastAPI()

# Allow all origins so the HTML file opened from disk can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # simple for local project
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------

class Song(BaseModel):
    id: int
    title: str
    artist: str
    genre: str
    mood: str
    tempo: str
    language: str
    audio_url: str
    cover_url: str


# ---------- Load songs from CSV ----------

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "songs.csv"

def load_songs_from_csv() -> List[Song]:
    if not CSV_PATH.exists():
        raise RuntimeError(f"songs.csv not found at {CSV_PATH}")

    songs: List[Song] = []
    with CSV_PATH.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Fallbacks for empty fields
            audio_url = row.get("audio_url") or "https://samplelib.com/lib/preview/mp3/sample-3s.mp3"
            cover_url = row.get("cover_url") or "https://picsum.photos/seed/default/200/200"

            song = Song(
                id=int(row["id"]),
                title=row["title"],
                artist=row["artist"],
                genre=row["genre"],
                mood=row["mood"],
                tempo=row["tempo"],
                language=row.get("language", "Unknown"),
                audio_url=audio_url,
                cover_url=cover_url,
            )
            songs.append(song)
    return songs

# Load once at startup
songs_db: List[Song] = load_songs_from_csv()


# ---------- Helper functions ----------

def find_song(song_id: int) -> Song:
    for song in songs_db:
        if song.id == song_id:
            return song
    raise HTTPException(status_code=404, detail="Song not found")

def similarity_score(base: Song, other: Song) -> int:
    """
    Very simple similarity:
    +2 same genre
    +1 same mood
    +1 same tempo
    +1 same language
    """
    score = 0
    if base.genre.lower() == other.genre.lower():
        score += 2
    if base.mood.lower() == other.mood.lower():
        score += 1
    if base.tempo.lower() == other.tempo.lower():
        score += 1
    if base.language.lower() == other.language.lower():
        score += 1
    return score


# ---------- API endpoints ----------

@app.get("/")
def root():
    return {"message": "Music Recommender API running", "total_songs": len(songs_db)}

@app.get("/songs", response_model=List[Song])
def get_songs():
    return songs_db

@app.get("/songs/{song_id}", response_model=Song)
def get_song_by_id(song_id: int):
    return find_song(song_id)

@app.get("/recommendations", response_model=List[Song])
def get_recommendations(song_id: int, limit: int = 5):
    base_song = find_song(song_id)

    scored = []
    for song in songs_db:
        if song.id == base_song.id:
            continue
        score = similarity_score(base_song, song)
        scored.append((score, song))

    # Sort by score (high to low), then by id
    scored.sort(key=lambda x: (-x[0], x[1].id))

    # Take songs with positive score, else fall back
    recommendations = [song for score, song in scored if score > 0][:limit]

    if not recommendations:
        recommendations = [song for song in songs_db if song.id != base_song.id][:limit]

    return recommendations
