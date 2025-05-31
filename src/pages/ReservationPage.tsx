import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Screening } from '../types/Screening';
import '../css/ReservationPage.css';

const ReservationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useUser();
  const screening: Screening | undefined = location.state?.screening;

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  useEffect(() => {
    if (!screening) navigate('/screenings');
  }, [screening, navigate]);

  if (!screening) return null;

  // Zakładam, że screening.availableSeats to boolean[] oznaczające dostępność miejsc
  const seatsArray: boolean[] = Array.isArray(screening.availableSeats)
    ? screening.availableSeats
    : [];

  const handleSeatClick = (index: number) => {
    if (!seatsArray[index]) return; // niedostępne
    setSelectedSeats(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleReserve = async () => {
    if (!username) {
      navigate('/login');
      return;
    }

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;

      // REST API: POST /api/reservations
      // Przykładowy body:
      // {
      //   screeningId: number,
      //   username: string,
      //   reservedSeats: number[]
      // }

      const response = await fetch(`${baseUrl}/api/reservations`, {
        method: 'POST',
        credentials: 'include', // wysyła credentials (cookie)
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          screeningId: screening.screeningID,
          username,
          reservedSeats: selectedSeats
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Reservation failed: ${response.status} ${errorText}`);
      }

      alert('Rezerwacja przebiegła pomyślnie.');
      navigate('/screenings');
    } catch (err: any) {
      console.error(err);
      alert(`Błąd przy wysyłce rezerwacji: ${err.message}`);
    }
  };

  return (
    <div className="reservation-page">
      <h1>Choose seats</h1>
      <div className="seats-container">
        {seatsArray.map((isAvailable, index) => (
          <button
            key={index}
            className={[
              'seat',
              isAvailable ? 'available' : 'unavailable',
              selectedSeats.includes(index) ? 'selected' : ''
            ].join(' ')}
            onClick={() => handleSeatClick(index)}
            disabled={!isAvailable}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <button
        className="reserve-button"
        onClick={handleReserve}
        disabled={selectedSeats.length === 0}
      >
        Make reservation ({selectedSeats.length})
      </button>
    </div>
  );
};

export default ReservationPage;
