import React from 'react';
import { User } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  usedBytes: number;
  totalBytes: number;
  user: User;
  onLogout: () => void;
  onNavigateToAdmin?: () => void; // Optional prop
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, usedBytes, totalBytes, user, onLogout, onNavigateToAdmin }) => {
  const percentage = Math.min((usedBytes / totalBytes) * 100, 100);
  
  // Verifica se é o admin (backdoor ou email real)
  const isAdmin = user.email === 'ediran@admin.com';

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-gray-800 z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800 relative bg-gradient-to-b from-gray-800/50 to-gray-900">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg uppercase border-2 border-gray-800">
                {user.email ? user.email.slice(0, 2) : 'US'}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-white font-semibold text-sm truncate">
                  {isAdmin ? 'Administrador' : 'Minha Conta'}
                </h3>
                <p className="text-gray-500 text-xs truncate w-40" title={user.email || ''}>{user.email}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Link Admin Especial */}
            {isAdmin && (
              <button 
                onClick={() => {
                  if (onNavigateToAdmin) onNavigateToAdmin();
                  onClose();
                }} 
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/20 text-red-400 border border-red-500/20 hover:bg-red-900/30 rounded-lg transition-colors mb-4 group"
              >
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                 <span className="font-bold">Painel Admin</span>
              </button>
            )}

            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 text-indigo-400 rounded-lg border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span className="font-medium">Minha Galeria</span>
            </div>
            
            <button onClick={() => alert("Em breve")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="font-medium">Configurações</span>
            </button>
          </nav>

          <div className="p-4 border-t border-gray-800">
             <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900 rounded-lg transition-colors"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               Sair da Conta
             </button>
          </div>

          <div className="p-6 bg-gray-950 border-t border-gray-800">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Armazenamento</h4>
            <div className="mb-2 flex justify-between items-end">
              <span className="text-xl font-bold text-white">{percentage.toFixed(1)}%</span>
              <span className="text-xs text-gray-400">{formatSize(usedBytes)} / {formatSize(totalBytes)}</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;