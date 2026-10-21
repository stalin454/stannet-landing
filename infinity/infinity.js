'use strict';
const skyline=document.querySelector('#skyline');
for(let i=0;i<36;i++){
 const tower=document.createElement('div');tower.className='tower';
 tower.style.setProperty('--left',(i*3.1-3)+'%');tower.style.setProperty('--width',(2.5+i*7%5)+'%');tower.style.setProperty('--height',(15+i*17%45)+'%');skyline.append(tower);
}
const canvas=document.querySelector('#universe'),ctx=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),button=document.querySelector('.motion-toggle');
const video=document.querySelector('video'),intro=document.querySelector('.city-scene');
let paused=false,visible=true,videoFailed=false,frame=0,last=0,time=0,w=0,h=0,points=[],mx=0,my=0,progress=0,background;
function moving(){return !reduced.matches&&!paused&&!document.hidden;}
function resize(){
 w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,w<700?1.25:1.5);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 background=ctx.createRadialGradient(w/2,h/2,5,w/2,h/2,Math.max(w,h)*.65);
 background.addColorStop(0,'#0e2949');background.addColorStop(1,'#020610');
 points=Array.from({length:Math.min(w<700?150:300,Math.round(w*h/3500))},()=>({a:Math.random()*Math.PI*2,z:Math.random(),s:Math.random()*2+.5}));
 scroll();if(!moving())paint(0);
}
function scroll(){progress=scrollY/Math.max(1,document.documentElement.scrollHeight-h);if(!moving())paint(0);}
function paint(dt){
 if(!ctx)return;time+=dt*.48;ctx.fillStyle=background;ctx.fillRect(0,0,w,h);
 const tunnel=progress>.25&&progress<.75;
 for(const p of points){
  const z=(p.z+time*(tunnel?.22:.035))%1,r=(tunnel?z*z:z)*Math.max(w,h)*.8;
  const x=w/2+Math.cos(p.a)*r+mx*25*(1-z),y=h/2+Math.sin(p.a)*r*.7+my*25*(1-z);
  ctx.beginPath();ctx.arc(x,y,Math.max(.4,z*2.8*p.s),0,Math.PI*2);ctx.fillStyle='rgba(94,229,255,'+(.15+z*.8)+')';ctx.fill();
 }
}
function tick(now){frame=0;if(!moving())return;paint(last?Math.min((now-last)/1000,.05):0);last=now;frame=requestAnimationFrame(tick);}
function sync(){
 cancelAnimationFrame(frame);frame=0;last=0;
 document.body.classList.toggle('motion-paused',!moving());
 button.textContent=reduced.matches?'Movimiento reducido':paused?'Reanudar movimiento':'Pausar movimiento';
 button.setAttribute('aria-pressed',String(paused||reduced.matches));button.disabled=reduced.matches;
 if(moving()&&ctx)frame=requestAnimationFrame(tick);else paint(0);
 if(moving()&&visible&&!videoFailed){
  const source=video.querySelector('source');if(!source.hasAttribute('src')){source.src=source.dataset.src;video.load();}
  video.play().catch(()=>{intro.classList.remove('video-ready');});
 }else video.pause();
}
video.addEventListener('playing',()=>intro.classList.add('video-ready'));
function fail(){videoFailed=true;intro.classList.remove('video-ready');video.pause();}
video.addEventListener('error',fail);video.querySelector('source').addEventListener('error',fail);
button.addEventListener('click',()=>{paused=!paused;sync();});
reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
addEventListener('resize',resize,{passive:true});addEventListener('scroll',scroll,{passive:true});
addEventListener('pointermove',e=>{if(moving()){mx=(e.clientX/w-.5)*2;my=(e.clientY/h-.5)*2;}},{passive:true});
resize();sync();
if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(intro);
