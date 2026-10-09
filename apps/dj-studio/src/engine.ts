export type DeckId = 'A' | 'B' | 'C' | 'D';
export const DECKS: DeckId[] = ['A', 'B', 'C', 'D'];
export type Assignment = 'L' | 'R' | 'THRU';
export type Band = 'low' | 'mid' | 'high';
export const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));
export function crossGain(assignment: Assignment, position: number) {
  const x = (clamp(position, -1, 1) + 1) / 2;
  return assignment === 'THRU' ? 1 : assignment === 'L' ? Math.cos(x * Math.PI / 2) : Math.sin(x * Math.PI / 2);
}
export interface Channel {
  gain: GainNode; eq: Record<Band, BiquadFilterNode>; fader: GainNode;
  cross: GainNode; meter: AnalyserNode; assignment: Assignment;
}
export interface Mixer {
  channels: Record<DeckId, Channel>; master: GainNode; compressor: DynamicsCompressorNode;
  limiter: WaveShaperNode; meter: AnalyserNode;
}
export function createMixer(ctx: BaseAudioContext, destination: AudioNode): Mixer {
  const master = ctx.createGain(); master.gain.value = .7;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -3; compressor.knee.value = 0;
  compressor.ratio.value = 20; compressor.attack.value = .003; compressor.release.value = .15;
  const limiter = ctx.createWaveShaper();
  const curve = new Float32Array(8193);
  for (let i = 0; i < curve.length; i++) curve[i] = clamp(i * 2 / (curve.length - 1) - 1, -.98, .98);
  limiter.curve = curve; limiter.oversample = 'none';
  const meter = ctx.createAnalyser(); meter.fftSize = 256;
  master.connect(compressor); compressor.connect(limiter); limiter.connect(meter); meter.connect(destination);
  const channels = {} as Record<DeckId, Channel>;
  for (const id of DECKS) {
    const gain = ctx.createGain();
    const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 250;
    const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = .8;
    const high = ctx.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 4000;
    const fader = ctx.createGain(); fader.gain.value = .8;
    const cross = ctx.createGain();
    const assignment: Assignment = id === 'A' || id === 'C' ? 'L' : 'R';
    cross.gain.value = crossGain(assignment, 0);
    const channelMeter = ctx.createAnalyser(); channelMeter.fftSize = 256;
    gain.connect(low); low.connect(mid); mid.connect(high); high.connect(fader);
    fader.connect(cross); cross.connect(channelMeter); channelMeter.connect(master);
    channels[id] = { gain, eq: {low, mid, high}, fader, cross, meter: channelMeter, assignment };
  }
  return {channels, master, compressor, limiter, meter};
}
export function smooth(param: AudioParam, value: number, ctx: BaseAudioContext) {
  param.cancelScheduledValues(ctx.currentTime);
  param.setTargetAtTime(value, ctx.currentTime, .008);
}
export class Deck {
  buffer: AudioBuffer | null = null;
  source: AudioBufferSourceNode | null = null;
  gate: GainNode | null = null;
  offset = 0; anchor = 0; rate = 1; cue = 0;
  private generation = 0;
  constructor(readonly ctx: BaseAudioContext, readonly input: AudioNode) {}
  get playing() { return this.source !== null; }
  get position() {
    return clamp(this.offset + (this.playing ? (this.ctx.currentTime - this.anchor) * this.rate : 0), 0, this.buffer?.duration ?? 0);
  }
  load(buffer: AudioBuffer) { this.stop(); this.buffer = buffer; this.offset = 0; this.cue = 0; this.rate = 1; }
  play() {
    if (!this.buffer || this.playing) return;
    if (this.offset >= this.buffer.duration) this.offset = 0;
    const source = this.ctx.createBufferSource(); const gate = this.ctx.createGain();
    source.buffer = this.buffer; source.playbackRate.value = this.rate;
    gate.gain.setValueAtTime(0, this.ctx.currentTime); gate.gain.linearRampToValueAtTime(1, this.ctx.currentTime + .005);
    source.connect(gate); gate.connect(this.input);
    this.anchor = this.ctx.currentTime; this.source = source; this.gate = gate;
    const generation = ++this.generation;
    source.onended = () => {
      source.disconnect(); gate.disconnect(); source.onended = null;
      if (generation === this.generation) { this.offset = this.buffer?.duration ?? 0; this.source = null; this.gate = null; }
    };
    source.start(this.ctx.currentTime, this.offset);
  }
  pause() { this.offset = this.position; this.stop(); }
  private stop() {
    const source = this.source, gate = this.gate;
    ++this.generation; this.source = null; this.gate = null;
    if (source && gate) {
      if (this.ctx.state === 'suspended' || this.ctx.state === 'closed') {
        source.onended = null; source.stop(); source.disconnect(); gate.disconnect(); return;
      }
      gate.gain.cancelScheduledValues(this.ctx.currentTime);
      gate.gain.setValueAtTime(gate.gain.value, this.ctx.currentTime);
      gate.gain.linearRampToValueAtTime(0, this.ctx.currentTime + .005);
      source.stop(this.ctx.currentTime + .006);
    }
  }
  seek(position: number) {
    const wasPlaying = this.playing; this.stop();
    this.offset = clamp(position, 0, this.buffer?.duration ?? 0);
    if (wasPlaying && this.offset < (this.buffer?.duration ?? 0)) this.play();
  }
  setRate(rate: number) {
    this.offset = this.position; this.anchor = this.ctx.currentTime;
    this.rate = clamp(rate, .84, 1.16);
    // Immediate rate and clock update together: no drift between position and source.
    if (this.source) this.source.playbackRate.setValueAtTime(this.rate, this.ctx.currentTime);
  }
  returnToCue() { this.pause(); this.offset = this.cue; }
  unload() { this.stop(); this.buffer = null; this.offset = 0; this.cue = 0; }
}
export class AudioEngine {
  readonly mixer: Mixer;
  readonly decks: Record<DeckId, Deck>;
  cross = 0;
  constructor(readonly ctx: AudioContext) {
    this.mixer = createMixer(ctx, ctx.destination);
    this.decks = Object.fromEntries(DECKS.map(id => [id, new Deck(ctx, this.mixer.channels[id].gain)])) as Record<DeckId, Deck>;
  }
  async activate() {
    if (this.ctx.state === 'closed') throw new Error('El motor de audio está cerrado. Recarga la página.');
    if (this.ctx.state !== 'running') await this.ctx.resume();
    if (this.ctx.state !== 'running') throw new Error('El navegador ha suspendido el audio. Pulsa reproducir otra vez.');
  }
  setCross(x: number) {
    this.cross = clamp(x, -1, 1);
    for (const id of DECKS) smooth(this.mixer.channels[id].cross.gain, crossGain(this.mixer.channels[id].assignment, this.cross), this.ctx);
  }
  assign(id: DeckId, assignment: Assignment) { this.mixer.channels[id].assignment = assignment; this.setCross(this.cross); }
  reset() {
    this.setCross(0); smooth(this.mixer.master.gain, .7, this.ctx);
    for (const id of DECKS) {
      const c = this.mixer.channels[id]; this.decks[id].setRate(1);
      c.assignment = id === 'A' || id === 'C' ? 'L' : 'R';
      smooth(c.gain.gain, 1, this.ctx); smooth(c.fader.gain, .8, this.ctx);
      for (const band of ['low','mid','high'] as Band[]) smooth(c.eq[band].gain, 0, this.ctx);
    }
    this.setCross(0);
  }
  async dispose() { for (const id of DECKS) this.decks[id].unload(); await this.ctx.close(); }
}
export function peak(meter: AnalyserNode, scratch: Float32Array<ArrayBuffer>) {
  meter.getFloatTimeDomainData(scratch); let value = 0;
  for (const sample of scratch) value = Math.max(value, Math.abs(sample));
  return value;
}
