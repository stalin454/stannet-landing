/**
 * Hannah IA: actual articulated WebGL 3D avatar. No third-party dependencies,
 * no camera/microphone, no private data. Falls back to the existing 2D sprite.
 */
const PALETTE={
 explorer:['#ede7ff','#72e4f5','#d976ba'],
 programming:['#272842','#55e3ff','#9275fa'],
 english:['#f8bad6','#fff1fa','#dd6199'],
 cybersecurity:['#182942','#65eafa','#3076ba']
};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const vs='attribute vec3 a_p,a_n;uniform mat4 u_p,u_v,u_m;varying vec3 v_n;void main(){v_n=mat3(u_m)*a_n;gl_Position=u_p*u_v*u_m*vec4(a_p,1.);}';
const fs='precision mediump float;uniform vec3 u_c;varying vec3 v_n;void main(){vec3 n=normalize(v_n);float light=max(dot(n,normalize(vec3(-0.55,1.4,2.2))),0.);float rim=pow(1.-max(dot(n,vec3(0.,0.,1.)),0.),3.)*.11;gl_FragColor=vec4(u_c*(.61+.37*light)+rim*vec3(.18,.15,.21),1.);}';
const model=(x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{const a=Math.cos(rx),b=Math.sin(rx),c=Math.cos(ry),d=Math.sin(ry),e=Math.cos(rz),f=Math.sin(rz);return new Float32Array([e*c*sx,f*c*sx,-d*sx,0,(e*d*b-f*a)*sy,(f*d*b+e*a)*sy,c*b*sy,0,(e*d*a+f*b)*sz,(f*d*a-e*b)*sz,c*a*sz,0,x,y,z,1])};
const multiply=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o};
function sphere(gl){
 const verts=[],indices=[],L=24,R=16;
 for(let i=0;i<=R;i++){const theta=i*Math.PI/R;for(let j=0;j<=L;j++){const phi=j*2*Math.PI/L,x=Math.sin(theta)*Math.cos(phi),y=Math.cos(theta),z=Math.sin(theta)*Math.sin(phi);verts.push(x,y,z,x,y,z)}}
 for(let i=0;i<R;i++)for(let j=0;j<L;j++){const a=i*(L+1)+j,b=a+L+1;indices.push(a,b,a+1,b,b+1,a+1)}
 const v=gl.createBuffer(),ix=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ix);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 return {v,ix,count:indices.length};
}
function compile(gl,type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function projection(r){const f=1/Math.tan(.68/2),n=.1,far=25;return new Float32Array([f/r,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0])}
export function createHannah3D({host,look='explorer',reducedMotion=false}={}){
 if(!host||typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.className='snai-3d-canvas';canvas.setAttribute('aria-hidden','true');
 let gl,program,mesh,loc;
 try{
  gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,premultipliedAlpha:true,powerPreference:'low-power',preserveDrawingBuffer:false});
  if(!gl)return null;
  program=gl.createProgram();const v=compile(gl,gl.VERTEX_SHADER,vs),f=compile(gl,gl.FRAGMENT_SHADER,fs);
  gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  mesh=sphere(gl);
  loc={p:gl.getAttribLocation(program,'a_p'),n:gl.getAttribLocation(program,'a_n'),proj:gl.getUniformLocation(program,'u_p'),view:gl.getUniformLocation(program,'u_v'),world:gl.getUniformLocation(program,'u_m'),color:gl.getUniformLocation(program,'u_c')};
 }catch{canvas.remove();return null}
 let outfit=PALETTE[look]?look:'explorer',activity='idle',visible=false,alive=true,frame=0,clock=0,last=0,ro=null,media=null;
 const skin=rgb('#edbca5'),hair=rgb('#241726'),black=rgb('#171422'),red=rgb('#d9284d'),pink=rgb('#fa547e'),white=rgb('#ffffff'),blush=rgb('#e6a2a0'),shoe=rgb('#282037');
 const view=model(0,-.05,-5.4);
 function draw(parent,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0){
  gl.uniformMatrix4fv(loc.world,false,multiply(parent,model(x,y,z,sx,sy,sz,rx,ry,rz)));
  gl.uniform3fv(loc.color,color);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
 }
 function paint(t=0){
  if(!alive||!visible||!host.isConnected)return;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);if(w<8||h<8)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.5),cw=Math.min(512,Math.round(w*dpr)),ch=Math.min(640,Math.round(h*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;gl.viewport(0,0,cw,ch)}
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.v);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ix);
  gl.enableVertexAttribArray(loc.p);gl.enableVertexAttribArray(loc.n);
  gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,24,12);
  gl.uniformMatrix4fv(loc.proj,false,projection(cw/ch));gl.uniformMatrix4fv(loc.view,false,view);
  const secs=t/1000,move=!reducedMotion,breathe=move?Math.sin(secs*1.9)*.025:0;
  const yaw=move?Math.sin(secs*.7)*.12:0,tilt=activity==='thinking'?.13:activity==='listening'?-.09:0;
  const open=activity==='speaking'?(move?.065+.070*(.5+.5*Math.sin(secs*17)):.07):.018;
  const blink=move&&Math.sin(secs*2.9)>.984?.07:1;
  const [main,detail,trim]=PALETTE[outfit].map(rgb),I=model(),body=model(0,-.54+breathe,0);
  // Torso, tunic, collar, badge, articulated sleeves and hands.
  draw(body,0,0,0,.46,.6,.34,main);draw(body,0,-.03,.29,.35,.38,.052,detail);
  draw(body,0,.48,0,.2,.24,.21,skin);draw(body,0,.34,.24,.28,.075,.10,trim);
  draw(body,0,.095,.34,.12,.12,.05,trim);draw(body,0,.09,.39,.064,.068,.025,white);
  draw(body,0,-.47,-.08,.42,.12,.32,trim);
  for(const side of [-1,1]){
   const shoulder=multiply(body,model(side*.41,.23,0,1,1,1,0,0,side*(move?.05*Math.sin(secs*2):0)-(activity==='listening'?side*.13:0)));
   draw(shoulder,side*.15,-.34,0,.17,.43,.19,main,0,0,side*.11);
   draw(shoulder,side*.22,-.70,.06,.16,.16,.15,skin);
   draw(I,side*.22,-1.38+breathe,0,.20,.30,.22,main);
   draw(I,side*.23,-1.66+breathe,.085,.24,.14,.29,shoe);
  }
  // Head group with actual rotation independent of torso.
  const head=multiply(model(0,.52+breathe,0),model(0,0,0,1,1,1,tilt,yaw,0));
  draw(head,0,.18,-.12,.73,.77,.58,hair);
  draw(head,-.59,-.13,-.19,.21,.4,.24,hair,0,0,-.13);
  draw(head,.59,-.13,-.19,.21,.4,.24,hair,0,0,.13);
  draw(head,0,.06,.10,.65,.65,.55,skin);
  draw(head,0,.58,-.025,.64,.22,.42,hair);
  draw(head,-.29,.48,.39,.37,.19,.15,hair,0,0,-.26);
  draw(head,.21,.51,.35,.31,.18,.17,hair,0,0,.23);
  for(const side of [-1,1]){
   draw(head,side*.245,.06,.59,.114,.13*blink,.07,black);
   draw(head,side*.225,.095,.66,.028,.033*blink,.014,white);
   draw(head,side*.44,-.16,.52,.13,.06,.023,blush);
  }
  draw(head,0,-.11,.646,.05,.034,.04,rgb('#d99787'));
  draw(head,0,-.257,.62,.10,open,.032,rgb('#a34452'));
  draw(head,0,-.28,.647,.07,.018,.013,pink);
  // Three dimensional red bow and knot attached to rotating hair.
  const bow=multiply(head,model(-.50,.65,.16));
  draw(bow,-.16,.035,0,.19,.13,.085,red,0,-.1,.25);
  draw(bow,.15,.015,0,.19,.13,.085,red,0,-.1,-.25);
  draw(bow,0,0,.084,.09,.09,.065,pink);
  draw(bow,-.065,-.2,0,.1,.18,.06,red,0,0,-.23);
 }
 function tick(t){frame=0;if(!alive||!visible||document.hidden)return;
  if(t-last>(host.clientWidth<160?42:28)){last=t;clock=t;paint(t)}
  if(!reducedMotion)frame=requestAnimationFrame(tick);
 }
 function pause(){if(frame)cancelAnimationFrame(frame);frame=0}
 function start(){pause();if(!alive||!visible||document.hidden)return;if(reducedMotion)paint(clock);else frame=requestAnimationFrame(tick)}
 function mount(next){if(!alive||!next)return;host?.classList.remove('snai-3d-ready');host=next;host.append(canvas);host.classList.add('snai-3d-ready');ro?.disconnect();ro?.observe(host);start()}
 const handleVisibility=()=>document.hidden?pause():start();document.addEventListener('visibilitychange',handleVisibility);
 const onLost=e=>{e.preventDefault();pause();host.classList.remove('snai-3d-ready')};canvas.addEventListener('webglcontextlost',onLost);
 try{ro=new ResizeObserver(()=>{if(reducedMotion)paint(clock)})}catch{}
 let onReduce=null;
 try{media=matchMedia('(prefers-reduced-motion: reduce)');onReduce=()=>{reducedMotion=media.matches;start()};media.addEventListener?.('change',onReduce)}catch{}
 mount(host);
 return {
  get ready(){return alive},get canvas(){return canvas},
  setOutfit(v){outfit=PALETTE[v]?v:'explorer';if(reducedMotion)paint(clock)},
  setActivity(v){activity=v;if(reducedMotion)paint(clock)},
  setVisible(v){visible=!!v;start()},
  mount,
  destroy(){alive=false;pause();document.removeEventListener('visibilitychange',handleVisibility);media?.removeEventListener?.('change',onReduce);ro?.disconnect();canvas.remove();host.classList.remove('snai-3d-ready');gl.deleteBuffer(mesh.v);gl.deleteBuffer(mesh.ix);gl.deleteProgram(program)}
 };
}