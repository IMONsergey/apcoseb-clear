  const SPOTS=[
    [.035896,.651867,.122553,.172182,1,117,187,206],
    [.248398,.406048,.436083,.098348,.481522,183,232,241],
    [.758052,.703249,.356924,.160685,.998864,204,236,244],
    [.278487,.623488,.180636,.085598,1,186,234,242],
    [.218842,.665581,.06738,.145616,.732305,255,255,255],
    [.524621,.400452,.187462,.066403,.791651,255,255,255],
    [.524516,.881,.142619,.047916,.645101,255,255,255],
    [.497262,.640925,.086785,.066244,1,250,255,254],
    [.760202,.634622,.084352,.222314,.639308,255,255,255],
  ];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a),0,1);return x*x*(3-2*x)};
  const jobs=new Set();let raf=0;
  function tick(now){raf=0;jobs.forEach(fn=>fn(now));if(jobs.size)raf=requestAnimationFrame(tick)}
  function add(fn){jobs.add(fn);if(!raf)raf=requestAnimationFrame(tick)}
  function remove(fn){jobs.delete(fn);if(!jobs.size&&raf){cancelAnimationFrame(raf);raf=0}}
  let sharedBrushesLight=null,sharedBrushesDark=null;
  const DARK_COLORS=[[24,66,76],[33,82,92],[29,72,83],[35,86,96],[43,96,106],[31,78,88],[28,70,80],[39,93,103],[30,76,86]];
  function getBrushes(theme='light'){
    const cached=theme==='dark'?sharedBrushesDark:sharedBrushesLight;
    if(cached)return cached;
  // These tiny brushes are drawn by code once. No uploaded image is used.
  const brushes=SPOTS.map(s=>{
    const c=document.createElement('canvas');c.width=c.height=128;
    const ctx=c.getContext('2d'),image=ctx.createImageData(128,128),data=image.data;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const dx=(x+.5-64)/16,dy=(y+.5-64)/16,i=(y*128+x)*4;
      const color=theme==='dark'?DARK_COLORS[SPOTS.indexOf(s)]:[s[5],s[6],s[7]];
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=Math.exp(-.5*(dx*dx+dy*dy))*255;
    }
    ctx.putImageData(image,0,0);return c;
  });
  const ring=document.createElement('canvas');ring.width=ring.height=128;
  const rc=ring.getContext('2d'),ri=rc.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const nx=(x+.5-64)/64,ny=(y+.5-64)/64,r=Math.hypot(nx,ny),i=(y*128+x)*4;
    const weight=r?(.80+.20*((nx-ny)/(r*Math.SQRT2))**2):.80;
    // Broad, low-opacity light only: no dark trough or sharply defined contour.
    const alpha=(Math.exp(-.5*((r-.625)/.095)**2)*.20+Math.exp(-.5*((r-.625)/.17)**2)*.04)*weight;
    const ringColor=theme==='dark'?[62,117,128]:[255,255,255];
    ri.data[i]=ringColor[0];
    ri.data[i+1]=ringColor[1];
    ri.data[i+2]=ringColor[2];
    ri.data[i+3]=alpha*255;
  }
  rc.putImageData(ri,0,0);
    const result={brushes,ring};
    if(theme==='dark')sharedBrushesDark=result;else sharedBrushesLight=result;
    return result;
  }
  export function createIceWaves(canvas,options={}){
    let ctx;try{ctx=canvas.getContext('2d',{alpha:false})}catch{ctx=null}
    if(!ctx)return {update(){},destroy(){},getStats:()=>({supported:false})};
    const settings={speed:1,paused:false,theme:'light'};
    const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let width=0,height=0,correction=1,veil=null,visible=true,destroyed=false,pagePaused=false;
    let phase=0,last=0,lastDraw=-Infinity,frames=0,cost=0,io=null,ro=null;
    const reduced=()=>!!motion?.matches;
    const enabled=()=>!destroyed&&width>0&&height>0&&visible&&!pagePaused&&!document.hidden&&!reduced()&&!settings.paused&&settings.speed>0;
    function draw(time){
      if(destroyed||!width||!height)return;
      const {brushes,ring}=getBrushes(settings.theme);
      const start=performance.now();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle=settings.theme==='dark'?'#0d1113':'#ffffff';ctx.fillRect(0,0,width,height);
      for(let i=0;i<SPOTS.length;i++){
        const s=SPOTS[i],p=i*1.61;
        const driftX=(Math.sin(time*.14+p)-Math.sin(p))*.008;
        const driftY=(Math.sin(time*.11+p*1.3)-Math.sin(p*1.3))*.005;
        const breath=1+(Math.sin(time*.18+p)-Math.sin(p))*.025;
        const sx=s[2]*width*breath,sy=s[3]*height*(2-breath);
        ctx.globalAlpha=s[4]*(settings.theme==='dark'?.72:1);
        ctx.drawImage(brushes[i],(s[0]+driftX)*width-sx*4,(s[1]+driftY)*height-sy*4,sx*8,sy*8);
      }
      const origin=SPOTS[7],p=7*1.61;
      const cx=(origin[0]+(Math.sin(time*.14+p)-Math.sin(p))*.008)*width;
      const cy=(origin[1]+(Math.sin(time*.11+p*1.3)-Math.sin(p*1.3))*.005)*height;
      ctx.setTransform(1,0,0,correction,cx,cy);
      for(let i=0;i<3;i++){
        const age=(time/22+.08+i/3)%1;
        const radius=width*(.035+.53*age),extent=radius/.625;
        ctx.globalAlpha=(settings.theme==='dark'?.32:.65)*smooth(0,.18,age)*(1-smooth(.55,1,age));
        ctx.drawImage(ring,-extent,-extent,extent*2,extent*2);
      }
      ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);
      frames++;cost=cost*.9+(performance.now()-start)*.1;
    }
    function stop(){remove(frame);last=0;lastDraw=-Infinity}
    function sync(){if(destroyed)return;if(reduced())draw(0);if(enabled())add(frame);else stop()}
    function resize(){
      if(destroyed)return;
      const r=canvas.getBoundingClientRect();
      if(!r.width||!r.height){width=height=0;stop();return}
      const scale=Math.min(1,288/Math.max(r.width,r.height));
      width=Math.max(2,Math.round(r.width*scale));height=Math.max(2,Math.round(r.height*scale));
      correction=r.width*height/(r.height*width);
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
      veil=ctx.createLinearGradient(0,0,0,height);
      for(let i=0;i<=80;i++){
        const y=i/80,a=1-smooth(.17,.24,y)*smooth(0,.07,1-y);
        veil.addColorStop(y,settings.theme==='dark'?'rgba(13,17,19,'+(Math.min(1,a+.16))+')':'rgba(255,255,255,'+a+')');
      }
      draw(reduced()?0:phase);sync();
    }
    function frame(now){
      if(!enabled()){stop();return}
      const interval=1000/24;if(now-lastDraw<interval-.5)return;
      if(!Number.isFinite(lastDraw)||now-lastDraw>interval*2)lastDraw=now;else lastDraw+=interval;
      const dt=last?Math.min(.1,(now-last)/1000):interval/1000;last=now;phase+=dt*settings.speed;
      draw(phase);
    }
    function update(next={}){
      if(destroyed)return;
      if('speed' in next)settings.speed=clamp(Number.isFinite(next.speed)?next.speed:1,0,3);
      if('paused' in next)settings.paused=!!next.paused;
      if('theme' in next&&(next.theme==='light'||next.theme==='dark'))settings.theme=next.theme;
      stop();resize();draw(reduced()?0:phase);sync();
    }
    function hide(){pagePaused=true;sync()}
    function show(){pagePaused=false;resize()}
    document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);window.addEventListener('resize',resize,{passive:true});
    if(motion?.addEventListener)motion.addEventListener('change',sync);else motion?.addListener?.(sync);
    if(typeof IntersectionObserver!=='undefined'){io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()});io.observe(canvas)}
    if(typeof ResizeObserver!=='undefined'){ro=new ResizeObserver(resize);ro.observe(canvas)}
    resize();update(options);
    return {update,getStats:()=>({supported:true,running:jobs.has(frame),width,height,frames,phase,renderMs:cost,targetFps:24}),destroy(){
      if(destroyed)return;stop();destroyed=true;io?.disconnect();ro?.disconnect();
      document.removeEventListener('visibilitychange',sync);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);window.removeEventListener('resize',resize);
      if(motion?.removeEventListener)motion.removeEventListener('change',sync);else motion?.removeListener?.(sync);
      veil=null;
    }};
  }
