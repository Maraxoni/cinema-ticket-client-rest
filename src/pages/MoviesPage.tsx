// src/components/MoviesPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Movie } from '../types/Movie';
import '../css/MoviesPage.css';

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      try {
        const response = await axios.get(`${baseUrl}/api/Movie`, {
        withCredentials: true
      });
        const data: Movie[] = response.data;
        setMovies(data);
      } catch (err: any) {
        setError(`Error loading films: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const getPosterSrc = (poster?: string | Uint8Array) => {
    if (!poster) return 'https://via.placeholder.com/150';
    if (typeof poster === 'string') {
      return poster.startsWith('data:') ? poster : `data:image/jpeg;base64,${poster}`;
    }
    return 'https://via.placeholder.com/150';
  };

  if (loading) return <p>Loading movies…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="movies-page">
      <h1>Movie list</h1>
      <div className="movie-list">
        {movies.map((m) => (
          <div key={m.movieID} className="movie-item">
            <div className="movie-poster">
              <img
                src={getPosterSrc(m?.poster)}
                alt={m.title || 'Poster'}
                className="poster-img"
              />
            </div>
            <div className="movie-info">
              <h2>{m.title}</h2>
              <p><strong>Director:</strong> {m.director}</p>
              <p><strong>Description:</strong> {m.description}</p>
              <p><strong>Actors:</strong> {Array.isArray(m.actors) ? m.actors.join(', ') : m.actors}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoviesPage;
