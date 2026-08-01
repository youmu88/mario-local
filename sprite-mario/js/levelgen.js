/* ===== 无限随机关卡生成 =====
 * 关卡由一系列段落拼接，返回二维 tile 数组 + 实体/道具/敌人刷出点。
 * tile 编码：
 *   0 空
 *   1 坚硬砖(block,不可破坏)
 *   2 可撞碎的砖(brick, 从上方撞可碎)
 *   3 问号块(未用)
 *   4 已用问号块
 *   5 地板(ground, 特殊顶部纹理)
 * 敌人类型：goomba 板栗仔 / koopa 乌龟 / spiny 尖刺龟(踩踏受伤) / flyer 红翼板栗(空中) / piranha 食人花(管道)
 */
import { TILE } from './physics.js';

function createEmpty(w, h){
  const t = [];
  for (let y=0;y<h;y++){ t.push(new Array(w).fill(0)); }
  return t;
}

/* 按关卡难度选择敌人类型 */
function pickEnemy(rng, levelNo){
  const r = rng();
  if (levelNo >= 2){
    if (r < 0.42) return 'goomba';
    if (r < 0.66) return 'koopa';
    if (r < 0.85) return 'spiny';   // 尖刺龟：踩踏受伤
    return 'flyer';                 // 红翼板栗：空中巡逻
  }
  return r < 0.6 ? 'goomba' : 'koopa';
}

/* 用 RNG 生成关卡。返回 { w,h,tiles, startX, spawns, sections } */
export function generateLevel(levelNo, seedStr){
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
      // 坑（宽度与新跳跃能力匹配：普通跳≈3格，冲刺大跳≈5格）
      if (x > 14 && x < w-20 && rng() < pitChance){
        const pw = ri(2, 3+Math.floor(diff/3));  // 2~4格，确保能跳过去
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
          else tiles[platY-1>=0?platY-1:platY-1][x+2]=2;
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
        // 散落地面的敌人（随难度混入尖刺龟/飞行板栗）
        const eg = Math.floor(enemyRate * rng()*4);
        for (let i=0;i<eg;i++){
          if (x+i*2 < w-16){
            const type = pickEnemy(rng, levelNo);
            spawns.push({x:x+i*2, y: (type==='flyer'? tileY-3 : tileY), type});
          }
          x+=2;
        }
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
      // 管道口食人花（还原原版要素：接近伸出攻击）
      if (rng()<0.5){
        spawns.push({x:x, y:tileY-(ph-1), type:'piranha'});
      }
      // 管道口跳上来有宝
      if (rng()<0.5) pushBlock(x, '?', 'power');
      x += 2 + ri(1,3);
    }
    else { // enemies
      const eg = 1 + Math.floor(Math.min(enemyRate, 3) * rng()*3);
      for (let i=0;i<eg;i++){
        const ex = x+i*3;
        if (ex < w-16){
          const type = pickEnemy(rng, levelNo);
          spawns.push({x:ex, y: (type==='flyer'? tileY-3 : tileY), type});
        }
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

  // ===== 检查点：起点 + 沿途安全列（连续3格地面、头顶2格无实心块），死亡后从最近检查点复活 =====
  const checkpoints = [{ x: 6 }];
  for (let cx = 26; cx < flagX - 6; cx += 20){
    const ok = tiles[groundY][cx]===5 && tiles[groundY][cx-1]===5 && tiles[groundY][cx+1]===5
      && tiles[groundY-1][cx]===0 && tiles[groundY-2][cx]===0;
    if (ok) checkpoints.push({ x: cx });
  }

  return {
    w, h:H, tiles, startX: 6,
    groundY, tileY,
    blocks, spawns,
    flagX,
    checkpoints,
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
export { TILE };
