import React from 'react';
import { FileItem } from '../services/firebase';

interface FileCardProps {
  file: FileItem;
  onCopy: (url: string) => void;
  onDelete: (file: FileItem) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onCopy, onDelete }) => {
  // Tenta extrair a data do nome do arquivo (formato: timestamp_nome.ext)
  const getFileDate = (): string | null => {
    try {
      const parts = file.name.split('_');
      const timestamp = parseInt(parts[0]);
      
      // Verifica se é um timestamp válido (ano > 2023)
      if (!isNaN(timestamp) && timestamp > 1672531200000) {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fileDate = getFileDate();

  return (
    <div className="group bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full">
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full bg-gray-900 overflow-hidden flex items-center justify-center">
        {file.isImage ? (
          <img 
            src={file.url} 
            alt={file.name} 
            loading="lazy"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs uppercase font-bold tracking-wider">Arquivo</span>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Abrir em nova aba"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div className="mb-3">
          <h3 className="text-gray-200 font-semibold text-sm truncate mb-1" title={file.name}>
            {file.name}
          </h3>
          <div className="flex justify-between items-center text-xs">
            <p className="text-gray-500 font-mono truncate max-w-[60%] opacity-70">
              {file.fullPath}
            </p>
            {fileDate && (
              <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded">
                {fileDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={() => onCopy(file.url)}
            className="flex-grow flex items-center justify-center gap-2 px-3 py-2 bg-gray-750 hover:bg-indigo-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium group-hover:bg-indigo-600/10 group-hover:text-indigo-400 group-hover:hover:bg-indigo-600 group-hover:hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copiar
          </button>

          <button
            onClick={() => onDelete(file)}
            className="flex-shrink-0 p-2 bg-gray-750 hover:bg-red-500/10 text-gray-400 hover:text-red-500 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
            title="Excluir arquivo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;