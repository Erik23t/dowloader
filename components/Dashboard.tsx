import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { listFiles, FileItem, uploadFile, deleteFile } from '../services/firebase';
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
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Upload States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentUploadName, setCurrentUploadName] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filtering & Sorting States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Permission Error State
  const [showPermissionHelp, setShowPermissionHelp] = useState<boolean>(false);
  
  // Toast State
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB

  // Fetch files for the specific user
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listFiles(user.uid);
      setFiles(items);
      setShowPermissionHelp(false);
    } catch (err: any) {
      console.error(err);
      let msg = "Não foi possível carregar os arquivos.";
      
      if (err.code === 'storage/object-not-found') {
        // Isso pode acontecer se a pasta do usuário ainda não existir.
        // Vamos tratar como vazio, mas logar.
        setFiles([]);
        setLoading(false);
        return;
      }
      if (err.code === 'storage/unauthorized') {
        msg = "Acesso negado. Necessário configurar regras.";
        setShowPermissionHelp(true);
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  // Busca inicial
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handlePermissionHelpClose = () => {
    setShowPermissionHelp(false);
    fetchFiles();
  };

  // Lógica de Filtragem e Ordenação
  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(file => file.name.toLowerCase().includes(lowerTerm));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.name.localeCompare(a.name);
        case 'oldest':
          return a.name.localeCompare(b.name);
        case 'az':
          return a.name.localeCompare(b.name);
        case 'za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchTerm, sortBy]);

  const totalUsage = useMemo(() => {
    return files.reduce((acc, file) => acc + (file.size || 0), 0);
  }, [files]);

  const usagePercentage = Math.min((totalUsage / MAX_STORAGE_BYTES) * 100, 100);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
    const confirmDelete = window.confirm(
      `Excluir "${file.name}" permanentemente?`
    );

    if (!confirmDelete) return;

    try {
      await deleteFile(file.fullPath);
      setFiles(currentFiles => currentFiles.filter(f => f.fullPath !== file.fullPath));
      setToastMessage('Arquivo excluído.');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error("Erro ao excluir:", err);
      let errorMsg = "Erro ao excluir arquivo.";
      
      if (err.code === 'storage/unauthorized') {
        errorMsg = "Sem permissão (403).";
        setShowPermissionHelp(true);
      } else if (err.code === 'storage/object-not-found') {
        errorMsg = "Arquivo não encontrado.";
        setFiles(currentFiles => currentFiles.filter(f => f.fullPath !== file.fullPath));
      }
      
      setToastMessage(errorMsg);
      setToastType('error');
      setShowToast(true);
    }
  }, []);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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

    if (file.size > 50 * 1024 * 1024) { 
      setToastMessage('Arquivo muito grande (>50MB).');
      setToastType('error');
      setShowToast(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadName(file.name);

    try {
      // Pass user.uid to uploadFile
      await uploadFile(user.uid, file, (progress) => {
        setUploadProgress(progress);
      });
      
      setToastMessage(`Upload concluído!`);
      setToastType('success');
      setShowToast(true);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await fetchFiles();
      if (sortBy !== 'newest') setSortBy('newest'); 
      
    } catch (err: any) {
      console.error("Erro no upload:", err);
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
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        usedBytes={totalUsage}
        totalBytes={MAX_STORAGE_BYTES}
        user={user}
        onLogout={onLogout}
      />

      <header className="sticky top-0 z-40 w-full bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-2 rounded-lg shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white hidden sm:block">
                  Dashboard <span className="text-indigo-400">Galeria</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg ${
                  isUploading 
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="hidden sm:inline">Novo Upload</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-gray-900 border-b border-gray-800 py-3 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 w-full px-2 sm:px-6">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Armazenamento</span>
                <span className="text-xs font-mono text-indigo-300">
                  {formatBytes(totalUsage)} <span className="text-gray-600">/</span> {formatBytes(MAX_STORAGE_BYTES)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                     usagePercentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' 
                     : usagePercentage > 75 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                     : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-3">
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-xs border-gray-700 bg-gray-800 text-gray-300 focus:outline-none rounded-md"
              >
                <option value="newest">Recentes</option>
                <option value="oldest">Antigos</option>
                <option value="az">Nome (A-Z)</option>
                <option value="za">Nome (Z-A)</option>
              </select>

              <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>

              <button 
                onClick={fetchFiles} 
                disabled={isUploading || loading}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="mb-6 flex items-center justify-between text-sm text-gray-400">
          <span>
            Exibindo <strong className="text-gray-200">{filteredFiles.length}</strong> de {files.length} arquivos
          </span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              Limpar busca
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {loading && !isUploading ? (
          <Loader />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-red-500/20 rounded-xl bg-red-900/10">
             <p className="text-red-400">{error}</p>
             {error.includes("Acesso negado") && (
              <button 
                onClick={() => setShowPermissionHelp(true)}
                className="text-indigo-400 hover:text-indigo-300 underline text-sm mt-2"
              >
                Corrigir permissões
              </button>
            )}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/50">
            <h3 className="text-lg font-medium text-gray-300 mb-1">Nenhum arquivo</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              {searchTerm ? "Nenhum resultado." : "Sua galeria pessoal está vazia."}
            </p>
            {!searchTerm && (
              <button onClick={handleUploadClick} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg">
                Adicionar Imagem
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

      {/* Upload Progress */}
      {isUploading && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-semibold text-white truncate pr-2">Enviando...</h4>
              <span className="text-xs font-mono text-indigo-400">{Math.round(uploadProgress)}%</span>
            </div>
            <p className="text-xs text-gray-400 truncate mb-3">{currentUploadName}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} type={toastType} />
      <PermissionHelp isOpen={showPermissionHelp} onClose={handlePermissionHelpClose} />
    </div>
  );
};

export default Dashboard;