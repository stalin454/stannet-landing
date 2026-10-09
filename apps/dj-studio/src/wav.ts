export const WAV_CHANNELS = 2;
export function wavHeader(frames: number,sampleRate: number,channels = WAV_CHANNELS): ArrayBuffer {
  if (!Number.isSafeInteger(frames)||frames<0||frames*channels*2>0xffffffff-36) throw new Error('La grabación excede el tamaño WAV admitido.');
  if (!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000||channels!==2) throw new Error('Formato WAV no válido.');
  const buffer=new ArrayBuffer(44),view=new DataView(buffer);
  const text=(at:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(at+i,value.charCodeAt(i));};
  text(0,'RIFF');view.setUint32(4,36+frames*channels*2,true);text(8,'WAVE');text(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);
  text(36,'data');view.setUint32(40,frames*channels*2,true);return buffer;
}
export const wavFilename = (title: string) => `${title.replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,80)||'StanNet-mix'}.wav`;
