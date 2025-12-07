import React from 'react';
import { FileItem } from '../services/firebase';

interface FileCardProps {
  file: FileItem;
  onCopy: (url: string) => void;
  onDelete: (file: FileItem) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onCopy, onDelete }) => {
  const getFileDate = (): string | null => {
    try {
      const parts = file.name.split('_');
      const timestamp = parseInt(parts[0]);
      if (!isNaN(timestamp) && timestamp > 1672531200000) {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
      }
    } catch (e) { return null; }
    return null;
  };

  const fileDate = getFileDate();

  return (
    <div className="group bg-[#0A0A0A]/60 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col h-full hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
      {/* Thumbnail Area */}
      <div className="relative aspect-[4/3] w-full bg-[#050505] overflow-hidden flex items-center justify-center border-b border-white/5">
        {file.isImage ? (
          <img 
            src={file.url} 
            alt={file.name} 
            loading="lazy"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-600">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] uppercase tracking-widest">Arquivo</span>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 border border-white/30 rounded-full hover:bg-white hover:text-black text-white transition-all transform hover:scale-110"
            title="Abrir"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div className="mb-4">
          <h3 className="text-white font-medium text-sm truncate mb-1" title={file.name}>
            {file.name.substring(file.name.indexOf('_') + 1)}
          </h3>
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-[10px] font-mono uppercase tracking-wider">
              {file.isImage ? 'IMG' : 'FILE'}
            </p>
            {fileDate && (
              <span className="text-gray-500 text-[10px] font-mono">
                {fileDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <button
            onClick={() => onCopy(file.url)}
            className="flex-grow flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white hover:text-black text-gray-300 border border-white/10 rounded text-xs font-bold uppercase tracking-wider transition-all duration-300"
          >
            Copiar Link
          </button>

          <button
            onClick={() => onDelete(file)}
            className="flex-shrink-0 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
            title="Excluir"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;