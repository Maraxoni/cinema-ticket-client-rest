import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Screening } from '../types/Screening';
import '../css/ReservationPage.css';

const ReservationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useUser();

  // Initial screening from navigation state
  const initialScreening: Screening | undefined = location.state?.screening;

  // State to hold screening, so we can update availableSeats dynamically
  const [screening, setScreening] = useState<Screening | undefined>(initialScreening);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  useEffect(() => {
    if (!screening) {
      navigate('/screenings');
      return;
    }
  }, [screening, navigate]);

  if (!screening) return null;

  const seatsArray: boolean[] = Array.isArray(screening.availableSeats)
    ? screening.availableSeats
    : [];

  const handleSeatClick = (index: number) => {
    if (!seatsArray[index]) return;
    setSelectedSeats(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const fetchScreening = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const response = await axios.get<Screening>(`${baseUrl}/api/screening/${screening.screeningID}`, {
        withCredentials: true,
      });
      setScreening(response.data);
      setSelectedSeats([]);  // reset selected seats after refresh
    } catch (err) {
      console.error('Failed to fetch screening:', err);
    }
  };

  const handleReserve = async () => {
    if (!username) {
      navigate('/login');
      return;
    }

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      await axios.post(`${baseUrl}/api/reservation`, {
        screeningId: screening.screeningID,
        accountUsername: username,
        reservedSeats: selectedSeats
      }, { withCredentials: true });

      alert('Reservation successful.');

      // Odśwież dane seansu, żeby mieć aktualne miejsca
      await fetchScreening();

    } catch (err: any) {
      console.error(err);
      alert(`Error during reservation: ${err.message}`);
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
