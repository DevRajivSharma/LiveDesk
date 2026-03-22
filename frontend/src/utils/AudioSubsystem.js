/**
 * VADProcessor: Voice Activity Detection for real-time audio analysis.
 */
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

/**
 * AudioRouter: Manages the full-mesh WebRTC topology and AudioContext lifecycle.
 */
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
    this.localStream = null;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive'
    });
    console.log(`[AudioSubsystem] AudioRouter initialized for user: ${currentUserId}`);
  }

  async setLocalStream(stream) {
    console.log('[AudioSubsystem] Setting local stream:', stream.id);
    this.localStream = stream;
    // Update all existing PCs with new local stream tracks
    for (const [userId, peerData] of this.pcs) {
      const { pc } = peerData;
      const senders = pc.getSenders();
      stream.getTracks().forEach(track => {
        const existingSender = senders.find(s => s.track?.kind === track.kind);
        if (existingSender) {
          console.log(`[AudioSubsystem] Replacing track for peer: ${userId}`);
          existingSender.replaceTrack(track);
        } else {
          console.log(`[AudioSubsystem] Adding track for peer: ${userId}`);
          pc.addTrack(track, stream);
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
      } catch (err) {
        console.error(`[AudioSubsystem] Answer handling error from ${fromUserId}:`, err);
      }
    }
  }

  async handleIce(fromUserId, candidate) {
    const peerData = this.pcs.get(fromUserId);
    if (peerData) {
      const { pc } = peerData;
      try {
        console.log(`[AudioSubsystem] Handling ICE candidate from ${fromUserId}`);
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        if (!peerData.ignoreOffer) {
          console.error(`[AudioSubsystem] ICE handling error from ${fromUserId}:`, err);
        }
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
      ]
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
      if (['disconnected', 'closed', 'failed'].includes(pc.iceConnectionState)) {
        this.cleanupPeer(targetUserId);
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`[AudioSubsystem] Signaling state for ${targetUserId}: ${pc.signalingState}`);
    };

    return pc;
  }

  cleanupPeer(userId) {
    const peerData = this.pcs.get(userId);
    if (peerData) {
      console.log(`[AudioSubsystem] Cleaning up peer: ${userId}`);
      peerData.pc.close();
      this.pcs.delete(userId);
    }
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
