// ============================================================================
// PROCEDURAL WEB AUDIO ENGINE — SPATIAL MALL SOUNDSCAPE & INTERACTION SFX
// ============================================================================

export class MallAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.started = false;
    this.masterGain = null;
    this.waterfallGain = null;
    this.surfGain = null;
    this.turbineOsc = null;
    this.turbineGain = null;
  }

  init() {
    if (this.started || !this.enabled) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.ctx.destination);

    // Create 3-second looping pink-ish noise buffer for waterfall, surf & soft mall murmur
    const sr = this.ctx.sampleRate;
    const len = sr * 3;
    const noiseBuf = this.ctx.createBuffer(1, len, sr);
    const data = noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.04) * 0.45;
    }

    // 1. Soft Concourse Murmur
    const concourseSrc = this.ctx.createBufferSource();
    concourseSrc.buffer = noiseBuf;
    concourseSrc.loop = true;
    const concourseFilter = this.ctx.createBiquadFilter();
    concourseFilter.type = 'bandpass';
    concourseFilter.frequency.value = 420;
    concourseFilter.Q.value = 0.7;
    const concourseGain = this.ctx.createGain();
    concourseGain.gain.value = 0.09;
    concourseSrc.connect(concourseFilter).connect(concourseGain).connect(this.masterGain);
    concourseSrc.start();

    // 2. Spatial Rainforest Waterfall Stream
    const wfSrc = this.ctx.createBufferSource();
    wfSrc.buffer = noiseBuf;
    wfSrc.loop = true;
    const wfFilter = this.ctx.createBiquadFilter();
    wfFilter.type = 'lowpass';
    wfFilter.frequency.value = 1350;
    this.waterfallGain = this.ctx.createGain();
    this.waterfallGain.gain.value = 0.0;
    wfSrc.connect(wfFilter).connect(this.waterfallGain).connect(this.masterGain);
    wfSrc.start();

    // 3. Spatial FlowRider Wave Rush
    const surfSrc = this.ctx.createBufferSource();
    surfSrc.buffer = noiseBuf;
    surfSrc.loop = true;
    const surfFilter = this.ctx.createBiquadFilter();
    surfFilter.type = 'bandpass';
    surfFilter.frequency.value = 980;
    this.surfGain = this.ctx.createGain();
    this.surfGain.gain.value = 0.0;
    surfSrc.connect(surfFilter).connect(this.surfGain).connect(this.masterGain);
    surfSrc.start();

    // 4. Spatial AirRider Wind Tunnel Turbine Drone
    this.turbineOsc = this.ctx.createOscillator();
    this.turbineOsc.type = 'sawtooth';
    this.turbineOsc.frequency.value = 115;
    const turbFilter = this.ctx.createBiquadFilter();
    turbFilter.type = 'lowpass';
    turbFilter.frequency.value = 280;
    this.turbineGain = this.ctx.createGain();
    this.turbineGain.gain.value = 0.0;
    this.turbineOsc.connect(turbFilter).connect(this.turbineGain).connect(this.masterGain);
    this.turbineOsc.start();

    this.started = true;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled && !this.started) {
      this.init();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? 0.35 : 0.0, this.ctx.currentTime, 0.1);
    }
    return this.enabled;
  }

  updateSpatial(playerPos) {
    if (!this.started || !this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    // Distance to Rainforest Waterfall (38, 3, 9)
    const dWaterfall = Math.hypot(playerPos.x - 38, (playerPos.y - 3) * 0.8, playerPos.z - 6);
    const wfVol = Math.max(0, 1 - dWaterfall / 36) * 0.34;
    this.waterfallGain.gain.setTargetAtTime(wfVol, now, 0.15);

    // Distance to LG601 FlowRider (-175, 1, 0)
    const dSurf = Math.hypot(playerPos.x + 175, playerPos.y - 1, playerPos.z);
    const surfVol = Math.max(0, 1 - dSurf / 28) * 0.32;
    this.surfGain.gain.setTargetAtTime(surfVol, now, 0.15);

    // Distance to S601 WINDLAB (-170, 19, -13)
    const dTurb = Math.hypot(playerPos.x + 170, playerPos.y - 19, playerPos.z + 13);
    const turbVol = Math.max(0, 1 - dTurb / 26) * 0.14;
    this.turbineGain.gain.setTargetAtTime(turbVol, now, 0.15);
  }

  playTone(freq, duration = 0.25, type = 'sine', gainVal = 0.18, delay = 0) {
    if (!this.started || !this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + duration);
    osc.connect(g).connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playChime(kind = 'stamp') {
    if (!this.started) this.init();
    if (kind === 'elevator') {
      this.playTone(784, 0.38, 'sine', 0.18, 0);
      this.playTone(659.25, 0.5, 'sine', 0.16, 0.18);
    } else if (kind === 'bell') {
      this.playTone(1046.5, 0.85, 'triangle', 0.2, 0);
      this.playTone(1568.0, 0.65, 'sine', 0.12, 0.05);
    } else if (kind === 'splash') {
      this.playTone(320, 0.16, 'sine', 0.15, 0);
      this.playTone(520, 0.22, 'sine', 0.12, 0.08);
    } else {
      // ONECARD Stamp celebration arpeggio!
      this.playTone(523.25, 0.22, 'triangle', 0.16, 0.0);
      this.playTone(659.25, 0.22, 'triangle', 0.16, 0.09);
      this.playTone(783.99, 0.26, 'triangle', 0.16, 0.18);
      this.playTone(1046.5, 0.48, 'sine', 0.2, 0.27);
    }
  }
}
