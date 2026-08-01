/* ===== 马里奥玩家 ===== */
import { TILE, aabb, moveX, moveY } from './physics.js';
import { SPRITES } from './sprites.js';
import { Bullet } from './entities.js';
import { CFG } from './config.js';
const CFG_ = CFG;

export class Player {
  constructor(world, startCfg){
    this.world = world;
    this.x = world.startX*TILE;
    this.y = world.groundY*TILE - TILE;
    this.small = !startCfg.startBig;
    this.fire = !!startCfg.startFire;
    this.invincible = !!startCfg.invincible;
    this.setSize();
    this.vx=0; this.vy=0;
    this.dir=1;           // 面向
    this.onGround=false;
    this.running=false;
    this.alive=true;
    this.starT = this.invincible? 99999 : 0;  // 无敌星星计时
    this.dying=false;     // 掉落坑
    this.dieT=0;
    this.stompCooldown=0;
    this.onBlock = null;  // 触发的块回调
    this.dead=false;
    this.score=0;
    this.coins=0;
    this.hurtFlashT=0;    // 受伤闪烁(无敌时间)
    this.frames=0;
  }

  setSize(){
    if (this.small){ this.w=TILE; this.h=TILE; }
    else { this.w=TILE; this.h=TILE*2; } // 大马里奥2格高
    // 保持脚底对齐
    this.y = (this.world.groundY*TILE) - this.h;
  }

  get spriteKey(){
    if (this.fire && !this.small) return 'mario_big'; // 火马里奥同大造型+不同色
    return this.small? 'mario_small':'mario_big';
  }

  update(input, sfx){
    this.frames++;
    if (this.hurtFlashT>0) this.hurtFlashT--;

    // 死亡下跌
    if (this.dying){
      this.vy+=0.5; this.y+=this.vy;
      this.dieT--;
      if (this.dieT<=0) this.alive=false;
      return;
    }

    // 冲刺/跑
    const max = input.keys.run ? CFG_.DASH_SPEED : CFG_.RUN_SPEED;
    if (input.keys.left){ this.vx = -max; this.dir=-1; }
    else if (input.keys.right){ this.vx = max; this.dir=1; }
    else this.vx=0;
    this.running = input.keys.run && (input.keys.left||input.keys.right);

    // 跳跃缓冲 + 蓄力(长按跳更高更远)
    if (input.consumeJump()){
      if (this.onGround){
        this.vy = this.running? CFG_.DASH_JUMP_VEL : CFG_.JUMP_VEL;
        this.onGround=false;
        this.jumpHeld = true;
        sfx.jump();
      } else {
        // 空中再跳(经典马里奥不能二段跳，忽略)
      }
    }
    // 松开跳跃：立即截断上升(短按跳得低)，长按则保持低重力升空
    if (!input.keys.jump){
      this.jumpHeld = false;
      if (this.vy < -3) this.vy = -3;   // 快速结束上升，实现可变跳高
    }

    // 开火
    if (input.consumeFire() && this.fire){
      if (this.world.bullets.filter(b=>b.alive).length<2){
        const by = this.small? this.y+4 : this.y+this.h*0.35;
        this.world.bullets.push(new Bullet(this.x + (this.dir>0? this.w:0) - 7, by, this.dir));
        sfx.fire();
      }
    }

    // 物理：上升中按住跳用低重力(长按大跳)，否则常态重力
    const g = (this.vy < 0 && this.jumpHeld) ? CFG_.JUMP_HOLD_GRAV : CFG_.NORMAL_GRAV;
    this.vy = Math.min(this.vy + g, CFG_.MAX_FALL);

    // 水平碰撞(推回 + 触碰块)
    const prevOnGround = this.onGround;
    const prevVX = this.vx;
    moveX(this, this.world.tiles, (tx,ty,dir)=>{
      // 撞到方块，如果是 ?/b 且 dir=1(向左撞) 触发? 经典是从下撞
    });
    // 垂直
    const m = moveY(this, this.world.tiles);
    this.onGround = m.grounded;
    for (const [tx,ty] of m.hits){
      this.triggerBlock(tx,ty, sfx);
    }

    // 掉落坑
    if (this.y > (this.world.h+2)*TILE + 20){ this.startDying(); }
  }

  // 从下顶块
  triggerBlock(tx,ty,sfx){
    const t = this.world.tileAt(tx,ty);
    if (t===3){ // 问号块
      this.world.usedBlocks.push({x:tx,y:ty});
      this.world.tiles[ty][tx] = 4;
      const blk = this.world.blocks.find(b=>b.x===tx && b.y===ty);
      const content = blk? blk.content : 'coin';
      this.bumpBlock(tx,ty);
      if (content==='coin'){ this.coins++; this.score+=100; this.world.coinFx.push({x:tx,y:ty,t:24}); sfx.coin(); }
      else { this.world.powerups.push(new PowerUp(tx*TILE, ty*TILE, content)); }
    } else if (t===2){ // 可碎砖
      // 大马里奥可碎
      if (!this.small){ this.world.tiles[ty][tx]=0; this.world.smashed.push({x:tx,y:ty,t:20}); sfx.bump(); }
      else { sfx.bump(); }
    }
  }
  bumpBlock(tx,ty){ this.world.smashed.push({x:tx,y:ty,t:12, bump:true}); }

  startDying(){
    if (this.dying) return;
    this.dying=true;
    this.vy=-7; this.vx=0; this.dieT=70;
  }

  damage(){
    if (this.starT>0) return;
    if (!this.small){ this.small=true; this.setSize(); this.hurtFlashT=80; }   // 缩回
    else { this.alive=false; }
  }
}
