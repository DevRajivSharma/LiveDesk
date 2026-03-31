import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useSocketContext } from '../contexts/SocketContext';
import { AudioRouter, VADProcessor } from '../utils/AudioSubsystem';
import toast from 'react-hot-toast';

const RemoteAudio = memo(({ stream, userId, audioRouter }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      console.log(`[AudioSubsystem] Attaching stream from user: ${userId}`);
      audioRef.current.srcObject = stream;
      
      const playAudio = () => {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(err => {
            console.warn(`[AudioSubsystem] Autoplay blocked for ${userId}, waiting for interaction`, err);
          });
        }
      };

      playAudio();
      audioRouter?.ensureAudioContext();

      const handleTrackChange = () => {
        console.log(`[AudioSubsystem] Remote track state changed for ${userId}`);
        playAudio();
      };
      const handleInteraction = () => {
        audioRouter?.ensureAudioContext();
        playAudio();
      };

      stream.getTracks().forEach(t => {
        t.onunmute = handleTrackChange;
        t.onmute = handleTrackChange;
        t.onended = handleTrackChange;
      });
      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchstart', handleInteraction);

      return () => {
        stream.getTracks().forEach(t => {
          t.onunmute = null;
          t.onmute = null;
          t.onended = null;
        });
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, [stream, userId, audioRouter]);

  return (
    <audio 
      ref={audioRef} 
      autoPlay 
      playsInline 
      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} 
    />
  );
});

function Sidebar({ isOpen, onClose, roomId, settings, onSettingsChange }) {
  const { users, currentUser, socket } = useSocketContext();
  if (!currentUser) return null;

  const isAdmin = settings?.adminId === currentUser?.id;

  const [isMuted, setIsMuted] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> MediaStream
  const [speakingUsers, setSpeakingUsers] = useState({}); // userId -> boolean

  const audioRouterRef = useRef(null);
  const vadsRef = useRef({}); // userId -> VADProcessor
  const isMicLocked = settings?.lockMic && !isAdmin;
  const isInitializingMicRef = useRef(false);

  const isMutedRef = useRef(isMuted);
  const localStreamRef = useRef(localStream);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  const setupVAD = useCallback((userId, stream) => {
    if (!audioRouterRef.current) return;
    
    if (vadsRef.current[userId]) vadsRef.current[userId].stop();

    vadsRef.current[userId] = new VADProcessor(
      audioRouterRef.current.getAudioContext(),
      stream,
      (isSpeaking) => {
        setSpeakingUsers(prev => {
          if (prev[userId] === isSpeaking) return prev;
          return { ...prev, [userId]: isSpeaking };
        });
        
        if (userId === currentUser.id) {
          socket?.emit('speaking-state-change', { roomId, userId, isSpeaking });
        }
      }
    );
  }, [socket, roomId, currentUser.id]);

  const teardownVAD = useCallback((userId) => {
    if (vadsRef.current[userId]) {
      vadsRef.current[userId].stop();
      delete vadsRef.current[userId];
    }
    setSpeakingUsers(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  }, []);

  
  const initMic = useCallback(async (force = false) => {
    if (isInitializingMicRef.current) {
      console.warn('[AudioSubsystem] Mic initialization already in progress...');
      return localStreamRef.current;
    }
    if (localStreamRef.current && !force) return localStreamRef.current;
    
    isInitializingMicRef.current = true;
    try {
      console.log('[AudioSubsystem] Protocol: Initializing local microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: { ideal: true }, 
          noiseSuppression: { ideal: true }, 
          autoGainControl: { ideal: true },
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 },
          latency: { ideal: 0.01 }
        }
      });
      
      console.log('[AudioSubsystem] Local microphone initialized successfully');
      stream.getAudioTracks().forEach(t => {
        t.enabled = !isMutedRef.current;
        console.log(`[AudioSubsystem] Initial track state for ${t.id}: ${t.enabled ? 'ENABLED' : 'MUTED'}`);
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream; // Update ref immediately
      audioRouterRef.current?.setLocalStream(stream);
      setupVAD(currentUser.id, stream);

      stream.getAudioTracks()[0].onended = () => {
        console.warn('[AudioSubsystem] Local mic track ended unexpectedly. Attempting recovery...');
        setTimeout(() => initMic(true), 2000);
      };

      return stream;
    } catch (err) {
      console.error('[AudioSubsystem] Critical Error: Mic access denied or failed:', err);
      toast.error('Microphone access failed. Please check permissions.');
      return null;
    } finally {
      isInitializingMicRef.current = false;
    }
  }, [currentUser.id, setupVAD]);

  useEffect(() => {
    if (!audioRouterRef.current && socket) {
      audioRouterRef.current = new AudioRouter(
        socket,
        roomId,
        currentUser.id,
        (userId, stream) => {
          setRemoteStreams(prev => ({ ...prev, [userId]: stream }));
          setupVAD(userId, stream);
        },
        (userId) => {
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
          teardownVAD(userId);
        }
      );
    }

    if (!localStreamRef.current) initMic();

    const handleInteraction = () => audioRouterRef.current?.ensureAudioContext();
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    const healthInterval = setInterval(() => {
      audioRouterRef.current?.checkHealth();
    }, 15000);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      clearInterval(healthInterval);
      audioRouterRef.current?.dispose();
    };
  }, [socket, roomId, currentUser.id, initMic, setupVAD, teardownVAD]);

  useEffect(() => {
    if (!socket || !audioRouterRef.current) return;

    const onOffer = ({ offer, fromUserId }) => audioRouterRef.current.handleOffer(fromUserId, offer);
    const onAnswer = ({ answer, fromUserId }) => audioRouterRef.current.handleAnswer(fromUserId, answer);
    const onIce = ({ candidate, fromUserId }) => audioRouterRef.current.handleIce(fromUserId, candidate);
    const onUserJoined = (user) => {
      if (user.id !== currentUser.id) audioRouterRef.current.initiateConnection(user.id);
    };
    const onUserLeft = ({ userId }) => audioRouterRef.current.cleanupPeer(userId);
    const onSpeakingUpdate = ({ userId, isSpeaking }) => {
      setSpeakingUsers(prev => ({ ...prev, [userId]: isSpeaking }));
    };

    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIce);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('speaking-update', onSpeakingUpdate);

    users.forEach(user => {
      if (user.id !== currentUser.id) audioRouterRef.current.initiateConnection(user.id);
    });

    return () => {
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIce);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('speaking-update', onSpeakingUpdate);
    };
  }, [socket, users, currentUser.id]);

  useEffect(() => {
    if (!audioRouterRef.current || !users?.length) return;
    const ensureConnections = () => {
      users.forEach(user => {
        if (user.id !== currentUser.id) {
          audioRouterRef.current?.initiateConnection(user.id);
        }
      });
    };
    ensureConnections();
    const reconnectInterval = setInterval(ensureConnections, 7000);
    return () => clearInterval(reconnectInterval);
  }, [users, currentUser.id]);

  const handleMuteToggle = async () => {
    if (isMicLocked) return;
    const nextMuteState = !isMutedRef.current;
    
    try {
      let stream = localStreamRef.current;
      if (!stream) {
        console.warn('[AudioSubsystem] No local stream found during toggle. Re-initializing...');
        stream = await initMic(true);
      }

      if (stream) {
        const tracks = stream.getAudioTracks();
        const hasLiveTrack = tracks.some(track => track.readyState === 'live');
        if (!hasLiveTrack) {
          console.warn('[AudioSubsystem] No live audio track found. Recreating microphone stream...');
          stream = await initMic(true);
        }

        const activeStream = stream || localStreamRef.current;
        if (!activeStream) {
          toast.error('Failed to access microphone');
          return;
        }

        activeStream.getAudioTracks().forEach(track => {
          if (track.readyState !== 'live') {
            console.warn(`[AudioSubsystem] Ignoring non-live track ${track.id} (${track.readyState})`);
            return;
          }
          track.enabled = !nextMuteState;
          console.log(`[AudioSubsystem] Local mic track ${track.id} state changed: ${track.enabled ? 'ENABLED' : 'MUTED'}`);
        });

        audioRouterRef.current?.ensureAudioContext();
        audioRouterRef.current?.setLocalStream(activeStream);
        isMutedRef.current = nextMuteState;
        setIsMuted(nextMuteState);
        socket?.emit('mic-status-change', { roomId, userId: currentUser.id, isMuted: nextMuteState });
      }
    } catch (err) {
      console.error('[AudioSubsystem] Mute toggle failed:', err);
      toast.error('Failed to toggle microphone');
    }
  };

  useEffect(() => {
    if (isMicLocked && !isMuted) {
      if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
      isMutedRef.current = true;
      setIsMuted(true);
    }
  }, [isMicLocked, isMuted]);

  const handleToggleSetting = (key) => {
    if (!isAdmin) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    onSettingsChange(newSettings);
    socket?.emit('room-settings-update', { roomId, settings: newSettings });
  };

  const handleKickUser = (userId) => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to remove this user?')) {
      socket?.emit('admin-kick-user', { roomId, targetUserId: userId });
    }
  };

  return (
    <>
      <div className="sr-only">
        {Object.entries(remoteStreams).map(([uid, stream]) => (
          <RemoteAudio key={uid} stream={stream} userId={uid} audioRouter={audioRouterRef.current} />
        ))}
      </div>

      
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      
      <div className={`fixed top-0 right-0 h-full w-[350px] bg-[#0f0f0f] border-l border-white/5 z-[90] shadow-2xl transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">

          
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#141414]">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Management</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Room Control Center</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-none transition-colors text-slate-500 hover:text-white border border-transparent hover:border-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-[#0a0a0a]">
            
            <section>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Voice Communication</h3>
              <div className="bg-[#111] rounded-none p-5 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-none flex items-center justify-center transition-all duration-500 ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}>
                      {isMuted ? '🔇' : '🎙️'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest">{isMuted ? 'Protocol: Muted' : 'Protocol: Active'}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {isMicLocked ? 'Locked by Host' : 'Real-time Channel'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleMuteToggle}
                    disabled={isMicLocked}
                    className={`w-14 h-7 rounded-none transition-all duration-300 relative border ${isMuted ? 'bg-black border-white/10' : 'bg-blue-600 border-blue-400'} ${isMicLocked ? 'opacity-20 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 transition-all duration-300 ${isMuted ? 'left-1 bg-slate-700' : 'left-8 bg-white shadow-lg'}`} />
                  </button>
                </div>
              </div>
            </section>

            
            <section className={isAdmin ? 'block' : 'opacity-30 pointer-events-none'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">System Controls</h3>
                {isAdmin && <span className="text-[9px] bg-blue-600/20 text-blue-400 px-2 py-1 border border-blue-600/30 font-black uppercase tracking-widest">Admin_Authorized</span>}
              </div>
              <div className="bg-[#111] rounded-none border border-white/5 divide-y divide-white/5">
                {[
                  { key: 'lockEditor', label: 'Lock Code Editor', sub: 'Read-only access' },
                  { key: 'lockWhiteboard', label: 'Lock Whiteboard', sub: 'Drawing disabled' },
                  { key: 'lockMic', label: 'Disable Mic for All', sub: 'Force mute protocol' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-widest">{label}</p>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{sub}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting(key)}
                      className={`w-12 h-6 rounded-none transition-all relative border ${settings?.[key] ? 'bg-blue-600 border-blue-400' : 'bg-black border-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 transition-all ${settings?.[key] ? 'left-7 bg-white' : 'left-1 bg-slate-800'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Operatives</h3>
                <span className="bg-white/5 border border-white/10 text-white text-[10px] font-black px-3 py-1 tracking-widest">{users.length}</span>
              </div>
              <div className="space-y-3">
                {users.map((user) => {
                  const isYou = user.id === currentUser?.id;
                  const isHost = user.id === settings?.adminId;
                  const isUserSpeaking = speakingUsers[user.id];
                  const isUserMuted = user.isMuted ?? true;

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-none border transition-all duration-300 ${
                        isYou
                          ? 'bg-blue-600/5 border-blue-600/30'
                          : 'bg-[#111] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-none flex items-center justify-center text-white font-black text-sm shadow-2xl transition-all duration-300 border-2 ${isUserSpeaking ? 'scale-105 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'border-white/10'}`}
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          {isUserSpeaking && (
                            <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-[#0a0a0a] flex items-center justify-center text-[10px]">🎙️</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black uppercase tracking-widest ${isYou ? 'text-blue-400' : 'text-slate-200'}`}>{user.name}</span>
                            {isYou && <span className="text-[8px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-none font-black uppercase tracking-tighter border border-blue-600/30">Self</span>}
                            {isHost && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-none font-black uppercase tracking-tighter border border-yellow-500/30">Host</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {isUserSpeaking ? (
                              <div className="flex gap-0.5 items-center">
                                <div className="w-0.5 h-2 bg-blue-500 animate-[bounce_0.8s_infinite_0.1s]" />
                                <div className="w-0.5 h-3 bg-blue-500 animate-[bounce_0.8s_infinite_0.2s]" />
                                <div className="w-0.5 h-2 bg-blue-500 animate-[bounce_0.8s_infinite_0.3s]" />
                                <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest ml-1.5">Talking...</span>
                              </div>
                            ) : (
                              <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{isUserMuted ? 'Muted' : 'Standby'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && !isYou && (
                          <button
                            onClick={() => handleKickUser(user.id)}
                            className="p-2 hover:bg-red-500/10 rounded-none text-slate-600 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                            title="Remove User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          
          <div className="p-6 bg-[#141414] border-t border-white/5 space-y-3">
            <button
              onClick={() => {
                const action = isAdmin ? 'terminate' : 'leave';
                if (confirm(`Are you sure you want to ${action} the session?`)) {
                  if (isAdmin) {
                    socket?.emit('admin-terminate-room', { roomId });
                  } else {
                    window.location.href = '/home';
                  }
                }
              }}
              className={`w-full py-4 font-black rounded-none transition-all duration-300 uppercase tracking-widest text-[11px] border shadow-2xl active:scale-[0.98] ${
                isAdmin
                  ? 'bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border-red-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
              }`}
            >
              {isAdmin ? 'Terminate Session' : 'Leave Session'}
            </button>
            {isAdmin && (
              <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-wider">
                Only the host can terminate the session for everyone
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
