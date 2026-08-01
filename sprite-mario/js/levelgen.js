/* ===== 无限随机关卡生成 =====
 * 关卡由一系列段落拼接，返回二维 tile 数组 + 实体/道具/敌人刷出点。
 * tile 编码：
 *   0 空
 *   1 坚硬砖(block,不可破坏)
 *   2 可撞碎的砖(brick, 从上方撞可碎)
 *   3 问号块(可顶出金币/道具)
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
  // 关卡长度随关卡显著增长：每关 +60 格（增长翻倍），进入下一关后旅程明显更长
  const w = 210 + levelNo*60;       // level1=270 level2=330 level3=390 ...
  const tiles = createEmpty(w, H);
  // 地板（单行：H=12 时 tiles[groundY+1] 越界恒不生效，地面仅一行，脚底行=groundY）
  for (let x=0;x<w;x++) tiles[groundY][x] = GROUND;

  const spawns = [];   // { x, type, y }
  const blocks=[];     // 特殊块: { x, y, kind:'?'|'b' , content }
  let x = 8;
  let sectionIndex = 0;

  // 难度系数
  const diff = Math.min(1 + levelNo*0.12, 4.5);
  const pitChance = Math.min(0.55 + levelNo*0.03, 0.9);
  const enemyRate = Math.min(0.55 + levelNo*0.08, 1.8);

  // 问号块：离地 3 格（groundY-4，头顶留 2 格空隙），跳起可顶、走路不挡（大马里奥 2 格高也不撞头）
  const pushBlock = (bx, kind, content) => {
    const by = groundY - 4;
    blocks.push({x:bx, y:by, kind, content});
    tiles[by][bx] = 3;
  };
    // 问号块道具内容：金币/蘑菇/花/星/1up（经典分布，统一为具体类型）
  const pickContent = () => {
    const r = rng();
    if (r < 0.55) return 'coin';
    if (r < 0.75) return 'mushroom';
    if (r < 0.88) return 'flower';
    if (r < 0.97) return 'star';
    return '1up';
  };

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
        // 纯平台（不在平台上放低空块，避免只能踩不能顶）
        x += platW + ri(1,3);
      } else {
        // 空中问号块列
        if (rng()<0.6 && x < w-16){
          const n = ri(1,3);
          for (let i=0;i<n;i++){
            pushBlock(x+i*2, '?', rng()<0.55?'coin':pickContent());
          }
          x += n*2 + ri(1,2);
        } else {
          // 纯平地段落：中点放宝箱点缀，避免后半程大段空白（快速冲到旗杆）
          const mid = x + Math.floor(segW/2);
          if (mid > 12 && mid < w-18 && rng()<0.75){
            pushBlock(mid, '?', rng()<0.55?'coin':pickContent());
          }
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
        if (kind==='?') pushBlock(bx, '?', rng()<0.55?'coin':pickContent());
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
      // 原版 SMB 管道旁不放宝箱：既避免大马里奥站管道顶被正上方问号块挡头卡住，
      // 也避免宝箱落到相邻管道段落正上方形成残留块
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
  // 终点前一段清空地面敌人安全（同时把已写入 tiles 的问号块清掉）
  for (let i=0;i<blocks.length;i++){ if (blocks[i].x > flagX-2){ tiles[blocks[i].y][blocks[i].x]=0; blocks.splice(i,1); i--; } }
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
