import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../css/ReservationPage.css';

interface Screening {
  screeningID: number;
  availableSeats: boolean[]; // lub inny typ, dostosuj do API
  // inne pola...
}

const ReservationEditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useUser();

  const reservationId: number | undefined = location.state?.reservationId;
  if (!reservationId) {
    navigate('/reservations');
  }

  const [screening, setScreening] = useState<Screening | null>(null);
  const [reservedSeats, setReservedSeats] = useState<number[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username || !reservationId) {
      navigate('/login');
      return;
    }

    const baseUrl = process.env.REACT_APP_API_BASE_URL;

    const fetchReservation = async () => {
      try {
        // Pobierz rezerwację (zawierającą seats i screeningId)
        const resRes = await axios.get(`${baseUrl}/api/Reservation/${reservationId}`, {
          withCredentials: true,
        });
        const reservation = resRes.data;
        setReservedSeats(reservation.reservedSeats ?? []);

        // Pobierz dane screening (z dostępnością miejsc)
        const screeningRes = await axios.get(`${baseUrl}/api/Screening/${reservation.screeningId}`, {
          withCredentials: true,
        });
        setScreening(screeningRes.data);

        // Ustaw początkowo selectedSeats na obecne zarezerwowane
        setSelectedSeats(reservation.reservedSeats ?? []);

        setLoading(false);
      } catch (err: any) {
        setError('Failed to load reservation data: ' + err.message);
        setLoading(false);
      }
    };

    fetchReservation();
  }, [username, reservationId, navigate]);

  if (loading) return <p>Loading reservation data...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!screening) return <p>Screening data not found</p>;

  const seatsArray = screening.availableSeats ?? [];

  const handleSeatClick = (index: number) => {
    const isAvailable = seatsArray[index];
    const isPreviouslyReserved = reservedSeats.includes(index);

    // Miejsce musi być dostępne lub wcześniej zarezerwowane, żeby można było zmieniać
    if (!isAvailable && !isPreviouslyReserved) return;

    setSelectedSeats(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleEdit = async () => {
    if (!username || !reservationId || !screening) {
      navigate('/login');
      return;
    }

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;

      // PUT update reservation z REST API
      await axios.put(
        `${baseUrl}/api/Reservation/${reservationId}`,
        {
          screeningId: screening.screeningID,
          AccountUsername: username,
          reservedSeats: selectedSeats,
        },
        { withCredentials: true }
      );

      alert('Reservation updated successfully');
      navigate('/reservations');
    } catch (err: any) {
      console.error('Error updating reservation:', err.message);
      alert('Failed to update reservation');
    }
  };

  return (
    <div className="reservation-page">
      <h1>Edit Reservation</h1>
      <div className="seats-container">
        {seatsArray.map((isAvailable, index) => {
          const isPreviouslyReserved = reservedSeats.includes(index);
          const isSelected = selectedSeats.includes(index);
          const isSelectable = isAvailable || isPreviouslyReserved;

          return (
            <button
              key={index}
              className={[
                'seat',
                isAvailable ? 'available' : isPreviouslyReserved ? 'reserved-by-user' : 'unavailable',
                isSelected ? 'selected' : '',
              ].join(' ')}
              onClick={() => handleSeatClick(index)}
              disabled={!isSelectable}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <button
        className="reserve-button"
        onClick={handleEdit}
        disabled={selectedSeats.length === 0}
      >
        Save Changes ({selectedSeats.length})
      </button>
    </div>
  );
};

export default ReservationEditPage;
