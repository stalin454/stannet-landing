// Public route metadata only. Never inspect lessons, answers or private documents here.
export const HANNAH_LOOKS=Object.freeze({
  explorer:0,
  programming:1,
  english:2,
  cybersecurity:3
});
export function resolveHannahLook(pathname=''){
  const path=String(pathname||'').split(/[?#]/,1)[0].replace(/\.html$/,'').replace(/\/$/,'');
  if(/^\/pages\/(?:programming(?:-[a-z0-9-]+)?|typing|shortcuts|fp-study)$/.test(path))return 'programming';
  if(/^\/pages\/(?:english(?:-[a-z0-9-]+)?|callan|danish(?:-[a-z0-9-]+)?|language-music)$/.test(path))return 'english';
  if(/^\/pages\/(?:cybersecurity|cyber-lab|password-security)$/.test(path))return 'cybersecurity';
  return null; // Other site sections retain the existing StanNet AI identity.
}
export function hannahSpritePosition(look){
  const index=HANNAH_LOOKS[look]??0;
  return index*100/3;
}
