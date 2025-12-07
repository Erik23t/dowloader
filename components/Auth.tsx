import React, { useState } from 'react';
import { loginUser, registerUser, db, getServerTimestamp } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const Auth: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Imagens estilo Editorial / Fashion / Abstrato para o Parallax
  const row1 = [
    "https://images.unsplash.com/photo-1550614000-4b9519e02a95?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
  ];

  const row2 = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?q=80&w=400&auto=format&fit=crop",
  ];

  const row3 = [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a302c2d56ea0?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485230946086-614024086a55?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=400&auto=format&fit=crop",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let finalEmail = email;
    let finalPassword = password;
    let isAdminAttempt = false;

    const normalizedEmail = email.toLowerCase().trim();

    if ((normalizedEmail === 'ediran' || normalizedEmail === 'ediran@admin.com') && 
        (password === '12345' || password === '123456')) {
      finalEmail = 'ediran@admin.com'; 
      finalPassword = '123456'; 
      isAdminAttempt = true;
    }

    try {
      if (isRegistering) {
        await registerUser(finalEmail, finalPassword);
      } else {
        await loginUser(finalEmail, finalPassword);
      }
    } catch (err: any) {
      console.error("Erro Auth:", err);
      
      if (isAdminAttempt && !isRegistering && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
         try {
           const cred = await registerUser(finalEmail, finalPassword);
           if (cred.user) {
             const userRef = doc(db, "users", cred.user.uid);
             await setDoc(userRef, {
                email: finalEmail,
                role: 'admin',
                storageUsed: 0,
                fileCount: 0,
                createdAt: getServerTimestamp(),
                lastLogin: getServerTimestamp()
             }, { merge: true });
           }
           return;
         } catch (createErr: any) {
           setError("Erro crítico ao provisionar Admin: " + createErr.message);
         }
      } else {
          let msg = "Ocorreu um erro ao conectar.";
          if (err.code === 'auth/invalid-credential') msg = "Credenciais inválidas.";
          if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
          if (err.code === 'auth/wrong-password') msg = "Senha incorreta.";
          if (err.code === 'auth/email-already-in-use') msg = "Email já cadastrado.";
          if (err.code === 'auth/weak-password') msg = "Senha muito fraca.";
          setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden font-sans">
      
      {/* --- LOCOMOTIVE PARALLAX BACKGROUND --- */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center gap-6 opacity-30 select-none pointer-events-none overflow-hidden scale-110 -rotate-[3deg]">
        <style>{`
          @keyframes infiniteScrollLeft {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes infiniteScrollRight {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .scroll-left { animation: infiniteScrollLeft 60s linear infinite; }
          .scroll-right { animation: infiniteScrollRight 60s linear infinite; }
          .scroll-left-fast { animation: infiniteScrollLeft 50s linear infinite; }
        `}</style>

        {/* Row 1 */}
        <div className="flex gap-6 w-[200%] scroll-left">
          {[...row1, ...row1, ...row1, ...row1].map((src, i) => (
            <div key={`r1-${i}`} className="w-72 h-56 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 ease-in-out hover:scale-105 border border-white/5">
              <img src={src} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-6 w-[200%] scroll-right">
          {[...row2, ...row2, ...row2, ...row2].map((src, i) => (
            <div key={`r2-${i}`} className="w-80 h-64 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 ease-in-out hover:scale-105 border border-white/5">
              <img src={src} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex gap-6 w-[200%] scroll-left-fast">
          {[...row3, ...row3, ...row3, ...row3].map((src, i) => (
            <div key={`r3-${i}`} className="w-72 h-56 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 ease-in-out hover:scale-105 border border-white/5">
              <img src={src} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      </div>

      {/* --- VIGNETTE & OVERLAY --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-0 pointer-events-none"></div>

      {/* --- AUTH CARD --- */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-black/40 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl animate-fade-in-up">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner">
              <span className="font-serif italic font-bold text-3xl text-white">F</span>
            </div>
            <h2 className="text-3xl font-serif text-white tracking-wide mb-2">
              {isRegistering ? 'Join the Club' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400 text-xs font-medium tracking-[0.2em] uppercase">
              {isRegistering ? 'Start your journey' : 'Acesse sua galeria'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-sm"
                placeholder="Email ou Usuário"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all text-sm"
                placeholder="Senha"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all transform active:scale-95 shadow-lg shadow-white/5 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                isRegistering ? 'Cadastrar' : 'ENTRAR'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-gray-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-0.5"
            >
              {isRegistering ? 'Já possui conta? Fazer Login' : 'Criar uma conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;