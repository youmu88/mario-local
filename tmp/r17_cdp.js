#!/usr/bin/env node
/* R17 CDP 端到端测试：过关自动进入下一关（无按钮）+ L2 出生距离 + 问号块可顶 */
const { execSync, spawn } = require('child_process');

const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const INDEX = 'file://' + ROOT + '/sprite-mario/index.html';
const PORT = 9223;
const CDP = 'http://127.0.0.1:' + PORT;

try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario17_profile`); } catch(e){}

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/mario17_profile',
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
  for (let i=0;i<50 && !(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game);i++) await sleep(200);
  const D = window.__MARIO_DEBUG, g = D.game;
  // T1 启动游戏（大马里奥、30命、无敌）
  g.startGame({lives:30, startBig:true, startFire:false, invincible:true});
  await sleep(300);
  out.T1_start = { levelNo:g.levelNo, state:g.state, flagX:g.world.flagX, w:g.world.w, playerX:Math.round(g.player.x), camX:Math.round(g.world.camX), playerH:g.player.h };
  // T2 触发过关（等价跑到旗子）
  g.reachFlag();
  await sleep(300);
  out.T2_reach = { state:g.state, clearMode:g.player.clearMode };
  // T3 等走进城堡 → clear 界面（应无按钮）
  await sleep(3000);
  out.T3_castle = { state:g.state, animDone:g.animDone, cleared:g.player.cleared,
    hasBtn: !!document.querySelector('#overlay .primary-btn'),
    overlayText: (document.querySelector('#overlay')?document.querySelector('#overlay').textContent.replace(/\\s+/g,' ').slice(0,60):'') };
  // T4 等自动跳关（无需点击）
  await sleep(4200);
  out.T4_autoNext = { state:g.state, levelNo:g.levelNo, flagX:g.world.flagX, w:g.world.w,
    playerX:Math.round(g.player.x), camX:Math.round(g.world.camX),
    distToFlag: Math.round((g.world.flagX*32 - g.player.x)/32),
    overlayEmpty: !document.querySelector('#overlay') || document.querySelector('#overlay').innerHTML === '' };
  // T5 L2 问号块：站立不挡路 + 跳起可顶（暂停游戏循环避免双驱动，模拟真实长按跳跃）
  const w2 = g.world;
  let qx=null, qy=null;
  for (let y=0;y<w2.h && qx===null;y++) for (let x=8;x<w2.w;x++) if (w2.tiles[y][x]===3){ qx=x; qy=y; break; }
  const p = g.player;
  const before = { tile:w2.tiles[qy][qx], coins:p.coins, score:p.score };
  const savedState = g.state;
  g.state = 'menu';                                  // 暂停 rAF 循环驱动
  p.x = qx*32 - 2; p.y = w2.groundY*32 - p.h; p.vy = 0; p.onGround = true;
  const standClear = (p.y > (qy+1)*32 - 0.01);      // 站立头顶(288)在块底(256)下方 → 不挡路
  let jumped = false;
  for (let i=0;i<140;i++){
    p.update({keys:{run:false,left:false,right:false,jump:true}, consumeJump:()=>!jumped, consumeFire:()=>false}, g.sfx);
    jumped = true;
  }
  g.state = savedState;
  out.T5_bump = { qPos:{x:qx,y:qy}, before, afterTile:w2.tiles[qy][qx], afterCoins:p.coins, afterScore:p.score, standClear };
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
  console.log('RESULT:' + JSON.stringify(val, null, 2));
  ws.close(); chrome.kill(); process.exit(0);
}

main().catch(e => { console.error('ERR', e.message); chrome.kill(); process.exit(1); });
