import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AuthPages.css';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;

      const response = await fetch(`${baseUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // <- wysyła cookies/autoryzację
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Registration failed');
      }

      setMessage('Registration successful!');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage(`Error during registration: ${error.message}`);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>Rejestracja</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Login"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">Zarejestruj</button>
        </form>
        {message && <p className="info">{message}</p>}
      </div>
    </div>
  );
};

export default RegisterPage;
