import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

function RemoteAudio({ stream, userId }) {
  const audioRef = useRef();

  useEffect(() => {
    if (audioRef.current && stream) {
      console.log(`[WebRTC] Attaching remote stream from ${userId}`);
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(e => {
        console.warn(`[WebRTC] Audio autoplay blocked for ${userId}:`, e);
      });
    }
  }, [stream, userId]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

function Sidebar({ isOpen, onClose, roomId, settings, onSettingsChange }) {
  const { users, currentUser, socket } = useSocketContext();
  const isAdmin = settings?.adminId === currentUser?.id;

  const [isMuted, setIsMuted] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const pcRef = useRef({}); // userId -> RTCPeerConnection
  const [remoteStreams, setRemoteStreams] = useState({});
  const [speakingUsers, setSpeakingUsers] = useState({});
  
  const audioContextRef = useRef(null);
  const analysersRef = useRef({});
  const isMicLocked = settings?.lockMic && !isAdmin;

  // ─── 1. Initialize Local Media ──────────────────────────────────────────
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        console.log('[WebRTC] Initializing local audio...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        
        // Start muted by default
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        
        setLocalStream(stream);
        setupSpeakingDetection(stream, currentUser.id);
      } catch (err) {
        console.error('[WebRTC] Failed to get local stream:', err);
      }
    };

    if (!localStream) {
      initLocalStream();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ─── 2. Handle Mic Toggle (Track Enabled/Disabled) ──────────────────────
  const handleMuteToggle = () => {
    if (isMicLocked) return;
    const nextMuteState = !isMuted;
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMuteState;
      });
    }
    
    setIsMuted(nextMuteState);
    socket?.emit('mic-status-change', { roomId, userId: currentUser.id, isMuted: nextMuteState });
  };

  useEffect(() => {
    if (isMicLocked && !isMuted) {
      if (localStream) {
        localStream.getAudioTracks().forEach(track => track.enabled = false);
      }
      setIsMuted(true);
    }
  }, [isMicLocked]);

  // ─── 3. WebRTC Mesh Logic ───────────────────────────────────────────────
  const createPeerConnection = useCallback((targetUserId, isInitiator) => {
    if (pcRef.current[targetUserId]) return pcRef.current[targetUserId];

    console.log(`[WebRTC] Creating PC for ${targetUserId}, initiator=${isInitiator}`);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
    });

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('webrtc-ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetUserId,
          fromUserId: currentUser.id
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${targetUserId}`);
      const stream = event.streams[0];
      setRemoteStreams(prev => ({ ...prev, [targetUserId]: stream }));
      setupSpeakingDetection(stream, targetUserId);
    };

    pc.onnegotiationneeded = async () => {
      if (isInitiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket?.emit('webrtc-offer', {
            roomId,
            offer: pc.localDescription,
            targetUserId,
            fromUserId: currentUser.id
          });
        } catch (err) {
          console.error(`[WebRTC] Error creating offer for ${targetUserId}:`, err);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanupPeer(targetUserId);
      }
    };

    pcRef.current[targetUserId] = pc;
    return pc;
  }, [localStream, socket, roomId, currentUser?.id]);

  const cleanupPeer = useCallback((userId) => {
    if (pcRef.current[userId]) {
      pcRef.current[userId].close();
      delete pcRef.current[userId];
    }
    setRemoteStreams(prev => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
    teardownSpeakingDetection(userId);
  }, []);

  // ─── 4. Signaling Handlers ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !currentUser?.id || !localStream) return;

    socket.on('webrtc-offer', async ({ offer, fromUserId }) => {
      console.log(`[WebRTC] Received offer from ${fromUserId}`);
      const pc = createPeerConnection(fromUserId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', {
          roomId,
          answer: pc.localDescription,
          targetUserId: fromUserId,
          fromUserId: currentUser.id
        });
      } catch (err) {
        console.error(`[WebRTC] Error answering offer from ${fromUserId}:`, err);
      }
    });

    socket.on('webrtc-answer', async ({ answer, fromUserId }) => {
      console.log(`[WebRTC] Received answer from ${fromUserId}`);
      const pc = pcRef.current[fromUserId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error(`[WebRTC] Error setting remote description for ${fromUserId}:`, err);
        }
      }
    });

    socket.on('webrtc-ice-candidate', async ({ candidate, fromUserId }) => {
      const pc = pcRef.current[fromUserId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error(`[WebRTC] Error adding ICE candidate for ${fromUserId}:`, err);
        }
      }
    });

    socket.on('user-joined', (user) => {
      if (user.id !== currentUser.id) {
        console.log(`[WebRTC] User joined: ${user.id}, initiating connection`);
        createPeerConnection(user.id, true);
      }
    });

    socket.on('user-left', ({ userId }) => {
      console.log(`[WebRTC] User left: ${userId}, cleaning up`);
      cleanupPeer(userId);
    });

    // Proactively connect to existing users when we first join
    users.forEach(user => {
      if (user.id !== currentUser.id && !pcRef.current[user.id]) {
        createPeerConnection(user.id, true);
      }
    });

    return () => {
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket, currentUser?.id, localStream, createPeerConnection, cleanupPeer, users]);

  // ─── 5. Audio Utilities ─────────────────────────────────────────────────
  const setupSpeakingDetection = useCallback((stream, userId) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current[userId] = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analysersRef.current[userId]) return;
        analyser.getByteFrequencyData(dataArray);
        let values = 0;
        for (let i = 0; i < bufferLength; i++) values += dataArray[i];
        const average = values / bufferLength;
        const isSpeaking = average > 10;
        setSpeakingUsers(prev => ({ ...prev, [userId]: isSpeaking }));
        requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      console.warn('Speaking detection error:', e);
    }
  }, []);

  const teardownSpeakingDetection = useCallback((userId) => {
    delete analysersRef.current[userId];
    setSpeakingUsers(prev => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
  }, []);

  // ─── Admin helpers ───────────────────────────────────────────────────────
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

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden Audio Elements - Always in DOM */}
      <div className="hidden pointer-events-none invisible h-0 w-0 overflow-hidden">
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <RemoteAudio key={userId} userId={userId} stream={stream} />
        ))}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[350px] bg-[#0f0f0f] border-l border-white/5 z-[90] shadow-2xl transition-transform duration-500 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#141414]">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Management</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Room Control Center
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {/* Audio Section */}
            <section>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                Voice Communication
              </h3>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isMuted ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                      }`}
                    >
                      {isMuted ? '🔇' : '🎙️'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {isMuted ? 'Microphone Off' : 'Microphone On'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {isMicLocked ? 'Muted by host' : 'Real-time Audio'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleMuteToggle}
                    disabled={isMicLocked}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      isMuted ? 'bg-slate-700' : 'bg-primary-600'
                    } ${isMicLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        isMuted ? 'left-1' : 'left-7'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Room Settings (Admin Only) */}
            <section className={isAdmin ? 'block' : 'opacity-50 pointer-events-none'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Room Controls
                </h3>
                {isAdmin && (
                  <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-black uppercase">
                    Admin Access
                  </span>
                )}
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-2 border border-white/5 divide-y divide-white/5">
                {[
                  { key: 'lockEditor', label: 'Lock Code Editor', sub: 'Read-only for others' },
                  { key: 'lockWhiteboard', label: 'Lock Whiteboard', sub: 'Disable drawing' },
                  { key: 'lockMic', label: 'Disable Mic for All', sub: 'Force mute participants' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{sub}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting(key)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        settings?.[key] ? 'bg-primary-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          settings?.[key] ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Participants */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Participants
                </h3>
                <span className="bg-primary-600/20 text-primary-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {users.length}
                </span>
              </div>
              <div className="space-y-2">
                {users.map(user => {
                  const isYou = user.id === currentUser?.id;
                  const isHost = user.id === settings?.adminId;
                  const isUserSpeaking = speakingUsers[user.id];
                  const isUserMuted = user.isMuted ?? true;

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group ${
                        isYou
                          ? 'bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                          : 'bg-[#1a1a1a] border-white/5 hover:border-white/10 hover:translate-x-1'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg transition-all duration-300 ${
                              isUserSpeaking ? 'scale-110 ring-2 ring-green-500/50' : ''
                            }`}
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          {isUserSpeaking && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-[#0f0f0f] flex items-center justify-center text-[8px]">
                                🎙️
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${isYou ? 'text-primary-400' : 'text-slate-200'}`}>
                              {user.name}
                            </span>
                            {isYou && (
                              <span className="text-[8px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
                                You
                              </span>
                            )}
                            {isHost && (
                              <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ring-1 ring-yellow-500/40">
                                Host
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isHost ? (
                              <span className="text-[8px] text-primary-500 font-black uppercase tracking-[0.15em] flex items-center gap-1">
                                <span className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
                                Session Host
                              </span>
                            ) : (
                              <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.15em]">
                                Participant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 pr-2">
                          <span className={`text-xs transition-opacity ${isUserMuted ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                            {isUserMuted ? '🔇' : '🎙️'}
                          </span>
                        </div>
                        {isAdmin && !isYou && (
                          <button
                            onClick={() => handleKickUser(user.id)}
                            className="p-2 hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                            title="Remove User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                              fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
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

          {/* Footer */}
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
              className={`w-full py-4 font-black rounded-2xl transition-all duration-300 uppercase tracking-widest text-[11px] border shadow-lg active:scale-[0.98] ${
                isAdmin
                  ? 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-red-500/20'
                  : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border-white/5'
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