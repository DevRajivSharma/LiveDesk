
export class VADProcessor {
  constructor(audioContext, stream, onSpeakingChange) {
    this.audioContext = audioContext;
    this.onSpeakingChange = onSpeakingChange;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.4;
    
    this.isSpeaking = false;
    this.rafId = null;
    this.threshold = 10;
    this.fadeOutDelay = 400;
    this.fadeOutTimer = null;

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.start();
  }

  start() {
    const checkVolume = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(this.dataArray);
      let values = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        values += this.dataArray[i];
      }
      const average = values / this.dataArray.length;
      const currentlySpeaking = average > this.threshold;

      if (currentlySpeaking) {
        if (this.fadeOutTimer) {
          clearTimeout(this.fadeOutTimer);
          this.fadeOutTimer = null;
        }
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this.onSpeakingChange(true);
        }
      } else {
        if (this.isSpeaking && !this.fadeOutTimer) {
          this.fadeOutTimer = setTimeout(() => {
            this.isSpeaking = false;
            this.onSpeakingChange(false);
            this.fadeOutTimer = null;
          }, this.fadeOutDelay);
        }
      }

      this.rafId = requestAnimationFrame(checkVolume);
    };
    this.rafId = requestAnimationFrame(checkVolume);
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.fadeOutTimer) clearTimeout(this.fadeOutTimer);
    this.analyser = null;
  }
}

export class AudioRouter {
  constructor(
    socket,
    roomId,
    currentUserId,
    onRemoteStream,
    onPeerLeft
  ) {
    this.socket = socket;
    this.roomId = roomId;
    this.currentUserId = currentUserId;
    this.onRemoteStream = onRemoteStream;
    this.onPeerLeft = onPeerLeft;
    this.pcs = new Map(); // targetUserId -> { pc, makingOffer, ignoreOffer }
    this.pendingIceCandidates = new Map(); // targetUserId -> RTCIceCandidateInit[]
    this.disconnectTimers = new Map(); // targetUserId -> timeoutId
    this.localStream = null;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive'
    });
    console.log(`[AudioSubsystem] AudioRouter initialized for user: ${currentUserId}`);
  }

  async setLocalStream(stream) {
    console.log(`[AudioSubsystem] Setting local stream: ${stream.id} (Tracks: ${stream.getAudioTracks().length})`);
    this.localStream = stream;
    for (const [userId, peerData] of this.pcs) {
      const { pc } = peerData;
      const senders = pc.getSenders();
      console.log(`[AudioSubsystem] Updating tracks for peer ${userId}. Current senders: ${senders.length}`);
      
      stream.getTracks().forEach(track => {
        const existingSender = senders.find(s => s.track?.kind === track.kind || (s.track === null && s.dtlsTransport));
        if (existingSender) {
          console.log(`[AudioSubsystem] Replacing ${track.kind} track for peer: ${userId}`);
          existingSender.replaceTrack(track).catch(err => {
            console.error(`[AudioSubsystem] Failed to replace ${track.kind} track for ${userId}:`, err);
          });
        } else {
          console.log(`[AudioSubsystem] Adding new ${track.kind} track for peer: ${userId}`);
          try {
            pc.addTrack(track, stream);
          } catch (err) {
            console.error(`[AudioSubsystem] Failed to add ${track.kind} track to ${userId}:`, err);
          }
        }
      });
    }
  }

  async initiateConnection(targetUserId) {
    if (this.pcs.has(targetUserId)) return;
    console.log(`[AudioSubsystem] Initiating connection to: ${targetUserId}`);
    this.getOrCreatePC(targetUserId);
  }

  async handleOffer(fromUserId, offer) {
    const peerData = this.getOrCreatePC(fromUserId);
    const { pc } = peerData;
    
    try {
      const isPolite = this.currentUserId < fromUserId;
      const offerCollision = peerData.makingOffer || pc.signalingState !== 'stable';
      
      peerData.ignoreOffer = !isPolite && offerCollision;
      if (peerData.ignoreOffer) {
        console.warn(`[AudioSubsystem] Ignoring offer collision from ${fromUserId} (impolite)`);
        return;
      }

      console.log(`[AudioSubsystem] Handling offer from ${fromUserId}`);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await this.flushIceQueue(fromUserId);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      this.socket.emit('webrtc-answer', {
        roomId: this.roomId,
        answer: pc.localDescription,
        targetUserId: fromUserId,
        fromUserId: this.currentUserId
      });
    } catch (err) {
      console.error(`[AudioSubsystem] Offer handling error from ${fromUserId}:`, err);
    }
  }

  async handleAnswer(fromUserId, answer) {
    const peerData = this.pcs.get(fromUserId);
    if (peerData) {
      const { pc } = peerData;
      try {
        console.log(`[AudioSubsystem] Handling answer from ${fromUserId}`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await this.flushIceQueue(fromUserId);
      } catch (err) {
        console.error(`[AudioSubsystem] Answer handling error from ${fromUserId}:`, err);
      }
    }
  }

  async handleIce(fromUserId, candidate) {
    const peerData = this.pcs.get(fromUserId);
    if (!peerData) {
      this.queueIceCandidate(fromUserId, candidate);
      return;
    }
    const { pc } = peerData;
    try {
      if (!pc.remoteDescription) {
        this.queueIceCandidate(fromUserId, candidate);
        return;
      }
      console.log(`[AudioSubsystem] Handling ICE candidate from ${fromUserId}`);
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      if (!peerData.ignoreOffer) {
        console.error(`[AudioSubsystem] ICE handling error from ${fromUserId}:`, err);
      }
      this.queueIceCandidate(fromUserId, candidate);
    }
  }

  queueIceCandidate(userId, candidate) {
    if (!candidate) return;
    const queue = this.pendingIceCandidates.get(userId) || [];
    queue.push(candidate);
    this.pendingIceCandidates.set(userId, queue);
    console.log(`[AudioSubsystem] Queued ICE candidate for ${userId}. Queue length: ${queue.length}`);
  }

  async flushIceQueue(userId) {
    const queue = this.pendingIceCandidates.get(userId);
    const peerData = this.pcs.get(userId);
    if (!queue?.length || !peerData?.pc?.remoteDescription) return;
    const { pc } = peerData;
    console.log(`[AudioSubsystem] Flushing ${queue.length} queued ICE candidates for ${userId}`);
    this.pendingIceCandidates.delete(userId);
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(`[AudioSubsystem] Failed queued ICE candidate for ${userId}:`, err);
      }
    }
  }

  getOrCreatePC(userId) {
    let peerData = this.pcs.get(userId);
    if (!peerData) {
      console.log(`[AudioSubsystem] Creating PeerConnection for: ${userId}`);
      const pc = this.createPC(userId);
      peerData = { pc, makingOffer: false, ignoreOffer: false };
      this.pcs.set(userId, peerData);
      
      if (this.localStream) {
        console.log(`[AudioSubsystem] Adding local tracks to PC for: ${userId}`);
        this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
      }
    }
    return peerData;
  }

  createPC(targetUserId) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit('webrtc-ice-candidate', {
          roomId: this.roomId, candidate, targetUserId, fromUserId: this.currentUserId
        });
      }
    };

    pc.ontrack = ({ streams: [stream] }) => {
      console.log(`[AudioSubsystem] Received remote track from: ${targetUserId}`);
      this.onRemoteStream(targetUserId, stream);
      this.ensureAudioContext();
    };

    pc.onnegotiationneeded = async () => {
      try {
        const peerData = this.pcs.get(targetUserId);
        if (!peerData) return;
        
        peerData.makingOffer = true;
        console.log(`[AudioSubsystem] Negotiating connection with: ${targetUserId}`);
        await pc.setLocalDescription();
        this.socket.emit('webrtc-offer', {
          roomId: this.roomId,
          offer: pc.localDescription,
          targetUserId,
          fromUserId: this.currentUserId
        });
      } catch (err) {
        console.error(`[AudioSubsystem] Negotiation error for ${targetUserId}:`, err);
      } finally {
        const peerData = this.pcs.get(targetUserId);
        if (peerData) peerData.makingOffer = false;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[AudioSubsystem] ICE connection state for ${targetUserId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[AudioSubsystem] Connection FAILED with ${targetUserId}, attempting ICE restart...`);
        pc.restartIce();
      } else if (pc.iceConnectionState === 'disconnected') {
        if (this.disconnectTimers.has(targetUserId)) clearTimeout(this.disconnectTimers.get(targetUserId));
        const timerId = setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            console.warn(`[AudioSubsystem] Peer ${targetUserId} still disconnected. Attempting ICE restart.`);
            pc.restartIce();
          }
        }, 10000);
        this.disconnectTimers.set(targetUserId, timerId);
      } else if (pc.iceConnectionState === 'closed') {
        this.cleanupPeer(targetUserId);
      } else {
        if (this.disconnectTimers.has(targetUserId)) {
          clearTimeout(this.disconnectTimers.get(targetUserId));
          this.disconnectTimers.delete(targetUserId);
        }
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`[AudioSubsystem] Signaling state for ${targetUserId}: ${pc.signalingState}`);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[AudioSubsystem] Connection state for ${targetUserId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        console.warn(`[AudioSubsystem] Full connection failure for ${targetUserId}. Restarting ICE.`);
        pc.restartIce();
      }
    };

    return pc;
  }

  async checkHealth() {
    console.log('[AudioSubsystem] Periodic health check...');
    for (const [userId, peerData] of this.pcs) {
      const { pc } = peerData;
      if (
        ['failed', 'closed'].includes(pc.connectionState) ||
        ['failed', 'closed'].includes(pc.iceConnectionState)
      ) {
        console.warn(`[AudioSubsystem] Unhealthy connection detected for ${userId}. Restarting...`);
        this.cleanupPeer(userId);
        this.initiateConnection(userId);
      } else if (pc.connectionState === 'disconnected' || pc.iceConnectionState === 'disconnected') {
        console.warn(`[AudioSubsystem] Connection to ${userId} is disconnected. Triggering ICE restart.`);
        pc.restartIce();
      }
    }
  }

  cleanupPeer(userId) {
    const peerData = this.pcs.get(userId);
    if (peerData) {
      console.log(`[AudioSubsystem] Cleaning up peer: ${userId}`);
      peerData.pc.close();
      this.pcs.delete(userId);
    }
    if (this.disconnectTimers.has(userId)) {
      clearTimeout(this.disconnectTimers.get(userId));
      this.disconnectTimers.delete(userId);
    }
    this.pendingIceCandidates.delete(userId);
    this.onPeerLeft(userId);
  }

  ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  getAudioContext() {
    return this.audioContext;
  }

  async getStats() {
    const allStats = {};
    for (const [userId, peerData] of this.pcs) {
      const stats = await peerData.pc.getStats();
      const userStats = {
        connectionState: peerData.pc.connectionState,
        iceConnectionState: peerData.pc.iceConnectionState,
        signalingState: peerData.pc.signalingState,
        streams: []
      };
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          userStats.streams.push({
            type: 'inbound',
            jitter: report.jitter,
            packetsLost: report.packetsLost,
            audioLevel: report.audioLevel
          });
        }
      });
      allStats[userId] = userStats;
    }
    return allStats;
  }

  dispose() {
    console.log('[AudioSubsystem] Disposing AudioRouter');
    this.pcs.forEach(peerData => peerData.pc.close());
    this.pcs.clear();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
