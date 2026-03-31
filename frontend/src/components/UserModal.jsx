import React from 'react';
import { useSocketContext } from '../contexts/SocketContext';

function UserModal({ isOpen, onClose }) {
  const { users, currentUser } = useSocketContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            Online Users ({users.length})
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        
        <div className="px-2 py-4 max-h-[60vh] overflow-y-auto bg-slate-950">
          {users.map((user) => {
            const isMe = user.id === currentUser?.id;
            return (
              <div 
                key={user.id} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isMe ? 'bg-slate-800/50 border border-slate-700' : 'hover:bg-slate-900'}`}
              >
                
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-slate-800"
                  style={{ backgroundColor: user.color || '#6366f1' }}
                >
                  {(user.name || 'A').charAt(0).toUpperCase()}
                </div>

                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200 truncate text-base">
                      {user.name || 'Anonymous'}
                    </span>
                    {isMe && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-600 text-white uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span>Active Now</span>
                  </div>
                </div>

                
                <div className="text-xs font-medium text-slate-500">
                  {new Date(user.joinedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>

        
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 hover:text-white transition-all shadow-lg active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserModal;
