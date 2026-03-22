import React from 'react';

const Logo = ({ className = "w-8 h-8", textClassName = "text-sm", showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`${className} bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-white/10`}>
        <span className="text-white font-black tracking-tighter leading-none" style={{ fontSize: 'calc(100% * 0.65)' }}>LD</span>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textClassName} font-black text-white tracking-tighter uppercase leading-none`}>LiveDesk</span>
          <span className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Professional Space</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
