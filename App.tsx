import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth, logoutUser } from './services/firebase';
import Loader from './components/Loader';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default App;