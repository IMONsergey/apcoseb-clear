import {LAND_STEP,LAND_MASK} from './land-data.js';

const TAU=Math.PI*2, RAD=Math.PI/180;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const jobs=new Set();let raf=0;
function tick(now){raf=0;jobs.forEach(job=>job(now));if(jobs.size)raf=requestAnimationFrame(tick)}
function add(job){jobs.add(job);if(!raf)raf=requestAnimationFrame(tick)}
function remove(job){jobs.delete(job);if(!jobs.size&&raf){cancelAnimationFrame(raf);raf=0}}
let cachedLand=null,cachedShell=null;
function sphere(lat,lon){const c=Math.cos(lat);return [c*Math.sin(lon),Math.sin(lat),c*Math.cos(lon)]}
function grid(step,mask){
  const points=[];let index=0;
  for(let lat=-90+step/2;lat<90;lat+=step){
    const n=Math.max(1,Math.round(360*Math.cos(lat*RAD)/step));
    for(let j=0;j<n;j++,index++)if(!mask||(mask.charCodeAt(index>>3)&(1<<(index&7))))points.push(...sphere(lat*RAD,(-180+(j+.5)*360/n)*RAD));
  }
  return new Float32Array(points);
}
function geography(){
  if(!cachedLand)cachedLand=grid(LAND_STEP,atob(LAND_MASK));
  if(!cachedShell)cachedShell=grid(3);
  return {land:cachedLand,shell:cachedShell};
}
function matrix(yaw,pitch,roll){
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch),cz=Math.cos(roll),sz=Math.sin(roll);
  return new Float32Array([
    cz*cy-sz*sx*sy,sz*cy+cz*sx*sy,-cx*sy,
    -sz*cx,cz*cx,sx,
    cz*sy+sz*sx*cy,sz*sy-cz*sx*cy,cx*cy,
  ]);
}
function project(p,m){return [m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]]}
function unproject(p,m){return [m[0]*p[0]+m[1]*p[1]+m[2]*p[2],m[3]*p[0]+m[4]*p[1]+m[5]*p[2],m[6]*p[0]+m[7]*p[1]+m[8]*p[2]]}
const VS=`
precision mediump float;
attribute vec3 a_position;
attribute float a_life;
uniform mat3 u_matrix;
uniform vec2 u_scale;
uniform float u_size;
uniform float u_kind;
varying float v_depth;
varying float v_radial;
varying float v_life;
void main(){
  vec3 p=u_matrix*a_position;
  gl_Position=vec4(p.xy*u_scale,0.,1.);
  gl_PointSize=u_size*(u_kind<1.5?(.72+.28*max(p.z,0.)):1.);
  v_depth=p.z;v_radial=length(p.xy);v_life=a_life;
}`;
const FS=`
precision mediump float;
uniform vec3 u_color;
uniform float u_kind;
varying float v_depth;
varying float v_radial;
varying float v_life;
void main(){
  float d=length((gl_PointCoord-.5)*2.);
  if(d>1.)discard;
  float a;
  if(u_kind>1.5){
    if(v_depth<.025)discard;
    float life=smoothstep(0.,.20,v_life)*(1.-smoothstep(.72,1.,v_life));
    float ring=1.-smoothstep(.02,.065,abs(d-(.65+.06*v_life)));
    a=(exp(-22.*d*d)+.23*exp(-6.*d*d)+.29*ring)*life*smoothstep(.025,.18,v_depth);
  }else{
    float center=u_kind<.5?(.08+.92*smoothstep(.22,.93,v_radial)):(.22+.78*smoothstep(.12,.95,v_radial));
    float facing=u_kind<.5?(v_depth<0.?.055:.58):(v_depth<0.?.19:.94);
    a=(1.-smoothstep(.72,1.,d))*center*facing;
  }
  gl_FragColor=vec4(u_color,clamp(a,0.,1.));
}`;
function webglRenderer(canvas,geo){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,powerPreference:'low-power',preserveDrawingBuffer:false});
  if(!gl)return null;
  const shaders=[],buffers=[];let program=null;
  const cleanup=()=>{buffers.forEach(b=>gl.deleteBuffer(b));if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s))};
  try{
  const shader=(type,source)=>{
    const s=gl.createShader(type);if(!s)throw Error('Shader allocation failed');shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;
  };
  const v=shader(gl.VERTEX_SHADER,VS),f=shader(gl.FRAGMENT_SHADER,FS);program=gl.createProgram();if(!program)throw Error('Program allocation failed');
  gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const loc={};for(const name of ['matrix','scale','size','color','kind'])loc[name]=gl.getUniformLocation(program,'u_'+name);
  const pos=gl.getAttribLocation(program,'a_position'),life=gl.getAttribLocation(program,'a_life');
  const buffer=data=>{const b=gl.createBuffer();if(!b)throw Error('Buffer allocation failed');buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return b};
  const land=buffer(geo.land),shell=buffer(geo.shell),signals=buffer(new Float32Array(32));
  const pointRange=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
  function layer(b,count,m,radius,size,color,kind,signalData){
    gl.bindBuffer(gl.ARRAY_BUFFER,b);
    if(signalData)gl.bufferSubData(gl.ARRAY_BUFFER,0,signalData);
    gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,signalData?16:12,0);
    if(signalData){gl.enableVertexAttribArray(life);gl.vertexAttribPointer(life,1,gl.FLOAT,false,16,12)}
    else {gl.disableVertexAttribArray(life);gl.vertexAttrib1f(life,0)}
    gl.uniformMatrix3fv(loc.matrix,false,m);gl.uniform2f(loc.scale,2*radius/canvas.width,2*radius/canvas.height);
    gl.uniform1f(loc.size,Math.min(size,pointRange[1]));gl.uniform3fv(loc.color,color);gl.uniform1f(loc.kind,kind);
    gl.drawArrays(gl.POINTS,0,count);
  }
  return {
    type:'webgl',draw(s){
      gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      layer(shell,geo.shell.length/3,s.shellMatrix,s.outerRadius,s.outerRadius*.013,s.shellColor,1);
      layer(land,geo.land.length/3,s.globeMatrix,s.radius,s.radius*.0095,s.landColor,0);
      layer(signals,8,s.globeMatrix,s.radius,s.radius*.072,s.signalColor,2,s.signals);
    },destroy:cleanup,
  };
  }catch(error){cleanup();throw error}
}
function smooth(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function canvasRenderer(canvas,geo){
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw Error('Canvas is unavailable');
  const css=color=>'rgb('+color.map(v=>Math.round(v*255)).join(',')+')';
  const buckets=Array.from({length:12},()=>[]);
  function points(data,m,r,size,color,kind){
    buckets.forEach(b=>b.length=0);
    const stride=canvas.width<700?6:3;
    for(let i=0;i<data.length;i+=stride){
      const x=m[0]*data[i]+m[3]*data[i+1]+m[6]*data[i+2],y=m[1]*data[i]+m[4]*data[i+1]+m[7]*data[i+2],z=m[2]*data[i]+m[5]*data[i+1]+m[8]*data[i+2];
      const radial=Math.hypot(x,y),center=kind===0?.08+.92*smooth(.22,.93,radial):.22+.78*smooth(.12,.95,radial);
      const alpha=center*(kind===0?(z<0?.055:.58):(z<0?.19:.94)),index=Math.round(alpha*11);
      if(index)buckets[index].push(canvas.width/2+x*r,canvas.height/2-y*r,size*(.72+.28*Math.max(z,0))/2);
    }
    ctx.fillStyle=css(color);
    buckets.forEach((b,index)=>{if(!b.length)return;ctx.globalAlpha=index/11;ctx.beginPath();for(let j=0;j<b.length;j+=3){ctx.moveTo(b[j]+b[j+2],b[j+1]);ctx.arc(b[j],b[j+1],b[j+2],0,TAU)}ctx.fill()});
    ctx.globalAlpha=1;
  }
  return {type:'canvas2d',draw(s){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    points(geo.shell,s.shellMatrix,s.outerRadius,s.outerRadius*.0105,s.shellColor,1);
    points(geo.land,s.globeMatrix,s.radius,s.radius*.0077,s.landColor,0);
    const rgb=s.signalColor.map(v=>Math.round(v*255)).join(',');
    for(let i=0;i<s.signals.length;i+=4){
      const p=project(s.signals.subarray(i,i+3),s.globeMatrix);if(p[2]<.025)continue;
      const age=s.signals[i+3],alpha=smooth(0,.20,age)*(1-smooth(.72,1,age))*smooth(.025,.18,p[2]);
      const x=canvas.width/2+p[0]*s.radius,y=canvas.height/2-p[1]*s.radius,r=s.radius*.036;
      const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba('+rgb+','+alpha+')');gradient.addColorStop(.26,'rgba('+rgb+','+alpha*.66+')');gradient.addColorStop(.66,'rgba('+rgb+','+alpha*.04+')');gradient.addColorStop(1,'rgba('+rgb+',0)');
      ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba('+rgb+','+alpha*.28+')';ctx.lineWidth=Math.max(.5,r*.055);ctx.beginPath();ctx.arc(x,y,r*(.65+.06*age),0,TAU);ctx.stroke();
    }
  },destroy(){ctx.clearRect(0,0,canvas.width,canvas.height)}};
}
function rgb(value,fallback){
  if(typeof value!=='string')return fallback;
  const match=/^#([\da-f]{6})$/i.exec(value);if(!match)return fallback;
  return [0,2,4].map(i=>parseInt(match[1].slice(i,i+2),16)/255);
}

export function createSignalGlobe(canvas,options={}){
  const original=canvas,originalDisplay=canvas.style.display;
  const settings={speed:1,fps:30,paused:false,interactive:true,renderer:'auto',landColor:'#6AB6C2',shellColor:'#FFFFFF',signalColor:'#269CAD',pixelRatio:1.5};
  Object.assign(settings,options);
  const geo=geography(),motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // Begin immediately; IntersectionObserver then owns visibility and pausing.
  let renderer=null,visible=true,destroyed=false,lost=false,io=null,ro=null,hasSize=false;
  let time=0,last=0,lastDraw=-Infinity,frames=0,cpuMs=0,seed=12793,pagePaused=false;
  let globeYaw=-64*RAD,shellYaw=.36,hoverX=0,hoverY=0,targetX=0,targetY=0;
  let width=0,height=0,dpr=1;const signalData=new Float32Array(32),slots=[];
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const initialMatrix=matrix(-64*RAD,18*RAD,-16*RAD);
  const locations=[[-.32,.65],[.02,.84],[.46,.56],[-.79,.15],[.68,.10],[-.57,-.48],[.37,-.42],[.04,-.82]];
  const phases=[.15,.34,.52,.73,.44,.63,.82,.25];
  locations.forEach(([x,y],i)=>{const duration=8+random()*5;slots.push({p:unproject([x,y,Math.sqrt(1-x*x-y*y)],initialMatrix),age:phases[i]*duration,duration})});
  const reduced=()=>!!motion?.matches;
  const enabled=()=>!destroyed&&!lost&&hasSize&&!pagePaused&&!document.hidden&&visible&&!settings.paused&&!reduced();
  function spawn(slot,m){
    // Equal-area random positions, excluding the hidden hemisphere and collisions.
    for(let attempt=0;attempt<40;attempt++){
      const y=random()*1.86-.93,lon=random()*TAU,p=sphere(Math.asin(y),lon),q=project(p,m);
      if(q[2]>.18&&slots.every(other=>other===slot||Math.hypot(...p.map((v,i)=>v-other.p[i]))>.22)){slot.p=p;break}
    }
    slot.age=0;slot.duration=8+random()*5;
  }
  function state(){
    const globeMatrix=matrix(globeYaw,18*RAD+Math.sin(time*.06)*.025+hoverY,-16*RAD+hoverX);
    const shellMatrix=matrix(shellYaw,34*RAD+Math.sin(time*.045)*.02+hoverY*.35,22*RAD+hoverX*.35);
    slots.forEach((s,i)=>{signalData.set(s.p,i*4);signalData[i*4+3]=reduced()?.5:clamp(s.age/s.duration,0,1)});
    return {globeMatrix,shellMatrix,radius:height*.417,outerRadius:height*.442,signals:signalData,
      landColor:rgb(settings.landColor,[.416,.714,.761]),shellColor:rgb(settings.shellColor,[1,1,1]),signalColor:rgb(settings.signalColor,[.149,.612,.678])};
  }
  function paint(){if(destroyed||!renderer||!hasSize||lost)return;const start=performance.now();renderer.draw(state());cpuMs=cpuMs*.9+(performance.now()-start)*.1;frames++}
  function stop(){remove(frame);last=0;lastDraw=-Infinity}
  function onState(){if(reduced()){hoverX=hoverY=targetX=targetY=0}if(enabled())add(frame);else{stop();if(!lost)paint()}}
  function resize(){
    if(destroyed)return;
    const rect=canvas.getBoundingClientRect();hasSize=rect.width>0&&rect.height>0;
    if(!hasSize){width=height=0;stop();return}
    const limit=renderer?.type==='canvas2d'?1:settings.pixelRatio;
    dpr=Math.min(window.devicePixelRatio||1,limit,1024/rect.width,1024/rect.height);
    width=Math.max(1,Math.round(rect.width*dpr));height=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
    paint();if(enabled())add(frame);
  }
  function frame(now){
    if(!enabled()){stop();return}
    const interval=1000/settings.fps;if(now-lastDraw<interval-.4)return;
    if(!Number.isFinite(lastDraw)||now-lastDraw>interval*2)lastDraw=now;else lastDraw+=interval;
    const dt=last?Math.min(.1,(now-last)/1000):interval/1000;last=now;time+=dt;
    globeYaw=(globeYaw+dt*.054*settings.speed)%TAU;shellYaw=(shellYaw+dt*.030*settings.speed)%TAU;
    const ease=1-Math.exp(-dt/.9);hoverX+=(targetX-hoverX)*ease;hoverY+=(targetY-hoverY)*ease;
    const m=matrix(globeYaw,18*RAD+Math.sin(time*.06)*.025+hoverY,-16*RAD+hoverX);
    slots.forEach(s=>{s.age+=dt;if(s.age>s.duration)spawn(s,m)});paint();
  }
  function update(next={}){
    if(destroyed)return;
    Object.assign(settings,next);settings.speed=clamp(Number(settings.speed)||1,.1,2);settings.fps=clamp(Number(settings.fps)||30,15,60);settings.pixelRatio=clamp(Number(settings.pixelRatio)||1.5,1,2);
    if(!settings.interactive||reduced()){targetX=targetY=hoverX=hoverY=0}
    stop();resize();onState();
  }
  function hide(){pagePaused=true;onState()}
  function show(){pagePaused=false;onState()}
  function contextLost(event){event.preventDefault();lost=true;stop()}
  function pointerMove(event){
    if(event.pointerType==='touch'||!settings.interactive||reduced()||settings.paused)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    targetX=clamp((event.clientX-rect.left)/rect.width*2-1,-1,1)*.045;
    targetY=clamp((event.clientY-rect.top)/rect.height*2-1,-1,1)*.028;
  }
  function pointerLeave(){targetX=targetY=0}
  function fallback(){
    // A canvas cannot change context type. Keep the React-owned node intact.
    const previous=canvas,copy=previous.cloneNode(false);copy.removeAttribute('id');
    previous.style.display='none';previous.insertAdjacentElement('afterend',copy);canvas=copy;
    if(previous!==original)previous.remove();
    return canvasRenderer(canvas,geo);
  }
  function makeRenderer(){
    if(settings.renderer==='canvas2d')return canvasRenderer(canvas,geo);
    try{return webglRenderer(canvas,geo)||canvasRenderer(canvas,geo)}catch(error){return fallback()}
  }
  function contextRestored(){
    const previous=canvas;renderer?.destroy();renderer=makeRenderer();lost=false;
    if(canvas!==previous){unbindCanvas(previous);io?.unobserve(previous);ro?.unobserve(previous);bindCanvas();io?.observe(canvas);ro?.observe(canvas)}
    resize();onState();
  }
  function bindCanvas(){canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);canvas.addEventListener('pointermove',pointerMove,{passive:true});canvas.addEventListener('pointerleave',pointerLeave,{passive:true});canvas.addEventListener('pointercancel',pointerLeave,{passive:true})}
  function unbindCanvas(node){node.removeEventListener('webglcontextlost',contextLost);node.removeEventListener('webglcontextrestored',contextRestored);node.removeEventListener('pointermove',pointerMove);node.removeEventListener('pointerleave',pointerLeave);node.removeEventListener('pointercancel',pointerLeave)}
  renderer=makeRenderer();bindCanvas();
  document.addEventListener('visibilitychange',onState);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);window.addEventListener('resize',resize,{passive:true});
  if(motion?.addEventListener)motion.addEventListener('change',onState);else motion?.addListener?.(onState);
  if(typeof IntersectionObserver!=='undefined'){io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;onState()});io.observe(canvas)}
  if(typeof ResizeObserver!=='undefined'){ro=new ResizeObserver(resize);ro.observe(canvas)}
  update(options);
  return {update,getStats:()=>({renderer:renderer.type,frames,phase:time,running:jobs.has(frame),landPoints:geo.land.length/3,shellPoints:geo.shell.length/3,signals:8,submissionMs:cpuMs,width,height,pixelRatio:dpr,globeYaw,shellYaw,hoverX,hoverY}),
    destroy(){if(destroyed)return;stop();destroyed=true;io?.disconnect();ro?.disconnect();renderer.destroy();
      unbindCanvas(canvas);if(canvas!==original){canvas.remove();original.style.display=originalDisplay}document.removeEventListener('visibilitychange',onState);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);window.removeEventListener('resize',resize);
      if(motion?.removeEventListener)motion.removeEventListener('change',onState);else motion?.removeListener?.(onState);
    }};
}
