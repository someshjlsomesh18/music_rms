from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Allow your Next.js frontend (localhost:3000) to call this API
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Song(BaseModel):
    id: int
    title: str
    artist: str
    genre: str
    mood: str
    tempo: str   # "slow" | "medium" | "fast"

# Simple in-memory "database"
songs_db: List[Song] = [
    Song(id=1, title="Calm Waves", artist="Oceanic Vibes", genre="Ambient", mood="Calm", tempo="slow"),
    Song(id=2, title="Night Drive", artist="Synth City", genre="Electronic", mood="Chill", tempo="medium"),
    Song(id=3, title="Thunder Run", artist="Rockers", genre="Rock", mood="Energetic", tempo="fast"),
    Song(id=4, title="Soft Piano", artist="Relax Keys", genre="Classical", mood="Calm", tempo="slow"),
    Song(id=5, title="Club Lights", artist="DJ Pulse", genre="Electronic", mood="Energetic", tempo="fast"),
    Song(id=6, title="Coffee Break", artist="LoFi Beats", genre="Lo-fi", mood="Chill", tempo="medium"),
    Song(id=7, title="Epic Battle", artist="Orchestra X", genre="Orchestral", mood="Epic", tempo="fast"),
    Song(id=8, title="Rainy Window", artist="LoFi Dreams", genre="Lo-fi", mood="Sad", tempo="slow"),
    Song(id=9, title="Sunrise Walk", artist="Acoustic Soul", genre="Acoustic", mood="Happy", tempo="medium"),
    Song(id=10, title="Midnight Jazz", artist="Blue Notes", genre="Jazz", mood="Chill", tempo="slow"),
]

def find_song(song_id: int) -> Song:
    for song in songs_db:
        if song.id == song_id:
            return song
    raise HTTPException(status_code=404, detail="Song not found")

def similarity_score(base: Song, other: Song) -> int:
    """
    Simple similarity:
      +2 if same genre
      +1 if same mood
      +1 if same tempo
    """
    score = 0
    if base.genre == other.genre:
        score += 2
    if base.mood == other.mood:
        score += 1
    if base.tempo == other.tempo:
        score += 1
    return score

@app.get("/")
def root():
    return {"message": "Music Recommender API is running"}

@app.get("/songs", response_model=List[Song])
def get_songs():
    return songs_db

@app.get("/songs/{song_id}", response_model=Song)
def get_song_by_id(song_id: int):
    return find_song(song_id)

@app.get("/recommendations", response_model=List[Song])
def get_recommendations(song_id: int, limit: int = 5):
    base_song = find_song(song_id)

    scored_songs = []
    for song in songs_db:
        if song.id == base_song.id:
            continue
        score = similarity_score(base_song, song)
        scored_songs.append((score, song))

    # Sort by score (highest first), then by id
    scored_songs.sort(key=lambda x: (-x[0], x[1].id))

    recommendations = [song for score, song in scored_songs if score > 0][:limit]

    # If nothing similar, just return some other songs
    if not recommendations:
        recommendations = [song for song in songs_db if song.id != base_song.id][:limit]

    return recommendations
