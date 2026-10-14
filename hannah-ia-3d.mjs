import {HANNAH_FACE_URI} from './hannah-ia-face.mjs';
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
const vs='attribute vec3 a_p,a_n;attribute vec2 a_uv;uniform mat4 u_p,u_v,u_m;varying vec3 v_n;varying vec2 v_uv;void main(){v_n=mat3(u_m)*a_n;v_uv=a_uv;gl_Position=u_p*u_v*u_m*vec4(a_p,1.);}';
const fs='precision mediump float;uniform vec3 u_c;uniform sampler2D u_face;uniform float u_useFace;varying vec3 v_n;varying vec2 v_uv;void main(){vec3 n=normalize(v_n);float light=max(dot(n,normalize(vec3(-0.55,1.4,2.2))),0.);float rim=pow(1.-max(dot(n,vec3(0.,0.,1.)),0.),3.)*.08;vec3 face=texture2D(u_face,v_uv).rgb;vec3 col=mix(u_c,face,u_useFace);gl_FragColor=vec4(col*(.82+.17*light)+rim*vec3(.12,.10,.15),1.);}';
const model=(x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{const a=Math.cos(rx),b=Math.sin(rx),c=Math.cos(ry),d=Math.sin(ry),e=Math.cos(rz),f=Math.sin(rz);return new Float32Array([e*c*sx,f*c*sx,-d*sx,0,(e*d*b-f*a)*sy,(f*d*b+e*a)*sy,c*b*sy,0,(e*d*a+f*b)*sz,(f*d*a-e*b)*sz,c*a*sz,0,x,y,z,1])};
const multiply=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o};
function sphere(gl){
 const verts=[],indices=[],L=24,R=16;
 for(let i=0;i<=R;i++){const theta=i*Math.PI/R;for(let j=0;j<=L;j++){const phi=j*2*Math.PI/L,x=Math.sin(theta)*Math.cos(phi),y=Math.cos(theta),z=Math.sin(theta)*Math.sin(phi);verts.push(x,y,z,x,y,z,j/L,1-i/R)}}
 for(let i=0;i<R;i++)for(let j=0;j<L;j++){const a=i*(L+1)+j,b=a+L+1;indices.push(a,b,a+1,b,b+1,a+1)}
 const v=gl.createBuffer(),ix=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ix);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 return {v,ix,count:indices.length};
}
function portrait(gl){
 const v=[],ids=[],rows=28,cols=32;
 for(let i=0;i<=rows;i++){
  const y=1-2*i/rows;
  for(let j=0;j<=cols;j++){
   const x=-1+2*j/cols,depth=Math.sqrt(Math.max(.006,1-x*x*.88-y*y*.82));
   const nx=x*.90,ny=y*.86,nz=Math.max(.2,depth),ln=Math.hypot(nx,ny,nz);
   // Face is a genuinely curved convex mesh, not a texture on a plane.
   v.push(x*.655,y*.655,.10+.52*depth,nx/ln,ny/ln,nz/ln,j/cols,1-i/rows);
  }
 }
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;ids.push(a,b,a+1,b,b+1,a+1)}
 const vb=gl.createBuffer(),ix=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ix);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ids),gl.STATIC_DRAW);
 return {v:vb,ix,count:ids.length};
}
function compile(gl,type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function projection(r){const f=1/Math.tan(.68/2),n=.1,far=25;return new Float32Array([f/r,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0])}
export function createHannah3D({host,look='explorer',reducedMotion=false}={}){
 if(!host||typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.className='snai-3d-canvas';canvas.setAttribute('aria-hidden','true');
 let gl,program,mesh,portraitMesh,loc,faceTexture=null,textureReady=false;
 try{
  gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,premultipliedAlpha:true,powerPreference:'low-power',preserveDrawingBuffer:false});
  if(!gl)return null;
  program=gl.createProgram();const v=compile(gl,gl.VERTEX_SHADER,vs),f=compile(gl,gl.FRAGMENT_SHADER,fs);
  gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  mesh=sphere(gl);portraitMesh=portrait(gl);
  loc={p:gl.getAttribLocation(program,'a_p'),n:gl.getAttribLocation(program,'a_n'),uv:gl.getAttribLocation(program,'a_uv'),proj:gl.getUniformLocation(program,'u_p'),view:gl.getUniformLocation(program,'u_v'),world:gl.getUniformLocation(program,'u_m'),color:gl.getUniformLocation(program,'u_c'),face:gl.getUniformLocation(program,'u_face'),useFace:gl.getUniformLocation(program,'u_useFace')};
 }catch{canvas.remove();return null}
 let outfit=PALETTE[look]?look:'explorer',activity='idle',visible=false,alive=true,frame=0,clock=0,last=0,ro=null,media=null;
 const skin=rgb('#f0bda7'),hair=rgb('#281b24'),darkHair=rgb('#3c2932'),highlightHair=rgb('#583d43'),red=rgb('#ed244a'),pink=rgb('#ff6486'),white=rgb('#ffffff'),blush=rgb('#e6a2a0'),shoe=rgb('#292339'),cyan=rgb('#67edfa'),silver=rgb('#cbbde9');
 const bindMesh=chosen=>{
   gl.bindBuffer(gl.ARRAY_BUFFER,chosen.v);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,chosen.ix);
   gl.enableVertexAttribArray(loc.p);gl.enableVertexAttribArray(loc.n);gl.enableVertexAttribArray(loc.uv);
   gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,32,12);gl.vertexAttribPointer(loc.uv,2,gl.FLOAT,false,32,24);
 };
 const art=new Image();art.decoding='async';
 art.onload=()=>{
   if(!alive)return;
   try{
     const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
     faceTexture=tx;textureReady=true;host.classList.add('snai-3d-ready');start();
   }catch(error){console.info('Face texture fallback',error)}
 };
 art.onerror=()=>console.info('Hannah illustration texture could not be decoded: vector fallback retained');
 art.src=HANNAH_FACE_URI;
 const view=model(0,-.05,-5.4);
 function draw(parent,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0,portraitFace=false){
  gl.uniformMatrix4fv(loc.world,false,multiply(parent,model(x,y,z,sx,sy,sz,rx,ry,rz)));
  gl.uniform3fv(loc.color,color);
  gl.uniform1f(loc.useFace,portraitFace&&textureReady?1:0);
  const m=portraitFace?portraitMesh:mesh;bindMesh(m);
  gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);
 }
 function paint(t=0){
  if(!alive||!visible||!host.isConnected)return;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);if(w<8||h<8)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.5),cw=Math.min(512,Math.round(w*dpr)),ch=Math.min(640,Math.round(h*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;gl.viewport(0,0,cw,ch)}
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,faceTexture);gl.uniform1i(loc.face,0);
  gl.uniformMatrix4fv(loc.proj,false,projection(cw/ch));gl.uniformMatrix4fv(loc.view,false,view);
  const secs=t/1000,move=!reducedMotion,breathe=move?Math.sin(secs*1.9)*.025:0;
  const yaw=move?Math.sin(secs*.56)*.065:0,tilt=activity==='thinking'?.10:activity==='listening'?-.055:0;
  const open=activity==='speaking'?(move?.065+.070*(.5+.5*Math.sin(secs*17)):.07):.018;
  const blink=move&&Math.sin(secs*2.9)>.984?.07:1;
  const [main,detail,trim]=PALETTE[outfit].map(rgb),I=model(),body=model(0,-.54+breathe,0);
  // Soft tailored body, contrasting panel seams, and the Academy heart insignia.
  draw(body,0,0,0,.44,.55,.34,main);
  draw(body,0,-.06,.294,.33,.40,.054,detail);
  draw(body,0,.46,0,.18,.21,.19,skin);
  draw(body,0,.32,.23,.30,.08,.12,trim);
  draw(body,0,.095,.34,.13,.13,.055,trim);
  draw(body,0,.09,.393,.075,.072,.033,white);
  draw(body,0,-.45,-.09,.42,.14,.32,trim);
  draw(body,0,-.42,.27,.31,.042,.055,cyan);
  draw(body,-.26,.21,.28,.035,.12,.035,white,0,0,-.15);
  draw(body,.26,.21,.28,.035,.12,.035,white,0,0,.15);
  for(const side of [-1,1]){
   const shoulder=multiply(body,model(side*.41,.23,0,1,1,1,0,0,side*(move?.05*Math.sin(secs*2):0)-(activity==='listening'?side*.13:0)));
   draw(shoulder,side*.15,-.34,0,.17,.43,.19,main,0,0,side*.11);
   draw(shoulder,side*.22,-.70,.06,.16,.16,.15,skin);
   draw(I,side*.22,-1.38+breathe,0,.18,.31,.22,main);
   draw(I,side*.23,-1.66+breathe,.095,.25,.15,.29,shoe);
   draw(I,side*.23,-1.65+breathe,.31,.22,.037,.045,trim);
   draw(shoulder,side*.22,-.49,.20,.17,.052,.07,trim);
  }
  // Head group with actual rotation independent of torso.
  const head=multiply(model(0,.52+breathe,0),model(0,0,0,1,1,1,tilt,yaw,0));
  // Curved face + illustrated portrait material (eyes and proportions stay recognisable).
  draw(head,0,.17,-.22,.78,.80,.58,hair);
  for(const side of [-1,1]){
    draw(head,side*.61,-.24,-.12,.23,.50,.27,hair,0,0,side*.10);
    draw(head,side*.69,-.33,-.03,.13,.41,.19,darkHair,0,0,-side*.18);
  }
  draw(head,0,.05,.08,.66,.67,.53,skin);
  draw(head,0,.00,0,1,1,1,skin,0,0,0,true);
  // Natural fringe and dimensional hair volume, red bow is attached to the head.
  draw(head,0,.59,-.09,.69,.25,.42,hair);
  draw(head,-.32,.48,.40,.43,.13,.16,hair,0,0,-.20);
  draw(head,.12,.49,.40,.36,.11,.17,hair,0,0,.18);
  for(let i=0;i<7;i++){const x=-.53+i*.175;draw(head,x,.55-Math.abs(x)*.14,.38,.14,.11,.11,i%3===0?darkHair:hair,0,0,(i-3)*.13)}
  for(const side of [-1,1])for(let j=0;j<3;j++){draw(head,side*(.65+j*.017),-.25-j*.19,.02,.09,.21,.12,j%2?highlightHair:hair,0,0,side*.12)}
  if(blink<.4){for(const side of [-1,1])draw(head,side*.26,.02,.627,.14,.08,.03,skin)}
  if(activity==='speaking'){
    draw(head,0,-.272,.64,.10,open,.025,rgb('#a24453'));
    draw(head,0,-.29,.668,.07,.019,.016,pink);
  }
  // Three dimensional red bow and knot attached to rotating hair.
  const bow=multiply(head,model(-.47,.66,.35));
  draw(bow,-.17,.05,0,.24,.15,.09,red,0,-.1,.30);
  draw(bow,.17,.03,0,.24,.15,.09,red,0,-.1,-.30);
  draw(bow,-.17,.03,.08,.16,.045,.019,pink,0,0,.30);
  draw(bow,.17,.03,.08,.16,.045,.019,pink,0,0,-.30);
  draw(bow,0,0,.10,.10,.10,.07,pink);
  draw(bow,-.06,-.20,.0,.10,.19,.06,red,0,0,-.23);
 }
 function tick(t){frame=0;if(!alive||!visible||document.hidden)return;
  if(t-last>(host.clientWidth<160?42:28)){last=t;clock=t;paint(t)}
  if(!reducedMotion)frame=requestAnimationFrame(tick);
 }
 function pause(){if(frame)cancelAnimationFrame(frame);frame=0}
 function start(){pause();if(!alive||!visible||document.hidden)return;if(reducedMotion)paint(clock);else frame=requestAnimationFrame(tick)}
 function mount(next){if(!alive||!next)return;host?.classList.remove('snai-3d-ready');host=next;host.append(canvas);if(textureReady)host.classList.add('snai-3d-ready');ro?.disconnect();ro?.observe(host);start()}
 const handleVisibility=()=>document.hidden?pause():start();document.addEventListener('visibilitychange',handleVisibility);
 const onLost=e=>{e.preventDefault();pause();host.classList.remove('snai-3d-ready')};canvas.addEventListener('webglcontextlost',onLost);
 try{ro=new ResizeObserver(()=>{if(reducedMotion)paint(clock)})}catch{}
 let onReduce=null;
 try{media=matchMedia('(prefers-reduced-motion: reduce)');onReduce=()=>{reducedMotion=media.matches;start()};media.addEventListener?.('change',onReduce)}catch{}
 mount(host);
 return {
  get ready(){return alive},get textureReady(){return textureReady},get canvas(){return canvas},
  setOutfit(v){outfit=PALETTE[v]?v:'explorer';if(reducedMotion)paint(clock)},
  setActivity(v){activity=v;if(reducedMotion)paint(clock)},
  setVisible(v){visible=!!v;start()},
  mount,
  destroy(){alive=false;pause();document.removeEventListener('visibilitychange',handleVisibility);media?.removeEventListener?.('change',onReduce);ro?.disconnect();canvas.remove();host.classList.remove('snai-3d-ready');gl.deleteBuffer(mesh.v);gl.deleteBuffer(mesh.ix);gl.deleteBuffer(portraitMesh.v);gl.deleteBuffer(portraitMesh.ix);if(faceTexture)gl.deleteTexture(faceTexture);gl.deleteProgram(program)}
 };
}