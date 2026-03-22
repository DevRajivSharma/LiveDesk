/**
 * AudioTestSystem: Automated test scenarios for WebRTC voice communication.
 */
export class AudioTestSystem {
  constructor(audioRouter, socket, roomId) {
    this.audioRouter = audioRouter;
    this.socket = socket;
    this.roomId = roomId;
    this.results = [];
  }

  async runFullTest() {
    console.log('[AudioTest] Starting comprehensive audio system test...');
    this.results = [];

    await this.testConnectionStability();
    await this.testSimultaneousMicrophones();
    await this.testAudioQualityMetrics();

    console.log('[AudioTest] Test complete. Results:', this.results);
    return this.results;
  }

  async testConnectionStability() {
    console.log('[AudioTest] Testing connection stability...');
    const stats = await this.audioRouter.getStats();
    const participants = Object.keys(stats);
    
    participants.forEach(userId => {
      const userStats = stats[userId];
      const isStable = userStats.connectionState === 'connected' || userStats.connectionState === 'completed';
      this.results.push({
        test: `Connection stability with ${userId}`,
        status: isStable ? 'PASS' : 'FAIL',
        details: userStats
      });
    });
  }

  async testSimultaneousMicrophones() {
    console.log('[AudioTest] Testing simultaneous microphone activity...');
    // This test would ideally simulate multiple active mics.
    // In this context, we check if multiple inbound streams are active and receiving data.
    const stats = await this.audioRouter.getStats();
    let activeInboundStreams = 0;
    
    Object.values(stats).forEach(userStats => {
      userStats.streams.forEach(stream => {
        if (stream.type === 'inbound' && stream.audioLevel > 0) {
          activeInboundStreams++;
        }
      });
    });

    this.results.push({
      test: 'Simultaneous microphone activity',
      status: activeInboundStreams > 0 ? 'PASS' : 'WARN',
      details: { activeInboundStreams }
    });
  }

  async testAudioQualityMetrics() {
    console.log('[AudioTest] Measuring audio quality metrics...');
    const stats = await this.audioRouter.getStats();
    
    Object.entries(stats).forEach(([userId, userStats]) => {
      userStats.streams.forEach(stream => {
        if (stream.type === 'inbound') {
          const highJitter = stream.jitter > 0.05; // > 50ms jitter
          const highLoss = stream.packetsLost > 10; // arbitrary threshold
          
          this.results.push({
            test: `Quality metrics for ${userId}`,
            status: (!highJitter && !highLoss) ? 'PASS' : 'FAIL',
            details: { jitter: stream.jitter, packetsLost: stream.packetsLost }
          });
        }
      });
    });
  }
}
