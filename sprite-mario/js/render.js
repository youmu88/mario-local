/* ===== 渲染引擎：画布绘制 ===== */
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

    // 道具
    for (const p of world.powerups) this.drawSprite(ctx, spriteFor(p.type), p.x-camX, p.y);
    // 敌人
    for (const e of world.enemies) if(e.alive||e.deadT>0) this.drawEnemy(ctx,e,camX);
    // 子弹
    for (const b of world.bullets) if(b.alive) this.drawSprite(ctx, SPRITES.fireball, b.x-camX, b.y);
    // 金币动画
    for (const c of world.coinFx) if(c.t>0) this.drawSprite(ctx, SPRITES.coin, c.x*TILE-camX, c.y*TILE-14-(24-c.t)*0.3, {scale:0.85});
    // 碎砖/顶块动画
    for (const s of world.smashed) if(s.t>0 && s.bump) this.drawSprite(ctx, SPRITES.brick_q, s.x*TILE-camX, s.y*TILE-4*(1-s.t/12));
    ctx.restore();
  }

  drawSprite(ctx, spl, sx, sy, o={}){
    if(!spl) return;
    const s=o.scale||1, w=spl.width*s, h=spl.height*s;
    ctx.save();
    ctx.globalAlpha = o.alpha!==undefined?o.alpha:1;
    if(o.flip){ctx.translate(sx+w,sy);ctx.scale(-1,1);ctx.drawImage(spl,0,0,w,h);}
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

  drawEnemy(ctx,e,camX){
    const px=e.x-camX;
    if(e.dead){ctx.fillStyle='#8a5224';ctx.fillRect(px,e.y+e.h-6,e.w,6);return;}
    if(e.shell){ctx.fillStyle='#7ce82a';ctx.fillRect(px+1,e.y+3,e.w-2,e.h-4);return;}
    const spr=e.type==='goomba'?SPRITES.goomba:SPRITES.koopa;
    this.drawSprite(ctx,spr,px,e.y,{flip:e.vx<0});
  }

  // 玩家(由上层调用)
  drawPlayer(player, camX, dying){
    const ctx=this.ctx;
    ctx.save();ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);
    const sx=player.x-camX;
    let spr = player.fire&&!player.small ? SPRITES.mario_fire : (player.small?SPRITES.mario_small:SPRITES.mario_big);
    if(!spr) spr = SPRITES.mario_small;
    const flicker = player.hurtFlashT>0 && Math.floor(player.hurtFlashT/6)%2===0;
    ctx.globalAlpha = flicker?0.5:1;
    const o={flip:player.dir<0};
    // 比例适配: 马里奥精灵让身体适合 h
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
