/* ===== SUPER MARIO - 单文件构建版 (自动生成) ===== */
/* 来源: js/*.js (ES module) 合并去模块化 */
;(function(){
"use strict";

/* ===== config.js ===== */
/* ===== 全局配置与开局配置 ===== */
const CFG = {
  // 逻辑分辨率（固定像素，物理恒定）
  VIEW_W: 640,
  VIEW_H: 360,
  // 像素块尺寸
  TILE: 32,
  GRAVITY: 0.55,        // 重力
  MAX_FALL: 14,
  RUN_SPEED: 3.2,       // 基础跑速
  DASH_SPEED: 5.2,      // 冲刺
  JUMP_VEL: -9.5,
  DASH_JUMP_VEL: -11.5, // 冲刺大跳
  // 时间限制(秒)
  TIME_LIMIT: 300,
};

/* 像素精灵地图缩放（每精灵内用 16x16 或 8x8 网格） */
const PX = 2; // 每个逻辑像素内精灵网格

/* ===== 开局配置（可被 UI 修改） ===== */
const StartConfig = {
  lives: 3,          // 3 | 30
  startBig: false,   // 开局是否大马里奥
  startFire: false,  // 开局是否带子弹(火球)
  invincible: false, // 无敌
};

/* 通过 localStorage 保存偏好可选项 */
let savedCfg = null;
try { savedCfg = JSON.parse(localStorage.getItem('mario_start_config')); } catch(e){}
if (savedCfg) Object.assign(StartConfig, savedCfg);

function saveStartConfig(){
  try { localStorage.setItem('mario_start_config', JSON.stringify(StartConfig)); } catch(e){}
}



/* ===== sprites.js ===== */
/* ===== 程序化像素精灵绘制 =====
 * 用 8x8/16x16 网格点阵描述精灵，运行时在离屏 canvas 上渲染为高清纹理。
 */

/* 简易像素字符画：'.'透明 其他=色板key */
function makeSprite(rows, pal) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w * PX;
  c.height = h * PX;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x * PX, y * PX, PX, PX);
    }
  }
  return c;
}

const PAL = {
  'R':'#e03a20','r':'#9c2a15',  // 红(帽/衣)
  'B':'#2a8cd4','b':'#1a5c9c',  // 蓝(裤)
  'S':'#f7c5a0','s':'#c98a62',  // 肤色
  'H':'#5a320a','h':'#341c05',  // 棕头发
  'K':'#2a1200',                // 眼睛黑
  'Y':'#ffd800','y':'#c9a400',  // 黄(扣/星)
  'W':'#fff','w':'#c0c0c0',     // 白
  'G':'#b07730','g':'#7a4a18',  // 棕壳
  'O':'#ff8c00',                // 橙
  'N':'#111',                   // 壳深
  'T':'#5aa02a','t':'#3a6a18',  // 乌龟绿
  'M':'#7ce82a',                // 绿
  'P':'#c96a12','p':'#8a3d00',  // 问号砖土色
  'C':'#d0d0d0',                // 灰砖
  'L':'#8fd14f',                // 蘑菇伞
  'E':'#e8e8e8',                // 蘑菇柄
  'F':'#ffb400',                // 火球
  'Q':'#ff7040',                // 金币
  'V':'#8a1a1a',                // 旗砖
};
PAL.M = '#7ce82a';

/* ===== 精灵定义 ===== */
const SPRITES = {};

// 问号砖
SPRITES['brick_q'] = makeSprite([
  'pppppppp',
  'pPPPPPPp',
  'pPYYYYPP',
  'pPYWYPPP',
  'pPPPYYYY',
  'pPPYWYPP',
  'pYPPPPPP',
  'pppppppp'
], PAL);

// 已消耗问号砖
SPRITES['brick_q_used'] = makeSprite([
  'pppppppp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pppppppp'
], PAL);

// 普通实心砖方块
SPRITES['block'] = makeSprite([
  'CCCCCCCC',
  'CccccccC',
  'CccccccC',
  'CCCCCCCC',
  'CccccccC',
  'CccccccC',
  'CCCCCCCC',
  'ccccccCC'
], PAL);

// 可撞碎砖(金币砖下面的实心)
SPRITES['brick_b'] = makeSprite([
  'CgGCgGCc',
  'gG.CgGCg',
  'CGgGCgGC',
  'CgGCgGCg',
  'gGCgGCgG',
  'GgGCgGCg',
  'CgGCgGCG',
  'gGCgGCgG'
], PAL);

// 金币
SPRITES['coin'] = makeSprite([
  '..QQQQ..',
  '.QYYYYQ.',
  'QYQYYQYQ',
  'QYQYYQYQ',
  'QYQYYQYQ',
  'QYQYYQYQ',
  '.QYYYYQ.',
  '..QQQQ..'
], PAL);

/* 小马里奥 - 面向右 */
const MARIO_SMALL = [
  '.....RRR.',
  '....RRRRR',
  '...RRRRRR',
  '..RRRRRRR',
  '..SSSSSSS',
  '..SSSKSKS',
  '..SSSSSSS',
  '.sSSSSSSs',
  '.sss.sss.',
  '...R...R.',
  '...B...B.',
  '..BB..BB.',
  '..B....B.'
];
SPRITES['mario_small'] = makeSprite(MARIO_SMALL, PAL);

/* 大马里奥 - 面向右 */
const MARIO_BIG = [
  '....RRRRR.',
  '...RRRRRRR',
  '...RRRRRRR',
  '...SSSSSSS',
  '..SSSSSSSS',
  '..SSSSKSKS',
  '...SSSSSSS',
  '...sSSSss.',
  '....sSSs..',
  '.RRR..RRR.',
  '.RRR..RRR.',
  '.BBB..BBB.',
  '.BBBB.BBBB',
  '.BB....BB.',
  '.........'
];
SPRITES['mario_big'] = makeSprite(MARIO_BIG, PAL);

// 蘑菇怪 Goomba
const GOOMBA = [
  '..NNNNNN..',
  '.NbbbbbbN.',
  'NbbbbbbbbN',
  'NbbbswbbNN',
  'NbbbbbbbbN',
  'NbNbbbbNNN',
  'NbbbbbbbbN',
  '.NNNNNNNN.',
  '...N..N...',
  '..NN..NN..'
];
PAL.b='#b07730'; PAL.n='#2a1200';
SPRITES['goomba'] = makeSprite(GOOMBA, PAL);

// 乌龟 Koopa（绿，面向右）
const KOOPA = [
  '....TtT...',
  '...TTtTT..',
  '.TTTTTTtTT',
  'TTttsssTTT',
  'TTsssKKTtT',
  '.TTTTTTTT.',
  '..GGGGGG..',
  '..GgGgGG..',
  '..GgGgGG..'
];
SPRITES['koopa'] = makeSprite(KOOPA, PAL);

// 蘑菇(红)- 变大道具
const MUSHROOM = [
  '....LLLLL....',
  '...LLLLLLL...',
  '.LLLLLLLLLLL.',
  'LLLLLLLLLLLLL',
  'LLLLLWWLLLLLL',
  'LLLLLWWWWLLLL',
  'LLLLLLLLLLLLL',
  'LLLLLLLLLLLLL',
  '.EEEEEEEEEEE.',
  'EeEeEEEEeEEEe',
  '.EEEEEEEEEEE.'
];
SPRITES['mushroom'] = makeSprite(MUSHROOM, PAL);

// 火之花
const FLOWER = [
  '....GG....',
  '...GGGG...',
  '.FGGGGGGF.',
  'FGGGFGGGF',
  '..GGGGGG..',
  '..GGGGGG..',
  '..GGGGGG..',
  '...EEEE...',
  '...EEEE...',
  '...EEEE...'
];
SPRITES['flower'] = makeSprite(FLOWER, PAL);

// 子弹(火球)
SPRITES['fireball'] = makeSprite([
  '..FF..',
  '.FFFF.',
  'FFFFFF',
  'FFFFFF',
  '.FFFF.',
  '..FF..'
], PAL);

// 星星
SPRITES['star'] = makeSprite([
  '...YY...',
  '..YYYY..',
  '.YYYYYY.',
  'YYYYYYYY',
  'YYYYYYYY',
 '.YYYYYY.',
 '..YYYY..',
 '...WW...'
], PAL);

// 旗杆顶部
SPRITES['flag_pole'] = makeSprite([
  'OOO....',
  'OOOOO..',
  'OOO....',
  'RRR....'
], PAL);

// 城堡(简单)
SPRITES['castle'] = makeSprite([
  '..VVVVVV..',
  '.VVSSSSVV.',
  'VSSSSSSSSV',
  'VSSSSSSSSV',
  'VVVVSSVVVV',
  ' SSS S S S'.replace(/ /g,'.'), // 门
  'VVVV..VVVV',
  'VVVV..VVVV'
], PAL);

// 云
SPRITES['cloud'] = makeSprite([
  '....WWW....',
  '..WWWWWW..',
  'WWWWWWWWWW',
  'WWWWWWWWWW',
  '..WWWWWW..'
], PAL);

// 灌木
SPRITES['bush'] = makeSprite([
  '..GGGG..',
  '.GGmGGg.',
  'GGmGGmGg',
  'GGmGGmGg',
  'GGGGGGGG',
  'GGGGGGGG'
], PAL);
PAL.m = '#3a8a22';

// 山
SPRITES['hill'] = makeSprite([
  '.....OOO.....',
  '....OOOOO....',
  '...OOOoOOO...',
  '..OOOoOoOOO..',
  '.OOOoOOOoOOO.',
  'OOOoOOOoOOOoO',
  'OOOOOOOOOOOOO'
], PAL);

// 管道
SPRITES['pipe'] = makeSprite([
  '..GGGGGG..',
  'GGggggggGG',
  'GGggggggGG',
  'GGggggggGG',
  'GGggggggGG'
], PAL);



/* ===== physics.js ===== */
/* ===== 物理与碰撞 ===== */
const TILE = 32;

// AABB 碰撞检测
function aabb(a, b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// 水平推回：返回是否落地面
function moveX(body, tiles, onCollide) {
  const tile = TILE;
  // 扫过所占 tile 范围
  const ys = Math.floor(body.y / tile);
  const ye = Math.floor((body.y + body.h - 0.001) / tile);
  const dir = body.vx > 0 ? 1 : -1;
  const edge = dir > 0 ? Math.floor((body.x + body.w) / tile) : Math.floor(body.x / tile);
  const nEdge = dir > 0 ? Math.floor((body.x + body.w + body.vx) / tile) : Math.floor((body.x + body.vx) / tile);
  for (let y = ys; y <= ye; y++){
    for (let x = Math.min(edge,nEdge); x <= Math.max(edge,nEdge); x++){
      if (tiles[y] && tiles[y][x]) {
        // 撞墙
        if (dir > 0) body.x = x * tile - body.w - 0.01;
        else body.x = (x + 1) * tile + 0.01;
        body.vx = 0;
        onCollide && onCollide(x, y, dir);
        return;
      }
    }
  }
  body.x += body.vx;
}

// 垂直推回 + 落面判定
// 返回结构 { grounded, hitCeil(col,row) }
function moveY(body, tiles, hits) {
  const tile = TILE;
  const xs = Math.floor(body.x / tile);
  const xe = Math.floor((body.x + body.w - 0.001) / tile);
  let grounded = false;
  const hitCells = [];

  if (body.vy >= 0) {
    // 下落
    const row = Math.floor((body.y + body.h) / tile);
    const nrow = Math.floor((body.y + body.h + body.vy) / tile);
    for (let r = row; r <= nrow; r++){
      for (let x = xs; x <= xe; x++){
        if (tiles[r] && tiles[r][x]) {
          body.y = r * tile - body.h - 0.01;
          body.vy = 0;
          grounded = true;
          hitCells.push([x, r]);
          return { grounded, hits: hitCells };
        }
      }
    }
  } else {
    // 上升
    const row = Math.floor(body.y / tile);
    const nrow = Math.floor((body.y + body.vy) / tile);
    for (let r = row; r >= nrow; r--){
      for (let x = xs; x <= xe; x++){
        if (tiles[r] && tiles[r][x]) {
          body.y = (r + 1) * tile + 0.01;
          body.vy = 0;
          hitCells.push([x, r]);
          return { grounded:false, hits: hitCells };
        }
      }
    }
  }
  body.y += body.vy;
  return { grounded, hits: hitCells };
}


/* ===== levelgen.js ===== */
/* ===== 无限随机关卡生成 =====
 * 关卡由一系列段落拼接，返回二维 tile 数组 + 实体/道具/敌人刷出点。
 * tile 编码：
 *   0 空
 *   1 坚硬砖(block,不可破坏)
 *   2 可撞碎的砖(brick, 从上方撞可碎)
 *   3 问号块(未用)
 *   4 已用问号块
 *   5 地板(ground, 特殊顶部纹理)
 */

function createEmpty(w, h){
  const t = [];
  for (let y=0;y<h;y++){ t.push(new Array(w).fill(0)); }
  return t;
}

/* 用 RNG 生成关卡。返回 { w,h,tiles, startX, spawns, sections } */
function generateLevel(levelNo, seedStr){
  // 确定性随机
  let seed = hashStr(seedStr || 'seed' + levelNo);
  const rng = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const ri = (a,b) => Math.floor(rng()*(b-a)) + a;

  const H = 12;                     // 逻辑高度(块)
  const groundY = H-1;              // 地板行
  const GROUND = 5;
  const w = 200 + levelNo*8;        // 关卡长度随关卡增长
  const tiles = createEmpty(w, H);
  // 地板
  for (let x=0;x<w;x++) tiles[groundY][x] = GROUND;
  for (let x=0;x<w;x++) tiles[groundY+1] && (tiles[groundY+1][x]=GROUND);

  const spawns = [];   // { x, type, y }
  const blocks=[];     // 特殊块: { x, y, kind:'?'|'b' , content }
  let x = 8;
  let sectionIndex = 0;

  // 难度系数
  const diff = Math.min(1 + levelNo*0.12, 4.5);
  const pitChance = Math.min(0.55 + levelNo*0.03, 0.9);
  const enemyRate = Math.min(0.5 + levelNo*0.06, 1.6);

  const pushBlock = (bx, kind, content) => blocks.push({x:bx, y:groundY-2, kind, content});
  const tileY = groundY-1;  // 放置实体块的行(距地面1格)

  // 起始安全段
  x += ri(2,5);

  while (x < w - 14) {
    const r = rng();
    const segW = ri(6,14);
    let choice = r < 0.20 ? 'ground' : (r < 0.42 ? 'blocks' : (r < 0.64 ? 'pit' : (r < 0.82 ? 'pipe' : 'enemies')));

    if (choice === 'pit'){
      // 坑
      if (x > 14 && x < w-20 && rng() < pitChance){
        const pw = ri(3, 4+Math.floor(diff/2));
        for (let px=0;px<pw;px++){
          for (let gy=0; gy<H; gy++) tiles[gy][x+px] = 0;
        }
        x += pw + ri(1,3);
      } else {
        choice = 'ground';
      }
    }

    if (choice === 'ground'){
      // 平地 + 偶尔低平台
      if (rng()<0.5 && x>10 && x<w-20){
        const platW = ri(3,6);
        const platY = tileY-1;
        for (let px=0;px<platW;px++){
          tiles[platY][x+px] = 1;
          if (rng()<0.8) tiles[platY+1][x+px]=1; // 高度2
        }
        // 平台上放块
        if (rng()<0.6 && x+platW < w-15){
          const kb = rng();
          if (kb<0.5) pushBlock(x+1,'?', rng()<0.7?'coin':'power');
          else tiles[treeY(platY-1)>=0?platY-1:platY-1][x+2]=2;
          x += platW;
        } else {
          x += platW + ri(1,3);
        }
      } else {
        // 空中问号块列
        if (rng()<0.6 && x < w-16){
          const n = ri(1,3);
          for (let i=0;i<n;i++){
            pushBlock(x+i*2, '?', rng()<0.6?'coin':(rng()<0.8?'power':'1up'));
          }
          x += n*2 + ri(1,2);
        } else {
          x += segW;
        }
        // 散落地面的敌人
        const eg = Math.floor(enemyRate * rng()*4);
        for (let i=0;i<eg;i++){ if (x+i*3 < w-16) spawns.push({x:x+i*2, y:tileY, type: rng()<0.7?'goomba':'koopa'}); x+=2; }
      }
    }
    else if (choice === 'blocks'){
      // 砖块 + 问号 组合
      const nb = ri(3,7);
      for (let i=0;i<nb;i++){
        const bx = x + i*2;
        if (bx > w-16) break;
        const kind = i%2===0 ? '?' : 'b';
        if (kind==='?') pushBlock(bx, '?', rng()<0.5?'coin':'power');
        else tiles[tileY][bx]=2;
      }
      x += nb*2;
    }
    else if (choice === 'pipe'){
      // 管道
      const ph = ri(1, 1+Math.floor(diff/2));
      for (let px=0;px<2;px++){
        for (let py=0;py<ph;py++){
          tiles[tileY-py][x+px] = 1;
        }
      }
      // 管道口跳上来有宝
      if (rng()<0.5) pushBlock(x, '?', 'power');
      x += 2 + ri(1,3);
    }
    else { // enemies
      const eg = 1 + Math.floor(Math.min(enemyRate, 3) * rng()*3);
      for (let i=0;i<eg;i++){
        const ex = x+i*3;
        if (ex < w-16) spawns.push({x:ex, y:tileY, type: rng()<0.65?'goomba':'koopa'});
      }
      x += eg*3;
    }
    sectionIndex++;
  }

  // 处理凹块上方的地形保持(确保有支撑)
  // 终点旗杆 + 城堡
  const flagX = w - 9;
  // 终点前一段清空地面敌人安全
  for (let i=0;i<blocks.length;i++){ if (blocks[i].x > flagX-2){ blocks.splice(i,1); i--; } }
  for (let i=0;i<spawns.length;i++){ if (spawns[i].x > flagX-2){ spawns.splice(i,1); i--; } }

  // 画旗杆(地图元素) — 用块标记: 在 flagX 垂直列放杆和旗
  for (let py=0; py<3; py++) tiles[tileY-1-py][flagX]=1;
  const flag = { x: flagX };

  return {
    w, h:H, tiles, startX: 6,
    groundY, tileY,
    blocks, spawns,
    flagX,
    seed: seedStr || ('level'+levelNo),
    levelNo
  };
}

function hashStr(s){
  let h = 2166136261;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// 兼容: treeY helper
function treeY(y){ return y; }


/* ===== entities.js ===== */
/* ===== 世界实体：道具/敌人/子弹 ===== */

// 道具(蘑菇/花/星/1up)
class PowerUp {
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
    // 跟地面
    const gy = world.tileY*TILE - this.h;
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
  inAir(world){ const gy=world.tileY*TILE-this.h; return Math.abs((this.y)-gy)>2; }
  applyGravity(world){ this.vy+=0.5; this.y+=this.vy; const gy=world.tileY*TILE-this.h; if(this.y>=gy){this.y=gy;this.vy=0;this.vx=this.vx; } }
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
class Bullet {
  constructor(x,y,dir){
    this.x=x; this.y=y; this.w=14; this.h=14;
    this.vx=dir*6; this.vy=0; this.alive=true;
    this.age=0;
  }
  update(world){
    this.age++;
    if (this.age>240){ this.alive=false; return; }
    this.vy+=0.6; this.x+=this.vx; this.y+=this.vy;
    const gy = world.tileY*TILE-22;
    if (this.vy>0 && this.y>=gy){ this.y=gy; this.vy=-4; } // 弹跳
    // 出界
    if (this.x < world.camX-20 || this.x>TILE) {
      if (this.x > world.w*TILE || this.x < -40) this.alive=false;
    }
    if (this.y > world.h*TILE+40) this.alive=false;
  }
}



/* ===== level.js ===== */
/* ===== World：关卡世界(管理地图/块/实体/玩家) ===== */




class World {
  constructor(levelNo, seed, startCfg){
    this.levelNo = levelNo;
    // 生成地图
    const gen = generateLevel(levelNo, seed);
    this.w = gen.w; this.h = gen.h;
    this.tiles = gen.tiles;
    this.groundY = gen.groundY;
    this.tileY = gen.tileY;
    this.blocks = gen.blocks;
    this.spawnDefs = gen.spawns;
    this.flagX = gen.flagX;
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


/* ===== player.js ===== */
/* ===== 马里奥玩家 ===== */




const CFG_ = CFG;

class Player {
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

    // 跳跃缓冲 + 蓄力
    if (input.consumeJump()){
      if (this.onGround){
        this.vy = this.running? CFG_.DASH_JUMP_VEL : CFG_.JUMP_VEL;
        this.onGround=false;
        sfx.jump();
      } else {
        // 空中再跳(经典马里奥不能二段跳，忽略)
      }
    }
    // 长按跳更高(可变跳)
    // if (!input.keys.jump && this.vy < -3) { this.vy = -3; }

    // 开火
    if (input.consumeFire() && this.fire){
      if (this.world.bullets.filter(b=>b.alive).length<2){
        const by = this.small? this.y+4 : this.y+this.h*0.35;
        this.world.bullets.push(newBullet(this.x + (this.dir>0? this.w:0) - 7, by, this.dir));
        sfx.fire();
      }
    }

    // 物理
    this.vy = Math.min(this.vy + CFG_.GRAVITY, CFG_.MAX_FALL);

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


/* ===== render.js ===== */
/* ===== 渲染引擎：画布绘制 ===== */


class Renderer {
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


/* ===== input.js ===== */
/* ===== 输入管理：键盘 + 触屏虚拟按键 ===== */
class Input {
  constructor() {
    this.keys = { left:false, right:false, jump:false, run:false, fire:false };
    this.jumpPressed = false;   // 跳跃按下沿(供跳跃缓冲)
    this.firePressed = false;
    this.onTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.touchBtn = {};
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', e => this._key(e, true));
    window.addEventListener('keyup', e => this._key(e, false));
    // 触屏按钮
    if (this.onTouchDevice) {
      document.querySelectorAll('.tbtn').forEach(btn => {
        const k = btn.dataset.key;
        const press = (v) => {
          this.keys[k] = v;
          if (v && k === 'jump') this.jumpPressed = true;
          if (v && k === 'fire') this.firePressed = true;
          if (v && this.handler) this.handler('touch', k);
        };
        btn.addEventListener('touchstart', e => { e.preventDefault(); press(true); btn.classList.add('active'); }, {passive:false});
        btn.addEventListener('touchend', e => { e.preventDefault(); press(false); btn.classList.remove('active'); }, {passive:false});
        btn.addEventListener('touchcancel', e => { press(false); btn.classList.remove('active'); });
        btn.addEventListener('mousedown', e => { e.preventDefault(); press(true); btn.classList.add('active'); });
        btn.addEventListener('mouseup', e => { press(false); btn.classList.remove('active'); });
        btn.addEventListener('mouseleave', e => { press(false); btn.classList.remove('active'); });
      });
    } else {
      document.getElementById('touch-controls').classList.add('hidden');
    }
  }

  _key(e, down) {
    const map = {
      'ArrowLeft':'left','a':'left','A':'left',
      'ArrowRight':'right','d':'right','D':'right',
      'ArrowUp':'jump','w':'jump','W':'jump',' ':'jump',' ': 'jump',
      'ArrowDown':'down','s':'down','S':'down',
      'Shift':'run','x':'fire','X':'fire','Enter':'jump'
    };
    const k = map[e.key];
    if (!k) return;
    e.preventDefault();
    // 空间/箭头 不重复触发
    if (this.keys[k] === down) {
      // jump 仍要捕获按下沿
      if (down && k === 'jump') this.jumpPressed = true;
      return;
    }
    this.keys[k] = down;
    if (down && k === 'jump') this.jumpPressed = true;
    if (down && k === 'fire') this.firePressed = true;
  }

  // 消费沿信号
  consumeJump() { const v = this.jumpPressed; this.jumpPressed = false; return v; }
  consumeFire() { const v = this.firePressed; this.firePressed = false; return v; }
  reset() {
    for (const k in this.keys) this.keys[k] = false;
    this.jumpPressed = false;
    this.firePressed = false;
  }
}



/* ===== audio.js ===== */
/* ===== 程序化音效 Web Audio ===== */
class AudioFX {
  constructor(){
    this.ctx = null;
    this.enabled = true;
    this._init();
  }
  _init(){
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.enabled=false; }
  }
  resume(){
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  _tone(freq, dur, type='square', vol=0.15, slideTo=null){
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  jump(){ this._tone(330, 0.18, 'square', 0.1, 660); }
  coin(){ this._tone(988, 0.09,'square',0.12); setTimeout(()=>this._tone(1319,0.25,'square',0.12),80); }
  stomp(){ this._tone(200, 0.12, 'triangle', 0.18, 80); }
  hurt(){ this._tone(400, 0.3, 'sawtooth', 0.12, 120); }
  powerup(){ [660,880,1100,1320].forEach((f,i)=>setTimeout(()=>this._tone(f,0.08,'square',0.1),i*90)); }
  fire(){ this._tone(1400, 0.15, 'square', 0.08, 400); }
  bump(){ this._tone(140, 0.1, 'square', 0.12); }
  die(){ [400,300,200,120].forEach((f,i)=>setTimeout(()=>this._tone(f,0.15,'sawtooth',0.12),i*140)); }
  flag(){ this._tone(523,0.1,'square',0.1); setTimeout(()=>this._tone(659,0.1,'square',0.1),110); setTimeout(()=>this._tone(784,0.25,'square',0.12),220); }
  clear(){ [523,523,523,659,784,659,1046].forEach((f,i)=>setTimeout(()=>this._tone(f,0.12,'square',0.13),i*120)); }
}



/* ===== game.js ===== */
/* ===== 游戏主状态机 ===== */







class Game {
  constructor(renderer, input, sfx, onStateChange){
    this.renderer = renderer;
    this.input = input;
    this.sfx = sfx;
    this.onStateChange = onStateChange;
    this.state = 'menu';      // menu | playing | dying | clear | gameover
    this.levelNo = 1;
    this.lives = StartConfig.lives;
    this.score = 0;
    this.world = null;
    this.player = null;
    this.clearT = 0;
    this.timer = 0;
    this.starMario = StartConfig.invincible;
  }

  startGame(cfg){
    this.lives = cfg.lives;
    this.score = 0;
    this.levelNo = 1;
    this.startLevel(cfg);
  }

  startLevel(cfg){
    if (this.lives <= 0 && !cfg){ this.gameOver(); return; }
    this.cfg = cfg || this.cfg || { lives:this.lives, startBig:StartConfig.startBig, startFire:StartConfig.startFire, invincible:StartConfig.invincible };
    this.world = new World(this.levelNo, null, this.cfg);
    this.world.score = this.score;
    this.player = new Player(this.world, this.cfg);
    this.player.score = this.score;
    this.player.lives = this.lives;
    this.state = 'playing';
    this.timer = 0;
    this.clearT = 0;
    this.onStateChange && this.onStateChange('playing', this);
  }

  update(dt){
    if (this.state==='menu') return;
    if (this.state==='playing' || this.state==='clear'){
      this.timer += dt;
      // 时间限制
      this.world.time = Math.max(0, 300 - Math.floor(this.timer));
      this.updateWorld();
      this.updatePlayer();
      this.checkCollisions();
      this.updateCamera();
      // 分数同步
      this.score = this.player.score;
    } else if (this.state==='dying'){
      this.updatePlayer();
      if (!this.player.alive){
        this.lives--;
        if (this.lives<=0){ this.state='gameover'; this.onStateChange('gameover', this); }
        else { this.state='clear'; this.clearT=0; this.startLevel({...this.cfg, lives:this.lives}); }
      }
    }
  }

  updateWorld(){
    const w = this.world;
    // 道具
    for (const p of w.powerups){ if (p.alive) p.update(w); }
    // 敌人
    for (const e of w.enemies){ if (e.alive) e.update(w); }
    // 子弹
    for (const b of w.bullets){ if (b.alive) b.update(w); }
    // 金币/碎砖动画
    for (const c of w.coinFx) c.t--;
    for (const s of w.smashed){ s.t--; if (s.t<=0 && !s.bump) s.bump=true; } // 简化
    // 回收
    w.powerups = w.powerups.filter(p=>p.alive);
    w.enemies = w.enemies.filter(e=>e.alive || e.deadT>0);
    w.bullets = w.bullets.filter(b=>b.alive);
  }

  updatePlayer(){
    if (!this.player.alive && this.state==='playing'){ this.state='dying'; this.onStateChange('dying', this); return; }
    if (this.player.alive && this.state==='playing') this.player.update(this.input, this.sfx);
    else if (this.state==='dying') this.player.update(this.input, this.sfx);
  }

  checkCollisions(){
    const w = this.world, p = this.player;
    if (!p.alive || this.state!=='playing') return;
    const pa = {x:p.x,y:p.y,w:p.w,h:p.h};
    // 与道具
    for (const pu of w.powerups){
      if (!pu.alive) continue;
      if (aabb(pa, pu)){
        pu.alive=false;
        this.applyPower(pu.type);
      }
    }
    // 与敌人
    for (const e of w.enemies){
      if (!e.alive || e.dead) continue;
      const ebox = {x:e.x,y:e.y,w:e.w,h:e.h};
      if (!aabb(pa, ebox)) continue;
      // 踩踏判断(下落且脚在敌上方)
      const stomping = p.vy>0 && (p.y + p.h - e.y) < 14;
      if (stomping){
        this.stomp(e);
      } else {
        // 被碰
        if (p.starT<=0){
          this.hurtPlayer();
        }
      }
    }
    // 到达旗杆
    if (!w.flagReached && p.x + p.w >= w.flagX*TILE + 8){
      this.reachFlag();
    }
  }

  stomp(e){
    const w=this.world;
    const s=this.sfx;
    if (e.type==='goomba'){ e.dead=true; e.deadT=30; this.player.vy = -6; this.addScore(100); s.stomp(); }
    else {
      // koopa 踩成壳
      if (e.shell){ /* 已在壳上，踢 */ e.kicked=true; e.kickVX = this.player.dir*6; this.addScore(200); }
      else { e.shell=true; e.dead=false; this.player.vy=-6; this.addScore(100); s.stomp(); }
      this.player.vy = -7;
    }
  }

  hurtPlayer(){
    const p = this.player;
    if (p.starT>0) return;
    p.starT = 120;  // 受伤短暂无敌(闪烁)
    p.damage();
    p.hurtFlashT=80;
    this.sfx.hurt();
    if (!p.alive){ this.sfx.die(); p.startDying(); this.state='dying'; }
  }

  applyPower(type){
    const p=this.player;
    if (type==='coin'){ p.coins++; p.score+=100; this.sfx.coin(); return; }
    if (type==='1up'){ this.lives++; this.addScore(1000); this.onStateChange('hud', this); this.sfx.clear(); return; }
    if (type==='mushroom'){ if (p.small){ p.small=false; p.setSize(); } p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='flower'){ p.fire=true; p.small=false; p.setSize(); p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='star'){ p.starT=9999; p.invincible=true; this.starMario=true; this.sfx.powerup(); return; }
  }

  addScore(n){ this.player.score += n; this.onStateChange('hud', this); }

  reachFlag(){
    if (this.world.flagReached) return;
    this.world.flagReached = true;
    this.sfx.flag();
    this.addScore(1000);
    this.state='clear';
    this.clearT=0;
    this.onStateChange('hud', this);
  }

  updateCamera(){
    const w=this.world, p=this.player;
    // 相机跟随(向右)
    w.camTarget = Math.max(w.camTarget, p.x - 200);
    w.camX += (w.camTarget - w.camX)*0.12;
    if (w.camX < -60) w.camX = -60;
    const maxCam = w.levelW - 640;
    if (w.camX > maxCam) w.camX = maxCam;
  }

  render(){
    const r = this.renderer;
    if (!this.world) { r.drawMenu(); return; }
    r.begin(this.world);
    r.draw(this.world);
    if (this.player && this.player.alive && this.state!=='menu'){
      r.drawPlayer(this.player, this.world.camX, this.state==='dying');
    }
    r.drawHUD(this);
  }

  gameOver(){ this.state='gameover'; this.onStateChange('gameover', this); }
  backToMenu(){ this.state='menu'; this.onStateChange('menu', this); }
}


/* ===== ui.js ===== */
/* ===== UI：菜单/配置/结算 ===== */

class UI {
  constructor(onStart, onRetry){
    this.onStart = onStart;
    this.onRetry = onRetry;
    this.overlay = document.getElementById('overlay');
    this.hudEl = null;
    this.screens = {};
    window._ui = this;
  }

  mount(){
    this.overlay.innerHTML = '';
    this.showMenu();
  }

  scr(cls){
    const d = document.createElement('div');
    d.className = 'screen ' + cls;
    return d;
  }

  /* ===== 开始菜单 + 配置 ===== */
  showMenu(){
    document.getElementById('touch-controls').classList.add('hidden');
    const s = this.scr('menu');
    s.innerHTML = `
      <div class="title">SUPER MARIO</div>
      <div class="subtitle">▶ 无限随机闯关 · 高精度经典还原 ◀</div>
      <div class="config-box">
        <div class="config-row">
          <div class="config-label">命数<small>初始生命数量</small></div>
          <div class="seg" data-cfg="lives">
            <button class="seg-btn ${StartConfig.lives===3?'active':''}" data-v="3">3 命</button>
            <button class="seg-btn ${StartConfig.lives===30?'active':''}" data-v="30">30 命</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">开局大小<small>大号=已吃蘑菇</small></div>
          <div class="seg" data-cfg="startBig">
            <button class="seg-btn ${!StartConfig.startBig?'active':''}" data-v="false">小马里奥</button>
            <button class="seg-btn ${StartConfig.startBig?'active':''}" data-v="true">大马里奥</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">默认子弹<small>开局即可发射火球(仅大号)</small></div>
          <div class="seg" data-cfg="startFire">
            <button class="seg-btn ${!StartConfig.startFire?'active':''}" data-v="false">无</button>
            <button class="seg-btn ${StartConfig.startFire?'active':''}" data-v="true">带子弹</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">无敌<small>不受任何伤害</small></div>
          <div class="seg" data-cfg="invincible">
            <button class="seg-btn ${!StartConfig.invincible?'active':''}" data-v="false">关</button>
            <button class="seg-btn ${StartConfig.invincible?'active':''}" data-v="true">开</button>
          </div>
        </div>
      </div>
      <button class="primary-btn" id="btn-start">▶ 开始游戏</button>
      <div class="status-line"></div>
    `;
    this.overlay.appendChild(s);
    // 配置切换
    s.querySelectorAll('.seg').forEach(seg => {
      seg.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = seg.dataset.cfg;
          const v = btn.dataset.v==='true'?true:(btn.dataset.v==='false'?false:Number(btn.dataset.v));
          StartConfig[key] = v;
          seg.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          saveStartConfig();
        });
      });
    });
    s.querySelector('#btn-start').addEventListener('click', () => this.onStart({...StartConfig}));
  }

  /* ===== 结算/死亡/游戏结束 ===== */
  showResult(type, game){
    document.getElementById('touch-controls').classList.remove('hidden');
    const s = this.scr('result');
    let title='', msg='', btnText='';
    if (type==='gameover'){ title='GAME OVER'; msg='再接再厉'; btnText='回到主菜单'; }
    else if (type==='clear'){ title='COURSE CLEAR!'; msg=`本关得分 ${game.score}`; btnText='继续下一关'; }
    else { title=''; msg=''; btnText='点击重试'; }
    s.innerHTML = `
      <div class="title" style="font-size:34px">${title}</div>
      <div class="status-line">${msg}</div>
      <button class="primary-btn red">${btnText}</button>
      <div class="loading"></div>
    `;
    this.overlay.appendChild(s);
    const btn = s.querySelector('.primary-btn');
    if (type==='gameover') btn.addEventListener('click', ()=>this.showMenu());
    else btn.addEventListener('click', ()=>this.onRetry());
    // 自动消失(clear)
    if (type==='clear'){
      setTimeout(()=>{ if (s.parentNode===this.overlay) s.remove(); }, 1600);
      setTimeout(()=>{ document.getElementById('touch-controls').classList.remove('hidden'); }, 400);
    }
  }

  /* 返回菜单时清理覆盖层 */
  hideAll(){
    this.overlay.innerHTML = '';
  }
}


/* ===== main.js ===== */
/* ===== 入口 ===== */






const renderer = new Renderer();
const input = new Input();
const sfx = new AudioFX();
let game = null;
let ui = null;
let last = 0;

function startGame(cfg){
  ui.hideAll();
  document.getElementById('touch-controls').classList.remove('hidden');
  game.startGame(cfg);
}

function retry(){
  ui.hideAll();
  document.getElementById('touch-controls').classList.remove('hidden');
  // 回到当前状态继续/下一关
  if (game.state==='clear') game.levelNo++;
  else if (game.state==='gameover'){ game.backToMenu(); }
  if (game.state!=='menu'){
    game.startLevel({...game.cfg});
  }
  renderer.resize();
}

function init(){
  ui = new UI((c)=>startGame(c), ()=>retry());
  game = new Game(renderer, input, sfx, (st)=>{
    if (st==='playing') ui.hideAll();
    else if (st==='gameover') ui.showResult('gameover', game);
    else if (st==='dying') { /* 死亡由后续显示 */ }
  });
  ui.mount();
  renderer.resize();

  window.addEventListener('resize', ()=>renderer.resize());
  window.addEventListener('keydown', e=>{ if(e.key==='Enter'){ sfx.resume(); } });
  document.addEventListener('pointerdown', ()=>sfx.resume(), {once:true});

  // PWA 注册
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
}

function loop(t){
  requestAnimationFrame(loop);
  const dt = Math.min((t-last)/1000, 0.05);
  last = t;
  if (!game) return;
  game.update(dt);
  renderer.begin();
  // 统一渲染
  if (game.world){
    game.render();
  } else {
    renderer.drawMenu();
  }
}

window.addEventListener('DOMContentLoaded', init);
last = performance.now();
requestAnimationFrame(loop);


})();
