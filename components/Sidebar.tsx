import React from 'react';
import { User } from '../services/firebase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  usedBytes: number;
  totalBytes: number;
  user: User;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, usedBytes, totalBytes, user, onLogout, onNavigateToAdmin }) => {
  const percentage = Math.min((usedBytes / totalBytes) * 100, 100);
  const isAdmin = user.email === 'ediran@admin.com';

  const formatBytes = (bytes: number) => {
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-[#050505] border-r border-white/10 z-50 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-serif font-bold text-lg">
                {user.email ? user.email.slice(0, 1).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-white font-serif tracking-wide text-sm truncate">
                  {isAdmin ? 'Administrator' : 'Minha Conta'}
                </h3>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest truncate w-40">
                  {user.email}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
            {isAdmin && (
              <button 
                onClick={() => {
                  if (onNavigateToAdmin) onNavigateToAdmin();
                  onClose();
                }} 
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black hover:border-white rounded-lg transition-all duration-300 group"
              >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                 <span className="text-xs uppercase font-bold tracking-wider">Painel Admin</span>
              </button>
            )}

            <div className="flex items-center gap-3 px-4 py-3 bg-[#0A0A0A] text-white rounded-lg border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span className="text-xs uppercase font-bold tracking-wider">Minha Galeria</span>
            </div>
            
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-xs uppercase font-bold tracking-wider">Configurações</span>
            </button>
          </nav>

          {/* Footer Sidebar */}
          <div className="p-6 border-t border-white/5 space-y-6">
             <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-transparent hover:bg-white/5 text-gray-500 hover:text-white border border-white/10 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest"
             >
               Sair
             </button>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Storage</span>
                <span className="text-[10px] font-mono text-white">
                  {formatBytes(usedBytes)} <span className="text-gray-600">/</span> {formatBytes(totalBytes)}
                </span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 bg-white`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;