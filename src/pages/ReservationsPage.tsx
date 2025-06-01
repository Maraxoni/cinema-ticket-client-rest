import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Reservation } from '../types/Reservation';
import { Screening } from '../types/Screening';
import { Movie } from '../types/Movie';
import jsPDF from 'jspdf';
import '../css/ReservationsPage.css';

interface EnrichedReservation extends Reservation {
  screening?: Screening;
  movie?: Movie;
}

const ReservationsPage: React.FC = () => {
  const { username } = useUser();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
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
          axios.get(`${baseUrl}/api/Reservation`, {
            params: { username },
            withCredentials: true,
          }),
          axios.get(`${baseUrl}/api/Screening`, { withCredentials: true }),
          axios.get(`${baseUrl}/api/Movie`, { withCredentials: true }),
        ]);

        console.log('Reservations raw data:', reservationsRes.data);
        console.log('Screenings raw data:', screeningsRes.data);
        console.log('Movies raw data:', moviesRes.data);

        const screeningsMap = new Map<number, Screening>(
          screeningsRes.data.map((s: Screening) => [s.screeningID, s])
        );
        const moviesMap = new Map<number, Movie>(
          moviesRes.data.map((m: Movie) => [m.movieID, m])
        );

        const enrichedReservations: EnrichedReservation[] = reservationsRes.data.map(
          (res: any) => {
            const screening = screeningsMap.get(res.screeningId);
            const movie = screening ? moviesMap.get(screening.movieID) : undefined;
            return {
              reservationId: res.reservationId,
              screeningId: res.screeningId,
              username: res.accountUsername, // z logów widzę, że jest accountUsername
              seats: res.reservedSeats ?? [], // tutaj poprawka!
              screening,
              movie,
            };
          }
        );

        console.log('Enriched reservations:', enrichedReservations);

        setReservations(enrichedReservations);
        setLoading(false);
      } catch (err: any) {
        setError('Error loading data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [username, navigate]);

  const handleDelete = async (reservationId: number) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      await axios.delete(`${baseUrl}/api/Reservation/${reservationId}`, { withCredentials: true });
      setReservations(prev => prev.filter(r => r.reservationId !== reservationId));
    } catch (err: any) {
      console.error('Error deleting reservation:', err.message);
      alert('Failed to delete reservation.');
    }
  };

  const handlePrint = (reservationId: number) => {
    const reservation = reservations.find(r => r.reservationId === reservationId);
    if (!reservation) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Cinema Ticket', 20, 20);

    doc.setFontSize(12);
    doc.text(`Reservation ID: ${reservation.reservationId}`, 20, 40);
    doc.text(`Movie: ${reservation.movie?.title ?? 'Unknown'}`, 20, 50);
    doc.text(
      `Date: ${new Date(reservation.screening?.startTime ?? '').toLocaleDateString('pl-PL')}`,
      20,
      60
    );
    doc.text(
      `Time: ${new Date(reservation.screening?.startTime ?? '').toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      20,
      70
    );

    const seatsText =
      reservation.seats && reservation.seats.length > 0
        ? reservation.seats.map(i => i + 1).join(', ')
        : 'None';
    doc.text(`Seats: ${seatsText}`, 20, 80);

    const usernameText = reservation.username ?? username ?? 'Unknown user';
    doc.text(`Username: ${usernameText}`, 20, 90);

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
        {reservations.map(res => (
          <div key={res.reservationId} className="reservation-item">
            <img
              src={getPosterSrc(res.movie?.poster)}
              alt={res.movie?.title || 'Poster'}
              className="poster-img"
            />
            <div className="reservation-info">
              <h2>{res.movie?.title || 'Unknown movie'}</h2>
              {res.screening?.startTime ? (
                <>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(res.screening.startTime).toLocaleDateString('pl-PL')}
                  </p>
                  <p>
                    <strong>Start time:</strong>{' '}
                    {new Date(res.screening.startTime).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </>
              ) : (
                <p>
                  <strong>Start:</strong> No data
                </p>
              )}
              <p>
                <strong>Seats:</strong>{' '}
                {res.seats ? res.seats.map(i => i + 1).join(', ') : 'None'}
              </p>
              <button onClick={() => handleDelete(res.reservationId)}>Delete reservation</button>
              <button
                onClick={() =>
                  navigate('/edit-reservation', {
                    state: {
                      screening: res.screening,
                      reservationId: res.reservationId,
                      seats: res.seats,
                    },
                  })
                }
              >
                Edit reservation
              </button>
              <button onClick={() => handlePrint(res.reservationId)}>Print reservation</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReservationsPage;
