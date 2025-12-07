import React, { useState } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const sliderItems = [
    { id: 0, title: "Designers", subtitle: "Tools that work like you do.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" },
    { id: 1, title: "Marketers", subtitle: "Campaigns that convert.", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80" },
    { id: 2, title: "Filmmakers", subtitle: "Cinematic excellence.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80" },
    { id: 3, title: "Creators", subtitle: "Engage your audience.", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80" },
    { id: 4, title: "Directors", subtitle: "Visionary leadership.", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <span className="font-serif italic font-bold text-2xl text-white">F</span>
              </div>
              <span className="text-xl font-serif tracking-widest uppercase">Femmelz</span>
            </div>
            <div className="hidden md:flex items-center space-x-12 text-xs font-bold uppercase tracking-widest text-gray-400">
              <a href="#services" className="hover:text-white transition-colors">Serviços</a>
              <a href="#bento" className="hover:text-white transition-colors">Galeria</a>
              <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
              <button 
                onClick={onEnter}
                className="px-8 py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-48 pb-32 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-gray-500 font-bold tracking-[0.3em] uppercase text-xs mb-8 animate-fade-in-up">
          Refined Solutions for the Modern Woman
        </h2>
        
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-medium leading-tight mb-12 tracking-tight">
          <span className="block text-white">Feminine by Nature,</span>
          <span className="block text-gray-600">Bold by Choice.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-gray-400 text-lg font-light leading-relaxed mb-12">
          Organize, armazene e compartilhe suas memórias com segurança e elegância em uma plataforma desenhada para o essencial.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button 
            onClick={onEnter}
            className="px-10 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Começar Agora
          </button>
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-10 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Ver Planos
          </button>
        </div>

        {/* Hero Image Mockup */}
        <div className="mt-24 relative rounded-md overflow-hidden border border-white/10 shadow-2xl animate-fade-in-up delay-200 group opacity-80 hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Dashboard Preview" 
            className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-1000"
          />
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="py-32 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 border border-white/10 bg-white/5 flex items-center justify-center mb-8">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-serif text-white mb-4">Segurança Máxima</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Criptografia de ponta a ponta em infraestrutura Google Cloud.</p>
            </div>

            <div className="p-10 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 border border-white/10 bg-white/5 flex items-center justify-center mb-8">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
              </div>
              <h3 className="text-xl font-serif text-white mb-4">Design Intuitivo</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Dashboard minimalista focada na sua produtividade.</p>
            </div>

            <div className="p-10 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 border border-white/10 bg-white/5 flex items-center justify-center mb-8">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-serif text-white mb-4">Alta Performance</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Uploads ultrarrápidos e carregamento instantâneo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section id="bento" className="py-32 bg-[#050505] relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20 items-start">
            <div className="lg:w-1/3 sticky top-32">
              <span className="text-white font-bold tracking-widest uppercase text-xs border border-white/20 px-3 py-1 rounded-full">Recursos</span>
              <h2 className="text-5xl font-serif mt-8 mb-8 leading-tight text-white">
                Galeria <span className="text-gray-600">Bento</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 font-light">
                Estrutura modular para exibir seu conteúdo com sofisticação.
              </p>
            </div>

            <div className="lg:w-2/3 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4">
                <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
                </div>
                <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" />
                </div>
                <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" />
                </div>
                <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1519681393798-3828fb4090bb?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif text-white">Investimento</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-8">
            {/* Starter */}
            <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 p-10 rounded-2xl hover:border-white/30 transition-all">
              <h3 className="text-xl font-serif text-white mb-4">Starter</h3>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-white">Free</span>
              </div>
              <ul className="space-y-4 mb-10 text-gray-400 text-sm">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> 1 GB Storage</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> Acesso Básico</li>
              </ul>
              <button onClick={onEnter} className="w-full py-4 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-lg">
                Começar
              </button>
            </div>

            {/* Pro */}
            <div className="w-full max-w-md bg-white text-black p-10 rounded-2xl transform md:-translate-y-4 shadow-2xl">
              <h3 className="text-xl font-serif mb-4">Professional</h3>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold">R$ 29</span>
                <span className="ml-2 text-sm uppercase tracking-widest opacity-60">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 text-gray-800 text-sm font-medium">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-black rounded-full"></div> Storage Ilimitado</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-black rounded-full"></div> Suporte VIP</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-black rounded-full"></div> Analytics</li>
              </ul>
              <button onClick={onEnter} className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-lg">
                Assinar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="font-serif text-2xl text-white block mb-4">Femmelz</span>
          <p className="text-gray-600 text-xs uppercase tracking-widest">&copy; 2025 All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;