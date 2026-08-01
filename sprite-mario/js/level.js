/* ===== World：关卡世界(管理地图/块/实体/玩家) ===== */
import { TILE, aabb, moveX, moveY } from './physics.js';
import { generateLevel } from './levelgen.js';
import { SPRITES } from './sprites.js';
import { PowerUp, makeEnemy, Bullet } from './entities.js';

export class World {
  constructor(levelNo, seed, startCfg){
    this.levelNo = levelNo;
    // 生成地图（seed 固定后同一关卡可复现）
    this.seed = seed || ('level'+levelNo);
    const gen = generateLevel(levelNo, this.seed);
    this.w = gen.w; this.h = gen.h;
    this.tiles = gen.tiles;
    this.groundY = gen.groundY;
    this.tileY = gen.tileY;
    this.blocks = gen.blocks;
    this.spawnDefs = gen.spawns;
    this.flagX = gen.flagX;
    this.startX = gen.startX;
    this.levelW = this.w * TILE;

    // 相机
    this.camX = -60;
    this.camTarget = this.camX;
    this.camY = 0;

    // 实体
    this.powerups = [];
    this.enemies = [];
    this.bullets = [];
    this.coinFx = [];      // 金币弹出动画 {x,y,t}
    this.spawnFromDefs();

    // 动态状态
    this.usedBlocks = [];   // {x,y}
    this.smashed = [];      // 可碎砖被撞碎动画
    this.flagReached = false;
    this.time = 300;
    this.complete = false;
    this.startCfg = startCfg;

    // 检查点（复活点）：起点 + 沿途安全列；curCp 为当前已激活检查点索引
    this.checkpoints = (gen.checkpoints && gen.checkpoints.length) ? gen.checkpoints : [{ x: gen.startX }];
    this.curCp = 0;
  }

  // 当前复活点（像素）
  get checkpointX(){ return this.checkpoints[this.curCp].x * TILE; }

  // 玩家前进经过检查点时激活最新一个（死亡后从该点复活）
  updateCheckpoint(px){
    while (this.curCp+1 < this.checkpoints.length && this.checkpoints[this.curCp+1].x*TILE <= px){
      this.curCp++;
    }
  }

  spawnFromDefs(){
    for (const s of this.spawnDefs){
      this.enemies.push(makeEnemy(s.x*TILE, s.y*TILE, s.type));
    }
  }

  tileAt(tx, ty){
    if (ty<0 || ty>=this.h || tx<0 || tx>=this.w) return 0;
    return this.tiles[ty][tx];
  }

  // 某实心区域是否有障碍(给定像素AABB)
  solidAt(x,y,w,h){
    const x0=Math.floor(x/TILE), x1=Math.floor((x+w-0.001)/TILE);
    const y0=Math.floor(y/TILE), y1=Math.floor((y+h-0.001)/TILE);
    for (let ty=y0;ty<=y1;ty++) for (let tx=x0;tx<=x1;tx++){
      const t=this.tileAt(tx,ty);
      if (t===1||t===2||t===3||t===4) return true;
    }
    return false;
  }

  get groundPixelY(){ return this.groundY*TILE; }
  get tilePixelY(){ return this.tileY*TILE; }
}
