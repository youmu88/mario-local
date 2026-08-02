/* ===== 马里奥玩家 ===== */
import { TILE, aabb, moveX, moveY } from './physics.js';
import { SPRITES } from './sprites.js';
import { Bullet } from './entities.js';
import { CFG } from './config.js';
const CFG_ = CFG;

export class Player {
  constructor(world, startCfg){
    this.world = world;
    this.x = (startCfg.spawnX!=null) ? startCfg.spawnX : world.startX*TILE;
    this.y = world.groundY*TILE - TILE;
    this.small = !startCfg.startBig;
    this.fire = !!startCfg.startFire;
    this.invincible = !!startCfg.invincible;
    this.setSize();
    this.vx=0; this.vy=0;
    this.dir=1;           // 面向
    this.onGround=false;
    this.running=false;
    this.crouching=false;   // 下蹲中（仅大马里奥，经典规则）
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
    this.respawnInvT=0;   // 复活无敌计时(5秒，期间不受伤害)
    this.frames=0;
    this.clearMode=null;   // 过关动画: null | 'slide'(沿旗杆滑下) | 'walk'(走向城堡)
    this.cleared=false;    // 已走进城堡(渲染隐藏)
  }

  setSize(){
    const feet = (this.h!=null) ? this.y + this.h : null;  // 变身/受伤保持脚底（避免空中变大被瞬移到地面）
    if (this.small){ this.w=TILE; this.h=TILE; }
    else { this.w=TILE; this.h=TILE*2; } // 大马里奥2格高
    // 保持脚底对齐
    this.y = (feet!=null) ? feet - this.h : (this.world.groundY*TILE) - this.h;
  }

  get spriteKey(){
    if (this.crouching) return 'mario_big_crouch';
    if (this.fire && !this.small) return 'mario_big'; // 火马里奥同大造型+不同色
    return this.small? 'mario_small':'mario_big';
  }

  // 站起：恢复大马里奥碰撞盒（脚底不动）
  standUp(){
    if (!this.crouching) return;
    this.crouching = false; this.h = TILE*2; this.y -= TILE;
  }

  // 头顶新增空间是否有实心瓦片（能否从蹲姿站起）
  canStand(){
    const xs = Math.floor(this.x/TILE), xe = Math.floor((this.x+this.w-0.001)/TILE);
    const r0 = Math.floor((this.y-TILE)/TILE), r1 = Math.floor((this.y-0.001)/TILE);
    for (let r=r0; r<=r1; r++) for (let x=xs; x<=xe; x++)
      if (this.world.tiles[r] && this.world.tiles[r][x]) return false;
    return true;
  }

  // 当前碰撞盒是否与实心瓦片重叠（长大后嵌顶自动蹲检测）
  bodyOverlaps(){
    const xs = Math.floor(this.x/TILE), xe = Math.floor((this.x+this.w-0.001)/TILE);
    const ys = Math.floor(this.y/TILE), ye = Math.floor((this.y+this.h-0.001)/TILE);
    for (let r=ys; r<=ye; r++) for (let x=xs; x<=xe; x++)
      if (this.world.tiles[r] && this.world.tiles[r][x]) return true;
    return false;
  }

  update(input, sfx){
    this.frames++;
    if (this.hurtFlashT>0) this.hurtFlashT--;
    if (this.respawnInvT>0) this.respawnInvT--;

    // 死亡下跌
    if (this.dying){
      this.vy+=0.5; this.y+=this.vy;
      this.dieT--;
      if (this.dieT<=0) this.alive=false;
      return;
    }

    // 过关动画：不受输入控制（沿杆滑下 → 自动走向城堡）
    if (this.clearMode){
      if (this.clearMode==='slide'){
        this.vx=0; this.vy=0;
        this.y += 2.6;   // 沿杆下滑
        const ground = this.world.groundY*TILE - this.h;
        if (this.y >= ground){ this.y = ground; this.clearMode='walk'; }
      } else if (this.clearMode==='walk'){
        this.dir = 1;
        this.vx = CFG_.RUN_SPEED;
        this.x += this.vx;
        this.onGround = true;
        if (this.x >= this.world.flagX*TILE + 4.5*TILE) this.cleared = true;  // 走进城堡
      }
      return;
    }

    // ===== 下蹲（大马里奥经典规则）：地面按↓蹲下(碰撞盒减半,脚底不动)；
    // 头顶被堵时松开↓仍保持蹲姿（低矮通道被迫蹲，可左右走）；主动蹲(按住↓)不迈步、带速度滑行
    if (!this.small){
      if (!this.crouching && this.onGround && input.keys.down){
        this.crouching = true; this.h = TILE; this.y += TILE;
      } else if (this.crouching && !input.keys.down && this.canStand()){
        this.standUp();
      }
      // 吃蘑菇/火焰花长大时头顶嵌砖：自动进入蹲姿，避免被水平碰撞推挤
      if (!this.crouching && this.bodyOverlaps()){
        this.crouching = true; this.h = TILE; this.y += TILE;
      }
    }
    const crouchLock = this.crouching && input.keys.down && this.onGround;  // 主动蹲锁定迈步(仅地面；空中可微调方向)

    // 冲刺/跑（渐进加速/减速：还原经典手感，消除“瞬间满速”导致的操作失误）
    const max = input.keys.run ? CFG_.DASH_SPEED : CFG_.RUN_SPEED;
    let wantDir = input.keys.left ? -1 : (input.keys.right ? 1 : 0);
    if (crouchLock) wantDir = 0;   // 主动蹲下时锁定迈步（可带惯性滑入缝隙）
    let accel;
    if (crouchLock){ accel = CFG_.CROUCH_FRICTION; }  // 蹲滑：低摩擦长滑行
    else if (wantDir === 0){ accel = CFG_.FRICTION; }
    else if (this.vx * wantDir < 0){ accel = CFG_.TURN_DECEL; }  // 反向变道：快速但平滑换向
    else { accel = this.onGround ? CFG_.WALK_ACCEL : CFG_.AIR_ACCEL; }
    this.vx += wantDir * accel;
    if (wantDir > 0) this.vx = Math.min(this.vx, max);
    else if (wantDir < 0) this.vx = Math.max(this.vx, -max);
    else {
      // 松开方向键：按摩擦减速（轻微滑行，最终完全停下）
      if (this.vx > 0) this.vx = Math.max(0, this.vx - accel);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + accel);
    }
    if (wantDir !== 0) this.dir = wantDir;
    this.running = input.keys.run && wantDir !== 0 && Math.abs(this.vx) > 0.5;

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
    if (this.starT>0 || this.respawnInvT>0) return;
    if (!this.small){ this.small=true; this.crouching=false; this.setSize(); this.hurtFlashT=80; }   // 缩回
    else { this.alive=false; }
  }
}
