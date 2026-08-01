#!/usr/bin/env node
/* R18 CDP 端到端测试：速度渐进模型 / 站立稳定 / 星星杀敌 / 火球打食人花(200分) / 火球撞砖消散 / 金币100加命 / 过关回归 */
const { execSync, spawn } = require('child_process');

const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const INDEX = 'file://' + ROOT + '/sprite-mario/index.html';
const PORT = 9224;
const CDP = 'http://127.0.0.1:' + PORT;

try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario18_profile`); } catch(e){}

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/mario18_profile',
  '--window-size=800,450',
  INDEX
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getTarget(){
  for (let i=0;i<60;i++){
    try {
      const list = await (await fetch(CDP + '/json/list')).json();
      const page = list.find(t => t.type==='page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch(e){}
    await sleep(250);
  }
  throw new Error('CDP target not found');
}

const TEST_JS = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  try {
  for (let i=0;i<50 && !(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game);i++) await sleep(200);
  if (!(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game)){ out.ERR = 'MARIO_DEBUG not ready'; return out; }
  const D = window.__MARIO_DEBUG, g = D.game;
  // 启动：小马里奥、30命、带火球
  g.startGame({lives:30, startBig:false, startFire:true, invincible:false});
  await sleep(200);
  const p = g.player, w = g.world;
  const saved = g.state;
  g.state = 'menu';                                   // 暂停 rAF 双驱动

  // 清空跑动测试区（行8/9/10，保留地面行11），保证 T1/T2 无碰撞
  const zone = 12;
  for (let tx=zone; tx<zone+16; tx++) for (let ty=8; ty<=10; ty++) w.tiles[ty][tx] = 0;

  // T1 速度渐进：按住右键 100 帧，vx 从小渐增至满速 1.6（非瞬变）
  p.x = zone*32; p.y = w.groundY*32 - p.h; p.vy = 0; p.vx = 0; p.onGround = true;
  const accSeq = [];
  for (let i=0;i<100;i++){
    p.update({keys:{run:false,left:false,right:true,jump:false}, consumeJump:()=>false, consumeFire:()=>false}, g.sfx);
    if (i===0 || i===5 || i===99) accSeq.push(Math.round(p.vx*100)/100);
  }
  out.T1_accel = { f0:accSeq[0], f5:accSeq[1], f99:accSeq[2], maxV:Math.round(p.vx*100)/100 };

  // T2 松开按键减速：40 帧 vx 递减回 0
  const decSeq = [];
  for (let i=0;i<40;i++){
    p.update({keys:{run:false,left:false,right:false,jump:false}, consumeJump:()=>false, consumeFire:()=>false}, g.sfx);
    if (i===2 || i===20 || i===39) decSeq.push(Math.round(p.vx*100)/100);
  }
  out.T2_decel = { f2:decSeq[0], f20:decSeq[1], f39:decSeq[2] };

  // T3 站立稳定：无输入 60 帧，y 恒定（moveY epsilon 修复）
  p.x = zone*32; p.y = w.groundY*32 - p.h; p.vy = 0;
  const ys = [];
  for (let i=0;i<60;i++){
    p.update({keys:{run:false,left:false,right:false,jump:false}, consumeJump:()=>false, consumeFire:()=>false}, g.sfx);
    ys.push(p.y);
  }
  out.T3_stable = { delta:Math.round((Math.max(...ys)-Math.min(...ys))*100)/100, groundY:w.groundY*32 - p.h };

  // 碰撞测试辅助：临时置 playing 让 checkCollisions 生效（同步执行，rAF 不会插队）
  const runCC = () => { g.state = 'playing'; g.checkCollisions(); g.state = 'menu'; };

  // T4 无敌星星碰到敌人直接消灭（+100）
  const score0 = p.score;
  p.x = zone*32; p.y = w.groundY*32 - p.h; p.vy = 0; p.hurtFlashT = 0; p.respawnInvT = 0;
  const fakeGoomba = { type:'goomba', x:p.x+10, y:p.y-16, w:32, h:32, alive:true, dead:false, deadT:0, vx:0, shell:false, kicked:false };
  w.enemies.push(fakeGoomba);
  p.starT = 9999;
  runCC();
  out.T4_star = { goombaDead: fakeGoomba.dead, scoreDelta: p.score - score0, starKill: fakeGoomba.dead && (p.score - score0) >= 100 };

  // T5 火球打食人花：伸出状态 → 击杀 +200 分（原版食人花 200）
  p.starT = 0;
  const s1 = p.score;
  const fakePiranha = { type:'piranha', x:p.x+40, y:w.groundY*32-64, w:32, h:32, alive:true, dead:false, deadT:0, vx:0, shell:false, kicked:false,
    box:{ x:p.x+42, y:w.groundY*32-96, w:28, h:32 } };
  w.enemies.push(fakePiranha);
  w.bullets.push({ x:p.x+42, y:w.groundY*32-80, w:14, h:14, alive:true, hitFrames:undefined });
  runCC();
  out.T5_bulletPiranha = { piranhaDead: fakePiranha.dead, scoreDelta: p.score - s1 };

  // T6 火球撞实心砖消散的判定条件：solidAt 在砖位置检测到实心（update 中命中即置 alive=false；
  // 真实 Bullet.update 撞砖消散已由 node 单测 T5 覆盖）
  const brickX = Math.floor((p.x + 90)/32);
  w.tiles[10][brickX] = 2;
  const hitPos = { x: brickX*32, y: 10*32+8 };
  out.T6_bulletWall = { solidDetected: w.solidAt(hitPos.x, hitPos.y, 14, 14), brickX };

  // T7 金币满100加命：coins=99 → 顶一次金币 → checkCollisions 触发 +1 命
  const lives0 = g.lives;
  p.coins = 99;
  g.applyPower('coin');        // coins 99→100
  runCC();
  out.T7_coinLife = { coins:p.coins, livesDelta: g.lives - lives0 };

  // T8 过关动画回归：滑旗→走城堡→clear（无按钮自动跳关）
  g.state = 'playing';
  g.reachFlag();
  await sleep(150);
  out.T8_clear = { state:g.state, clearMode:g.player.clearMode, flagSlide:Math.round(w.flagSlide*100)/100 };

  g.state = saved;
  } catch(e){ out.ERR = String(e && e.stack || e); }
  return out;
})()`;

async function main(){
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = {};
  const send = (method, params={}) => new Promise((resolve,reject)=>{
    const mid = ++id; pending[mid] = {resolve,reject};
    ws.send(JSON.stringify({id:mid, method, params}));
  });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]){ pending[m.id].resolve(m); delete pending[m.id]; }
  };
  await new Promise(r => ws.onopen = r);
  await sleep(1200);
  const r = await send('Runtime.evaluate', { expression: TEST_JS, awaitPromise: true, returnByValue: true });
  const val = r.result && r.result.result && r.result.result.value;
  if (!val) console.log('RAW:', JSON.stringify(r.result).slice(0, 500));
  console.log('RESULT:' + JSON.stringify(val, null, 2));
  ws.close(); chrome.kill(); process.exit(0);
}

main().catch(e => { console.error('ERR', e.message); chrome.kill(); process.exit(1); });
