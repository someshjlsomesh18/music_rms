import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoadingSongs(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/songs`);
      if (!res.ok) throw new Error("Failed to fetch songs");
      const data = await res.json();
      setSongs(data);
      if (data.length > 0) {
        setSelectedSongId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load songs from backend. Is the FastAPI server running?");
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleRecommendClick = async () => {
    if (!selectedSongId) return;
    try {
      setLoadingRecs(true);
      setError("");
      const res = await fetch(
        `${API_BASE_URL}/recommendations?song_id=${selectedSongId}`
      );
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load recommendations. Check backend logs.");
    } finally {
      setLoadingRecs(false);
    }
  };

  const selectedSong = songs.find((s) => s.id === selectedSongId);

  return (
    <div className="app-container">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="title">🎵 Music Recommendation System</div>
            <div className="subtitle">
              Select a song from the left. The system recommends similar songs
              based on <b>genre, mood, and tempo</b>.
            </div>
          </div>
          <div className="badge">Full-stack • FastAPI + Next.js</div>
        </div>

        <div className="layout">
          {/* LEFT: Song List */}
          <div className="panel">
            <h2>Song Library</h2>
            <p>These songs are served from the FastAPI backend.</p>

            {loadingSongs && <div className="helper-text">Loading songs…</div>}

            <div className="song-list">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className={
                    "song-item" +
                    (song.id === selectedSongId ? " selected" : "")
                  }
                  onClick={() => setSelectedSongId(song.id)}
                >
                  <div className="song-title">
                    {song.title} • {song.artist}
                  </div>
                  <div className="song-meta">
                    #{song.id} · {song.genre}
                  </div>
                  <div className="badge-row">
                    <span className="meta-pill">Mood: {song.mood}</span>
                    <span className="meta-pill">Tempo: {song.tempo}</span>
                  </div>
                </div>
              ))}

              {!loadingSongs && songs.length === 0 && (
                <div className="empty-state">
                  No songs loaded. Check if backend is running.
                </div>
              )}
            </div>

            <div className="button-row">
              <button
                className="button button-primary"
                onClick={handleRecommendClick}
                disabled={!selectedSongId || loadingRecs}
              >
                {loadingRecs ? "Finding recommendations..." : "Recommend Similar"}
              </button>
              <button
                className="button button-outline"
                onClick={fetchSongs}
                disabled={loadingSongs}
              >
                Reload Songs
              </button>
            </div>

            {error && <div className="error">⚠ {error}</div>}
          </div>

          {/* RIGHT: Recommendation Panel */}
          <div className="panel">
            <div className="section-title">Recommendations</div>
            <div className="helper-text">
              Based on the selected song, the backend returns similar tracks.
            </div>

            {selectedSong && (
              <div style={{ marginBottom: "12px", fontSize: 13 }}>
                <div style={{ color: "#9ca3af" }}>Selected song:</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {selectedSong.title} • {selectedSong.artist}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  {selectedSong.genre} · Mood: {selectedSong.mood} · Tempo:{" "}
                  {selectedSong.tempo}
                </div>
              </div>
            )}

            {loadingRecs && (
              <div className="helper-text">Loading recommendations…</div>
            )}

            {!loadingRecs && recommendations.length === 0 && (
              <div className="empty-state">
                No recommendations yet. Select a song and click{" "}
                <b>“Recommend Similar”</b>.
              </div>
            )}

            <div className="song-list">
              {recommendations.map((song) => (
                <div key={song.id} className="song-item">
                  <div className="song-title">
                    {song.title} • {song.artist}
                  </div>
                  <div className="song-meta">
                    {song.genre} · Mood: {song.mood} · Tempo: {song.tempo}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, fontSize: 11, color: "#64748b" }}>
              💡 You can extend this by:
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                <li>Using real song data from a database or CSV</li>
                <li>Replacing the score with cosine similarity on audio features</li>
                <li>Connecting to Spotify or another music API</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
