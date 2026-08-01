/* ===== 世界实体：道具/敌人/子弹 ===== */
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
    if (type==='goomba'){}
    else { this.h=TILE+4; } // koopa 略高
    this.x=x; this.y=y-this.h;
    this.vx = type==='goomba'? -0.9 : -0.7;
    this.vy=0;
    this.dir = this.vx<0?-1:1;
    this.alive=true;
    this.dead=false;         // 踩扁
    this.deadT=0;
    this.shell=false;        // 乌龟变壳
    this.kicked=false;
    this.kickVX=0;
    this.walkT=0;
  }
  update(world){
    if (this.dead){ this.deadT--; if (this.deadT<=0) this.alive=false; return; }
    if (this.shell){
      // 壳：静止或被踢
      this.x += this.kicked? this.kickVX : 0;
      this.applyGravity(world);
      return;
    }
    // 正常移动
    this.applyGravity(world);
    this.walkT++;
    // 碰墙/边缘
    const ahead = this.worldSolidAhead(world);
    const edge = this.noEdgeAhead(world);
    if ((ahead || !edge) && !this.inAir(world)) this.vx=-this.vx;
    this.x += this.vx;
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
    const tx=Math.floor(side/TILE); const ty=Math.floor((this.y+this.h)/TILE)+1;
    if (tx>=world.w) return true;
    return world.tileAt(tx,ty)!==0;
  }
}

// 敌人工厂
function makeEnemy(x,y,type){
  if (type==='koopa') return new Enemy(x,y,'koopa');
  return new Enemy(x,y,'goomba');
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
