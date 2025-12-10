import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoadingSongs(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/songs`);
      const data = await res.json();
      setSongs(data);
      if (data.length > 0) setSelectedSongId(data[0].id);
    } catch (err) {
      setError("Failed to load songs. Check if backend is running.");
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleRecommend = async () => {
    if (!selectedSongId) return;
    try {
      setLoadingRecs(true);
      const res = await fetch(`${API_BASE_URL}/recommendations?song_id=${selectedSongId}`);
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      setError("Failed to load recommendations.");
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", background: "#111", minHeight: "100vh", color: "#fff" }}>
      <h1>🎵 Music Recommendation System</h1>
      <p>FastAPI + Next.js</p>

      {/* Song List */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        
        {/* LEFT SIDE */}
        <div style={{ width: "40%", background: "#222", padding: "15px", borderRadius: "8px" }}>
          <h2>Songs</h2>

          {loadingSongs && <p>Loading songs…</p>}

          {songs.map((song) => (
            <div
              key={song.id}
              style={{
                padding: "10px",
                margin: "8px 0",
                borderRadius: "5px",
                background: selectedSongId === song.id ? "#444" : "#333",
                cursor: "pointer",
              }}
              onClick={() => setSelectedSongId(song.id)}
            >
              <strong>{song.title}</strong> — {song.artist}
              <br />
              <small>{song.genre} | {song.mood} | {song.tempo}</small>
            </div>
          ))}

          <button
            onClick={handleRecommend}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "green",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {loadingRecs ? "Loading..." : "Get Recommendations"}
          </button>

        </div>

        {/* RIGHT SIDE */}
        <div style={{ width: "60%", background: "#222", padding: "15px", borderRadius: "8px" }}>
          <h2>Recommendations</h2>

          {recommendations.length === 0 && <p>No recommendations yet.</p>}

          {recommendations.map((song) => (
            <div key={song.id} style={{ padding: "10px", background: "#333", marginBottom: "10px", borderRadius: "5px" }}>
              <strong>{song.title}</strong> — {song.artist}
              <br />
              <small>{song.genre} | {song.mood} | {song.tempo}</small>
            </div>
          ))}
        </div>
      </div>

      {error && <p style={{ color: "red", marginTop: "20px" }}>⚠ {error}</p>}
    </div>
  );
}
