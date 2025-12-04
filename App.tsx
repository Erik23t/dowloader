import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { listFiles, FileItem, uploadFile, deleteFile } from './services/firebase';
import Loader from './components/Loader';
import FileCard from './components/FileCard';
import Toast from './components/Toast';
import PermissionHelp from './components/PermissionHelp';
import Sidebar from './components/Sidebar';

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

const App: React.FC = () => {
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

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listFiles();
      setFiles(items);
      // Se carregou com sucesso, garante que fecha o modal de ajuda
      setShowPermissionHelp(false);
    } catch (err: any) {
      console.error(err);
      let msg = "Não foi possível carregar os arquivos.";
      
      if (err.code === 'storage/object-not-found') {
        msg = "Bucket não encontrado (404). Verifique o nome do bucket.";
      }
      if (err.code === 'storage/unauthorized') {
        msg = "Acesso negado. Necessário configurar regras.";
        setShowPermissionHelp(true);
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca inicial
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle modal close -> retry fetch
  const handlePermissionHelpClose = () => {
    setShowPermissionHelp(false);
    // Tenta reconectar imediatamente quando o usuário fecha o modal dizendo que arrumou
    fetchFiles();
  };

  // Lógica de Filtragem e Ordenação
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // 1. Filtrar por busca
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(file => file.name.toLowerCase().includes(lowerTerm));
    }

    // 2. Ordenar
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

  // Cálculo de Uso de Armazenamento
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
        setToastMessage('Link copiado para a área de transferência!');
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
      `Tem certeza que deseja excluir permanentemente o arquivo:\n"${file.name}"?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      await deleteFile(file.fullPath);
      
      // Atualiza a lista localmente para resposta rápida
      setFiles(currentFiles => currentFiles.filter(f => f.fullPath !== file.fullPath));
      
      setToastMessage('Arquivo excluído com sucesso.');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error("Erro ao excluir:", err);
      let errorMsg = "Erro ao excluir arquivo.";
      
      // Tratamento de erro específico para ajudar o usuário
      if (err.code === 'storage/unauthorized') {
        errorMsg = "Sem permissão (403). Verifique se aplicou as regras no bucket correto.";
        setShowPermissionHelp(true);
      } else if (err.code === 'storage/object-not-found') {
        errorMsg = "Arquivo não encontrado (talvez já excluído).";
        // Remove da lista se não existe mais
        setFiles(currentFiles => currentFiles.filter(f => f.fullPath !== file.fullPath));
      } else {
        errorMsg = `Erro (${err.code}): ${err.message}`;
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

    // Check storage limit
    if (totalUsage + file.size > MAX_STORAGE_BYTES) {
      setToastMessage('Armazenamento cheio! Exclua arquivos para liberar espaço.');
      setToastType('error');
      setShowToast(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) { 
      setToastMessage('O arquivo é muito grande (Máx 50MB).');
      setToastType('error');
      setShowToast(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadName(file.name);

    try {
      await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      setToastMessage(`Upload concluído: "${file.name}"`);
      setToastType('success');
      setShowToast(true);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await fetchFiles();
      if (sortBy !== 'newest') setSortBy('newest'); 
      
    } catch (err: any) {
      console.error("Erro no upload (App):", err);
      
      let errorMsg = 'Falha ao salvar a imagem.';
      if (err.code === 'storage/unauthorized') {
        errorMsg = 'Permissão negada! Verifique se selecionou o bucket correto nas Regras.';
        setShowPermissionHelp(true);
      } else if (err.code === 'storage/canceled') {
        errorMsg = 'Upload cancelado.';
      } else if (err.message) {
        errorMsg = `Erro: ${err.message}`;
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
      />

      {/* 1. Header Principal */}
      <header className="sticky top-0 z-40 w-full bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* Menu Button */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Abrir Menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
                    Dashboard <span className="text-indigo-400">Galeria</span>
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />

              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg ${
                  isUploading 
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40'
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

      {/* 2. Barra de Organização (Toolbar) com Storage Meter */}
      <div className="bg-gray-900 border-b border-gray-800 py-3 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:bg-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Storage Meter Bar (New) */}
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
                     usagePercentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                     : usagePercentage > 75 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                     : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Sort & Refresh */}
            <div className="flex w-full sm:w-auto items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="sort" className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap hidden md:inline">Ordenar:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="block w-full pl-3 pr-8 py-1.5 text-xs border-gray-700 bg-gray-800 text-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="newest">Recentes</option>
                  <option value="oldest">Antigos</option>
                  <option value="az">Nome (A-Z)</option>
                  <option value="za">Nome (Z-A)</option>
                </select>
              </div>

              <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>

              <button 
                onClick={fetchFiles} 
                disabled={isUploading || loading}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
                title="Atualizar Lista"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Área Principal */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Status Bar: Contagem e filtros ativos */}
        <div className="mb-6 flex items-center justify-between text-sm text-gray-400">
          <span>
            Exibindo <strong className="text-gray-200">{filteredFiles.length}</strong> de {files.length} arquivos
          </span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
            >
              Limpar busca
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Lista de Arquivos */}
        {loading && !isUploading ? (
          <Loader />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-red-500/20 rounded-xl bg-red-900/10">
            <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-red-400 mb-2">Erro ao carregar</h3>
            <p className="text-red-300/70 max-w-md break-words mb-4">{error}</p>
            {error.includes("Acesso negado") && (
              <button 
                onClick={() => setShowPermissionHelp(true)}
                className="text-indigo-400 hover:text-indigo-300 underline text-sm"
              >
                Ver como corrigir permissões
              </button>
            )}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/50">
            <div className="bg-gray-800 p-4 rounded-full mb-4 ring-1 ring-gray-700">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">Nenhum arquivo encontrado</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              {searchTerm ? `Nenhum resultado para "${searchTerm}".` : "Sua galeria está vazia."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleUploadClick}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-indigo-600/20"
              >
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

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">Dashboard Galeria &copy; {new Date().getFullYear()}</p>
          <p className="text-gray-600 text-xs mt-1">Gerenciado via Firebase Storage</p>
        </div>
      </footer>

      {/* Floating Progress Bar (Upload Status) */}
      {isUploading && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-semibold text-white truncate pr-2">Enviando arquivo...</h4>
              <span className="text-xs font-mono text-indigo-400">{Math.round(uploadProgress)}%</span>
            </div>
            <p className="text-xs text-gray-400 truncate mb-3">{currentUploadName}</p>
            
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-900/50 px-4 py-2 border-t border-gray-700/50 flex justify-between items-center">
             <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Aguarde...</span>
             {uploadProgress < 100 && (
               <svg className="w-3 h-3 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
             )}
          </div>
        </div>
      )}

      {/* Modals & Toasts */}
      <Toast 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
        type={toastType}
      />
      
      <PermissionHelp 
        isOpen={showPermissionHelp} 
        onClose={handlePermissionHelpClose} 
      />
    </div>
  );
};

export default App;