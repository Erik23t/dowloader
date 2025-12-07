import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { listFiles, FileItem, uploadFile, deleteFile, User } from '../services/firebase';
import Loader from './Loader';
import FileCard from './FileCard';
import Toast from './Toast';
import PermissionHelp from './PermissionHelp';
import Sidebar from './Sidebar';

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentUploadName, setCurrentUploadName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showPermissionHelp, setShowPermissionHelp] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; 

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listFiles(user.uid);
      setFiles(items);
      setShowPermissionHelp(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'storage/object-not-found') {
        setFiles([]);
        setLoading(false);
        return;
      }
      if (err.code === 'storage/unauthorized') {
        setShowPermissionHelp(true);
      }
      setError("Não foi possível carregar os arquivos.");
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handlePermissionHelpClose = () => {
    setShowPermissionHelp(false);
    fetchFiles();
  };

  const filteredFiles = useMemo(() => {
    let result = [...files];
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(file => file.name.toLowerCase().includes(lowerTerm));
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.name.localeCompare(a.name);
        case 'oldest': return a.name.localeCompare(b.name);
        case 'az': return a.name.localeCompare(b.name);
        case 'za': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
    return result;
  }, [files, searchTerm, sortBy]);

  const totalUsage = useMemo(() => {
    return files.reduce((acc, file) => acc + (file.size || 0), 0);
  }, [files]);

  const usagePercentage = Math.min((totalUsage / MAX_STORAGE_BYTES) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setToastMessage('Link copiado!');
        setToastType('success');
        setShowToast(true);
      })
      .catch(() => {
        setToastMessage('Erro ao copiar link.');
        setToastType('error');
        setShowToast(true);
      });
  }, []);

  const handleDelete = useCallback(async (file: FileItem) => {
    const confirmDelete = window.confirm(`Excluir permanentemente?`);
    if (!confirmDelete) return;

    try {
      await deleteFile(file.fullPath, file.size);
      setFiles(currentFiles => currentFiles.filter(f => f.fullPath !== file.fullPath));
      setToastMessage('Arquivo excluído.');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      let errorMsg = "Erro ao excluir.";
      if (err.code === 'storage/unauthorized') {
        errorMsg = "Sem permissão (403).";
        setShowPermissionHelp(true);
      }
      setToastMessage(errorMsg);
      setToastType('error');
      setShowToast(true);
    }
  }, []);

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (totalUsage + file.size > MAX_STORAGE_BYTES) {
      setToastMessage('Armazenamento cheio!');
      setToastType('error');
      setShowToast(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadName(file.name);

    try {
      await uploadFile(user.uid, file, (progress) => setUploadProgress(progress));
      setToastMessage(`Upload concluído!`);
      setToastType('success');
      setShowToast(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchFiles();
      setSortBy('newest');
    } catch (err: any) {
      let errorMsg = 'Falha ao salvar.';
      if (err.code === 'storage/unauthorized') {
        errorMsg = 'Permissão negada (403).';
        setShowPermissionHelp(true);
      }
      setToastMessage(errorMsg);
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadName('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        usedBytes={totalUsage}
        totalBytes={MAX_STORAGE_BYTES}
        user={user}
        onLogout={onLogout}
      />

      {/* Header Minimalista */}
      <header className="sticky top-0 z-40 w-full bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-serif text-white tracking-wide">
              Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                isUploading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              }`}
            >
              {isUploading ? 'Enviando...' : 'Novo Upload'}
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row gap-6 justify-between items-center">
          {/* Search */}
          <div className="relative w-full sm:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-600 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 border border-white/10 rounded-xl bg-[#0A0A0A] text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#0F0F0F] transition-all text-sm"
              placeholder="Buscar arquivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Stats & Sort */}
          <div className="flex flex-1 w-full items-center justify-end gap-6">
            <div className="hidden md:flex flex-col items-end gap-1 min-w-[200px]">
              <div className="flex justify-between w-full text-[10px] uppercase font-bold tracking-widest text-gray-500">
                <span>Storage</span>
                <span>{formatBytes(totalUsage)} / {formatBytes(MAX_STORAGE_BYTES)}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-700"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-black">Recentes</option>
              <option value="oldest" className="bg-black">Antigos</option>
              <option value="az" className="bg-black">A-Z</option>
              <option value="za" className="bg-black">Z-A</option>
            </select>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 relative">
        {loading && !isUploading ? (
          <Loader />
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <p className="text-gray-500 text-sm mb-4">
              {searchTerm ? "Nenhum resultado encontrado." : "Sua galeria está vazia."}
            </p>
            {!searchTerm && (
              <button onClick={handleUploadClick} className="text-white border-b border-white/50 hover:border-white pb-0.5 text-xs font-bold uppercase tracking-widest transition-all">
                Começar agora
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
            {filteredFiles.map((file) => (
              <FileCard 
                key={file.fullPath} 
                file={file} 
                onCopy={handleCopyLink} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Upload Toast */}
      {isUploading && (
        <div className="fixed bottom-8 right-8 z-50 w-80 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Enviando Arquivo</h4>
            <span className="text-xs font-mono text-gray-400">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
            <div className="bg-white h-1 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 truncate font-mono">{currentUploadName}</p>
        </div>
      )}

      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} type={toastType} />
      <PermissionHelp isOpen={showPermissionHelp} onClose={handlePermissionHelpClose} />
    </div>
  );
};

export default Dashboard;