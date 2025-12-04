import React, { useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { getAllUsers, UserData } from '../services/firebase';
import Loader from './Loader';
import Sidebar from './Sidebar';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Erro admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalStorage = useMemo(() => users.reduce((acc, u) => acc + (u.storageUsed || 0), 0), [users]);
  const totalFiles = useMemo(() => users.reduce((acc, u) => acc + (u.fileCount || 0), 0), [users]);
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPercentage = (used: number) => {
    const limit = 1024 * 1024 * 1024; // 1GB
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
       <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        usedBytes={totalStorage} // Uso global no admin
        totalBytes={1024 * 1024 * 1024 * 100} // Limite fictício alto para admin
        user={user}
        onLogout={onLogout}
      />

      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-red-900/30 p-2 rounded-lg border border-red-500/20">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h1 className="text-xl font-bold text-white">Painel <span className="text-red-500">Administrativo</span></h1>
              </div>
           </div>
           <div className="text-sm text-gray-400">
             Logado como <span className="text-white font-medium">Ediran (Owner)</span>
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <svg className="w-24 h-24 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
            </div>
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total de Usuários</h3>
            <p className="text-3xl font-bold text-white mt-2">{users.length}</p>
            <span className="text-green-500 text-xs font-medium mt-1 inline-flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Ativos na plataforma
            </span>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </div>
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Arquivos Hospedados</h3>
            <p className="text-3xl font-bold text-white mt-2">{totalFiles}</p>
            <span className="text-gray-500 text-xs mt-1">Total de uploads realizados</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <svg className="w-24 h-24 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1.5a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5H16a.5.5 0 01-.5-.5v-.5a.5.5 0 01.5-.5h.5zM2 11a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1.5a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5H16a.5.5 0 01-.5-.5v-.5a.5.5 0 01.5-.5h.5zM2 17a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1.5a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5H16a.5.5 0 01-.5-.5v-.5a.5.5 0 01.5-.5h.5z" clipRule="evenodd"></path></svg>
            </div>
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Armazenamento Global</h3>
            <p className="text-3xl font-bold text-indigo-400 mt-2">{formatBytes(totalStorage)}</p>
            <span className="text-gray-500 text-xs mt-1">Consumo total do bucket</span>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">Top Consumo de Armazenamento</h3>
          <div className="h-64 flex items-end justify-start gap-2 sm:gap-4 overflow-x-auto pb-2">
            {users.slice(0, 10).map((u, index) => {
              const height = Math.max((u.storageUsed / (Math.max(...users.map(u => u.storageUsed)) || 1)) * 100, 5);
              return (
                <div key={u.uid} className="flex flex-col items-center gap-2 group min-w-[60px] flex-1">
                  <div className="relative w-full flex justify-center">
                    <div 
                       className="w-full max-w-[40px] bg-gradient-to-t from-indigo-900 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-indigo-700 group-hover:to-indigo-400 relative"
                       style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none z-10">
                        {formatBytes(u.storageUsed)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 truncate w-16 text-center" title={u.email}>{u.email.split('@')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h3 className="text-lg font-bold text-white">Monitoramento de Usuários</h3>
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700">Tempo Real</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Usuário</th>
                  <th className="px-6 py-4 font-semibold text-center">Arquivos</th>
                  <th className="px-6 py-4 font-semibold">Uso de Armazenamento</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u) => {
                  const percent = getPercentage(u.storageUsed);
                  return (
                    <tr key={u.uid} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-700">
                            {u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">{u.email}</span>
                            <span className="text-xs text-gray-600 font-mono">ID: {u.uid.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-gray-800 text-gray-300 py-1 px-3 rounded-md text-xs font-mono border border-gray-700">
                          {u.fileCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-medium">{formatBytes(u.storageUsed)}</span>
                          <span className="text-gray-500">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${percent > 80 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'bg-green-900/30 text-green-400 border border-green-500/30'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Ativo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;