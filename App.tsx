import React, { useEffect, useState } from 'react';
import { subscribeToAuth, logoutUser, User } from './services/firebase';
import Loader from './components/Loader';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');
  
  // Controls if we show the landing page (for non-logged in users)
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      
      // If user is logged in, we skip the landing page and auth screen
      if (currentUser) {
        setShowLanding(false);
      }
      
      if (currentUser?.email === 'ediran@admin.com') {
         // Optional: automatically switch to admin view if preferred
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentView('dashboard');
      setShowLanding(true); // Go back to landing page on logout
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const toggleAdminView = () => {
    setCurrentView(prev => prev === 'admin' ? 'dashboard' : 'admin');
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <Loader />
      </div>
    );
  }

  // 2. Not Logged In State
  if (!user) {
    // Show Landing Page first
    if (showLanding) {
      return <LandingPage onEnter={() => setShowLanding(false)} />;
    }
    // If they clicked "Enter" on Landing Page, show Auth
    return <Auth />;
  }

  // 3. Admin View
  if (currentView === 'admin' && user.email === 'ediran@admin.com') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // 4. Standard Dashboard View
  return (
    <div className="relative">
       {/* Botão flutuante para admin (fallback caso sidebar não funcione imediatamente) */}
       {user.email === 'ediran@admin.com' && currentView === 'dashboard' && (
         <button 
           onClick={toggleAdminView}
           className="fixed bottom-4 left-4 z-50 bg-red-900 text-red-200 px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-red-500/30 hover:bg-red-800 transition-colors"
         >
           Acessar Admin
         </button>
       )}
       <Dashboard user={user} onLogout={handleLogout} />
    </div>
  );
};

export default App;