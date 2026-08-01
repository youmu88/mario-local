#!/usr/bin/env node
/* R18 单元测试：物理站立稳定性 / 贴墙不穿 / 管道上方无块 / 食人花碰撞盒 / 火球撞墙消散 */
import { TILE, moveX, moveY } from '../sprite-mario/js/physics.js';
import { generateLevel } from '../sprite-mario/js/levelgen.js';
import { Piranha, Bullet } from '../sprite-mario/js/entities.js';

let pass = 0, fail = 0;
function assert(cond, msg){
  if (cond){ pass++; console.log('  ✅', msg); }
  else { fail++; console.log('  ❌', msg); }
}

function makeTiles(W=60, H=12){
  const t = [];
  for (let y=0;y<H;y++) t.push(new Array(W).fill(0));
  for (let x=0;x<W;x++) t[H-1][x] = 5;   // 地面行 11
  return t;
}

console.log('T1 站立稳定性（修复后 y 应恒为 320，无振荡）');
{
  const tiles = makeTiles();
  const body = { x: 5*32, y: 11*32-32, w: 32, h: 32, vx: 0, vy: 0 };
  let minY=Infinity, maxY=-Infinity;
  for (let i=0;i<300;i++){
    body.vy = Math.min(body.vy + 0.42, 14);
    moveX(body, tiles, null);
    moveY(body, tiles);
    minY=Math.min(minY,body.y); maxY=Math.max(maxY,body.y);
  }
  assert(maxY-minY < 0.01, `站立 300 帧 y 无振荡 (${minY.toFixed(3)}~${maxY.toFixed(3)})`);
  assert(Math.abs(body.y-320) < 0.01, `y 精确贴地=${body.y.toFixed(3)}`);
}

console.log('T2 贴墙（行10 有砖）不被推回/穿墙，稳定停靠在砖左侧');
{
  const tiles = makeTiles();
  tiles[10][12] = 2;   // 砖块在行10 列12（离地1格）
  const body = { x: 10*32, y: 11*32-32, w: 32, h: 32, vx: 0, vy: 0 };
  for (let i=0;i<120;i++){
    body.vx = 1.6;                                     // 每帧按下→目标速度
    body.vy = Math.min(body.vy + 0.42, 14);
    moveX(body, tiles, null);
    moveY(body, tiles);
  }
  assert(body.x + body.w <= 12*32 + 0.1, `被砖挡住未穿墙 (x+w=${(body.x+body.w).toFixed(2)})`);
  assert(Math.abs((body.y)-(11*32-32)) < 0.01, `站立稳定 y=${body.y.toFixed(3)}`);
  // 砖列左侧空隙：列 11 无砖 → 玩家应能停在砖前一列
  assert(body.x >= 11*32 - 0.1, `未被过度推回 (x=${body.x.toFixed(2)})`);
}

console.log('T3 关卡生成：管道正上方无块（含问号块），大马里奥站管道顶不卡头');
{
  let checked = 0;
  for (let lv=1; lv<=4; lv++){
    const gen = generateLevel(lv, 'seed'+lv);
    for (const s of gen.spawns){
      if (s.type !== 'piranha') continue;
      const py = s.y;                      // 管道顶行
      for (let ty = py-1; ty >= 0; ty--){
        for (let tx = s.x; tx <= s.x+1; tx++){
          const t = gen.tiles[ty][tx];
          if (t !== 0) { assert(false, `管道(${s.x},${py}) 上方(${tx},${ty}) 有块 ${t}`); continue; }
          checked++;
        }
      }
    }
  }
  assert(checked > 0, `共检查 ${checked} 个管道上方格位，全部为空`);
}

console.log('T4 食人花碰撞盒：不超花头高度、底部不伸入管道口');
{
  const p = new Piranha(10*32, 11*32, 11*32);   // 管道顶面=地面行像素 352
  // 直接摆到完全伸出状态（box 为纯计算，不依赖 update 模拟）
  p.phase='up'; p.y = p.pipeTopY - p.maxExtend;
  const out = p.pipeTopY - p.y;
  const box = p.box;
  assert(Math.abs(out - 48) < 0.01, `完全伸出量=${out}`);
  assert(box.h <= 32, `box.h=${box.h} ≤ TILE(32)`);
  assert(box.y + box.h <= p.pipeTopY + 0.01, `box 底部 ${(box.y+box.h).toFixed(2)} ≤ 管道口顶面 ${p.pipeTopY}`);
  // 隐藏态 box 空
  p.phase='hidden'; p.y = p.pipeTopY;
  const b0 = p.box;
  assert(b0.w===0 && b0.h===0, '隐藏态 box 为空(不可被攻击/不造成伤害)');
}

console.log('T5 火球撞实心块（砖）消散，不穿墙');
{
  const tiles = makeTiles();
  tiles[10][20] = 2;   // 砖块在行10 列20
  const world = {
    groundY: 11, w: 60, h: 12,
    solidAt(x,y,ww,hh){
      const x0=Math.floor(x/32), x1=Math.floor((x+ww-0.001)/32);
      const y0=Math.floor(y/32), y1=Math.floor((y+hh-0.001)/32);
      for (let ty=y0;ty<=y1;ty++) for (let tx=x0;tx<=x1;tx++){
        const t = tiles[ty] && tiles[ty][tx];
        if (t===1||t===2||t===3||t===4) return true;
      }
      return false;
    }
  };
  const b = new Bullet(15*32, 10*32+8, 1);   // 行10 水平向右，正对砖
  for (let i=0;i<200 && b.alive;i++) b.update(world);
  assert(!b.alive, '火球撞砖后消散（不再穿墙）');
  // 控制组：无砖路径不消散且能飞行
  const tiles2 = makeTiles();
  const world2 = { groundY: 11, w: 60, h: 12, solidAt:(x,y,ww,hh)=>{ return false; } };
  const b2 = new Bullet(15*32, 9*32+8, 1);
  for (let i=0;i<30 && b2.alive;i++) b2.update(world2);
  assert(b2.alive && b2.x > 15*32, `空旷路径火球正常飞行 x=${Math.round(b2.x)}`);
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail===0 ? 0 : 1);
