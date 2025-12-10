import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class MusicRecommender:
    def __init__(self, csv_path: str):
        self.df = self._load_data(csv_path)
        self.similarity_matrix = self._build_similarity_matrix(self.df)

    def _load_data(self, csv_path: str) -> pd.DataFrame:
        df = pd.read_csv(csv_path)
        df["artist"] = df["artist"].fillna("")
        df["genre"] = df["genre"].fillna("")
        return df.reset_index(drop=True)

    def _build_similarity_matrix(self, df: pd.DataFrame):
        df["combined_text"] = df["artist"] + " " + df["genre"]
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(df["combined_text"])
        similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
        return similarity_matrix

    def recommend(self, song_title: str, n_recommendations: int = 5):
        # Find song index
        matches = self.df[self.df["title"].str.lower() == song_title.lower()]

        if matches.empty:
            return []

        idx = matches.index[0]
        sim_scores = list(enumerate(self.similarity_matrix[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        # skip the song itself
        sim_scores = sim_scores[1 : n_recommendations + 1]
        song_indices = [i for i, _ in sim_scores]

        results = self.df.iloc[song_indices][
            ["title", "artist", "genre", "popularity"]
        ]

        # Convert to list of dict for API
        return [
            {
                "title": row["title"],
                "artist": row["artist"],
                "genre": row["genre"],
                "popularity": int(row["popularity"]),
            }
            for _, row in results.iterrows()
        ]
