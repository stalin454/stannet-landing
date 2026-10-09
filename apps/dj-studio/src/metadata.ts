export interface Tags { title?: string; artist?: string; bpm?: number }
const syncSafe = (b: Uint8Array, at: number) => ((b[at] & 127) << 21) | ((b[at+1] & 127) << 14) | ((b[at+2] & 127) << 7) | (b[at+3] & 127);
export function parseID3(bytes: ArrayBuffer): Tags {
  const b = new Uint8Array(bytes), out: Tags = {};
  if (b.length < 10 || String.fromCharCode(...b.slice(0,3)) !== 'ID3' || ![3,4].includes(b[3]) || (b[5] & 0xc0)) return out;
  const version = b[3], end = Math.min(b.length, 10 + syncSafe(b,6));
  const view = new DataView(bytes); let at = 10;
  // Extended header sizes differ between ID3v2.3 and v2.4.
  if (b[5] & 0x40) { if (at + 4 > end) return out; at += version === 4 ? syncSafe(b,at) : 4 + view.getUint32(at); }
  while (at + 10 <= end) {
    const id = String.fromCharCode(...b.slice(at,at+4));
    const size = version === 4 ? syncSafe(b,at+4) : view.getUint32(at+4);
    if (!size || at + 10 + size > end || !/^[A-Z0-9]{4}$/.test(id)) break;
    if (['TIT2','TPE1','TBPM'].includes(id) && b[at+9] === 0) {
      const data = b.slice(at+10,at+10+size); const encoding = data[0];
      let label = encoding === 3 ? 'utf-8' : encoding === 2 ? 'utf-16be' : encoding === 1 ? 'utf-16le' : 'windows-1252';
      if (encoding === 1 && data[1] === 0xfe && data[2] === 0xff) label = 'utf-16be';
      const text = new TextDecoder(label).decode(data.slice(1)).replace(/\0/g,'').trim();
      if (id === 'TIT2') out.title = text.slice(0,200);
      if (id === 'TPE1') out.artist = text.slice(0,200);
      if (id === 'TBPM' && Number.isFinite(Number(text)) && Number(text) >= 20 && Number(text) <= 400) out.bpm = Number(text);
    }
    at += 10 + size;
  }
  return out;
}
export interface WaveBin { peak: number; color: number }
export async function waveform(buffer: AudioBuffer, count = 700): Promise<WaveBin[]> {
  const bins: WaveBin[] = []; const channels = Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  for (let bin = 0; bin < count; bin++) {
    const start = Math.floor(bin * buffer.length / count), end = Math.floor((bin+1) * buffer.length / count);
    let peak = 0, delta = 0, samples = 0;
    for (const data of channels) for (let i = start; i < end; i++) {
      peak = Math.max(peak, Math.abs(data[i])); delta += Math.abs(data[i] - (data[i-1] ?? 0)); samples++;
    }
    bins.push({peak, color:Math.min(1, delta / Math.max(1,samples) * 6)});
    if (bin % 70 === 0) await new Promise(resolve => setTimeout(resolve,0));
  }
  return bins;
}
