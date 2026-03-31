import React from 'react';

function Loading({ message = 'Loading workspace...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center">
        
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-[2rem] shadow-2xl shadow-primary-500/20 animate-pulse flex items-center justify-center">
            <span className="text-white font-black text-5xl tracking-tighter animate-bounce">L</span>
          </div>
          
          
          <div className="absolute inset-[-20px] rounded-full border border-white/5 animate-[spin_4s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
          </div>
          <div className="absolute inset-[-40px] rounded-full border border-white/5 animate-[spin_6s_linear_infinite_reverse]">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          </div>
        </div>

        
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {message}
          </h2>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-4">
            LiveDesk Pro &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}

export default Loading;
