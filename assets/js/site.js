(function(){
  // v6.0.39 — mantém o zoom nativo acessível. A navegação de componentes
  // interativos continua sob responsabilidade do respectivo plugin, não do documento.
  const CTA_SELECTOR = [
    '[data-design-role="cta"]',
    '.button-primary','.btn-primary','.opp-cta','.svp-hero-button','.formsenderCSS_button','.spp-cta','.pit-glass-cta','.pp-flip-cta','.btn-flip','.btn-flipFake',
    '.fsp-result a[data-fsp-cta]',
    'a[class*="__cta"]','button[class*="__cta"]','a[class*="-cta"]','button[class*="-cta"]','a[class*="_cta"]','button[class*="_cta"]',
    'a[class*="call-to-action"]','button[class*="call-to-action"]'
  ].join(',');
  function buttonEffect(){return cssVar(document.documentElement,'--action-button-effect','depth')||'depth'}
  function buttonClickEffect(){return cssVar(document.documentElement,'--action-button-click-effect','press')||'press'}
  function decorateCTA(el){
    if(!(el instanceof Element))return;
    el.classList.add('imobify-design-cta');
    el.dataset.imobifyEffect=buttonEffect();
  }
  function parseColor(value){
    const raw=String(value||'').trim();
    let m=raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(m){let hex=m[1];if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return {r:parseInt(hex.slice(0,2),16),g:parseInt(hex.slice(2,4),16),b:parseInt(hex.slice(4,6),16)}}
    m=raw.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if(m)return {r:+m[1],g:+m[2],b:+m[3]};
    return null;
  }
  function hex(rgb){const h=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');return '#'+h(rgb.r)+h(rgb.g)+h(rgb.b)}
  function lum(value){const rgb=parseColor(value);if(!rgb)return null;const c=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return c(rgb.r)*.2126+c(rgb.g)*.7152+c(rgb.b)*.0722}
  function ratio(a,b){const x=lum(a),y=lum(b);if(x==null||y==null)return 1;return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  function mix(a,b,t){const x=parseColor(a),y=parseColor(b);if(!x||!y)return a;t=Math.max(0,Math.min(1,Number(t)||0));return hex({r:x.r+(y.r-x.r)*t,g:x.g+(y.g-x.g)*t,b:x.b+(y.b-x.b)*t})}
  function safest(background){return ratio('#ffffff',background)>=ratio('#000000',background)?'#ffffff':'#000000'}
  function ensureContrast(preferred,background,minimum){
    minimum=Number(minimum)||4.5;
    if(!parseColor(preferred)||!parseColor(background)||ratio(preferred,background)>=minimum)return preferred;
    const target=safest(background);
    for(let step=1;step<=20;step++){const candidate=mix(preferred,target,step/20);if(ratio(candidate,background)>=minimum)return candidate}
    return target;
  }
  function cssVar(el,name,fallback=''){return (getComputedStyle(el).getPropertyValue(name)||fallback).trim()}
  function contrastEnabled(){return cssVar(document.documentElement,'--contrast-enabled','1')!=='0'}
  function contrastMinimum(){return Number(cssVar(document.documentElement,'--contrast-min','4.5'))||4.5}
  function setSafe(el,name,preferred,background){if(!el||!contrastEnabled())return;el.style.setProperty(name,ensureContrast(preferred,background,contrastMinimum()))}
  function applyDesignSemantics(root){
    const scope=root&&root.querySelectorAll?root:document;
    const pluginRoots=[];
    if(scope instanceof Element){
      const owner=scope.closest('[data-plugin]');
      if(owner)pluginRoots.push(owner);
    }
    if(scope.querySelectorAll)scope.querySelectorAll('[data-plugin]').forEach(el=>pluginRoots.push(el));
    if(scope instanceof Element && scope.matches(CTA_SELECTOR))decorateCTA(scope);
    [...new Set(pluginRoots)].forEach(function(plugin){
      plugin.querySelectorAll('h1,h2,h3,h4,h5,h6,[data-design-role=\"title\"]').forEach(function(el){
        el.classList.add('imobify-design-title');
      });
      plugin.querySelectorAll('.hero-copy,.svp-hero-subtitle,[class$=\"__subtitle\"],[class$=\"-subtitle\"],[class$=\"_subtitle\"],[class$=\"__subheading\"],[class$=\"-subheading\"],[class$=\"_subheading\"],[data-design-role=\"subtitle\"]').forEach(function(el){
        el.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll('h1,h2').forEach(function(heading){
        const next=heading.nextElementSibling;
        if(next&&next.matches('p:not(.eyebrow):not(.legal)'))next.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll(CTA_SELECTOR).forEach(decorateCTA);
      plugin.querySelectorAll('.bbp[data-project-profile=\"true\"] .bbp__cta').forEach(decorateCTA);
    });
    scope.querySelectorAll(CTA_SELECTOR).forEach(decorateCTA);
  }

  function applyContrastGuards(root){
    if(!contrastEnabled())return;
    const scope=root&&root.querySelectorAll?root:document;
    const include=(selector)=>{const out=[];if(scope instanceof Element&&scope.matches(selector))out.push(scope);scope.querySelectorAll(selector).forEach(el=>out.push(el));return out};

    include('.pit-section').forEach(el=>{
      const accent=cssVar(el,'--pit-accent',cssVar(document.documentElement,'--primary','#16a34a'));
      const surface=cssVar(document.documentElement,'--surface','#ffffff');
      setSafe(el,'--pit-accent-on-surface',accent,surface);
      setSafe(el,'--pit-accent-contrast',safest(accent),accent);
    });

    include('.iwfp-widget').forEach(el=>{
      const bg=cssVar(el,'--iwfp-bg','#25d366');
      setSafe(el,'--iwfp-icon-safe',cssVar(el,'--iwfp-icon','#ffffff'),bg);
      setSafe(el,'--iwfp-text-safe',cssVar(el,'--iwfp-text','#ffffff'),bg);
    });

    include('.imobify-menu-pro').forEach(el=>{
      const text=cssVar(el,'--imp-text','#ffffff'),accent=cssVar(el,'--imp-accent','#d4af37');
      const bg=cssVar(el,'--imp-bg','#0a1628'),scroll=cssVar(el,'--imp-bg-scroll',bg),mobile=cssVar(el,'--imp-mobile-bg',bg);
      setSafe(el,'--imp-text-safe',text,bg);setSafe(el,'--imp-text-scroll-safe',text,scroll);setSafe(el,'--imp-text-mobile-safe',text,mobile);
      setSafe(el,'--imp-accent-safe',accent,bg);setSafe(el,'--imp-accent-scroll-safe',accent,scroll);setSafe(el,'--imp-accent-mobile-safe',accent,mobile);
      setSafe(el,'--imp-accent-contrast',safest(accent),accent);
    });
  }

  function clearButtonMotion(el){if(!el)return;el.style.removeProperty('--imobify-button-x');el.style.removeProperty('--imobify-button-y')}
  const cursorEffects=new Set(['magnetic','magnet-orbit','tilt-3d','cursor-halo','liquid-follow','prism-shimmer','orbit-ring','neon-trace']);
  function motionAllowed(){return matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches}
  document.addEventListener('pointermove',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    const fx=buttonEffect();
    if(!el||!cursorEffects.has(fx)||!motionAllowed())return;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
    const nx=Math.max(-1,Math.min(1,2*(event.clientX-r.left)/r.width-1));
    const ny=Math.max(-1,Math.min(1,2*(event.clientY-r.top)/r.height-1));
    const strength=fx==='magnet-orbit'?23:fx==='magnetic'?5:0;
    el.style.setProperty('--imobify-button-x',(nx*strength).toFixed(2)+'px');
    el.style.setProperty('--imobify-button-y',(ny*strength*.76).toFixed(2)+'px');
    el.style.setProperty('--imobify-cursor-x',((nx+1)*50).toFixed(1)+'%');
    el.style.setProperty('--imobify-cursor-y',((ny+1)*50).toFixed(1)+'%');
    el.style.setProperty('--imobify-tilt-x',(-ny*12).toFixed(2)+'deg');
    el.style.setProperty('--imobify-tilt-y',(nx*12).toFixed(2)+'deg');
  },{passive:true});
  document.addEventListener('pointerout',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    if(el&&!el.contains(event.relatedTarget)){
      clearButtonMotion(el);
      ['--imobify-cursor-x','--imobify-cursor-y','--imobify-tilt-x','--imobify-tilt-y'].forEach(k=>el.style.removeProperty(k));
    }
  },{passive:true});
  document.addEventListener('click',function(event){
    const el=event.target.closest?.('.imobify-design-cta, [data-design-role="cta"]');
    if(!el||el.matches('[disabled],[aria-disabled="true"]'))return;
    const mode=buttonClickEffect();
    if(mode==='press'){
      el.classList.remove('imobify-click-press'); void el.offsetWidth;
      el.classList.add('imobify-click-press');
      setTimeout(()=>el.classList.remove('imobify-click-press'),380);
    }
    if(mode==='ripple'){
      const rect=el.getBoundingClientRect();
      const ripple=document.createElement('span');
      ripple.className='imobify-button-ripple';
      const restorePosition=getComputedStyle(el).position==='static';
      if(restorePosition)el.style.position='relative';
      el.classList.add('imobify-ripple-active');
      const cx=Number.isFinite(event.clientX)&&event.clientX!==0?event.clientX-rect.left:rect.width/2;
      const cy=Number.isFinite(event.clientY)&&event.clientY!==0?event.clientY-rect.top:rect.height/2;
      ripple.style.left=cx+'px'; ripple.style.top=cy+'px';
      el.appendChild(ripple);setTimeout(()=>{ripple.remove();el.classList.remove('imobify-ripple-active');if(restorePosition)el.style.removeProperty('position')},650);
    }else if(['shockwave','confetti','sparks','rings','stamp','jelly','spin','flip','success','glow-burst','pixel-burst','shake'].includes(mode)){
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const rect=el.getBoundingClientRect();
      const cx=Number.isFinite(event.clientX)&&event.clientX!==0?event.clientX-rect.left:rect.width/2;
      const cy=Number.isFinite(event.clientY)&&event.clientY!==0?event.clientY-rect.top:rect.height/2;
      const particleModes=['confetti','sparks','pixel-burst'];
      const ringModes=['shockwave','rings','glow-burst'];
      const active=['stamp','jelly','spin','flip','shake'].includes(mode)?mode:null;
      if(active){
        const cls='imobify-click-'+active;
        el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
        setTimeout(()=>el.classList.remove(cls),620);
      }
      if(mode==='success'){
        const mark=document.createElement('span');mark.className='imobify-click-success';mark.textContent='✓';mark.setAttribute('aria-hidden','true');
        el.appendChild(mark);setTimeout(()=>mark.remove(),700);
      }
      if(particleModes.includes(mode)||ringModes.includes(mode)){
        const count=particleModes.includes(mode)?(mode==='confetti'?12:9):(mode==='rings'?3:2);
        const restorePosition=getComputedStyle(el).position==='static';if(restorePosition)el.style.position='relative';
        for(let i=0;i<count;i++){
          const part=document.createElement('span');part.setAttribute('aria-hidden','true');
          part.className='imobify-click-particle '+(particleModes.includes(mode)?'imobify-click-particle-'+mode:'imobify-click-ring '+ 'imobify-click-ring-'+mode);
          part.style.left=cx+'px';part.style.top=cy+'px';
          part.style.setProperty('--i',String(i));part.style.setProperty('--count',String(count));
          part.style.setProperty('--angle',(i*360/count)+'deg');part.style.setProperty('--delay',(i*65)+'ms');
          el.appendChild(part);setTimeout(()=>part.remove(),900);
        }
        if(restorePosition)setTimeout(()=>el.style.removeProperty('position'),920);
      }
    }else if(mode==='bounce'||mode==='flash'){
      const cls=mode==='bounce'?'imobify-button-click-bounce':'imobify-button-click-flash';
      el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),430);
    }
  },true);

  document.addEventListener('click',function(event){
    if(event.__imobifyFloatingHandled)return;
    const link=event.target.closest?.('[href^="#"]');
    if(!link)return;
    const href=String(link.getAttribute('href')||'').trim();
    if(!href||href==='#')return;
    const floating=window.ImobifyFloating?.get?.(href);
    if(floating){
      event.preventDefault();
      window.ImobifyFloating.open(href,link);
      return;
    }
    let target=null;
    try{target=document.querySelector(href)}catch(_error){return}
    if(target){event.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  });
  window.Imobify={
    track:function(name,data){
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:name,...(data||{})});
    },
    contrastRatio:ratio,
    ensureContrast:ensureContrast,
    applyContrastGuards:applyContrastGuards,
    applyDesignSemantics:applyDesignSemantics,
    registerCTA:function(el){decorateCTA(el);return el},
    refreshDesign:function(root){applyDesignSemantics(root||document);applyContrastGuards(root||document)}
  };
  const scan=()=>{applyDesignSemantics(document);applyContrastGuards(document)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){if(node instanceof Element){applyDesignSemantics(node);applyContrastGuards(node)}})});
  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-design-role']});
})();


/* ImobStudio 6.0.61 — element animation, synchronized with the existing section reveal. */
(function(){
 'use strict';
 const SELECTOR='h1,h2,h3,h4,h5,h6,p,img,button,a,[data-design-role="title"],[data-design-role="subtitle"],[data-design-role="cta"]';
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const clamp=(v,a,b,f)=>Number.isFinite(parseFloat(v))?Math.min(b,Math.max(a,parseFloat(v))):f;
 const processed=new WeakSet();
 function targets(root){return [...root.querySelectorAll(SELECTOR)].filter(el=>el.closest('[data-section-id]')===root)}
 function play(el,cfg,delay,scrollDriven=false){
   if(!el||reduced()||!el.animate||cfg?.preset==='none')return;
   const preset=cfg?.preset||'none';if(preset==='none')return;
   const duration=clamp(cfg.durationMs,200,2000,750), intensity=cfg.intensity==='balanced'?1:0.62;
   const y=24*intensity,x=25*intensity,blur=7*intensity;
   const frame={opacity:0,transform:`translate3d(0,${y}px,0)`};
   if(preset==='orthogonal-assemble'){frame.transform=`translate3d(${-x}px,${y}px,0) rotate(-3deg) scale(.985)`;frame.clipPath='inset(0 0 75% 0)'}
   else if(preset==='line-reveal'){frame.transform=`translateY(${y}px)`;frame.clipPath='inset(100% 0 0 0)'}
   else if(preset==='soft-focus'){frame.filter=`blur(${blur}px)`;frame.transform=`translateY(${y/2}px)`}
   else if(preset==='float-in'){frame.transform=`translate3d(0,${y}px,0)`}
   else if(preset==='layer-assemble'){frame.transform=`translate3d(${x}px,${-y}px,0) scale(.98)`}
   else if(preset==='mask-unveil'){frame.opacity=1;frame.transform='none';frame.clipPath='inset(0 100% 0 0)'}
   else if(preset==='subtle-scale'){frame.transform='scale(.963)'}

   else if(preset==='orbit-settle'){frame.transform=`translate3d(${-x*2}px,${y*1.4}px,0) rotate(-9deg) scale(.92)`;}
   else if(preset==='elastic-dock'){frame.transform=`translate3d(${x*2.4}px,0,0) scale(.92)`;}
   else if(preset==='diagonal-sweep'){frame.transform=`translate3d(${-x*1.8}px,${y*1.8}px,0)`;frame.clipPath='inset(0 70% 70% 0)';}
   else if(preset==='flip-reveal'){frame.transform='perspective(700px) rotateX(-48deg) translateY(16px)';}
   else if(preset==='arc-rise'){frame.transform=`translate3d(${x*1.5}px,${y*2}px,0) rotate(7deg)`;}
   else if(preset==='depth-arrival'){frame.transform='perspective(700px) translateZ(-180px) scale(.86)';frame.filter=`blur(${blur*.65}px)`;}
   else if(preset==='split-shift'){frame.transform=`translate3d(${-x*2}px,${-y*.5}px,0) skewX(-8deg)`;}
   else if(preset==='tilt-unfold'){frame.opacity=1;frame.transform='perspective(650px) rotateY(-35deg) scale(.94)';frame.clipPath='inset(0 85% 0 0)';}
   else if(preset==='bounce-fade'){frame.transform=`translate3d(0,${y*2}px,0) scale(.9)`;}
   else if(preset==='wave-glide'){frame.transform=`translate3d(${x*1.6}px,${y*.8}px,0) rotate(4deg)`;}
   else if(preset==='curtain-diagonal'){frame.opacity=1;frame.transform=`translate3d(0,${y*.5}px,0)`;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';}
   else if(preset==='magnetic-snap'){frame.transform=`translate3d(${-x*1.7}px,${y*.5}px,0) scale(.94) rotate(-4deg)`;}
   else if(preset==='architectural-curtain'){frame.opacity=1;frame.clipPath='inset(0 100% 0 0)';frame.transform=`scale(1.06) translateX(${x}px)`;}
   else if(preset==='kinetic-shear'){frame.transform=`translate3d(${-x*2}px,${y}px,0) skewX(13deg)`;frame.clipPath='inset(0 35% 0 0)';}
   else if(preset==='depth-parallax'){frame.transform=`perspective(900px) translate3d(0,${y*2}px,-120px) rotateX(9deg) scale(.88)`;}
   else if(preset==='light-sweep'){frame.filter=`brightness(1.8) blur(${blur}px)`;frame.transform=`translateX(${-x}px) scale(1.04)`;}
   else if(preset==='prism-unfold'){frame.opacity=1;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';frame.transform='perspective(950px) rotateY(-24deg)';}
   else if(preset==='liquid-mask'){frame.opacity=1;frame.clipPath='ellipse(0% 10% at 50% 50%)';frame.filter=`blur(${blur*.65}px)`;}
   else if(preset==='cinema-focus'){frame.filter=`blur(${blur*1.7}px) brightness(.7)`;frame.transform='scale(1.115)';}
   else if(preset==='stereo-drift'){frame.transform=`perspective(900px) translate3d(${x*2}px,${-y}px,-90px) rotateY(16deg)`;}
   else return;
   const end={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};

   const overshoot={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};
   let frames=[frame,end],easing='cubic-bezier(.22,1,.36,1)';
   if(preset==='elastic-dock'||preset==='magnetic-snap'||preset==='bounce-fade'){
     const offset=preset==='bounce-fade'?`translateY(${-y*.28}px) scale(1.035)`:`translateX(${-x*.25}px) scale(1.025)`;
     frames=[{...frame,offset:0},{...overshoot,transform:offset,offset:.72},{...end,offset:1}];easing='ease-out';
   }else if(preset==='orbit-settle'||preset==='arc-rise'||preset==='wave-glide'){
     frames=[{...frame,offset:0},{...overshoot,transform:`translate3d(${x*.35}px,${-y*.28}px,0) rotate(-2deg)`,offset:.68},{...end,offset:1}];
   }else if(preset==='curtain-diagonal'){
     frames=[{...frame,offset:0},{...overshoot,clipPath:'polygon(0 0,75% 0,100% 100%,0 100%)',offset:.62},{...end,clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)',offset:1}];
   }
   try{el.getAnimations().filter(a=>a.id==='imobify-element-motion').forEach(a=>a.cancel());const a=el.animate(frames,{duration,delay:scrollDriven?0:Math.max(0,delay||0),fill:scrollDriven?'both':'backwards',easing:scrollDriven?'linear':easing});a.id='imobify-element-motion';if(scrollDriven){a.pause();a.currentTime=0;return a;}a.finished.then(()=>a.cancel()).catch(()=>{});}catch(_){}
 }
 const scrollSections=new Map();
 let scrollTick=false;
 function updateScroll(){scrollTick=false;if(reduced())return;const vh=window.innerHeight||800;scrollSections.forEach((animations,section)=>{if(!section.isConnected){animations.forEach(a=>a.cancel());scrollSections.delete(section);return;}const rect=section.getBoundingClientRect();const total=Math.max(1,vh+rect.height);const progress=Math.max(0,Math.min(1,(vh-rect.top)/total));animations.forEach(({a,start,end})=>{try{a.currentTime=Math.max(0,Math.min(1,(progress-start)/Math.max(.001,end-start)))*a.effect.getTiming().duration;}catch(_){}});});}
 function requestScroll(){if(!scrollTick){scrollTick=true;requestAnimationFrame(updateScroll);}}
 window.addEventListener('scroll',requestScroll,{passive:true});window.addEventListener('resize',requestScroll,{passive:true});
 function run(section){
   if(!section||reduced())return;
   const cfg=section._imobifyElementMotion||{};
   const items=cfg.items||{};
   const list=targets(section).map((el,index)=>({el,index,c:items[String(index)]})).filter(o=>o.c&&o.c.preset&&o.c.preset!=='none');
   list.sort((a,b)=>clamp(a.c.order,0,99,a.index)-clamp(b.c.order,0,99,b.index)||a.index-b.index);
   const sectionDelay=section.getAttribute('data-section-transition')==='none'?0:clamp(getComputedStyle(section).getPropertyValue('--imobify-duration'),200,4000,800)+clamp(getComputedStyle(section).getPropertyValue('--imobify-delay'),0,2500,0);
   const base=clamp(cfg.baseDelayMs,0,2500,150),stagger=clamp(cfg.staggerMs,0,1000,100);
   if(cfg.scrollMode==='scrub'){if(scrollSections.has(section))return;const length=Math.max(1,list.length);const animations=list.map(({el,c},i)=>({a:play(el,c,0,true),start:.14+i*.32/length,end:.60+i*.32/length})).filter(x=>x.a);scrollSections.set(section,animations);requestScroll();return;}
   list.forEach(({el,c},i)=>play(el,c,sectionDelay+base+i*stagger+clamp(c.delayMs,0,2000,120)));
 }
 function prepare(section){
   if(processed.has(section))return;
   processed.add(section);
   try{section._imobifyElementMotion=JSON.parse(decodeURIComponent(section.getAttribute('data-element-motion')||'%7B%7D'));}catch(_){section._imobifyElementMotion={};}
   section.addEventListener('imobify:section-visible',()=>run(section));
   if(section._imobifyElementMotion?.scrollMode==='scrub')run(section);else if(section.dataset.motionTriggered==='true'||section.classList.contains('is-visible'))run(section);
 }
 function scan(root){if(root.matches?.('[data-element-motion]'))prepare(root);root.querySelectorAll?.('[data-element-motion]').forEach(prepare)}
 function init(){scan(document);new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.body,{childList:true,subtree:true});}
 window.ImobifyElementMotion={play,targets};
 window.addEventListener('message',e=>{
   if(e.data?.type!=='imobify-element-motion-preview-all')return;
   const root=document.querySelector(`[data-section-id="${String(e.data.sectionId||'').replace(/[^a-zA-Z0-9_-]/g,'')}"]`);
   if(!root)return;
   const cfg=e.data.config||{};const entries=targets(root).map((el,index)=>({el,index,c:cfg.items?.[String(index)]})).filter(o=>o.c?.preset&&o.c.preset!=='none');
   entries.sort((a,b)=>clamp(a.c.order,0,99,a.index)-clamp(b.c.order,0,99,b.index)||a.index-b.index);
   entries.forEach(({el,c},i)=>play(el,c,clamp(cfg.baseDelayMs,0,2500,0)+i*clamp(cfg.staggerMs,0,1000,100)+clamp(c.delayMs,0,2000,0)));
 });
 window.addEventListener('message',e=>{if(e.data?.type!=='imobify-element-motion-test')return;const root=document.querySelector(`[data-section-id="${String(e.data.sectionId||'').replace(/[^a-zA-Z0-9_-]/g,'')}"]`);if(root){const el=targets(root)[Number(e.data.index)];play(el,e.data.config||{},0);}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


(function(){const hero=document.querySelector('[data-plugin="hero"]');if(!hero)return;hero.querySelectorAll('.button').forEach(button=>button.addEventListener('click',()=>window.Imobify&&Imobify.track('hero_cta',{label:button.textContent.trim()})));})();


(function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  var SAMPLE_ASSET = {
    p1:'plugins/smart-plant-v1.4.2/assets/images/plant-1.png', p1full:'plugins/smart-plant-v1.4.2/assets/images/plant-1-full.png',
    p2:'plugins/smart-plant-v1.4.2/assets/images/plant-2.png', p3:'plugins/smart-plant-v1.4.2/assets/images/plant-3.png', pos1:'plugins/smart-plant-v1.4.2/assets/images/position-1.png'
  };
  function resolveSampleAsset(raw) {
    var key = String(raw || '').trim();
    var prefix = ['assets','images'].join('/') + '/';
    if (key === prefix + 'plant-1.png') return SAMPLE_ASSET.p1;
    if (key === prefix + 'plant-1-full.png') return SAMPLE_ASSET.p1full;
    if (key === prefix + 'plant-2.png') return SAMPLE_ASSET.p2;
    if (key === prefix + 'plant-3.png') return SAMPLE_ASSET.p3;
    if (key === prefix + 'smart-plant-position-1.png' || key === prefix + 'position-1.png') return SAMPLE_ASSET.pos1;
    return key;
  }
  function safeImage(value) {
    var raw = resolveSampleAsset(value);
    if (!raw) return '';
    if (/^data:image\//i.test(raw) || /^(?:https?:)?\/\//i.test(raw) || /^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw) || /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.~%+@()-]+)+/.test(raw)) return raw;
    return '';
  }
  function normalizePlant(item, index) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id:String(item.id || ('planta-' + (index + 1))),
      code:String(item.code || item.identifier || ''),
      title:String(item.title || ('Planta ' + (index + 1))),
      description:String(item.description || ''),
      area:String(item.area || ''),
      composition:String(item.composition || ''),
      bathrooms:String(item.bathrooms || ''),
      features:Array.isArray(item.features) ? item.features.join('|') : String(item.features || ''),
      image:String(item.image || ''),
      fullImage:String(item.fullImage || item.image || ''),
      positionImage:String(item.positionImage || ''),
      position:String(item.position || '')
    };
  }
  function readPlants(root) {
    try {
      var list = JSON.parse(root.dataset.plants || '[]');
      if (Array.isArray(list)) return list.map(normalizePlant);
    } catch (_) {}
    return [];
  }
  function badges(plant) {
    return [plant.area, plant.composition, plant.bathrooms].concat(String(plant.features || '').split('|').map(function (v) { return v.trim(); })).filter(Boolean);
  }
  function cardMarkup(plant, index, buttonText) {
    var image = safeImage(plant.image || plant.fullImage);
    return '<article class="smart-plant__card" data-smart-plant-card="' + esc(plant.id) + '">' +
      '<div class="smart-plant__card-media">' + (image ? '<img src="' + esc(image) + '" alt="' + esc(plant.title) + '"' + (index ? ' loading="lazy"' : '') + ' decoding="async">' : '') + '</div>' +
      '<div class="smart-plant__card-body"><h3>' + esc(plant.title) + '</h3>' +
      (plant.description ? '<p>' + esc(plant.description) + '</p>' : '') +
      '<div class="smart-plant__badges">' + badges(plant).map(function (item) { return '<span class="smart-plant__badge">' + esc(item) + '</span>'; }).join('') + '</div>' +
      '<button class="smart-plant__card-button" type="button" data-design-role="cta" data-smart-plant-open="' + esc(plant.id) + '"><span>' + esc(buttonText || 'Ver planta completa') + '</span></button>' +
      '</div></article>';
  }
  function fillTemplate(template, root, plant) {
    return String(template || '')
      .replace(/\{empreendimento\}/gi, root.dataset.empreendimento || '')
      .replace(/\{planta\}/gi, plant.title || '')
      .replace(/\{metragem\}/gi, plant.area || '');
  }
  function init(wrapper) {
    if (wrapper.dataset.smartPlantReady === 'true') return;
    wrapper.dataset.smartPlantReady = 'true';
    var root = wrapper.querySelector('.smart-plant') || wrapper;
    // Tema local é uma exceção explícita. O contraste é calculado a partir
    // da cor escolhida; no modo projeto a decisão continua com o Core.
    if (root.getAttribute('data-local-theme') === 'true') {
      var customAccent = (root.style.getPropertyValue('--sp-local-accent') || '').trim();
      var hex = /^#([a-f0-9]{6})$/i.exec(customAccent);
      if (hex) {
        var channel = [0,2,4].map(function(i) {
          var v = parseInt(hex[1].slice(i,i+2),16) / 255;
          return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
        });
        var luminance = .2126*channel[0] + .7152*channel[1] + .0722*channel[2];
        var onAccent = luminance > .1791 ? '#101318' : '#ffffff';
        root.style.setProperty('--sp-cta-text', onAccent);
        root.style.setProperty('--action-button-bg', customAccent);
        root.style.setProperty('--action-button-text', onAccent);
      }
    }
    var plants = readPlants(root);
    var grid = root.querySelector('[data-smart-plant-grid]');
    var modal = root.querySelector('[data-smart-plant-modal]');
    var active = null;
    var lockedScrollY = 0;
    var viewportHandler = null;
    var modalPortal = null;
    var lastTrigger = null;
    var closing = false;
    var magnifierCleanup = null;
    if (grid) grid.innerHTML = plants.map(function (plant, index) { return cardMarkup(plant, index, root.dataset.cardButtonText); }).join('');

    // O modal público é portado para o <body> para não herdar transform,
    // overflow, contain ou contexto de posicionamento da section Smart Plant.
    // Isso é essencial no Safari/iPhone, onde um ancestral transformado pode
    // transformar position:fixed em posicionamento relativo ao bloco ancestral.
    function ensureModalPortal() {
      if (!modal || modalPortal) return modalPortal;
      modalPortal = document.createElement('div');
      modalPortal.className = 'smart-plant-modal-portal';
      modalPortal.setAttribute('data-plugin', 'smart-plant');
      modalPortal.setAttribute('data-smart-plant-portal', '');
      var owningSection = wrapper.closest('[data-section-id]') || wrapper;
      if (owningSection.hasAttribute('data-section-id')) modalPortal.setAttribute('data-section-id', owningSection.getAttribute('data-section-id'));
      if (owningSection.getAttribute('data-ib-type-mode') === 'local') modalPortal.setAttribute('data-ib-type-mode', 'local');
      modalPortal.setAttribute('data-local-theme', root.getAttribute('data-local-theme') || 'false');
      document.body.appendChild(modalPortal);
      modalPortal.appendChild(modal);
      return modalPortal;
    }
    function syncPortalTheme() {
      if (!modalPortal) return;
      // A section pode estar com um estilo local ativo. Como o modal é portado
      // para o body, seu contexto visual deve ser explicitamente replicado.
      // Copiar somente --heading perdia tamanho, peso, tracking, botão e cores.
      var cs = window.getComputedStyle(root);
      var section = wrapper.closest('[data-section-id]') || wrapper;
      if (section.hasAttribute('data-section-id')) modalPortal.setAttribute('data-section-id', section.getAttribute('data-section-id'));
      if (section.getAttribute('data-ib-type-mode') === 'local') modalPortal.setAttribute('data-ib-type-mode', 'local');
      else modalPortal.removeAttribute('data-ib-type-mode');
      modalPortal.setAttribute('data-local-theme', root.getAttribute('data-local-theme') || 'false');
      var tokens = [
        '--heading','--body','--heading-weight','--heading-line','--heading-tracking',
        '--heading-color','--body-color','--muted-color','--body-size','--body-line',
        '--h2-max','--h3-max','--section-space','--content-gap','--element-gap',
        '--component-padding','--radius','--surface','--primary','--accent',
        '--component-title-color','--component-text-color','--component-muted-color',
        '--action-button-bg','--action-button-text','--action-button-fill',
        '--action-button-border-width','--action-button-border-color',
        '--action-button-effect','--action-button-click-effect',
        '--sp-accent','--sp-cta-text','--sp-modal','--sp-text','--sp-muted',
        '--sp-local-accent','--sp-local-section','--sp-local-card',
        '--sp-local-modal','--sp-local-text','--sp-local-muted'
      ];
      ['eyebrow','headline','subheadline','body','cta'].forEach(function(role) {
        ['font','size','weight','line','tracking','color','transform'].forEach(function(suffix) {
          tokens.push('--ib-' + role + '-' + suffix);
        });
      });
      tokens.forEach(function(name) {
        var value = cs.getPropertyValue(name).trim();
        if (value) modalPortal.style.setProperty(name, value);
        else modalPortal.style.removeProperty(name);
      });
      modalPortal.style.fontFamily = cs.fontFamily || '';
      modalPortal.style.fontSize = cs.fontSize || '';
      modalPortal.style.lineHeight = cs.lineHeight || '';
    }
    function syncVisualViewportBox() {
      if (!modal) return;
      var vv = window.visualViewport;
      var left = vv ? vv.offsetLeft : 0;
      var top = vv ? vv.offsetTop : 0;
      var width = vv ? vv.width : window.innerWidth;
      var height = vv ? vv.height : window.innerHeight;
      modal.style.left = Math.round(left) + 'px';
      modal.style.top = Math.round(top) + 'px';
      modal.style.width = Math.round(width) + 'px';
      modal.style.height = Math.round(height) + 'px';
      modal.style.right = 'auto';
      modal.style.bottom = 'auto';
    }

    function unlockPage() {
      document.documentElement.classList.remove('smart-plant-modal-open');
      document.body.classList.remove('smart-plant-body-locked');
      document.body.style.top = '';
      document.body.style.width = '';
      if (window.visualViewport && viewportHandler) {
        window.visualViewport.removeEventListener('resize', viewportHandler);
        window.visualViewport.removeEventListener('scroll', viewportHandler);
      }
      window.removeEventListener('resize', viewportHandler);
      window.removeEventListener('orientationchange', viewportHandler);
      viewportHandler = null;
      // Safari iOS restaura o scroll com mais consistência após liberar o body.
      window.requestAnimationFrame(function () {
        window.scrollTo(0, lockedScrollY || 0);
      });
    }
    function fitModalToViewport() {
      if (!modal || !modal.classList.contains('is-open')) return;
      syncVisualViewportBox();
      var dialog = modal.querySelector('.smart-plant__dialog');
      if (!dialog) return;
      dialog.style.setProperty('--sp-modal-scale', '1');
      var vv = window.visualViewport;
      var vw = vv ? vv.width : window.innerWidth;
      var vh = vv ? vv.height : window.innerHeight;
      var padX = vw <= 640 ? 16 : 36;
      var padY = vw <= 640 ? 16 : 36;
      var naturalW = dialog.offsetWidth || 1;
      var naturalH = dialog.offsetHeight || 1;
      var scale = Math.min(1, (vw - padX) / naturalW, (vh - padY) / naturalH);
      if (!Number.isFinite(scale) || scale <= 0) scale = 1;
      // Sem barra interna: em telas realmente pequenas o conteúdo reduz como bloco.
      dialog.style.setProperty('--sp-modal-scale', String(Math.max(.32, scale)));
    }
    function lockPage() {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('smart-plant-modal-open');
      document.body.classList.add('smart-plant-body-locked');
      document.body.style.top = (-lockedScrollY) + 'px';
      document.body.style.width = '100%';
      viewportHandler = function () {
        window.requestAnimationFrame(function () {
          syncVisualViewportBox();
          fitModalToViewport();
        });
      };
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', viewportHandler, { passive:true });
        window.visualViewport.addEventListener('scroll', viewportHandler, { passive:true });
      }
      window.addEventListener('resize', viewportHandler, { passive:true });
      window.addEventListener('orientationchange', viewportHandler, { passive:true });
    }
    function setupMagnifier(image) {
      if (magnifierCleanup) { try { magnifierCleanup(); } catch (_) {} magnifierCleanup = null; }
      if (!modal || !image) return;
      var stage = modal.querySelector('[data-smart-plant-magnifier-stage]');
      var lens = modal.querySelector('[data-smart-plant-magnifier]');
      var settingsToggle = modal.querySelector('[data-smart-plant-magnifier-settings-toggle]');
      var settingsPanel = modal.querySelector('[data-smart-plant-magnifier-settings]');
      var zoomButtons = Array.prototype.slice.call(modal.querySelectorAll('[data-smart-plant-zoom]'));
      if (!stage || !lens) return;

      function boolData(name, fallback) {
        var value = String(root.dataset[name] == null ? '' : root.dataset[name]).trim().toLowerCase();
        if (!value) return fallback;
        return !['false','0','no','off'].includes(value);
      }
      var touchToggle = boolData('magnifierTouchToggle', true);
      var clickPosition = boolData('magnifierClickPosition', true);
      var dragPosition = boolData('magnifierDragPosition', true);
      var followMouse = boolData('magnifierFollowMouse', false);
      var holdMode = boolData('magnifierStartHidden', true);
      var hint = modal.querySelector('[data-smart-plant-magnifier-hint]');
      if (hint) hint.hidden = !holdMode;
      stage.dataset.holdMode = String(holdMode);
      lens.classList.toggle('is-hold-mode', holdMode);
      var zoom = String(root.dataset.magnifierZoom || '3') === '2' ? 2 : 3;
      var dragging = false;
      var pointerId = null;
      var dragMoved = false;
      var downX = 0, downY = 0;
      var suppressLensClick = false;
      var touchStart = null;
      var lastTouchToggleAt = 0;

      lens.dataset.dragEnabled = dragPosition ? 'true' : 'false';

      function sourceUrl() { return safeImage(image.currentSrc || image.src || ''); }
      function updateZoomUi() {
        lens.setAttribute('aria-label', 'Lupa ' + zoom + ' vezes');
        zoomButtons.forEach(function (button) {
          button.classList.toggle('is-active', Number(button.dataset.smartPlantZoom) === zoom);
        });
      }
      function place(clientX, clientY) {
        var rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        var y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        lens.style.left = x + 'px'; lens.style.top = y + 'px';
        lens.style.backgroundImage = 'url("' + sourceUrl().replace(/"/g,'\\"') + '")';
        lens.style.backgroundSize = (rect.width * zoom) + 'px ' + (rect.height * zoom) + 'px';
        lens.style.backgroundPosition = ((75 - x * zoom)) + 'px ' + ((75 - y * zoom)) + 'px';
      }
      function refreshAtCurrentPosition() {
        var rect = stage.getBoundingClientRect();
        var left = parseFloat(lens.style.left), top = parseFloat(lens.style.top);
        if (!Number.isFinite(left)) left = rect.width / 2;
        if (!Number.isFinite(top)) top = rect.height / 2;
        place(rect.left + left, rect.top + top);
      }
      function center() { var r = stage.getBoundingClientRect(); place(r.left + r.width/2, r.top + r.height/2); }
      function setVisible(visible) { lens.classList.toggle('is-hidden', !visible); }
      function toggleVisible() { setVisible(lens.classList.contains('is-hidden')); }
      function setSettingsOpen(open) {
        if (!settingsPanel) return;
        settingsPanel.classList.toggle('is-open', !!open);
        settingsPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (settingsToggle) settingsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      function toggleSettings() { setSettingsOpen(!(settingsPanel && settingsPanel.classList.contains('is-open'))); }
      function chooseZoom(event) {
        var button = event.currentTarget;
        zoom = Number(button.dataset.smartPlantZoom) === 2 ? 2 : 3;
        updateZoomUi();
        refreshAtCurrentPosition();
        event.preventDefault(); event.stopPropagation();
      }
      function down(event) {
        if (!dragPosition) return;
        dragging = true; pointerId = event.pointerId; dragMoved = false; downX = event.clientX; downY = event.clientY;
        lens.classList.add('is-dragging');
        try { lens.setPointerCapture(pointerId); } catch (_) {}
        place(event.clientX,event.clientY); event.preventDefault(); event.stopPropagation();
      }
      function move(event) {
        if (!dragging || (pointerId != null && event.pointerId !== pointerId)) return;
        if (Math.abs(event.clientX-downX) > 3 || Math.abs(event.clientY-downY) > 3) dragMoved = true;
        place(event.clientX,event.clientY); event.preventDefault(); event.stopPropagation();
      }
      function up(event) {
        if (!dragging || (pointerId != null && event.pointerId !== pointerId)) return;
        suppressLensClick = true;
        if (!dragMoved) toggleSettings();
        dragging=false; lens.classList.remove('is-dragging');
        try { lens.releasePointerCapture(pointerId); } catch (_) {} pointerId=null;
        event.preventDefault(); event.stopPropagation();
        setTimeout(function () { suppressLensClick = false; }, 0);
      }
      function lensClick(event) {
        if (suppressLensClick) return;
        toggleSettings();
        event.preventDefault(); event.stopPropagation();
      }
      function stageClick(event) {
        if (holdMode) return;
        if (!clickPosition || (Date.now() - lastTouchToggleAt) < 500) return;
        if (event.target.closest('[data-smart-plant-magnifier], [data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) return;
        if (event.pointerType === 'touch') return;
        setVisible(true); place(event.clientX,event.clientY);
      }
      function stagePointerMove(event) {
        if (holdMode) return;
        if (!followMouse || dragging || event.pointerType !== 'mouse') return;
        if (event.target.closest('[data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) return;
        setVisible(true); place(event.clientX,event.clientY);
      }
      function stagePointerDown(event) {
        if (holdMode) return;
        if (!touchToggle || event.pointerType !== 'touch') return;
        if (event.target.closest('[data-smart-plant-magnifier], [data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) return;
        touchStart = { id:event.pointerId, x:event.clientX, y:event.clientY };
      }
      function stagePointerUp(event) {
        if (holdMode) return;
        if (!touchToggle || event.pointerType !== 'touch' || !touchStart || touchStart.id !== event.pointerId) return;
        if (event.target.closest('[data-smart-plant-magnifier], [data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) { touchStart=null; return; }
        var moved = Math.abs(event.clientX-touchStart.x) > 8 || Math.abs(event.clientY-touchStart.y) > 8;
        touchStart = null;
        if (moved) return;
        lastTouchToggleAt = Date.now();
        if (lens.classList.contains('is-hidden')) { setVisible(true); place(event.clientX,event.clientY); }
        else toggleVisible();
        event.preventDefault();
      }
      // Modality-independent press-and-hold: no persistent floating lens on entry.
      // Do not hijack native vertical scrolling on touch devices.
      var holdPointer = null;
      function isMagnifierControl(target) {
        return !!(target && target.closest && target.closest('[data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]'));
      }
      function holdDown(event) {
        if (!holdMode || event.button > 0 || isMagnifierControl(event.target)) return;
        holdPointer = event.pointerId;
        setVisible(true); place(event.clientX, event.clientY);
      }
      function holdMove(event) {
        if (!holdMode || holdPointer !== event.pointerId) return;
        place(event.clientX, event.clientY);
      }
      function holdRelease(event) {
        if (!holdMode || holdPointer !== event.pointerId) return;
        holdPointer = null; setVisible(false);
      }
      function holdKeyDown(event) {
        if (!holdMode || event.target !== stage || (event.key !== ' ' && event.key !== 'Enter') || event.repeat) return;
        event.preventDefault(); center(); setVisible(true);
      }
      function holdKeyUp(event) {
        if (!holdMode || event.target !== stage || (event.key !== ' ' && event.key !== 'Enter')) return;
        event.preventDefault(); setVisible(false);
      }
      function holdBlur() { if (holdMode) {holdPointer=null;setVisible(false);} }
      function toggleSettingsButton(event) { toggleSettings(); event.preventDefault(); event.stopPropagation(); }

      lens.addEventListener('pointerdown', down); lens.addEventListener('pointermove', move); lens.addEventListener('pointerup', up); lens.addEventListener('pointercancel', up); lens.addEventListener('click', lensClick);
      stage.addEventListener('pointerdown', holdDown); stage.addEventListener('pointermove', holdMove); stage.addEventListener('pointerup', holdRelease); stage.addEventListener('pointercancel', holdRelease);
      stage.addEventListener('keydown',holdKeyDown); stage.addEventListener('keyup',holdKeyUp); stage.addEventListener('blur',holdBlur);
      document.addEventListener('pointerup', holdRelease); document.addEventListener('pointercancel', holdRelease);
      stage.addEventListener('click', stageClick); stage.addEventListener('pointermove', stagePointerMove); stage.addEventListener('pointerdown', stagePointerDown); stage.addEventListener('pointerup', stagePointerUp); stage.addEventListener('pointercancel', function(){ touchStart=null; });
      if (settingsToggle) settingsToggle.addEventListener('click', toggleSettingsButton);
      zoomButtons.forEach(function (button) { button.addEventListener('click', chooseZoom); });
      lens.classList.add('is-ready'); setVisible(!holdMode); updateZoomUi(); center(); setSettingsOpen(false);

      magnifierCleanup = function () {
        lens.removeEventListener('pointerdown',down); lens.removeEventListener('pointermove',move); lens.removeEventListener('pointerup',up); lens.removeEventListener('pointercancel',up); lens.removeEventListener('click',lensClick);
        stage.removeEventListener('pointerdown',holdDown); stage.removeEventListener('pointermove',holdMove); stage.removeEventListener('pointerup',holdRelease); stage.removeEventListener('pointercancel',holdRelease);
        stage.removeEventListener('keydown',holdKeyDown); stage.removeEventListener('keyup',holdKeyUp); stage.removeEventListener('blur',holdBlur);
        document.removeEventListener('pointerup',holdRelease); document.removeEventListener('pointercancel',holdRelease);
        stage.removeEventListener('click',stageClick); stage.removeEventListener('pointermove',stagePointerMove); stage.removeEventListener('pointerdown',stagePointerDown); stage.removeEventListener('pointerup',stagePointerUp);
        if (settingsToggle) settingsToggle.removeEventListener('click',toggleSettingsButton);
        zoomButtons.forEach(function (button) { button.removeEventListener('click',chooseZoom); });
        lens.classList.remove('is-ready','is-dragging','is-hidden','is-hold-mode'); setSettingsOpen(false);
      };
    }

    function closeModal() {
      if (!modal || closing || !modal.classList.contains('is-open')) return;
      closing = true;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      if (magnifierCleanup) { try { magnifierCleanup(); } catch (_) {} magnifierCleanup = null; }
      unlockPage();
      active = null;
      var restore = lastTrigger;
      lastTrigger = null;
      window.setTimeout(function () {
        closing = false;
        if (restore && restore.isConnected && restore.focus) {
          try { restore.focus({ preventScroll:true }); } catch (_) { restore.focus(); }
        }
      }, 30);
    }
    function openModal(id, trigger) {
      active = plants.find(function (item) { return String(item.id) === String(id); }) || null;
      if (!active || !modal) return;
      ensureModalPortal();
      syncPortalTheme();
      syncVisualViewportBox();
      lastTrigger = trigger || document.activeElement || null;
      closing = false;
      var image = modal.querySelector('[data-smart-plant-modal-image]');
      var title = modal.querySelector('[data-smart-plant-modal-title]');
      var badgeWrap = modal.querySelector('[data-smart-plant-modal-badges]');
      var positionImage = modal.querySelector('[data-smart-plant-position-image]');
      var position = modal.querySelector('[data-smart-plant-position]');
      var positionBlock = modal.querySelector('[data-smart-plant-position-block]');
      var action = modal.querySelector('[data-smart-plant-action]');
      var full = safeImage(active.fullImage || active.image);
      if (image) { image.src = full; image.alt = active.title || 'Planta'; }
      if (title) title.textContent = active.title;
      if (badgeWrap) badgeWrap.innerHTML = badges(active).map(function (item) { return '<span class="smart-plant__badge">' + esc(item) + '</span>'; }).join('');
      if (positionImage) {
        var posSrc = safeImage(active.positionImage);
        positionImage.src = posSrc;
        positionImage.style.display = posSrc ? 'block' : 'none';
      }
      if (position) position.textContent = active.position || '';
      if (positionBlock) positionBlock.style.display = (active.position || active.positionImage) ? '' : 'none';
      if (action) action.textContent = root.dataset.actionMode === 'form' ? (root.dataset.actionLabelForm || 'Gostei desta planta. Quero mais informações') : (root.dataset.actionLabelWhats || 'Gostei desta! Quero mais informações');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
      lockPage();
      window.requestAnimationFrame(function () {
        fitModalToViewport();
        window.requestAnimationFrame(fitModalToViewport);
      });
      if (image) {
        // Initialize controls and the hidden state immediately, even while the
        // high-resolution image is still loading (or if the image is unavailable).
        setupMagnifier(image);
        image.onload = function () { fitModalToViewport(); setupMagnifier(image); };
      }
      setTimeout(function () {
        fitModalToViewport();
        var closeButton = modal.querySelector('[data-smart-plant-close].smart-plant__close');
        if (closeButton && closeButton.focus) closeButton.focus({ preventScroll:true });
      }, 40);
    }
    function sendAction() {
      if (!active) return;
      var mode = root.dataset.actionMode === 'form' ? 'form' : 'whatsapp';
      if (mode === 'whatsapp') {
        var number = String(root.dataset.whatsNumber || '').replace(/\D+/g,'');
        var message = fillTemplate(root.dataset.whatsMessage, root, active);
        var url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank', 'noopener');
        return;
      }
      var detail = {
        source:'smart-plant',
        empreendimento:root.dataset.empreendimento || '',
        plantId:active.id,
        plantCode:active.code || '',
        plantTitle:active.title,
        area:active.area,
        message:fillTemplate(root.dataset.formContextMessage, root, active),
        targetAnchor:String(root.dataset.formAnchor || '').replace(/^#/,'')
      };

      // Integração nativa com o Form Sender v4.
      // O Smart Plant grava o contexto diretamente no formulário que efetivamente
      // será submetido pelo Form Sender v4. Assim a planta escolhida chega no e-mail
      // mesmo quando o campo visual de mensagem estiver oculto.
      function locateFormSenderV4() {
        var scope = detail.targetAnchor ? document.getElementById(detail.targetAnchor) : null;
        var mount = null;
        if (scope) {
          if (scope.matches && scope.matches('.formsenderV4_mount')) mount = scope;
          if (!mount && scope.querySelector) mount = scope.querySelector('.formsenderV4_mount');
          if (!mount && scope.matches && scope.matches('[data-plugin="form-sender-v4"]')) mount = scope.querySelector('.formsenderV4_mount');
        }
        if (!mount) mount = document.querySelector('[data-plugin="form-sender-v4"] .formsenderV4_mount');
        if (!mount) mount = document.querySelector('.formsenderV4_mount');
        return mount;
      }

      function writeFormSenderV4Context(mount) {
        if (!mount) return false;
        var form = mount.querySelector('form');
        if (!form) return false;

        function setHidden(name, value) {
          var field = form.querySelector('[name="' + name + '"]');
          if (!field) {
            field = document.createElement('input');
            field.type = 'hidden';
            field.name = name;
            form.appendChild(field);
          }
          field.value = String(value || '');
        }

        setHidden('origem', 'Smart Plant');
        setHidden('smartPlantId', detail.plantId);
        setHidden('smartPlantCode', detail.plantCode);
        setHidden('smartPlant', detail.plantTitle);
        setHidden('smartPlantArea', detail.area);

        var msg = form.querySelector('[name="msg"]');
        if (!msg) {
          msg = document.createElement('input');
          msg.type = 'hidden';
          msg.name = 'msg';
          form.appendChild(msg);
        }

        var current = String(msg.value || '').trim();
        var previous = String(form.dataset.smartPlantMessage || '');
        if (previous && current.indexOf(previous) >= 0) current = current.replace(previous, '').trim();

        var lines = [
          detail.plantTitle ? 'Planta: ' + detail.plantTitle : '',
          detail.area ? 'Metragem: ' + detail.area : '',
          detail.plantCode ? 'Identificador: ' + detail.plantCode : ''
        ].filter(Boolean);
        if (detail.message) lines.push('', detail.message);
        var block = lines.join('\n').trim();

        form.dataset.smartPlantMessage = block;
        msg.value = [current, block].filter(Boolean).join('\n\n');
        mount.dataset.smartPlantSelected = detail.plantId || detail.plantTitle || 'true';
        return true;
      }

      var formSenderMount = locateFormSenderV4();
      var applied = writeFormSenderV4Context(formSenderMount);

      // Form Sender Popup recebe sempre o contexto, mesmo quando o Form Sender V4 ja foi preenchido.
      window.dispatchEvent(new CustomEvent('imobify:smart-plant-popup', { detail:detail }));

      // Mantém o evento oficial para o adapter do Form Sender v4 e futuras integrações.
      // Só o dispara quando não foi possível aplicar diretamente, evitando duplicidade.
      if (!applied) {
        window.dispatchEvent(new CustomEvent('imobify:smart-plant-form', { detail:detail }));
      }

      closeModal();
      var target = document.querySelector('[data-plugin="form-sender-popup"]') ? null : (formSenderMount || (detail.targetAnchor ? document.getElementById(detail.targetAnchor) : document.querySelector('[data-plugin="form-sender-v4"]')));
      if (target) {
        target.scrollIntoView({ behavior:'smooth', block:'center' });
        setTimeout(function () {
          var focusTarget = target.querySelector ? target.querySelector('input,textarea,button') : null;
          if (focusTarget && focusTarget.focus) focusTarget.focus({preventScroll:true});
        }, 500);
      } else {
        console.warn('[Smart Plant] Form Sender v4 não encontrado. Configure a âncora do Form Sender ou adicione uma seção form-sender-v4 à página.');
      }
    }
    root.addEventListener('click', function (event) {
      var open = event.target.closest('[data-smart-plant-open]');
      if (open) { openModal(open.dataset.smartPlantOpen, open); return; }
    });
    if (modal) {
      // Listener próprio porque o modal é movido para um portal fora da section.
      // Click é intencional: evita o duplo disparo touchend + click no Safari iOS.
      modal.addEventListener('click', function (event) {
        var closeControl = event.target.closest('[data-smart-plant-close]');
        if (closeControl) {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }
        var actionControl = event.target.closest('[data-smart-plant-action]');
        if (actionControl) {
          event.preventDefault();
          sendAction();
        }
      });
    }
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal(); });
  }
  function boot() { document.querySelectorAll('[data-plugin="smart-plant"]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();


(function(){})();


(function(){
  "use strict";
  function init(scope=document){
    scope.querySelectorAll('[data-plugin="only-text-context"] .otc-root').forEach((root)=>{
      if(root.dataset.otcReady==='true')return;
      root.dataset.otcReady='true';
      const motion=(root.dataset.motion||'none').trim();
      if(motion==='none'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){root.classList.add('is-visible');return;}
      root.classList.add('otc-motion-ready');
      if(!('IntersectionObserver' in window)){root.classList.add('is-visible');return;}
      const io=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(entry.isIntersecting){root.classList.add('is-visible');io.disconnect();}});},{threshold:.18,rootMargin:'0px 0px -8% 0px'});
      io.observe(root);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});else init();
})();


(function(){})();


(function(){function setup(root){if(root.dataset.bsInitialized==='1')return;root.dataset.bsInitialized='1';root.querySelectorAll('.bs-filter').forEach(button=>{button.addEventListener('click',()=>{const filter=button.dataset.bsFilter;root.querySelectorAll('.bs-filter').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});root.querySelectorAll('.bs-card').forEach(c=>{c.hidden=filter!=='*'&&c.dataset.bsCategory!==filter})})});if(root.dataset.bsMotion==='none'||matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver'in window))return;const cards=[...root.querySelectorAll('.bs-card')];root.classList.add('bs-motion-ready');const obs=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('bs-visible');obs.unobserve(entry.target)}})},{threshold:.12,rootMargin:'0px 0px -20px 0px'});cards.forEach(c=>obs.observe(c));}function init(){document.querySelectorAll('[data-plugin="benefits-showcase"]').forEach(setup)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.ImobifyBenefitsShowcaseInit=init;})();

(function(){
  document.querySelectorAll('[data-plugin="image-single"] .iis-image').forEach(function(image){
    image.addEventListener('error',function(){image.closest('.iis-figure')?.classList.add('is-image-error');},{once:true});
  });
})();


(function () {
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeHref(value) {
    var raw = String(value || '').trim();
    if (/^#[A-Za-z][\w:.-]*$/.test(raw)) return raw;
    if (/^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw)) return raw;
    if (/^(?:https?:|mailto:|tel:)/i.test(raw)) return raw;
    return '#';
  }

  function safeImage(value) {
    var raw = String(value || '').trim();
    if (/^data:image\/(?:avif|gif|jpeg|png|svg\+xml|webp);/i.test(raw)) return raw;
    if (/^(?:https?:)?\/\//i.test(raw)) return raw;
    if (/^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw)) return raw;
    if (/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.~%+@()-]+)+(?:\?[A-Za-z0-9_.~!$&'()*+,;=:@%/?-]*)?$/.test(raw)) return raw;
    return '';
  }

  function normalizeSlide(item, index) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id: String(item.id || ('slide-' + (index + 1))),
      image: String(item.image || ''),
      imageAlt: String(item.imageAlt || item.title || ''),
      eyebrow: String(item.eyebrow || ''),
      title: String(item.title || ''),
      text: String(item.text || item.copy || ''),
      showButton: item.showButton !== false && String(item.showButton).toLowerCase() !== 'false',
      buttonText: String(item.buttonText || item.cta || ''),
      buttonLink: String(item.buttonLink || item.link || '#')
    };
  }

  function legacySlides(slider) {
    var items = [];
    for (var n = 1; n <= 3; n += 1) {
      var image = slider.dataset['image' + n] || '';
      var title = slider.dataset['title' + n] || '';
      var eyebrow = slider.dataset['eyebrow' + n] || '';
      var text = slider.dataset['copy' + n] || '';
      var cta = slider.dataset['cta' + n] || '';
      var link = slider.dataset['link' + n] || '#';
      if (!image && !title && !eyebrow && !text && !cta) continue;
      items.push(normalizeSlide({ id:'slide-' + n, image:image, imageAlt:title, eyebrow:eyebrow, title:title, text:text, showButton:Boolean(cta), buttonText:cta, buttonLink:link }, items.length));
    }
    return items;
  }

  function readSlides(slider) {
    try {
      var parsed = JSON.parse(slider.dataset.slides || '[]');
      if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizeSlide);
    } catch (_) {}
    return legacySlides(slider);
  }

  function slideMarkup(item, index) {
    var image = safeImage(item.image);
    var button = item.showButton && item.buttonText.trim()
      ? '<a class="button button-primary" href="' + esc(safeHref(item.buttonLink)) + '">' + esc(item.buttonText) + '</a>'
      : '';
    var eyebrow = item.eyebrow.trim() ? '<p class="eyebrow">' + esc(item.eyebrow) + '</p>' : '';
    var title = item.title.trim() ? '<h2>' + esc(item.title) + '</h2>' : '';
    var text = item.text.trim() ? '<p>' + esc(item.text) + '</p>' : '';
    var img = image ? '<img src="' + esc(image) + '" alt="' + esc(item.imageAlt || item.title) + '"' + (index ? ' loading="lazy"' : '') + ' decoding="async">' : '';
    return '<article class="property-slide' + (index === 0 ? ' is-active' : '') + '" data-slide-index="' + index + '" aria-hidden="' + (index === 0 ? 'false' : 'true') + '">' + img + '<div class="property-slide-shade"></div><div class="property-slide-content">' + eyebrow + title + text + button + '</div></article>';
  }

  function renderSlides(slider) {
    var items = readSlides(slider);
    var track = slider.querySelector('.property-slider-track');
    var dots = slider.querySelector('.property-slider-dots');
    if (track) track.innerHTML = items.map(slideMarkup).join('');
    if (dots) dots.innerHTML = items.map(function (_, index) {
      return '<button type="button" data-slider-dot="' + index + '" class="' + (index === 0 ? 'is-active' : '') + '" aria-label="Ir para slide ' + (index + 1) + '" aria-selected="' + (index === 0 ? 'true' : 'false') + '"></button>';
    }).join('');
    slider.dataset.slideCount = String(items.length);
  }

  function init(root) {
    if (root.dataset.sliderReady === 'true') return;
    root.dataset.sliderReady = 'true';
    var slider = root.matches('.property-slider') ? root : (root.querySelector(':scope > .property-slider') || root);
    renderSlides(slider);
    var slides = Array.from(slider.querySelectorAll('.property-slide'));
    var dots = Array.from(slider.querySelectorAll('[data-slider-dot]'));
    var index = 0;
    var timer = 0;
    var interval = Math.max(2500, Number(slider.dataset.interval) || 5500);
    var autoplay = slider.dataset.autoplay === 'true' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pauseOnHover = slider.dataset.pauseHover !== 'false';
    var loop = slider.dataset.loop !== 'false';
    var swipe = slider.dataset.swipe !== 'false';
    var startX = null;
    slider.style.setProperty('--slider-duration', interval + 'ms');

    function show(next, userAction) {
      if (!slides.length) return;
      if (loop) index = (next + slides.length) % slides.length;
      else index = Math.max(0, Math.min(slides.length - 1, next));
      slides.forEach(function (slide, position) {
        var active = position === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === index);
        dot.setAttribute('aria-selected', position === index ? 'true' : 'false');
      });
      if (userAction) restart();
    }

    function schedule() {
      window.clearTimeout(timer);
      slider.classList.remove('is-running');
      if (!autoplay || slides.length < 2 || document.hidden) return;
      void slider.offsetWidth;
      slider.classList.add('is-running');
      timer = window.setTimeout(function () {
        if (!loop && index >= slides.length - 1) { slider.classList.remove('is-running'); return; }
        show(index + 1); schedule();
      }, interval);
    }

    function restart() { schedule(); }
    slider.querySelector('[data-slider-prev]')?.addEventListener('click', function () { show(index - 1, true); });
    slider.querySelector('[data-slider-next]')?.addEventListener('click', function () { show(index + 1, true); });
    dots.forEach(function (dot) { dot.addEventListener('click', function () { show(Number(dot.dataset.sliderDot), true); }); });
    slider.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') show(index - 1, true);
      if (event.key === 'ArrowRight') show(index + 1, true);
    });
    slider.addEventListener('pointerdown', function (event) { if (swipe) startX = event.clientX; });
    slider.addEventListener('pointerup', function (event) {
      if (startX == null) return;
      var distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 50) show(index + (distance < 0 ? 1 : -1), true);
    });
    slider.addEventListener('mouseenter', function () { if (!pauseOnHover) return; window.clearTimeout(timer); slider.classList.remove('is-running'); });
    slider.addEventListener('mouseleave', function () { if (pauseOnHover) schedule(); });
    document.addEventListener('visibilitychange', schedule);
    show(0);
    schedule();
  }

  function boot() { document.querySelectorAll('[data-plugin="property-slider"]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


(function(){
  'use strict';

  function decodeHtml(value){
    return String(value || '').replace(/&amp;/gi, '&').trim();
  }

  function extractIframeSrc(value){
    var text = decodeHtml(value);
    var match = text.match(/<iframe[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/i);
    return match && match[1] ? decodeHtml(match[1]) : text;
  }

  function safeUrl(value){
    var text = extractIframeSrc(value);
    if (!/^https?:\/\//i.test(text)) return '';
    try { return new URL(text); } catch (e) { return ''; }
  }

  function embedFromUrl(value, address){
    var parsed = safeUrl(value);
    var fallback = String(address || '').trim();

    if (parsed) {
      var host = parsed.hostname.toLowerCase();
      var isGoogle = host === 'google.com' || host.endsWith('.google.com') || host === 'maps.google.com' || host === 'maps.app.goo.gl';

      if (isGoogle) {
        if (/\/maps\/embed/i.test(parsed.pathname) || parsed.searchParams.get('output') === 'embed') {
          return parsed.href;
        }

        var q = parsed.searchParams.get('q') || parsed.searchParams.get('query') || parsed.searchParams.get('ll');
        if (q) {
          return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
        }

        var coords = parsed.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
        if (coords) {
          return 'https://www.google.com/maps?q=' + encodeURIComponent(coords[1] + ',' + coords[2]) + '&output=embed';
        }
      }
    }

    if (fallback) {
      return 'https://www.google.com/maps?q=' + encodeURIComponent(fallback) + '&output=embed';
    }

    return '';
  }

  function renderMap(section){
    if (!section) return;

    var map = section.querySelector('.location-map');
    if (!map) return;

    var link = map.querySelector('a');
    var addressNode = section.querySelector('.location-layout .address');
    var address = addressNode ? addressNode.textContent.trim() : '';
    var source = link ? (link.getAttribute('href') || '') : '';
    var src = embedFromUrl(source, address);
    if (!src) return;

    var frame = map.querySelector('iframe.location-map-frame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.className = 'location-map-frame';
      frame.setAttribute('title', 'Localização no Google Maps');
      frame.setAttribute('loading', 'lazy');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      map.insertBefore(frame, map.firstChild);
    }

    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    if (window.__IMOBIFY_EDITOR__) frame.style.pointerEvents = 'none';
    map.classList.add('has-google-map');
  }

  function enhancePlaces(section){
    section.querySelectorAll('.location-places li').forEach(function(item){
      if (item.querySelector('strong')) return;
      var raw = (item.textContent || '').trim();
      var separator = raw.indexOf('|');
      if (separator < 0) return;
      var time = raw.slice(0, separator).trim();
      var place = raw.slice(separator + 1).trim();
      item.textContent = '';
      var strong = document.createElement('strong');
      var span = document.createElement('span');
      strong.textContent = time;
      span.textContent = place;
      item.append(strong, span);
    });
  }

  function boot(scope){
    var root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('.location-section').forEach(function(section){
      enhancePlaces(section);
      renderMap(section);
    });
  }

  function start(){
    boot(document);
    if (!document.documentElement) return;
    new MutationObserver(function(mutations){
      var needsRender = mutations.some(function(mutation){ return mutation.addedNodes && mutation.addedNodes.length; });
      if (needsRender) boot(document);
    }).observe(document.documentElement, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();


(function(){document.querySelectorAll('[data-plugin="faq"] details').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)window.Imobify&&Imobify.track('faq_open',{question:item.querySelector('summary').textContent.replace('+','').trim()});}));})();


(function () {
  "use strict";

  const PLUGIN_ID = "anti-ia-copy-policy";
  const POLICY_NODE_ID = "imobify-anti-ai-policy";
  const JSONLD_ID = "imobify-anti-ai-rights-jsonld";
  const META_ATTR = "data-imobify-anti-ai";

  function toBoolean(value) {
    return String(value).toLowerCase() === "true";
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function setMeta(name, content) {
    let meta = document.head.querySelector(`meta[name="${name}"][${META_ATTR}]`);

    if (!content) {
      if (meta) meta.remove();
      return;
    }

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      meta.setAttribute(META_ATTR, "true");
      document.head.appendChild(meta);
    }

    meta.content = content;
  }

  function removeGeneratedMetadata() {
    document.head
      .querySelectorAll(`[${META_ATTR}]`)
      .forEach((element) => element.remove());

    document.getElementById(JSONLD_ID)?.remove();
    document.getElementById(POLICY_NODE_ID)?.remove();
  }

  function buildPolicy(config) {
    const restrictions = [];

    if (config.blockReproduction) {
      restrictions.push("cópia, reprodução, redistribuição, adaptação e criação de obras derivadas");
    }

    if (config.blockTraining) {
      restrictions.push("treinamento, ajuste, avaliação, mineração ou alimentação de sistemas de inteligência artificial");
    }

    if (config.blockSummarization) {
      restrictions.push("resumo automatizado ou reformulação substancial por sistemas de inteligência artificial");
    }

    const restrictionText = restrictions.length
      ? `Não autorizado para ${restrictions.join("; ")} sem autorização expressa do titular.`
      : "Uso sujeito aos direitos autorais e às condições declaradas pelo titular.";

    return [
      config.directive,
      restrictionText,
      config.owner ? `Titular: ${config.owner}.` : "",
      config.siteName ? `Obra/site: ${config.siteName}.` : "",
      config.copyrightYear ? `Ano: ${config.copyrightYear}.` : "",
      config.licenseUrl ? `Termos de uso: ${config.licenseUrl}.` : "",
      config.contactUrl ? `Contato para licenciamento: ${config.contactUrl}.` : ""
    ].filter(Boolean).join(" ");
  }

  function injectPolicy(config) {
    removeGeneratedMetadata();

    const policy = buildPolicy(config);
    const copyrightNotice = [
      config.copyrightYear ? `© ${config.copyrightYear}` : "©",
      config.owner || config.siteName || "Todos os direitos reservados"
    ].join(" ");

    const policyNode = document.createElement("aside");
    policyNode.id = POLICY_NODE_ID;
    policyNode.className = "aicp-machine-policy";
    policyNode.setAttribute("aria-hidden", "true");
    policyNode.setAttribute("data-ai-usage-policy", config.blockTraining ? "no-training" : "restricted");
    policyNode.setAttribute("data-content-license", config.licenseUrl || "all-rights-reserved");
    policyNode.textContent = policy;
    document.body.appendChild(policyNode);

    setMeta("copyright", copyrightNotice);
    setMeta("rights", policy);
    setMeta("ai-usage-policy", config.blockTraining ? "no-training" : "restricted-use");
    setMeta("content-license", config.licenseUrl || "all-rights-reserved");

    if (config.addNoAiMeta) {
      setMeta("robots", "noai, noimageai");
      setMeta("googlebot", "noai, noimageai");
    }

    if (config.addJsonLd) {
      const data = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": config.siteName || document.title || "Conteúdo protegido",
        "copyrightNotice": copyrightNotice,
        "copyrightYear": config.copyrightYear || undefined,
        "copyrightHolder": config.owner
          ? { "@type": "Person", "name": config.owner }
          : undefined,
        "license": config.licenseUrl || undefined,
        "usageInfo": config.licenseUrl || config.contactUrl || undefined,
        "description": policy
      };

      Object.keys(data).forEach((key) => {
        if (data[key] === undefined || data[key] === "") delete data[key];
      });

      const script = document.createElement("script");
      script.id = JSONLD_ID;
      script.type = "application/ld+json";
      script.setAttribute(META_ATTR, "true");
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }

  function readConfig(root) {
    const source = root.querySelector(".aicp-config");
    if (!source) return null;

    return {
      owner: clean(source.dataset.owner),
      siteName: clean(source.dataset.siteName),
      copyrightYear: clean(source.dataset.year),
      contactUrl: clean(source.dataset.contactUrl),
      licenseUrl: clean(source.dataset.licenseUrl),
      blockTraining: toBoolean(source.dataset.blockTraining),
      blockReproduction: toBoolean(source.dataset.blockReproduction),
      blockSummarization: toBoolean(source.dataset.blockSummarization),
      addNoAiMeta: toBoolean(source.dataset.addNoaiMeta),
      addJsonLd: toBoolean(source.dataset.addJsonld),
      directive: clean(source.querySelector(".aicp-directive-source")?.textContent)
    };
  }

  function initialize() {
    const instances = Array.from(document.querySelectorAll(`[data-plugin="${PLUGIN_ID}"]`));
    if (!instances.length) return;

    /* A última instância configurada prevalece para evitar metadados duplicados. */
    const config = readConfig(instances[instances.length - 1]);
    if (config) injectPolicy(config);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();


/* IMOBIFY Financeiro — versão 1.0.0: módulo reutilizável, sem telemetria ou envios paralelos. */
(function(){'use strict';if(window.ImobifyFinancialFlow)return;
function parse(config){var raw=config.financialQuestions||'';try{var v=JSON.parse(raw);if(Array.isArray(v))return v.filter(function(q){return q&&q.id&&q.label}).slice(0,30)}catch(e){console.warn('[Imobify financeiro] Configuração inválida; revise o JSON.',e)}return []}
function isEnabled(config){return ['true','1','on'].includes(String(config.financialEnabled))}
function launch(config){return new Promise(function(resolve){var questions=parse(config);if(!isEnabled(config)||!questions.length){resolve([]);return}
 var cover=document.createElement('div');cover.className='imobify-finance-overlay';cover.setAttribute('role','presentation');
 var card=document.createElement('section');card.className='imobify-finance-dialog';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Condições financeiras');card.tabIndex=-1;
 var title=document.createElement('h2');title.textContent=config.financialTitle||'Para entender suas condições';var desc=document.createElement('p');desc.textContent=config.financialCopy||'Algumas respostas ajudam a personalizar o atendimento.';
 var form=document.createElement('form');form.noValidate=true;form.className='imobify-finance-form';var items=document.createElement('div');items.className='imobify-finance-items';var status=document.createElement('p');status.className='imobify-finance-status';status.setAttribute('role','alert');var submit=document.createElement('button');submit.type='submit';submit.textContent='Enviar';submit.className='imobify-design-cta imobify-finance-submit';submit.setAttribute('data-design-role','cta');
 form.append(items,status,submit);card.append(title,desc,form);cover.append(card);document.body.append(cover);
 var focusBefore=document.activeElement,answers={};function visible(q){if(!q.showIf)return true;var parent=answers[q.showIf.id];if(Array.isArray(parent))return parent.includes(q.showIf.equals);return String(parent||'')===String(q.showIf.equals)}
 function setAnswer(id,v){answers[id]=v;questions.forEach(function(q){if(!visible(q))delete answers[q.id]});render()}
 function render(){items.replaceChildren();questions.forEach(function(q){if(!visible(q))return;var field=document.createElement('fieldset');var legend=document.createElement('legend');legend.textContent=q.label+(q.required?' *':'');field.append(legend);var type=q.type||'yesno';if(type==='date'||type==='text'||type==='number'){var inp=document.createElement('input');inp.type=type;inp.value=answers[q.id]||'';if(type==='date'){inp.max=new Date().toISOString().slice(0,10)}inp.addEventListener('change',function(){setAnswer(q.id,inp.value)});field.append(inp)}else{var opts=type==='yesno'?['Sim','Não']:Array.isArray(q.options)?q.options:[];var group=document.createElement('div');group.className='imobify-finance-options';opts.forEach(function(option){var label=document.createElement('label'),inp=document.createElement('input');inp.type=type==='multiple'?'checkbox':'radio';inp.name='finance_'+q.id;inp.value=option;inp.checked=type==='multiple'?Array.isArray(answers[q.id])&&answers[q.id].includes(option):answers[q.id]===option;inp.addEventListener('change',function(){if(type==='multiple'){var arr=Array.isArray(answers[q.id])?answers[q.id].slice():[];arr=inp.checked?[...arr,option]:arr.filter(function(x){return x!==option});setAnswer(q.id,arr)}else setAnswer(q.id,option)});label.append(inp,document.createTextNode(option));group.append(label)});field.append(group)}items.append(field)});status.textContent=''}
 function finish(){var missing=questions.find(function(q){return visible(q)&&q.required&&(!answers[q.id]||(Array.isArray(answers[q.id])&&!answers[q.id].length))});if(missing){status.textContent='Responda: '+missing.label;return}var result=questions.filter(function(q){return visible(q)&&answers[q.id]!==undefined&&answers[q.id]!==''}).map(function(q){return {id:q.id,label:q.label,answer:Array.isArray(answers[q.id])?answers[q.id].join(' | '):String(answers[q.id])}});cover.remove();if(focusBefore&&focusBefore.isConnected)focusBefore.focus();resolve(result)}
 form.addEventListener('submit',function(e){e.preventDefault();finish()});cover.addEventListener('keydown',function(e){if(e.key==='Tab'){var elements=Array.from(cover.querySelectorAll('input,button')).filter(function(el){return el.getClientRects().length});if(!elements.length)return;var first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});render();card.focus();
 })}
function addToForm(form,results){if(!form||!results||!results.length)return;var text=results.map(function(r){return r.label+': '+r.answer}).join('\n');var hidden=form.querySelector('[name="condicoesFinanceiras"]');if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.name='condicoesFinanceiras';form.append(hidden)}hidden.value=text;var msg=form.querySelector('[name="msg"]');if(msg)msg.value=[msg.value,'Condições financeiras:',text].filter(Boolean).join('\n\n')}
window.ImobifyFinancialFlow={launch:launch,addToForm:addToForm,isEnabled:isEnabled};})();


/**
 * ================================================================
 * notify-send.js v1.2.0 - Sistema de Notificações e Alertas
 * ================================================================
 */

(function() {
    'use strict';
    
    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================
    
    const CONFIG = {
        notificationDuration: 5000,
        alertDefaultAvatar: 'fa-info-circle',
        alertTypes: {
            success: { icon: 'fa-check-circle', color: '#27ae60', title: 'Sucesso' },
            error: { icon: 'fa-times-circle', color: '#e74c3c', title: 'Erro' },
            warning: { icon: 'fa-exclamation-triangle', color: '#f39c12', title: 'Atenção' },
            info: { icon: 'fa-info-circle', color: '#3498db', title: 'Informação' },
            question: { icon: 'fa-question-circle', color: '#9b59b6', title: 'Pergunta' }
        },
        defaultMessages: {
            success: { title: 'Sucesso!', message: 'Operação realizada com sucesso.' },
            error: { title: 'Erro!', message: 'Ocorreu um erro. Tente novamente.' },
            warning: { title: 'Atenção!', message: 'Verifique as informações antes de continuar.' },
            info: { title: 'Informação', message: 'Aguarde enquanto processamos sua solicitação.' }
        },
        icons: {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        },
        defaultAvatar: 'fa-bell'
    };
    
    // ============================================================
    // CRIAÇÃO DOS CONTAINERS
    // ============================================================
    
    function createContainers() {
        // Container de Notificações
        if (!document.getElementById('ns-notification-container')) {
            const container = document.createElement('div');
            container.id = 'ns-notification-container';
            container.className = 'ns-notification-container';
            document.body.appendChild(container);
        }
        
        // Modal Overlay
        if (!document.getElementById('ns-modal-overlay')) {
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'ns-modal-overlay';
            modalOverlay.className = 'ns-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="ns-modal">
                    <div class="ns-modal-avatar-container" style="text-align: center; margin-bottom: 15px; display: none;">
                        <div class="ns-modal-avatar" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            <i class="fas fa-info-circle" style="font-size: 48px; color: white;"></i>
                        </div>
                    </div>
                    <div class="ns-modal-icon" style="text-align: center; font-size: 50px; margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <h2 class="ns-modal-title">Título</h2>
                    <p class="ns-modal-message">Mensagem</p>
                    <div class="ns-modal-buttons">
                        <button class="ns-modal-button confirm" style="background: #3498db; padding: 12px 28px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; color: white;">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        }
        
        // Toast
        if (!document.getElementById('ns-toast')) {
            const toast = document.createElement('div');
            toast.id = 'ns-toast';
            toast.className = 'ns-toast';
            document.body.appendChild(toast);
        }
    }
    
    // ============================================================
    // FUNÇÃO PRINCIPAL: ALERT COM AVATAR
    // ============================================================
    
    window.notify_Send_alert = function(message, type = 'info', title = '', avatar = '') {
        return new Promise((resolve) => {
            const modalOverlay = document.getElementById('ns-modal-overlay');
            if (!modalOverlay) {
                console.error('notify_Send: Modal overlay não encontrado');
                resolve();
                return;
            }
            
            const modal = modalOverlay.querySelector('.ns-modal');
            const modalTitle = modal.querySelector('.ns-modal-title');
            const modalMessage = modal.querySelector('.ns-modal-message');
            const confirmBtn = modal.querySelector('.ns-modal-button.confirm');
            const modalIcon = modal.querySelector('.ns-modal-icon');
            const modalIconI = modal.querySelector('.ns-modal-icon i');
            const avatarContainer = modal.querySelector('.ns-modal-avatar-container');
            const avatarDiv = modal.querySelector('.ns-modal-avatar');
            
            // Configurar tipo
            const typeConfig = CONFIG.alertTypes[type] || CONFIG.alertTypes.info;
            const finalTitle = title || typeConfig.title;
            
            // Atualizar conteúdo
            modalTitle.textContent = finalTitle;
            modalMessage.textContent = message || 'Mensagem';
            confirmBtn.textContent = 'OK';
            confirmBtn.style.background = typeConfig.color;
            
            // Configurar avatar
            if (avatar) {
                // Mostrar container de avatar, esconder ícone padrão
                avatarContainer.style.display = 'block';
                modalIcon.style.display = 'none';
                
                // Configurar avatar
                if (avatar.match(/^(https?:\/\/|data:image|\/)/i) || avatar.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                    // É URL de imagem
                    avatarDiv.innerHTML = `<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
                } else if (avatar.startsWith('fa-')) {
                    // É ícone Font Awesome
                    avatarDiv.innerHTML = `<i class="fas ${avatar}" style="font-size: 48px; color: white;"></i>`;
                } else {
                    // Fallback
                    avatarDiv.innerHTML = `<i class="fas ${CONFIG.alertDefaultAvatar}" style="font-size: 48px; color: white;"></i>`;
                }
            } else {
                // Sem avatar, mostrar ícone padrão do tipo
                avatarContainer.style.display = 'none';
                modalIcon.style.display = 'block';
                if (modalIconI) {
                    modalIconI.className = `fas ${typeConfig.icon}`;
                    modalIconI.style.color = typeConfig.color;
                }
            }
            
            // Função para fechar
            function closeModal() {
                modalOverlay.classList.remove('show');
                resolve();
            }
            
            // Remover listener antigo e adicionar novo
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            newConfirmBtn.addEventListener('click', closeModal);
            
            // Fechar ao clicar fora
            modalOverlay.onclick = function(e) {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            };
            
            // Mostrar modal
            modalOverlay.classList.add('show');
        });
    };
    
    // ============================================================
    // SOBRESCREVER ALERT NATIVO
    // ============================================================
    
    let alertOverridden = false;
    let originalAlert = null;
    
    window.notify_Send_override_alert = function(enable = true, defaultAvatar = '') {
        if (enable && !alertOverridden) {
            // Salvar referência do alert original
            originalAlert = window.alert;
            
            // Substituir
            window.alert = function(message) {
                window.notify_Send_alert(message, 'info', 'Aviso', defaultAvatar);
            };
            alertOverridden = true;
            console.log('✅ Alert nativo substituído pelo notify_Send_alert');
        } else if (!enable && alertOverridden) {
            // Restaurar alert original
            window.alert = originalAlert;
            alertOverridden = false;
            console.log('✅ Alert nativo restaurado');
        }
    };
    
    // ============================================================
    // FUNÇÕES DE NOTIFICAÇÃO
    // ============================================================
    
    function getAvatarHTML(avatar) {
        if (!avatar) {
            return `<div class="ns-notification-avatar"><i class="fas ${CONFIG.defaultAvatar}"></i></div>`;
        }
        
        if (avatar.match(/^(https?:\/\/|data:image|\/)/i) || avatar.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return `<div class="ns-notification-avatar"><img src="${avatar}" alt="Avatar" onerror="this.parentElement.innerHTML='<i class=\'fas fa-user-circle\'></i>'"></div>`;
        }
        
        if (avatar.startsWith('fa-')) {
            return `<div class="ns-notification-avatar"><i class="fas ${avatar}"></i></div>`;
        }
        
        return `<div class="ns-notification-avatar"><i class="fas fa-user-circle"></i></div>`;
    }
    
    function closeNotification(notificationElement) {
        if (!notificationElement || !notificationElement.parentElement) return;
        notificationElement.classList.remove('show');
        notificationElement.classList.add('hide');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 400);
    }
    
    window.notify_Send_notification = function(type, message = '', title = '', avatar = '') {
        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            console.warn(`notify_Send: Tipo inválido "${type}". Usando "info".`);
            type = 'info';
        }
        
        const finalTitle = title || CONFIG.defaultMessages[type].title;
        const finalMessage = message || CONFIG.defaultMessages[type].message;
        
        const notification = document.createElement('div');
        notification.className = `ns-notification ${type}`;
        
        const avatarHTML = getAvatarHTML(avatar);
        const iconHTML = !avatar ? `<i class="fas ${CONFIG.icons[type]} ns-notification-icon"></i>` : '';
        
        notification.innerHTML = `
            ${avatarHTML}
            ${iconHTML}
            <div class="ns-notification-content">
                <div class="ns-notification-title">${escapeHtml(finalTitle)}</div>
                <div class="ns-notification-message">${escapeHtml(finalMessage)}</div>
            </div>
            <button class="ns-notification-close" onclick="notify_Send_close_notification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
            <div class="ns-notification-progress"></div>
        `;
        
        const container = document.getElementById('ns-notification-container');
        if (container) {
            container.appendChild(notification);
        } else {
            console.error('notify_Send: Container de notificações não encontrado');
            return;
        }
        
        setTimeout(() => {
            notification.classList.add('show');
            const progressBar = notification.querySelector('.ns-notification-progress');
            if (progressBar) {
                setTimeout(() => {
                    progressBar.style.transform = 'scaleX(0)';
                }, 50);
            }
        }, 10);
        
        const timeoutId = setTimeout(() => {
            if (notification.parentElement) {
                closeNotification(notification);
            }
        }, CONFIG.notificationDuration);
        
        notification.dataset.timeoutId = timeoutId;
    };
    
    window.notify_Send_close_notification = function(notificationElement) {
        if (notificationElement && notificationElement.dataset.timeoutId) {
            clearTimeout(parseInt(notificationElement.dataset.timeoutId));
        }
        closeNotification(notificationElement);
    };
    
    window.notify_Send_close_all = function() {
        const container = document.getElementById('ns-notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.ns-notification');
            notifications.forEach(notification => {
                closeNotification(notification);
            });
        }
    };
    
    window.notify_Send_toast = function(message, duration = 3000) {
        const toast = document.getElementById('ns-toast');
        if (!toast) {
            console.error('notify_Send: Toast element não encontrado');
            return;
        }
        toast.textContent = message || 'Notificação';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createContainers);
    } else {
        createContainers();
    }
    
    console.log('🎉 notify-send.js carregado com sucesso!');
    console.log('📌 Funções disponíveis:');
    console.log('   - notify_Send_alert()');
    console.log('   - notify_Send_notification()');
    console.log('   - notify_Send_modal()');
    console.log('   - notify_Send_toast()');
    console.log('   - notify_Send_override_alert()');
    
})();

/**
 * formsenderJS.Plugin - Formulário de contato com validação e integração com notify-send
 * 
 * Uso:
 * new formsenderJS.Plugin('#meu-formulario', {
 *   produto: 'The Garden - New Edition',
 *   endpoint: 'https://script.google.com/macros/s/.../exec',
 *   textoBotao: 'Enviar Mensagem'
 * });
 */
(function() {
    'use strict';

    window.formsenderJS = window.formsenderJS || {};

    class FormPlugin {
        constructor(selector, options = {}) {
            // Container
            this.container = document.querySelector(selector);
            if (!this.container) {
                console.error(`[formsenderJS] Elemento "${selector}" não encontrado.`);
                throw new Error(`Elemento "${selector}" não encontrado.`);
            }

            // Opções padrão
            const defaults = {
                produto: 'The Garden - New Edition',
                endpoint: '',                    // obrigatório
                textoBotao: 'Enviar Mensagem',
                mostrarMensagem: true,
                mostrarCheckboxes: false,
                mostrarDataNasc: false,
                notificacao: null,               // função personalizada (tipo, mensagem, titulo)
                onSuccess: null,
                onError: null
            };
            this.opts = { ...defaults, ...options };

            if (!this.opts.endpoint) {
                throw new Error('[formsenderJS] A opção "endpoint" é obrigatória.');
            }

            // Gera ID único
            this.uid = 'fs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

            // Constrói o HTML
            this.buildForm();

            // Inicializa eventos
            this.initEvents();

            console.log('[formsenderJS] Plugin inicializado com sucesso!');
        }

        // ---------- Monta o formulário (com prefixo CSS) ----------
        buildForm() {
            const uid = this.uid;
            const opts = this.opts;
            const css = 'formsenderCSS_';

            const hiddenFields = `
                <input type="hidden" name="produto" value="${opts.produto.replace(/"/g, '&quot;')}">
                <input type="hidden" name="dataHora" id="dataHora_${uid}">
            `;

            const nascimentoHtml = opts.mostrarDataNasc ? `
                <div class="${css}field">
                    <label for="nascimento_${uid}" class="${css}label">Data de Nascimento</label>
                    <input type="date" id="nascimento_${uid}" name="nascimento" class="${css}input">
                </div>
            ` : `
                <input type="date" name="nascimento" style="display:none;">
            `;

            const checkboxesHtml = opts.mostrarCheckboxes ? `
                <div class="${css}field">
                    <label class="${css}label">Informações Adicionais</label>
                    <div class="${css}checkbox-group">
                        <label class="${css}checkbox">
                            <input type="checkbox" name="anosCtps" value="X"> 3 Anos de carteira assinada?
                        </label>
                        <label class="${css}checkbox">
                            <input type="checkbox" name="fatorsocial" value="X"> Possui cônjuge ou dependente(a)
                        </label>
                        <label class="${css}checkbox">
                            <input type="checkbox" name="imovelnome" value="X"> Possui imóvel no nome?
                        </label>
                    </div>
                </div>
            ` : '';

            const mensagemHtml = opts.mostrarMensagem ? `
                <div class="${css}field">
                    <label for="msg_${uid}" class="${css}label">Mensagem</label>
                    <textarea id="msg_${uid}" name="msg" rows="4" class="${css}input ${css}textarea"></textarea>
                </div>
            ` : '';

            const formHtml = `
                <form id="form_${uid}" class="${css}form" novalidate>
                    ${hiddenFields}
                    <div class="${css}field">
                        <label for="nome_${uid}" class="${css}label">Nome Completo *</label>
                        <input type="text" id="nome_${uid}" name="nome" required class="${css}input">
                    </div>
                    <div class="${css}row">
                        <div class="${css}col">
                            <label for="email_${uid}" class="${css}label">E-mail *</label>
                            <input type="email" id="email_${uid}" name="email" required class="${css}input">
                        </div>
                        <div class="${css}col">
                            <label for="telefone_${uid}" class="${css}label">Telefone *</label>
                            <input type="tel" id="telefone_${uid}" name="telefone" required class="${css}input">
                        </div>
                    </div>
                    ${nascimentoHtml}
                    ${checkboxesHtml}
                    ${mensagemHtml}
                    <button type="submit" id="submit_${uid}" class="${css}button">${opts.textoBotao}</button>
                    <div id="resposta_${uid}" class="${css}resposta"></div>
                </form>
            `;

            this.container.innerHTML = formHtml;

            // Referências
            this.form = document.getElementById(`form_${uid}`);
            this.submitBtn = document.getElementById(`submit_${uid}`);
            this.resposta = document.getElementById(`resposta_${uid}`);
            this.dataHoraInput = document.getElementById(`dataHora_${uid}`);
        }

        // ---------- Eventos ----------
        initEvents() {
            // Máscara de telefone
            const telInput = this.form.querySelector('input[name="telefone"]');
            if (telInput) {
                telInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.substring(0, 11);
                    if (value.length > 0) {
                        value = value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, '($1) $2-$3');
                    }
                    e.target.value = value;
                });
            }

            // Validação de data
            const dateInput = this.form.querySelector('input[type="date"]');
            if (dateInput && this.opts.mostrarDataNasc) {
                dateInput.addEventListener('change', (e) => {
                    const selected = new Date(e.target.value);
                    const today = new Date();
                    if (selected > today) {
                        this.mostrarNotificacao('error', 'Data de nascimento não pode ser no futuro', 'Erro!');
                        e.target.value = '';
                    }
                });
            }

            // Envio
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // ---------- VALIDAÇÃO MANUAL DOS CAMPOS OBRIGATÓRIOS ----------
        validarCampos() {
            // Define quais campos são obrigatórios conforme as opções
            const obrigatorios = ['nome', 'email', 'telefone'];
            
            // Se quiser tornar a data obrigatória, descomente a linha abaixo:
            // if (this.opts.mostrarDataNasc) obrigatorios.push('nascimento');

            let valido = true;
            const css = 'formsenderCSS_';

            for (const campo of obrigatorios) {
                const input = this.form.querySelector(`[name="${campo}"]`);
                if (input) {
                    // Remove espaços e verifica se está vazio
                    if (!input.value.trim()) {
                        input.classList.add(`${css}input_error`);
                        valido = false;
                    } else {
                        input.classList.remove(`${css}input_error`);
                    }
                }
            }
            return valido;
        }

        // ---------- Envio com validação ----------
        handleSubmit(e) {
            e.preventDefault();

            // 1. VALIDA OS CAMPOS
            if (!this.validarCampos()) {
                this.mostrarNotificacao('error', 'Preencha todos os campos obrigatórios.', 'Atenção!');
                return; // Não envia
            }

            // 2. DESABILITA BOTÃO
            this.submitBtn.disabled = true;
            const originalText = this.submitBtn.textContent;
            this.submitBtn.textContent = 'Enviando...';

            // 3. PREENCHE DATA/HORA
            if (this.dataHoraInput) {
                this.dataHoraInput.value = new Date().toLocaleString('pt-BR');
            }

            const formData = new FormData(this.form);

            // 4. ENVIA
            fetch(this.opts.endpoint, {
                method: 'POST',
                body: formData,
            })
                .then(response => response.text())
                .then(msg => {
                    this.resposta.innerText = msg;
                    this.resposta.className = 'formsenderCSS_resposta formsenderCSS_success';
                    this.mostrarNotificacao('success', 'Mensagem enviada com sucesso!', 'Sucesso!');
                    this.form.reset();
                    if (this.opts.onSuccess) this.opts.onSuccess(msg);
                })
                .catch(err => {
                    this.resposta.innerText = 'Erro ao enviar dados. Por favor, tente novamente.';
                    this.resposta.className = 'formsenderCSS_resposta formsenderCSS_error';
                    this.mostrarNotificacao('error', 'Erro no envio. Tente novamente.', 'Erro!');
                    console.error(err);
                    if (this.opts.onError) this.opts.onError(err);
                })
                .finally(() => {
                    this.submitBtn.disabled = false;
                    this.submitBtn.textContent = originalText;
                    setTimeout(() => {
                        this.resposta.innerText = '';
                        this.resposta.className = 'formsenderCSS_resposta';
                    }, 3000);
                });
        }

        // ---------- Sistema de notificação (integrado ao notify-send) ----------
        mostrarNotificacao(tipo, mensagem, titulo) {
            // 1. Se o usuário forneceu uma função personalizada, usa ela
            if (typeof this.opts.notificacao === 'function') {
                this.opts.notificacao(tipo, mensagem, titulo);
                return;
            }

            // 2. Se o notify-send estiver disponível, usa-o
            if (typeof window.notify_Send_notification === 'function') {
                const avatar = (tipo === 'success')
                    ? 'https://randomuser.me/api/portraits/men/32.jpg'
                    : 'fas fa-exclamation-triangle';
                window.notify_Send_notification(tipo, mensagem, titulo, avatar);
                return;
            }

            // 3. Fallback para showfeedview_notification
            if (typeof window.showfeedview_notification === 'function') {
                window.showfeedview_notification(tipo, mensagem, titulo);
                return;
            }

            // 4. Último recurso: alert simples
            alert(`${titulo}: ${mensagem}`);
        }
    }

    // Exporta a classe no namespace
    window.formsenderJS.Plugin = FormPlugin;

    //console.log(' formsenderJS.Plugin carregado com sucesso!');
    //console.log(' Uso: new formsenderJS.Plugin("#seletor", { ... });');
})();

(function () {
  'use strict';
function configureFixedBackgrounds(){document.querySelectorAll('.formsenderV4_section[data-fixed-background="true"]').forEach(function(el){var url=el.dataset.backgroundImage||'';if(/^https:\/\//i.test(url)){el.style.setProperty('--sender-fixed-image','url('+JSON.stringify(url)+')')}else{el.style.removeProperty('--sender-fixed-image')}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',configureFixedBackgrounds);else configureFixedBackgrounds();


  function enabled(value) {
    return value === 'true' || value === '1' || value === 'on';
  }



  function quickQuestion(mount, index) {
    var prefix = 'quickQ' + index;
    var key = prefix.charAt(0).toLowerCase() + prefix.slice(1);
    function ds(suffix) { return mount.dataset[key + suffix] || ''; }
    var type = ds('Type') || 'single';
    var options = ds('Options').split('|').map(function (item) { return item.trim(); }).filter(Boolean);
    if (type === 'yesno') options = ['Sim', 'Não'];
    if (type === 'truefalse') options = ['Verdadeiro', 'Falso'];
    return {
      enabled: enabled(ds('Enabled')),
      label: ds('Label') || ('Pergunta ' + index),
      type: type,
      options: options,
      required: true
    };
  }

  function applyPossibilitySummary(mount, explicitSummary) {
    var summary = String(explicitSummary || '');
    if (!summary) { try { summary = sessionStorage.getItem('imobify:possibility-path-summary') || ''; } catch (_) {} }
    if (!summary) return;
    var form = mount && mount.querySelector('form');
    if (!form) return;
    var msg = form.querySelector('textarea[name="msg"]');
    if (msg && !msg.value.trim()) msg.value = summary;
    var hidden = form.querySelector('input[name="diagnosticoPossibilidade"]');
    if (!hidden) { hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = 'diagnosticoPossibilidade'; form.appendChild(hidden); }
    hidden.value = summary;
  }


  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function openQuickComplement(instance, config) {
    return new Promise(function (resolve) {
      var questions = (config.questions || []).filter(function (q) { return q && q.enabled !== false && q.label; });
      if (!questions.length) { resolve([]); return; }
      var old = document.getElementById('quick_' + instance.uid); if (old) old.remove();
      function choices(q) {
        if (q.type === 'yesno') return ['Sim','Não'];
        if (q.type === 'truefalse') return ['Verdadeiro','Falso'];
        return Array.isArray(q.options) ? q.options : [];
      }
      var overlay = document.createElement('div');
      overlay.id = 'quick_' + instance.uid;
      overlay.className = 'formsenderCSS_quick-overlay';
      overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
      overlay.innerHTML = '<div class="formsenderCSS_quick-card">' +
        '<div class="formsenderCSS_quick-head"><span class="formsenderCSS_quick-kicker">Só mais um detalhe</span>' +
        '<h3>' + escapeHtml(config.title || 'Antes de finalizar, só me confirma rapidinho…') + '</h3>' +
        (config.copy ? '<p>' + escapeHtml(config.copy) + '</p>' : '') + '</div>' +
        (questions.length > 1 ? '<div class="formsenderCSS_quick-progress" aria-live="polite"><span data-quick-current>1</span> de ' + questions.length + '</div>' : '') +
        '<div class="formsenderCSS_quick-questions">' + questions.map(function (q, i) {
          return '<fieldset class="formsenderCSS_quick-question' + (i === 0 ? ' is-active' : '') + '" data-quick-question="' + i + '">' +
            '<legend>' + escapeHtml(q.label) + ' *</legend>' +
            '<div class="formsenderCSS_quick-options">' + choices(q).map(function (option) {
              return '<button type="button" class="formsenderCSS_quick-option" data-value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</button>';
            }).join('') + '</div><small>Selecione uma opção para continuar.</small></fieldset>';
        }).join('') + '</div>' +
        '<div class="formsenderCSS_quick-actions">' +
        '<button type="button" class="formsenderCSS_quick-confirm">' + escapeHtml(config.confirmText || 'Concluir envio') + '</button></div></div>';
      document.body.appendChild(overlay);
      document.documentElement.classList.add('formsender-quick-open');
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      var selected = new Map();
      var activeIndex = 0;
      var isMobile = false;
      try { isMobile = window.matchMedia ? window.matchMedia('(max-width: 640px)').matches : window.innerWidth <= 640; } catch (_) {}
      var progressCurrent = overlay.querySelector('[data-quick-current]');
      var questionsWrap = overlay.querySelector('.formsenderCSS_quick-questions');
      var confirmButton = overlay.querySelector('.formsenderCSS_quick-confirm');
      var quickCard = overlay.querySelector('.formsenderCSS_quick-card');
      var fitRaf = 0;
      var viewportResizeTarget = window.visualViewport || null;

      function fitMobileCard() {
        if (!isMobile || !quickCard) return;
        if (fitRaf) cancelAnimationFrame(fitRaf);
        fitRaf = requestAnimationFrame(function () {
          fitRaf = 0;
          var vw = viewportResizeTarget ? viewportResizeTarget.width : window.innerWidth;
          var vh = viewportResizeTarget ? viewportResizeTarget.height : window.innerHeight;
          var naturalWidth = Math.max(1, quickCard.offsetWidth);
          var naturalHeight = Math.max(1, quickCard.scrollHeight);
          overlay.style.setProperty('--formsender-vv-width', Math.round(vw) + 'px');
          overlay.style.setProperty('--formsender-vv-height', Math.round(vh) + 'px');
          var availableWidth = Math.max(1, vw - 24);
          var availableHeight = Math.max(1, vh - 24);
          var scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
          if (!isFinite(scale) || scale <= 0) scale = 1;
          quickCard.style.setProperty('--formsender-mobile-scale', String(Math.max(.55, scale)));
        });
      }

      function currentNode(index) { return overlay.querySelector('[data-quick-question="' + index + '"]'); }
      function currentAnswer(index) {
        var raw = selected.get(index);
        return Array.isArray(raw) ? raw.join(', ') : (raw || '');
      }
      function updateMobileHeight() {
        if (!isMobile || !questionsWrap) return;
        /* A pergunta ativa permanece no fluxo normal. Não fixamos a altura do wrapper:
           isso evita que opções maiores que a etapa anterior vazem para fora do card. */
        questionsWrap.style.removeProperty('height');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { fitMobileCard(); });
        });
      }
      function updateActionLabel() {
        if (!confirmButton) return;
        if (!isMobile) {
          confirmButton.hidden = false;
          confirmButton.textContent = config.confirmText || 'Concluir envio';
          overlay.classList.add('has-mobile-action');
          return;
        }
        var q = questions[activeIndex];
        var needsAction = q && (q.type || 'single') === 'multiple';
        confirmButton.hidden = !needsAction;
        overlay.classList.toggle('has-mobile-action', !!needsAction);
        if (needsAction) confirmButton.textContent = activeIndex < questions.length - 1 ? 'Concluir seleção' : (config.confirmText || 'Concluir envio');
      }
      function showStep(nextIndex, immediate) {
        if (!isMobile) return;
        nextIndex = Math.max(0, Math.min(questions.length - 1, nextIndex));
        var oldNode = currentNode(activeIndex);
        var newNode = currentNode(nextIndex);
        if (!newNode || nextIndex === activeIndex) { updateMobileHeight(); updateActionLabel(); return; }
        function activate() {
          if (oldNode) oldNode.classList.remove('is-active','is-leaving');
          activeIndex = nextIndex;
          newNode.classList.add('is-active');
          if (progressCurrent) progressCurrent.textContent = String(activeIndex + 1);
          updateActionLabel();
          updateMobileHeight();
          requestAnimationFrame(function () { newNode.classList.add('is-entered'); });
          setTimeout(function () { newNode.classList.remove('is-entered'); }, 220);
        }
        if (immediate || !oldNode) activate();
        else {
          oldNode.classList.add('is-leaving');
          setTimeout(activate, 140);
        }
      }
      function validateIndex(index) {
        var q = questions[index];
        var answer = currentAnswer(index);
        var node = currentNode(index);
        if (q && !answer) { if (node) node.classList.add('has-error'); return false; }
        if (node) node.classList.remove('has-error');
        return true;
      }
      function collectAnswers() {
        var valid = true;
        var answers = questions.map(function (q, index) {
          var answer = currentAnswer(index);
          if (!answer) { valid = false; var node = currentNode(index); if (node) node.classList.add('has-error'); }
          return { label:q.label, answer:answer };
        });
        return { valid:valid, answers:answers };
      }
      function cleanup() {
        document.documentElement.classList.remove('formsender-quick-open');
        if (fitRaf) cancelAnimationFrame(fitRaf);
        window.removeEventListener('resize', fitMobileCard);
        window.removeEventListener('orientationchange', fitMobileCard);
        if (viewportResizeTarget && viewportResizeTarget.removeEventListener) viewportResizeTarget.removeEventListener('resize', fitMobileCard);
        document.removeEventListener('keydown', blockEscape, true);
        overlay.classList.add('is-closing');
        setTimeout(function () { overlay.remove(); }, 180);
      }
      function finish(answers) {
        cleanup();
        resolve({ cancelled:false, answers:answers || [] });
      }

      overlay.querySelectorAll('.formsenderCSS_quick-option').forEach(function (button) {
        button.addEventListener('click', function () {
          var fieldset = button.closest('[data-quick-question]');
          var index = Number(fieldset.dataset.quickQuestion); var q = questions[index]; var value = button.dataset.value || '';
          if ((q.type || 'single') === 'multiple') {
            var values = selected.get(index) || [];
            var next = values.indexOf(value) >= 0 ? values.filter(function (v) { return v !== value; }) : values.concat([value]);
            selected.set(index, next); button.classList.toggle('is-selected', next.indexOf(value) >= 0);
          } else {
            selected.set(index, value);
            fieldset.querySelectorAll('.formsenderCSS_quick-option').forEach(function (el) { el.classList.toggle('is-selected', el === button); });
          }
          fieldset.classList.remove('has-error');
          if (isMobile && (q.type || 'single') !== 'multiple' && index === activeIndex) {
            if (index < questions.length - 1) {
              setTimeout(function () { showStep(index + 1, false); }, 110);
            } else {
              setTimeout(function () {
                var result = collectAnswers();
                if (result.valid) finish(result.answers);
              }, 110);
            }
          }
        });
      });

      confirmButton.addEventListener('click', function () {
        if (isMobile) {
          var currentQuestion = questions[activeIndex];
          if (!currentQuestion || (currentQuestion.type || 'single') !== 'multiple') return;
          if (!validateIndex(activeIndex)) return;
          if (activeIndex < questions.length - 1) {
            showStep(activeIndex + 1, false);
            return;
          }
        }
        var result = collectAnswers();
        if (result.valid) finish(result.answers);
        else if (isMobile) {
          var firstInvalid = questions.findIndex(function (q, index) { return !currentAnswer(index); });
          if (firstInvalid >= 0) showStep(firstInvalid, true);
        }
      });
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      function blockEscape(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
      document.addEventListener('keydown', blockEscape, true);

      if (isMobile) {
        overlay.classList.add('is-mobile-steps');
        updateActionLabel();
        updateMobileHeight();
        window.addEventListener('resize', fitMobileCard, { passive:true });
        window.addEventListener('orientationchange', fitMobileCard, { passive:true });
        if (viewportResizeTarget && viewportResizeTarget.addEventListener) viewportResizeTarget.addEventListener('resize', fitMobileCard, { passive:true });
        setTimeout(fitMobileCard, 40);
      }
    });
  }

  function appendQuickAnswers(instance, answers) {
    var answered = (answers || []).filter(function (item) { return item && String(item.answer || '').trim(); });
    if (!answered.length) return;
    var block = answered.map(function (item) { return item.label + '\n' + item.answer + ';'; }).join('\n\n');
    var form = instance.form; if (!form) return;
    var msg = form.querySelector('[name="msg"]');
    if (!msg) { msg = document.createElement('input'); msg.type = 'hidden'; msg.name = 'msg'; form.appendChild(msg); }
    var original = String(msg.value || '').trim();
    msg.value = [original, 'Informações complementares:', block].filter(Boolean).join('\n\n');
    var hidden = form.querySelector('[name="complementacaoRapida"]');
    if (!hidden) { hidden = document.createElement('input'); hidden.type='hidden'; hidden.name='complementacaoRapida'; form.appendChild(hidden); }
    hidden.value = block;
    answered.forEach(function (item, index) {
      var input = form.querySelector('[name="qualificacao_' + (index+1) + '"]');
      if (!input) { input=document.createElement('input'); input.type='hidden'; input.name='qualificacao_' + (index+1); form.appendChild(input); }
      input.value = item.label + '\n' + item.answer + ';';
    });
  }

  function installQuickComplement(instance, config) {
    if (!instance || !config) return;
    var original = instance.handleSubmit.bind(instance);
    var opening = false;
    instance.handleSubmit = function (event) {
      if (opening) { event && event.preventDefault && event.preventDefault(); return; }
      event && event.preventDefault && event.preventDefault();
      if (!instance.validarCampos()) { instance.mostrarNotificacao('error','Preencha todos os campos obrigatórios.','Atenção!'); return; }
      opening = true;
      window.ImobifyFinancialFlow.launch(config.financial || {}).then(function (financeAnswers) {
        window.ImobifyFinancialFlow.addToForm(instance.form, financeAnswers);
        return (config.enabled && (config.questions || []).length) ? openQuickComplement(instance, config) : [];
      }).then(function (result) {
        if (result && result.cancelled) { opening = false; return; }
        var answers = result && Array.isArray(result.answers) ? result.answers : (Array.isArray(result) ? result : []);
        appendQuickAnswers(instance, answers);
        opening = false;
        original({ preventDefault:function () {} });
      }).catch(function () { opening = false; });
    };
  }

  function configureAutocomplete(instance, shouldEnable) {
    if (!instance || !instance.form) return;
    var fields = [
      { name:'nome', token:'name', extra:{ autocapitalize:'words' } },
      { name:'email', token:'email', extra:{ inputmode:'email', autocapitalize:'none', spellcheck:'false' } },
      { name:'telefone', token:'tel', extra:{ inputmode:'tel' } }
    ];
    fields.forEach(function (item) {
      var input = instance.form.querySelector('[name="' + item.name + '"]');
      if (!input) return;
      input.setAttribute('autocomplete', shouldEnable ? item.token : 'off');
      Object.keys(item.extra || {}).forEach(function (key) { input.setAttribute(key, item.extra[key]); });
    });
    instance.form.setAttribute('autocomplete', shouldEnable ? 'on' : 'off');
  }

  function initialize() {
    document.querySelectorAll('[data-plugin="form-sender-v4"] .formsenderV4_mount:not([data-initialized])').forEach(function (mount, index) {
      mount.dataset.initialized = 'true';
      mount.id = mount.id || 'formsender-v4-' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2, 7);

      if (!window.formsenderJS || typeof window.formsenderJS.Plugin !== 'function') {
        mount.innerHTML = '<p>Não foi possível inicializar o Form.v4.</p>';
        return;
      }

      var endpoint = 'https://script.google.com/macros/s/AKfycbxxA_8OOrK8oSJk6dFSC4bSvIHxICKLYG6ZpalORyFnM5fe-I4eLil-KGsKyoD31NMWlg/exec';
      if (!endpoint) {
        mount.innerHTML = '<p>Configure o endpoint do Form.v4 no editor.</p>';
        return;
      }

      if (window.__IMOBIFY_EDITOR__) {
        mount.addEventListener('submit', function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }, true);
      }

      try {
        var quickConfig = {
          enabled: enabled(mount.dataset.quickComplement),
          title: mount.dataset.quickTitle || 'Antes de finalizar, só me confirma rapidinho…',
          copy: mount.dataset.quickCopy || '',
          confirmText: mount.dataset.quickConfirmText || 'Concluir envio',
          financial: mount.closest(".formsenderV4_section").dataset,
          questions: [quickQuestion(mount, 1), quickQuestion(mount, 2), quickQuestion(mount, 3), quickQuestion(mount, 4)].filter(function (q) { return q.enabled; })
        };
        var instance = new window.formsenderJS.Plugin('#' + mount.id, {
          produto: mount.dataset.product || 'The Garden - New Edition',
          endpoint: endpoint,
          textoBotao: mount.dataset.buttonText || 'Enviar Mensagem',
          mostrarMensagem: enabled(mount.dataset.showMessage),
          mostrarCheckboxes: enabled(mount.dataset.showCheckboxes),
          mostrarDataNasc: enabled(mount.dataset.showBirthdate),
          notificacao: function (type, message, title) {
            if (type === 'success') return;
            if (typeof window.notify_Send_notification === 'function') {
              window.notify_Send_notification(type, message, title, 'fas fa-exclamation-triangle');
            } else {
              window.alert(title + ': ' + message);
            }
          },
          onSuccess: function () {
            if (typeof window.notify_Send_notification === 'function') {
              window.notify_Send_notification(
                'success',
                mount.dataset.successMessage || 'Nosso consultor entrará em contato!',
                mount.dataset.successTitle || 'Fique atento',
                mount.dataset.successAvatar || ''
              );
            }
          },
          onError: function (error) {
            console.warn('[Form.v4]', error);
          }
        });
        mount.formsenderV4 = instance;
        configureAutocomplete(instance, enabled(mount.dataset.fieldAutocomplete));
        installQuickComplement(instance, quickConfig);
        applyPossibilitySummary(mount);
      } catch (error) {
        console.error('[Form.v4]', error);
        mount.innerHTML = '<p>Erro ao carregar o formulário: ' + String(error.message || error) + '</p>';
      }
    });
  }

  window.addEventListener('imobify:possibility-path-complete', function (event) { document.querySelectorAll('[data-plugin="form-sender-v4"] .formsenderV4_mount').forEach(function (mount) { applyPossibilitySummary(mount, event.detail && event.detail.summary); }); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();


(function(){
  'use strict';
  function installFallback(image){
    if(image.dataset.footerIconFallback==='true')return;
    image.dataset.footerIconFallback='true';
    image.addEventListener('error',()=>{
      const fallback=document.createElement('i');
      fallback.className='fa-solid fa-link';
      fallback.setAttribute('aria-hidden','true');
      image.replaceWith(fallback);
    },{once:true});
  }
  function init(scope=document){
    scope.querySelectorAll('[data-plugin="footer"] .footer-social-icon img').forEach(installFallback);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});
  else init();
})();


/* Imobify 6.0.4 — gatilho único de visibilidade para todos os efeitos. */
(function(){
  'use strict';
  var SELECTOR='[data-section-transition]';
  var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var items=new Set(), scheduled=false, observer=null;
  function thresholdOf(el){
    var raw=el.getAttribute('data-motion-threshold');
    if(raw===null||raw==='')return .20;
    var value=Number(raw);
    return Number.isFinite(value)?Math.max(0,Math.min(1,value)):.20;
  }
  function excluded(el){return el.matches('[data-plugin="parallax"], [data-plugin="scrollytelling-video-pro"]')||el.getAttribute('data-section-transition')==='none';}
  function clamp(value){return Math.min(1,Math.max(0,value));}
  function measure(el){
    var r=el.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight||0;
    var vw=window.innerWidth||document.documentElement.clientWidth||0;
    var w=Math.max(0,Math.min(r.right,vw)-Math.max(0,r.left));
    var h=Math.max(0,Math.min(r.bottom,vh)-Math.max(0,r.top));
    var area=Math.max(1,r.width*r.height);
    return {ratio:clamp(w*h/area),visible:w>0&&h>0,rect:r,vh:vh};
  }
  function update(){
    scheduled=false;
    items.forEach(function(el){
      if(!el.isConnected){items.delete(el);return;}
      if(reduced||excluded(el)){el.classList.add('is-visible');return;}
      var m=measure(el), threshold=thresholdOf(el);
      var reached=m.visible&&(threshold===0||m.ratio+0.000001>=threshold);
      var started=el.dataset.motionTriggered==='true';
      var replay=el.dataset.motionReplay==='true';
      var type=el.getAttribute('data-section-transition');
      if(!reached){
        if(replay||!started){el.classList.remove('is-visible');}
        if(replay){el.dataset.motionTriggered='false';}
        if(type==='curtain-reveal'&&!started)el.style.setProperty('--imobify-curtain-side','50%');
        return;
      }
      if(!started){el.dataset.motionTriggered='true';el.classList.add('is-visible');el.dispatchEvent(new CustomEvent('imobify:section-visible',{bubbles:false}));}
      if(type==='curtain-reveal'){
        // Curtain begins only once the configured section visibility is reached.
        // Its completion is driven by additional travel through the viewport.
        var available=Math.max(1,m.vh*(1-threshold));
        var travel=Math.max(0,m.vh-m.rect.top-threshold*m.rect.height);
        var progress=clamp(travel/available);
        el.style.setProperty('--imobify-curtain-side',(50*(1-progress)).toFixed(3)+'%');
      }
    });
  }
  function schedule(){if(scheduled)return;scheduled=true;if(window.requestAnimationFrame)window.requestAnimationFrame(update);else update();}
  function register(root){
    if(root.matches&&root.matches(SELECTOR))items.add(root);
    if(root.querySelectorAll)root.querySelectorAll(SELECTOR).forEach(function(el){items.add(el);});
    schedule();
  }
  function init(){
    if(document.documentElement.dataset.imobifyMotionInit)return;
    document.documentElement.dataset.imobifyMotionInit='1';
    // Initial state is installed before the first visibility calculation.
    document.documentElement.classList.add('imobify-motion-ready');
    register(document);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('load',schedule);
    if('ResizeObserver' in window){observer=new ResizeObserver(schedule);items.forEach(function(el){observer.observe(el);});}
    if('MutationObserver' in window){
      new MutationObserver(function(changes){
        changes.forEach(function(change){
          change.addedNodes.forEach(function(node){if(node.nodeType!==1)return;register(node);if(observer){if(node.matches&&node.matches(SELECTOR))observer.observe(node);if(node.querySelectorAll)node.querySelectorAll(SELECTOR).forEach(function(el){observer.observe(el);});}});
          if(change.type==='attributes'){if(change.target.matches&&change.target.matches(SELECTOR))items.add(change.target);schedule();}
        });
      }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion-threshold','data-motion-replay','data-section-transition']});
    }
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


(function(){const triggers=document.querySelectorAll('[data-lightbox-src]');if(!triggers.length)return;const box=document.createElement('div');box.className='imobify-lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.innerHTML='<button aria-label="Fechar">×</button><img alt="Imagem ampliada">';document.body.append(box);const close=()=>{box.classList.remove('is-open');document.body.classList.remove('no-scroll');};triggers.forEach(trigger=>trigger.addEventListener('click',()=>{box.querySelector('img').src=trigger.dataset.lightboxSrc;box.classList.add('is-open');document.body.classList.add('no-scroll');box.querySelector('button').focus();}));box.addEventListener('click',event=>{if(event.target===box||event.target.tagName==='BUTTON')close();});addEventListener('keydown',event=>{if(event.key==='Escape')close();});})();


(function () {
  "use strict";

  const ROOT_CLASS = "imobify-content-protection";
  const READY_ATTRIBUTE = "data-content-protection-ready";

  function isEditableElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    return Boolean(
      element.closest(
        'input, textarea, select, [contenteditable="true"], [data-allow-copy]'
      )
    );
  }

  function blockEvent(event) {
    if (isEditableElement(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function blockKeyboardShortcuts(event) {
    const key = String(event.key || "").toLowerCase();
    const ctrlOrCommand = event.ctrlKey || event.metaKey;

    if (isEditableElement(event.target)) {
      return;
    }

    const blockedShortcut =
      event.key === "F12" ||
      (ctrlOrCommand && key === "c") ||
      (ctrlOrCommand && key === "x") ||
      (ctrlOrCommand && key === "u") ||
      (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
      (event.metaKey && event.altKey && ["i", "j", "c"].includes(key));

    if (!blockedShortcut) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function initialize() {
    const html = document.documentElement;

    if (html.hasAttribute(READY_ATTRIBUTE)) {
      return;
    }

    html.setAttribute(READY_ATTRIBUTE, "true");
    html.classList.add(ROOT_CLASS);

    document.addEventListener("contextmenu", blockEvent, true);
    document.addEventListener("selectstart", blockEvent, true);
    document.addEventListener("copy", blockEvent, true);
    document.addEventListener("cut", blockEvent, true);
    document.addEventListener("keydown", blockKeyboardShortcuts, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
