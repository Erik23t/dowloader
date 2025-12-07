import React, { useState } from 'react';

interface PermissionHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionHelp: React.FC<PermissionHelpProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Regras SEGURAS: Exige login E garante que usuário só mexe na pasta dele.
  const rulesCode = `rules_version = '2';
service firebase.storage {
  // O símbolo {bucket} aplica a regra a todos os seus buckets
  match /b/{bucket}/o {
    
    // Regra: Usuário só acessa sua própria pasta 'users/{userId}'
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Opcional: Admin acessa tudo (se tiver Custom Claim configurada, ou use email fixo para testes)
    match /{allPaths=**} {
       allow read, write: if request.auth != null && request.auth.token.email == 'ediran@admin.com';
    }
  }
}`;

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || request.auth.token.email == 'ediran@admin.com');
    }
  }
}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-red-500/30 rounded-xl shadow-2xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-500/10 rounded-full shrink-0 animate-pulse">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Correção de Segurança Necessária</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              O erro <code>storage/unauthorized</code> ou <code>permission-denied</code> indica que o Firebase bloqueou o acesso.
              <br/>
              Para proteger os dados dos seus clientes, você <strong>NÃO</strong> deve usar regras públicas ("if true").
            </p>
          </div>
        </div>

        {/* Alerta Visual do Dropdown */}
        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg mb-6">
          <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            Passo 1: Selecione o Bucket Correto
          </h3>
          <p className="text-gray-300 text-sm mb-2">
            No console do Storage, verifique se o dropdown no topo está selecionado em:
          </p>
          <div className="bg-black/50 p-2 rounded text-sm font-mono text-white border border-gray-700 inline-block">
            gs://armazenamento1-ba1e
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Storage Rules */}
          <div className="bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
              <span className="text-indigo-400 text-xs uppercase font-bold tracking-wider">Regras Storage (Arquivos)</span>
              <button onClick={() => handleCopy(rulesCode)} className="text-xs text-gray-400 hover:text-white">Copiar</button>
            </div>
            <pre className="p-4 overflow-x-auto text-green-400 font-mono text-[10px] leading-relaxed scrollbar-thin">
              {rulesCode}
            </pre>
          </div>

          {/* Firestore Rules */}
          <div className="bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
              <span className="text-orange-400 text-xs uppercase font-bold tracking-wider">Regras Firestore (Banco)</span>
              <button onClick={() => handleCopy(firestoreRules)} className="text-xs text-gray-400 hover:text-white">Copiar</button>
            </div>
            <pre className="p-4 overflow-x-auto text-orange-300 font-mono text-[10px] leading-relaxed scrollbar-thin">
              {firestoreRules}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-600/20"
          >
            Já configurei as regras seguras
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionHelp;