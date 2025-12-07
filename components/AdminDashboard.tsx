import React, { useEffect, useState, useMemo } from 'react';
import { getAllUsers, UserData, User } from '../services/firebase';
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
    const limit = 1024 * 1024 * 1024; 
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
       <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        usedBytes={totalStorage}
        totalBytes={1024 * 1024 * 1024 * 100}
        user={user}
        onLogout={onLogout}
      />

      <header className="bg-[#050505]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-xl font-serif text-white tracking-wide">Painel <span className="text-gray-500">Master</span></h1>
           </div>
           <div className="text-xs uppercase font-bold tracking-widest text-gray-500 border border-white/10 px-3 py-1 rounded-full">
             Admin Mode
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-colors">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Total Usuários</h3>
            <p className="text-4xl font-serif text-white">{users.length}</p>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-colors">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Arquivos</h3>
            <p className="text-4xl font-serif text-white">{totalFiles}</p>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-colors">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Armazenamento</h3>
            <p className="text-4xl font-serif text-white">{formatBytes(totalStorage)}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-serif text-white">Monitoramento de Usuários</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest">
                  <th className="px-8 py-4 font-bold">Usuário</th>
                  <th className="px-8 py-4 font-bold text-center">Arquivos</th>
                  <th className="px-8 py-4 font-bold">Uso de Armazenamento</th>
                  <th className="px-8 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const percent = getPercentage(u.storageUsed);
                  return (
                    <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 border border-white/5">
                            {u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{u.email}</span>
                            <span className="text-[10px] text-gray-600 font-mono">{u.uid.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-sm font-mono text-gray-400">{u.fileCount || 0}</span>
                      </td>
                      <td className="px-8 py-5 min-w-[200px]">
                        <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                          <span className="text-gray-300">{formatBytes(u.storageUsed)}</span>
                          <span className="text-gray-600">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-white transition-all`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'text-white bg-white/10 border border-white/20' : 'text-gray-500 bg-white/5 border border-white/5'}`}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
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