import React, { useState } from 'react';

interface PermissionHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionHelp: React.FC<PermissionHelpProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rulesCode = `rules_version = '2';
service firebase.storage {
  // O símbolo {bucket} faz a regra valer para todos os buckets
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // 'read': ver arquivos
      // 'write': enviar E EXCLUIR arquivos
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-indigo-500/30 rounded-xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-500/10 rounded-full shrink-0">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Atenção: Bucket Secundário</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Você está usando um bucket personalizado (<code>armazenamento1-ba1e</code>). 
              <br/>
              Muitas vezes as regras são aplicadas no bucket errado!
            </p>
          </div>
        </div>

        {/* Alerta Visual do Dropdown */}
        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg mb-6">
          <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            Verifique no Console do Firebase:
          </h3>
          <p className="text-gray-300 text-sm mb-2">
            Na aba <strong>Rules (Regras)</strong>, procure um menu Dropdown (seta para baixo) próximo ao topo, onde diz o nome do bucket.
          </p>
          <div className="bg-black/50 p-2 rounded text-xs font-mono text-gray-400 border border-gray-700">
            Certifique-se de selecionar: <span className="text-white font-bold">armazenamento1-ba1e</span>
          </div>
        </div>

        <div className="bg-gray-950 rounded-lg border border-gray-800 mb-6 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Código das Regras</span>
            <button 
              onClick={handleCopy}
              className={`text-xs font-medium px-2 py-1 rounded transition-colors flex items-center gap-1 ${copied ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'}`}
            >
              {copied ? (
                <>Copiado!</>
              ) : (
                <>Copiar Código</>
              )}
            </button>
          </div>
          
          <pre className="p-4 overflow-x-auto text-green-400 font-mono text-xs selection:bg-gray-700 leading-relaxed">
            {rulesCode}
          </pre>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-600/20"
          >
            Já Atualizei - Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionHelp;