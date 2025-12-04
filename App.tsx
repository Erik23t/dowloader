import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth, logoutUser } from './services/firebase';
import Loader from './components/Loader';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      
      // Se for o admin, podemos setar a view padrão ou manter dashboard
      if (currentUser?.email === 'ediran@admin.com') {
         // Opcional: já cair direto no admin se preferir
         // setCurrentView('admin'); 
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentView('dashboard'); // Reset view on logout
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const toggleAdminView = () => {
    setCurrentView(prev => prev === 'admin' ? 'dashboard' : 'admin');
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

  // Roteamento Simples
  if (currentView === 'admin' && user.email === 'ediran@admin.com') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Passamos uma prop extra para o Sidebar (via Dashboard -> Sidebar) saber que pode navegar
  // Como o Dashboard encapsula o Sidebar, teríamos que passar essa prop.
  // Para simplificar sem alterar props do Dashboard agora, vamos manter o Dashboard
  // Mas precisamos garantir que o usuário admin possa navegar. 
  
  // Vamos injetar uma prop modificada no componente Sidebar dentro de Dashboard?
  // Não, melhor editar o Dashboard para aceitar onNavigateToAdmin se necessário, 
  // MAS, como o Dashboard tem seu próprio sidebar state, a solução mais limpa
  // é renderizar o Dashboard e, se o usuário for admin, o Sidebar interno dele
  // (que já atualizamos no passo anterior) mostrará o botão.
  // Quando clicado, precisamos que o Dashboard avise o App.
  
  // Para isso, precisamos adicionar onNavigateToAdmin no DashboardProps também.
  // Vou fazer um pequeno ajuste no componente Sidebar.tsx (já feito acima) 
  // E agora preciso ajustar Dashboard.tsx para passar essa prop para o Sidebar.
  
  // Como não pedi para alterar o Dashboard.tsx no XML anterior, vou adicionar uma modificação nele agora.
  
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