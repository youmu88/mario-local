/* ===== 世界实体：道具/敌人/子弹 =====
 * 敌人类型：
 *   goomba  板栗仔（可踩扁，火球/踢壳可消灭）
 *   koopa   乌龟（可踩成壳，壳可踢出连杀/撞墙反弹）
 *   spiny   尖刺龟（踩踏受伤，仅火球/踢壳可消灭）
 *   flyer   红翼板栗（空中正弦巡逻，可踩扁，火球/踢壳可消灭）
 *   piranha 食人花（管道伸缩攻击，不可踩，碰撞受伤）
 */
import { TILE, aabb } from './physics.js';

// 道具(蘑菇/花/星/1up)
export class PowerUp {
  constructor(x, y, type){
    this.x=x; this.y=y;
    this.w=TILE; this.h=TILE;
    this.vx=1.6; this.vy=0;
    this.type=type;         // 'mushroom'|'flower'|'star'|'1up'
    this.alive=true;
    this.rising=0.9;        // 从块中升出
    this.landY=y;
    this.startY=y-TILE;
  }
  update(world){
    if (this.rising>0){
      this.rising -= 0.06;
      this.y = this.landY - this.rising*(this.landY-this.startY);
      if (this.rising<=0){ this.y=this.landY; }
      return;
    }
    if (this.type==='flower') return; // 花静止
    // 星跳动
    if (this.type==='star'){
      this.vy += 0.4;
      if (this.y+this.h >= world.groundY*TILE){ this.vy=-7; this.y = world.groundY*TILE-this.h; }
    } else {
      this.vy += 0.5;
    }
    this.x += this.vx;
    this.y += this.vy;
    // 落到地面(玩家同一基准: groundY)
    const gy = world.groundY*TILE - this.h;
    if (this.vy>0 && this.y >= gy){ this.y=gy; this.vy=0; }
    // 碰到障碍反向
    const col = world.solidAt(this.x, this.y, this.w, this.h);
    if (col){ this.vx = -this.vx; }
  }
}

// 敌人基类
class Enemy {
  constructor(x,y,type){
    this.type=type;
    this.w=TILE; this.h=TILE;
    if (type==='koopa'){ this.h=TILE+4; } // koopa 略高
    this.x=x; this.y=y-this.h;
    this.vx = (type==='goomba'||type==='spiny') ? -0.6 : (type==='flyer' ? -0.8 : -0.5);
    this.vy=0;
    this.dir = this.vx<0?-1:1;
    this.alive=true;
    this.dead=false;         // 被消灭(踩扁/击杀)
    this.deadT=0;
    this.shell=false;        // 乌龟变壳
    this.kicked=false;       // 壳被踢出
    this.kickVX=0;
    this.kickT=0;            // 踢出计时（刚踢出不伤玩家）
    this.walkT=0;            // 动画计时
    this.frame=0;            // 当前动画帧 0/1
    this.baseY=this.y;       // flyer 飞行基准
    this.phase=Math.random()*Math.PI*2;
  }
  update(world){
    if (this.dead){ this.deadT--; if (this.deadT<=0) this.alive=false; return; }
    if (this.shell){
      if (this.kicked){
        this.kickT++;
        // 撞墙反弹（踢出的壳在原版中撞墙会弹回）
        if (this.worldSolidAhead(world)){ this.kickVX = -this.kickVX; }
        this.x += this.kickVX;
      }
      this.applyGravity(world);
      return;
    }
    if (this.type==='flyer'){
      // 飞行：正弦上下 + 水平巡逻（不落地、不坠坑）
      this.phase += 0.06;
      this.y = this.baseY + Math.sin(this.phase)*18;
      this.walkT++;
      this.frame = Math.floor(this.walkT/10)%2;
      if (this.worldSolidAhead(world)){ this.vx=-this.vx; }
      this.x += this.vx;
      this.dir = this.vx<0?-1:1;
      return;
    }
    // 正常移动
    this.applyGravity(world);
    this.walkT++;
    this.frame = Math.floor(this.walkT/10)%2;
    // 碰墙/边缘
    const ahead = this.worldSolidAhead(world);
    const edge = this.noEdgeAhead(world);
    if ((ahead || !edge) && !this.inAir(world)) this.vx=-this.vx;
    this.x += this.vx;
    this.dir = this.vx<0?-1:1;
  }
  inAir(world){ const gy=world.groundY*TILE-this.h; return Math.abs((this.y)-gy)>2; }
  applyGravity(world){ this.vy+=0.5; this.y+=this.vy; const gy=world.groundY*TILE-this.h; if(this.y>=gy){this.y=gy;this.vy=0; } }
  worldSolidAhead(world){
    const side = this.vx>0 ? this.x+this.w+2 : this.x-2;
    const tx=Math.floor(side/TILE); const ty=Math.floor((this.y+this.h/2)/TILE);
    return world.tileAt(tx,ty)!==0;
  }
  noEdgeAhead(world){
    const side = this.vx>0 ? this.x+this.w+4 : this.x-4;
    const tx=Math.floor(side/TILE); const ty=Math.floor((this.y+this.h)/TILE); // 脚底所在行(H=12时+1越界恒0导致原地抖动)
    if (tx>=world.w) return true;
    return world.tileAt(tx,ty)!==0;
  }
}

// 食人花：从管道伸缩攻击（不可踩，碰撞受伤）
export class Piranha {
  constructor(x,y,pipeTopY){
    this.type='piranha';
    this.w=TILE; this.h=TILE;
    this.x=x; this.y=pipeTopY;      // y = 花头顶部位置（初始缩在管道口）
    this.pipeTopY=pipeTopY;         // 缩回基准（管道口顶面）
    this.maxExtend=TILE*1.5;        // 最大伸出高度
    this.phase='hidden';            // hidden|rising|up|falling
    this.phaseT=0;
    this.alive=true; this.dead=false;
    this.dir=-1; this.vx=0; this.vy=0;
    this.walkT=0; this.frame=0;
  }
  // 碰撞盒：花头（仅伸出明显时有效；未伸出则无碰撞）
  get box(){
    const out = this.pipeTopY - this.y;   // 当前伸出量
    if (out < 10) return { x:this.x, y:this.y, w:0, h:0 };
    return { x:this.x+2, y:this.y, w:this.w-4, h:Math.min(out+10, 42) };
  }
  update(world){
    this.walkT++;
    this.frame = Math.floor(this.walkT/8)%2;   // 花头张合动画
    const player = world.player;
    const dist = player ? Math.abs((player.x+player.w/2) - (this.x+this.w/2)) : 999;
    if (this.phase==='hidden'){
      if (dist < 5*TILE){ this.phase='rising'; this.phaseT=0; }
      this.y = this.pipeTopY;
    } else if (this.phase==='rising'){
      this.phaseT++;
      this.y = this.pipeTopY - this.maxExtend * Math.min(1, this.phaseT/22);
      if (this.phaseT>=22){ this.phase='up'; this.phaseT=0; }
    } else if (this.phase==='up'){
      this.phaseT++;
      if (dist > 6.5*TILE || this.phaseT>110){ this.phase='falling'; this.phaseT=0; }
    } else { // falling
      this.phaseT++;
      this.y = this.pipeTopY - this.maxExtend * Math.max(0, 1 - this.phaseT/18);
      if (this.phaseT>=18){ this.phase='hidden'; this.y=this.pipeTopY; }
    }
  }
}

// 敌人工厂
function makeEnemy(x,y,type){
  if (type==='piranha') return new Piranha(x, y, y);   // y = 管道顶面像素
  return new Enemy(x,y,type);
}

// 子弹(火球)
export class Bullet {
  constructor(x,y,dir){
    this.x=x; this.y=y; this.w=14; this.h=14;
    this.vx=dir*6; this.vy=0; this.alive=true;
    this.age=0;
  }
  update(world){
    this.age++;
    if (this.age>240){ this.alive=false; return; }
    this.vy+=0.6; this.x+=this.vx; this.y+=this.vy;
    const gy = world.groundY*TILE-22;
    if (this.vy>0 && this.y>=gy){ this.y=gy; this.vy=-4; } // 弹跳
    // 出界(屏幕外较远处 或 掉出世界底部)
    if (this.x < -60 || this.x > world.w*TILE+60 || this.y > world.h*TILE+60) this.alive=false;
  }
}

export { Enemy, makeEnemy };
