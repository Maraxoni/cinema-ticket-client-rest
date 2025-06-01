
// ReservationEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Screening } from '../types/Screening';
import '../css/ReservationPage.css';

const ReservationEditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useUser();

  const screening: Screening | undefined = location.state?.screening;
  const reservationId: number | undefined = location.state?.reservationId;
  const reservedSeats: number[] = location.state?.reservedSeats || [];

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  useEffect(() => {
    if (!screening || reservationId === undefined) {
      navigate('/reservations');
    } else {
      setSelectedSeats(reservedSeats);
    }
  }, [screening, reservationId, reservedSeats, navigate]);

  if (!screening || reservationId === undefined) return null;

  const seatsArray: boolean[] = Array.isArray(screening.availableSeats)
    ? screening.availableSeats
    : [];

  const handleSeatClick = (index: number) => {
    const isAvailable = seatsArray[index];
    const isPreviouslyReserved = reservedSeats.includes(index);

    if (!isAvailable && !isPreviouslyReserved) return;

    setSelectedSeats(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleEdit = async () => {
    if (!username) {
      navigate('/login');
      return;
    }

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      await axios.put(`${baseUrl}/api/reservation/${reservationId}`, {
        screeningId: screening.screeningID,
        accountUsername: username,
        reservedSeats: selectedSeats
      }, { withCredentials: true });

      alert('Reservation updated successfully.');
      navigate('/reservations');
    } catch (err: any) {
      console.error(err);
      alert(`Error during reservation update: ${err.message}`);
    }
  };

  return (
    <div className="reservation-page">
      <h1>Edit reservation</h1>
      <div className="seats-container">
        {seatsArray.map((isAvailable, index) => {
          const isPreviouslyReserved = reservedSeats.includes(index);
          const isSelectable = isAvailable || isPreviouslyReserved;

          return (
            <button
              key={index}
              className={[
                'seat',
                isAvailable ? 'available' : isPreviouslyReserved ? 'reserved-by-user' : 'unavailable',
                selectedSeats.includes(index) ? 'selected' : ''
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
        Save changes ({selectedSeats.length})
      </button>
    </div>
  );
};

export default ReservationEditPage;
