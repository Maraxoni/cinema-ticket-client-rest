import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserContextType {
  username: string | null;
  password: string | null;
  login: (username: string, password: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');
    if (storedUsername && storedPassword) {
      setUsername(storedUsername);
      setPassword(storedPassword);
    }
  }, []);

  const login = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
  };

  const logout = () => {
    setUsername(null);
    setPassword(null);
    localStorage.removeItem('username');
    localStorage.removeItem('password');
  };

  return (
    <UserContext.Provider value={{ username, password, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
