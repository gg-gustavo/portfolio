/* Input compartilhado — Pointer Events (mouse + touch + pen) */
/* Padrões do Hammer.js em vanilla: unificado, prioriza touch, sem CDN. */

/* swipeFrom(x0,y0,x1,y1,threshold): 'up'|'down'|'left'|'right'|null (dominância axial) */
function swipeFrom(x0,y0,x1,y1,threshold){
  const dx=x1-x0, dy=y1-y0;
  if(Math.abs(dx)<threshold && Math.abs(dy)<threshold) return null;
  return Math.abs(dx)>=Math.abs(dy)? (dx>0?'right':'left') : (dy>0?'down':'up');
}

/* squareFromPoint(rect, x, y, cols, rows, pad): índice grade a partir de ponto */
function squareFromPoint(rect,x,y,cols,rows,pad){
  pad=pad||0;
  const cellW=(rect.width-2*pad)/cols, cellH=(rect.height-2*pad)/rows;
  const c=Math.floor((x-rect.left-pad)/cellW), r=Math.floor((y-rect.top-pad)/cellH);
  if(c<0||r<0||c>=cols||r>=rows) return -1;
  return r*cols+c;
}

/*
 * bindDrag(el, handlers, opts): gesto completo.
 * Pointer Events unificam mouse/touch. touch-action deve impedir scroll no elemento.
 *  handlers: onDown(target), onMove(target,dx,dy), onDrop(target), onCancel()
 *  opts: {moveThreshold (px, default 6), pick(el,px,py)->target, ghost(el,px,py)->clone}
 * Tap (movimento < threshold) dispara onTap(orig). Drag dispara onDown/onMove/onDrop.
 */
function bindDrag(el,handlers,opts){
  opts=opts||{};
  const threshold=opts.moveThreshold||6;
  let pid=null, sx=0, sy=0, px=0, py=0, dragging=false, target=null, ghost=null, ghostOff={x:0,y:0};

  function pickPoint(e){
    const t=opts.pick? opts.pick(e,px,py): e.target;
    return t;
  }
  function makeGhost(){
    if(!opts.ghost) return null;
    const g=opts.ghost(target,px,py);
    if(g){
      g.style.position='fixed';
      g.style.pointerEvents='none';
      g.style.zIndex='9999';
      g.style.margin='0';
      g.style.left='0'; g.style.top='0';
      g.style.transform='translate(0,0)';
      document.body.appendChild(g);
      const r=g.getBoundingClientRect();
      ghostOff={x:r.width/2,y:r.height/2};
    }
    return g;
  }
  function placeGhost(){
    if(!ghost) return;
    ghost.style.transform='translate('+(px-ghostOff.x)+'px,'+(py-ghostOff.y)+'px)';
  }

  el.addEventListener('pointerdown',e=>{
    if(pid!==null||e.button>0) return;
    pid=e.pointerId;
    sx=px=e.clientX; sy=py=e.clientY;
    dragging=false;
    try{ el.setPointerCapture(pid); }catch(_){}
  });

  el.addEventListener('pointermove',e=>{
    if(e.pointerId!==pid) return;
    px=e.clientX; py=e.clientY;
    if(!dragging && (Math.abs(px-sx)>=threshold||Math.abs(py-sy)>=threshold)){
      dragging=true;
      target=opts.pick? opts.pick(e,sx,sy): e.target;
      if(handlers.onDown) handlers.onDown(target);
      ghost=makeGhost();
    }
    if(dragging){
      if(handlers.onMove) handlers.onMove(target,px-sx,py-sy);
      placeGhost();
    }
  });

  function end(e){
    if(e.pointerId!==pid) return;
    pid=null;
    try{ el.releasePointerCapture(e.pointerId); }catch(_){}
    if(dragging){
      if(handlers.onDrop){
        const t=opts.pickEnd? opts.pickEnd(e,px,py): (opts.pick? opts.pick(e,px,py): null);
        handlers.onDrop(t,px,py);
      }
      if(handlers.onCancel&&ghost) handlers.onCancel();
      const sup=ev=>{ ev.preventDefault(); ev.stopPropagation(); document.removeEventListener('click',sup,true); };
      document.addEventListener('click',sup,true);
      setTimeout(()=>document.removeEventListener('click',sup,true),300);
    }else{
      if(handlers.onTap) handlers.onTap(pickPoint(e),sx,sy);
    }
    if(ghost){ ghost.remove(); ghost=null; }
    dragging=false;
  }
  el.addEventListener('pointerup',end);
  el.addEventListener('pointercancel',end);
}
