import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Screening } from '../types/Screening';
import { Movie } from '../types/Movie';
import '../css/ScreeningsPage.css';

const ScreeningsPage: React.FC = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL;
        const [screeningsRes, moviesRes] = await Promise.all([
          axios.get(`${baseUrl}/api/Screening`, { withCredentials: true }),
          axios.get(`${baseUrl}/api/Movie`, { withCredentials: true }),
        ]);

        setScreenings(screeningsRes.data);
        setMovies(moviesRes.data);
      } catch (err: any) {
        setError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPosterSrc = (poster?: string | Uint8Array) => {
    if (!poster) return 'https://via.placeholder.com/150';
    if (typeof poster === 'string') {
      return poster.startsWith('data:') ? poster : `data:image/jpeg;base64,${poster}`;
    }
    return 'https://via.placeholder.com/150';
  };

  const getMovieById = (id: number) => movies.find((m) => m.movieID === id);

  if (loading) return <p>Loading screenings…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="screenings-page">
      <h1>Screening List</h1>
      <div className="screening-list">
        {screenings.map((screening) => {
          const movie = getMovieById(screening.movieID);

          if (!movie) {
            console.warn(`Movie not found for movieID=${screening.movieID}`);
            return null;
          }

          return (
            <div key={screening.screeningID} className="screening-item">
              <img
                src={getPosterSrc(movie.poster)}
                alt={movie.title || 'Poster'}
                className="poster-img"
              />
              <div className="screening-info">
                <h2>{movie.title || 'Unknown Movie'}</h2>
                <p><strong>Date:</strong> {new Date(screening.startTime).toLocaleDateString()}</p>
                <p><strong>Start time:</strong> {new Date(screening.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>End time:</strong> {new Date(screening.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <button onClick={() => navigate('/reservation', { state: { screening } })}>
                  Reserve Seats
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScreeningsPage;
