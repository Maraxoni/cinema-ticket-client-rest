import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/AuthPages.css';
import { useUser } from '../context/UserContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const response = await axios.post(
        `${baseUrl}/api/Account/login`,  // Zmieniony endpoint na login
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setMessage('Login successful!');
        login(username, password);
        navigate('/');
      } else {
        setMessage(response.data.message || 'Login failed.');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error during login.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {message && <p className="info">{message}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
