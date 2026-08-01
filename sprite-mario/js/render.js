/* ===== 渲染引擎：画布绘制（支持动画帧/新敌人类型） ===== */
import { SPRITES } from './sprites.js';
import { TILE } from './physics.js';

export class Renderer {
  constructor(){
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.scale = 1;
    this.offX = 0; this.offY = 0;
  }

  // 计算缩放(保留整块像素，最大清晰度)
  resize(){
    const cw = window.innerWidth, ch = window.innerHeight;
    this.canvas.width = cw; this.canvas.height = ch;
    // 保持 640x360 逻辑，等比缩放
    const s = Math.min(cw/640, ch/360);
    this.scale = s;
    this.offX = (cw - 640*s)/2;
    this.offY = (ch - 360*s)/2;
    this.ctx.imageSmoothingEnabled = false;
  }

  begin(){
    const ctx=this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
  }

  draw(world){
    const ctx=this.ctx, camX=world.camX;
    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.scale(this.scale, this.scale);
    ctx.imageSmoothingEnabled=false;

    sky(ctx, camX);
    clouds(ctx, camX);
    // 背景山(视差，慢速滚动)
    hills(ctx, camX*0.35);
    // 背景灌木(视差中速)
    bushes(ctx, camX*0.6);
    // 地面草皮纹理(远层装饰随相机滚动)
    groundDecor(ctx, camX);

    // 地块
    const vx0 = Math.max(0, Math.floor(camX/TILE));
    const vx1 = Math.min(world.w-1, Math.ceil((camX+640)/TILE));
    for (let ty=0; ty<world.h; ty++){
      for (let tx=vx0; tx<=vx1; tx++){
        const t = world.tiles[ty] && world.tiles[ty][tx];
        if (!t) continue;
        const px = tx*TILE - camX, py=ty*TILE;
        if (px<-64||px>640+64) continue;
        this.drawTile(ctx,t,px,py);
      }
    }
    // 旗杆
    this.drawFlag(ctx, world, camX);

    // 道具（逻辑1格高）
    for (const p of world.powerups) this.drawSprite(ctx, spriteFor(p.type), p.x-camX, p.y, {fit:TILE});
    // 敌人（动画帧）
    for (const e of world.enemies) if(e.alive||e.deadT>0) this.drawEnemy(ctx,e,camX);
    // 子弹（逻辑约半格）
    for (const b of world.bullets) if(b.alive) this.drawSprite(ctx, SPRITES.fireball, b.x-camX, b.y, {fit:14});
    // 金币动画
    for (const c of world.coinFx) if(c.t>0) this.drawSprite(ctx, SPRITES.coin, c.x*TILE-camX, c.y*TILE-14-(24-c.t)*0.3, {fit:TILE*0.85});
    // 碎砖/顶块动画
    for (const s of world.smashed) if(s.t>0 && s.bump) this.drawSprite(ctx, SPRITES.brick_q, s.x*TILE-camX, s.y*TILE-4*(1-s.t/12), {fit:TILE});
    ctx.restore();
  }

  drawSprite(ctx, spl, sx, sy, o={}){
    if(!spl) return;
    // o.fit: 逻辑高度(px) — 将精灵缩放到该逻辑高度，宽度按比例
    // o.scale: 直接缩放倍数（与 fit 二选一，fit 优先）
    let w=spl.width, h=spl.height;
    if(o.fit){ const k=o.fit/spl.height; w=spl.width*k; h=o.fit; }
    else if(o.scale){ w=spl.width*o.scale; h=spl.height*o.scale; }
    ctx.save();
    ctx.globalAlpha = o.alpha!==undefined?o.alpha:1;
    if(o.flip){ ctx.translate(sx+w,sy); ctx.scale(-1,1); ctx.drawImage(spl,0,0,w,h); }
    else ctx.drawImage(spl,sx,sy,w,h);
    ctx.restore();
  }

  drawTile(ctx,t,px,py){
    const m={1:SPRITES.block,2:SPRITES.brick_b,3:SPRITES.brick_q,4:SPRITES.brick_q_used};
    if(t===5){
      ctx.fillStyle='#b07730';ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#e8b84a';ctx.fillRect(px,py,TILE,6);
      ctx.fillStyle='#7a4a18';
      for(let i=0;i<4;i++)ctx.fillRect(px+i*8,py+16,4,4);
      return;
    }
    if(m[t])ctx.drawImage(m[t],px,py,TILE,TILE);
  }

  drawFlag(ctx,world,camX){
    const fx=world.flagX*TILE+16-camX, base=world.groundY*TILE, top=base-6*TILE;
    ctx.fillStyle='#2a1200';ctx.fillRect(fx-2,top,4,base-top+40);
    ctx.fillStyle='#ffd800';ctx.fillRect(fx-1,top-4,18,16);
  }

  // 敌人渲染：动画帧交替（走/爬）、踩扁帧、壳、食人花/尖刺龟/飞行
  drawEnemy(ctx,e,camX){
    const px=e.x-camX;
    const flip = (e.dir!==undefined && e.dir<0);
    // 食人花（管道伸缩，张合动画）
    if (e.type==='piranha'){
      const spr = e.frame ? SPRITES.piranha_2 : SPRITES.piranha;
      if (spr) this.drawSprite(ctx, spr, px, e.y, {fit:TILE});
      else { ctx.fillStyle='#2f9a4a'; ctx.fillRect(px,e.y,TILE,TILE); }
      return;
    }
    // 被消灭：压扁形态
    if(e.dead){
      const spr = e.type==='koopa' ? SPRITES.koopa_shell : SPRITES.goomba_squash;
      if (spr) this.drawSprite(ctx, spr, px, e.y + e.h - 12, {flip, fit:12});
      else { ctx.fillStyle='#8a5224';ctx.fillRect(px,e.y+e.h-6,e.w,6); }
      return;
    }
    // 乌龟壳
    if(e.shell){
      this.drawSprite(ctx, SPRITES.koopa_shell, px, e.y+2, {fit:TILE-6});
      return;
    }
    // 走路/爬行动画帧
    let spr;
    if (e.type==='spiny'){ spr = e.frame ? SPRITES.spiny_w2 : SPRITES.spiny; }
    else if (e.type==='flyer'){ spr = e.frame ? SPRITES.flyer_w2 : SPRITES.flyer; }
    else if (e.type==='goomba'){ spr = e.frame ? SPRITES.goomba_w2 : SPRITES.goomba; }
    else { spr = e.frame ? SPRITES.koopa_w2 : SPRITES.koopa; }
    if (spr) this.drawSprite(ctx, spr, px, e.y, {flip, fit:TILE});
    else { ctx.fillStyle='#8a5224';ctx.fillRect(px,e.y,e.w,e.h); }
  }

  // 玩家（站/跑/跳动画帧，按方向翻转）
  drawPlayer(player, camX, dying){
    const ctx=this.ctx;
    ctx.save();ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);
    const sx=player.x-camX;
    let spr;
    if (player.small){
      if (!player.onGround){ spr = SPRITES.mario_small_jump; }
      else if (Math.abs(player.vx)>0.1){
        const r = Math.floor(player.frames/5)%4;
        spr = r===0 ? SPRITES.mario_small
          : (r===1 ? SPRITES.mario_small_run2
          : (r===2 ? SPRITES.mario_small_run3 : SPRITES.mario_small_run4));
      } else spr = SPRITES.mario_small;
    } else {
      if (!player.onGround){ spr = SPRITES.mario_big; }
      else if (Math.abs(player.vx)>0.1){ spr = Math.floor(player.frames/7)%2 ? SPRITES.mario_big_run : SPRITES.mario_big; }
      else spr = SPRITES.mario_big;
    }
    if(!spr) spr = SPRITES.mario_small;
    const flicker = player.hurtFlashT>0 && Math.floor(player.hurtFlashT/6)%2===0;
    ctx.globalAlpha = flicker?0.5:1;
    const o={flip:player.dir<0, fit:player.h};
    // 按玩家逻辑高度缩放精灵(占格不变，细节放大)
    this.drawSprite(ctx, spr, sx, player.y, o);
    ctx.restore();
  }

  drawHUD(game){
    const ctx=this.ctx, t=game;
    ctx.save();
    ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);
    ctx.font='bold 14px monospace';ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=3;
    const tp=(x,y,s)=>{ctx.strokeText(s,x,y);ctx.fillText(s,x,y);};
    const p=t.player||{};
    tp(12,10,`MARIO  ${String(p.score??t.score??0).padStart(6,'0')}`);
    tp(220,10,`●×${p.coins??0}`);
    tp(340,10,`WORLD ${t.levelNo}`);
    tp(520,10,`TIME ${String(Math.ceil(t.world?(t.world.time):300)).padStart(3,'0')}`);
    tp(140,34,`命 x${t.lives}`);
    if(p.starT>0&&p.starT<9999){ctx.fillStyle='#ffe14d';tp(420,34,'无敌*');}
    ctx.restore();
  }

  // 菜单背景(简单)
  drawMenu(){
    const ctx=this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    ctx.save();ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);
    sky(ctx,0);
    ctx.fillStyle='#5a3a00';ctx.fillRect(0,300,640,60);
    ctx.fillStyle='#3a2500';ctx.fillRect(0,340,640,20);
    ctx.font='bold 42px monospace';ctx.textAlign='center';
    ctx.fillStyle='#ffd800';ctx.strokeStyle='#8a3d00';ctx.lineWidth=6;
    ctx.strokeText('SUPER MARIO',320,110);ctx.fillText('SUPER MARIO',320,110);
    ctx.font='16px monospace';ctx.fillStyle='#fff';
    ctx.strokeText('无限随机闯关 · 经典还原',320,170);ctx.fillText('无限随机闯关 · 经典还原',320,170);
    // 站立的马里奥
    this.drawSprite(ctx, SPRITES.mario_big||SPRITES.mario_small, 280, 260);
    ctx.restore();
  }
}

function spriteFor(type){
  if(type==='flower')return SPRITES.flower;
  if(type==='star')return SPRITES.star;
  return SPRITES.mushroom;
}

function sky(ctx,camX){
  const g=ctx.createLinearGradient(0,0,0,360);
  g.addColorStop(0,'#5c94fc');g.addColorStop(1,'#8fc8ff');
  ctx.fillStyle=g;ctx.fillRect(-40,0,720,360);
}
function clouds(ctx,camX){
  ctx.fillStyle='rgba(255,255,255,0.85)';
  for(let i=0;i<6;i++){
    const r=((i*260 - camX*0.25)%1400+1400)%1400-120, y=40+(i%3)*42;
    ctx.beginPath();
    ctx.arc(r,y,16,0,7);ctx.arc(r+18,y-6,20,0,7);ctx.arc(r+38,y,16,0,7);ctx.fill();
  }
}

// 背景山（视差慢速滚动，立体青绿色）
function hills(ctx,off){
  for(let i=0;i<5;i++){
    const hx=((i*300 - off)%1600+1600)%1600-160;
    const hh=70+(i%3)*28;
    ctx.fillStyle = i%2 ? '#3fae5a' : '#2f9a4a';
    ctx.beginPath();
    ctx.moveTo(hx, 328);
    ctx.quadraticCurveTo(hx+60, 328-hh, hx+120, 328);
    ctx.closePath(); ctx.fill();
    // 高光
    ctx.fillStyle='rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(hx+22, 328);
    ctx.quadraticCurveTo(hx+52, 328-hh*0.55, hx+88, 328);
    ctx.closePath(); ctx.fill();
  }
}

// 背景灌木（视差中速，半透明绿丛）
function bushes(ctx,off){
  for(let i=0;i<6;i++){
    const bx=((i*220 - off)%1320+1320)%1320-120;
    const by=300-((i%3)*6);
    ctx.fillStyle='rgba(70,160,60,0.55)';
    ctx.beginPath();
    ctx.arc(bx,by,14,0,7);ctx.arc(bx+16,by-6,16,0,7);ctx.arc(bx+34,by,14,0,7);
    ctx.fill();
  }
}

// 地面装饰（草皮/小石子，随相机滚动）
function groundDecor(ctx,camX){
  const gy=328;
  ctx.fillStyle='#7ed957';
  for(let i=0;i<10;i++){
    const gx=((i*90 - camX)%1000+1000)%1000-80;
    ctx.fillRect(gx,gy+2,8,3);
    ctx.fillRect(gx+3,gy-2,3,6);
  }
  ctx.fillStyle='#9a6a2a';
  for(let i=0;i<6;i++){
    const gx=((i*160 - camX)%1200+1200)%1200-80;
    ctx.fillRect(gx,gy+10,4,3);
    ctx.fillRect(gx+6,gy+16,5,3);
  }
}
