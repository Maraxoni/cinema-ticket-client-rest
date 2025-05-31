import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Reservation } from '../types/Reservation';
import { Screening } from '../types/Screening';
import { Movie } from '../types/Movie';
import jsPDF from 'jspdf';
import '../css/ReservationsPage.css';

const ReservationsPage: React.FC = () => {
  const { username } = useUser();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL;

        const [reservationsRes, screeningsRes, moviesRes] = await Promise.all([
          axios.get(`${baseUrl}/api/Reservation`, { withCredentials: true }),
          axios.get(`${baseUrl}/api/Screening`, { withCredentials: true }),
          axios.get(`${baseUrl}/api/Movie`, { withCredentials: true }),
        ]);

        const reservationsData: Reservation[] = reservationsRes.data;
        const screeningsData: Screening[] = screeningsRes.data;
        const moviesData: Movie[] = moviesRes.data;

        setReservations(reservationsData.filter(r => r.username === username));
        setScreenings(screeningsData);
        setMovies(moviesData);
      } catch (err: any) {
        setError('Error loading data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, navigate]);

  const getScreeningById = (id: number) => screenings.find(s => s.screeningID === id);
  const getMovieById = (id: number) => movies.find(m => m.movieID === id);

  const handleDelete = async (reservationId: number) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      await axios.delete(`${baseUrl}/api/reservations/${reservationId}`, { withCredentials: true });
      setReservations(prev => prev.filter(r => r.reservationId !== reservationId));
    } catch (err: any) {
      console.error('Error deleting reservation:', err.message);
      alert('Failed to delete reservation.');
    }
  };

  const handlePrint = (reservationId: number) => {
    const reservation = reservations.find(r => r.reservationId === reservationId);
    if (!reservation) return;

    const screening = getScreeningById(reservation.screeningId);
    const movie = screening ? getMovieById(screening.movieID) : undefined;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Cinema Ticket', 20, 20);

    doc.setFontSize(12);
    doc.text(`Reservation ID: ${reservation.reservationId}`, 20, 40);
    doc.text(`Movie: ${movie?.title ?? 'Unknown'}`, 20, 50);
    doc.text(`Date: ${new Date(screening?.startTime ?? '').toLocaleDateString('pl-PL')}`, 20, 60);
    doc.text(`Time: ${new Date(screening?.startTime ?? '').toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`, 20, 70);
    doc.text(`Seats: ${reservation.seats?.map(i => i + 1).join(', ')}`, 20, 80);
    doc.text(`Username: ${reservation.username}`, 20, 90);

    doc.save(`ticket-${reservation.reservationId}.pdf`);
  };

  const getPosterSrc = (poster?: string | Uint8Array) => {
    if (!poster) return 'https://via.placeholder.com/150';
    if (typeof poster === 'string') {
      return poster.startsWith('data:') ? poster : `data:image/jpeg;base64,${poster}`;
    }
    return 'https://via.placeholder.com/150';
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="reservations-page">
      <h1>Your reservations</h1>
      <div className="reservation-list">
        {reservations.map(res => {
          const screening = getScreeningById(res.screeningId);
          const movie = screening ? getMovieById(screening.movieID) : undefined;

          return (
            <div key={res.reservationId} className="reservation-item">
              <img
                src={getPosterSrc(movie?.poster)}
                alt={movie?.title || 'Poster'}
                className="poster-img"
              />
              <div className="reservation-info">
                <h2>{movie?.title || 'Unknown movie'}</h2>
                {screening?.startTime ? (
                  <>
                    <p><strong>Date:</strong> {new Date(screening.startTime).toLocaleDateString('pl-PL')}</p>
                    <p><strong>Start time:</strong> {new Date(screening.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</p>
                  </>
                ) : (
                  <p><strong>Start:</strong> No data</p>
                )}
                <p><strong>Seats:</strong> {res.seats ? res.seats.map(i => i + 1).join(', ') : 'None'}</p>
                <button onClick={() => handleDelete(res.reservationId)}>
                  Delete reservation
                </button>
                <button onClick={() => navigate('/edit-reservation', {
                  state: {
                    screening,
                    reservationId: res.reservationId,
                    reservedSeats: res.seats
                  }
                })}>
                  Edit reservation
                </button>
                <button onClick={() => handlePrint(res.reservationId)}>
                  Print reservation
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReservationsPage;
